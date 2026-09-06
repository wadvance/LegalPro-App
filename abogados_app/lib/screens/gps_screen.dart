import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';

import '../theme/app_theme.dart';
import '../utils/ayudas.dart' as ay;

part 'lugares_panama.g.dart';

class LugarPanama {
  final String id;
  final String label;
  final String address;
  final String type;
  final String icon;
  const LugarPanama({
    required this.id,
    required this.label,
    required this.address,
    required this.type,
    required this.icon,
  });
}

/// Replica src/screens/NavigationScreen.js (buscador + lugares + Maps/Waze).
class GpsScreen extends StatefulWidget {
  final ThemeController themeController;
  const GpsScreen({super.key, required this.themeController});

  @override
  State<GpsScreen> createState() => _GpsScreenState();
}

class _GpsScreenState extends State<GpsScreen> {
  final _busquedaCtrl = TextEditingController();
  String _busqueda = '';
  String _filtro = 'all'; // all | Provincia | Distrito | Lugar
  Position? _ubicacion;
  String _errorUbicacion = '';
  bool _localizando = false;
  List<LugarPanama> _guardadas = [];

  @override
  void initState() {
    super.initState();
    _cargarGuardadas();
  }

  @override
  void dispose() {
    _busquedaCtrl.dispose();
    super.dispose();
  }

  Future<void> _cargarGuardadas() async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return;
    try {
      final clientes = await FirebaseFirestore.instance
          .collection('clientes')
          .where('abogadoId', isEqualTo: uid)
          .get();
      final empresas = await FirebaseFirestore.instance
          .collection('empresas')
          .where('abogadoId', isEqualTo: uid)
          .get();
      final lista = <LugarPanama>[];
      for (final d in clientes.docs) {
        final data = d.data();
        final dir = '${data['direccion'] ?? ''}'.trim();
        if (dir.isNotEmpty) {
          lista.add(LugarPanama(
            id: 'cli_${d.id}',
            label: '${data['nombre'] ?? ''} ${data['apellido'] ?? ''}'.trim(),
            address: dir,
            type: 'Cliente',
            icon: '👤',
          ));
        }
      }
      for (final d in empresas.docs) {
        final data = d.data();
        final dir = '${data['direccion'] ?? ''}'.trim();
        if (dir.isNotEmpty) {
          lista.add(LugarPanama(
            id: 'emp_${d.id}',
            label: '${data['nombre'] ?? 'Empresa'}',
            address: dir,
            type: 'Empresa',
            icon: '🏢',
          ));
        }
      }
      if (!mounted) return;
      setState(() => _guardadas = lista);
    } catch (_) {}
  }

  List<LugarPanama> _filtrados() {
    final todos = [...kLugaresPanama, ..._guardadas];
    final q = _busqueda.toLowerCase();
    return todos.where((l) {
      if (_filtro != 'all' &&
          l.type != _filtro &&
          !(l.type == 'Cliente' || l.type == 'Empresa')) {
        return false;
      }
      if (q.isEmpty) return true;
      return '${l.label} ${l.address} ${l.type}'
          .toLowerCase()
          .contains(q);
    }).toList();
  }

  Future<void> _miUbicacion() async {
    setState(() {
      _localizando = true;
      _errorUbicacion = '';
    });
    try {
      final servicio =
          await Geolocator.isLocationServiceEnabled();
      if (!servicio) {
        throw 'Ubicación no disponible.';
      }
      var permiso = await Geolocator.checkPermission();
      if (permiso == LocationPermission.denied) {
        permiso = await Geolocator.requestPermission();
      }
      if (permiso == LocationPermission.denied) {
        throw 'Permiso denegado. Active la ubicación en su dispositivo.';
      }
      if (permiso == LocationPermission.deniedForever) {
        throw 'Permiso denegado. Active la ubicación en su dispositivo.';
      }
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 10),
        ),
      );
      if (!mounted) return;
      setState(() => _ubicacion = pos);
    } catch (e) {
      if (!mounted) return;
      final msg = '$e';
      setState(() {
        _errorUbicacion = msg.contains('denegado') || msg.contains('denied')
            ? 'Permiso denegado. Active la ubicación en su dispositivo.'
            : msg.contains('timeout') || msg.contains('espera')
                ? 'Tiempo de espera agotado.'
                : 'Error al obtener ubicación.';
      });
    } finally {
      if (mounted) setState(() => _localizando = false);
    }
  }

  Future<void> _abrirMaps(String destino) async {
    final dir = destino.trim().isEmpty
        ? _busqueda.trim().isEmpty
            ? 'Panamá'
            : _busqueda.trim()
        : destino.trim();
    var url =
        'https://www.google.com/maps/dir/?api=1&destination=${Uri.encodeComponent(dir)}';
    if (_ubicacion != null) {
      url +=
          '&origin=${_ubicacion!.latitude},${_ubicacion!.longitude}';
    }
    await launchUrl(Uri.parse(url),
        mode: LaunchMode.externalApplication);
  }

  Future<void> _abrirWaze(String destino) async {
    final dir = destino.trim().isEmpty
        ? _busqueda.trim().isEmpty
            ? 'Panamá'
            : _busqueda.trim()
        : destino.trim();
    await launchUrl(
        Uri.parse(
            'https://waze.com/ul?q=${Uri.encodeComponent(dir)}&navigate=yes'),
        mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.themeController.colors;
    final lugares = _filtrados();
    const filtros = [
      ('all', 'Todas'),
      ('Provincia', 'Provincias'),
      ('Distrito', 'Distritos'),
      ('Lugar', 'Lugares'),
    ];

    return Scaffold(
      backgroundColor: c.background,
      appBar: AppBar(
        backgroundColor: c.headerBg,
        foregroundColor: Colors.white,
        leading: const BackButton(),
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('📍 Navegación GPS'),
            Text('Busca direcciones y navega',
                style: TextStyle(fontSize: 12)),
          ],
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _busquedaCtrl,
              onChanged: (v) =>
                  setState(() => _busqueda = v.trim()),
              onSubmitted: (v) => _abrirMaps(v),
              decoration: InputDecoration(
                prefixText: '🔍 ',
                hintText: 'Busca una dirección o lugar...',
                suffixIcon: _busqueda.isEmpty
                    ? null
                    : IconButton(
                        icon: const Text('✕'),
                        onPressed: () {
                          _busquedaCtrl.clear();
                          setState(() => _busqueda = '');
                        },
                      ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => _abrirMaps(''),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1976D2),
                      foregroundColor: Colors.white,
                      minimumSize: const Size.fromHeight(44),
                    ),
                    child: const Text('🗺️ Google Maps'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => _abrirWaze(''),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1A237E),
                      foregroundColor: Colors.white,
                      minimumSize: const Size.fromHeight(44),
                    ),
                    child: const Text('🧭 Waze'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _localizando ? null : _miUbicacion,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF388E3C),
                      foregroundColor: Colors.white,
                      minimumSize: const Size.fromHeight(44),
                    ),
                    child: Text(_localizando
                        ? '...'
                        : '📍 Mi ubicación'),
                  ),
                ),
              ],
            ),
          ),
          if (_ubicacion != null)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.all(12),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFF388E3C).withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                  '📍 ${_ubicacion!.latitude.toStringAsFixed(4)}, ${_ubicacion!.longitude.toStringAsFixed(4)}'),
            ),
          if (_errorUbicacion.isNotEmpty)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.all(12),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFD32F2F).withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(_errorUbicacion,
                  style: const TextStyle(color: Color(0xFFB71C1C))),
            ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: filtros
                  .map((f) => Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(f.$2),
                          selected: _filtro == f.$1,
                          selectedColor: c.primary,
                          labelStyle: TextStyle(
                              color: _filtro == f.$1
                                  ? Colors.white
                                  : c.text),
                          onSelected: (_) =>
                              setState(() => _filtro = f.$1),
                        ),
                      ))
                  .toList(),
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: lugares.isEmpty
                ? Center(
                    child: Text(_busqueda.isEmpty
                        ? 'No hay lugares disponibles.'
                        : 'No se encontraron lugares'))
                : ListView.builder(
                    itemCount: lugares.length,
                    itemBuilder: (_, i) {
                      final l = lugares[i];
                      return Card(
                        margin: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        child: InkWell(
                          onTap: () => _abrirMaps(l.address),
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Row(
                              children: [
                                Text(l.icon,
                                    style:
                                        const TextStyle(fontSize: 28)),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(l.label,
                                          maxLines: 1,
                                          overflow:
                                              TextOverflow.ellipsis,
                                          style: const TextStyle(
                                              fontWeight:
                                                  FontWeight.bold)),
                                      Text(l.address,
                                          maxLines: 2,
                                          overflow:
                                              TextOverflow.ellipsis,
                                          style: TextStyle(
                                              color:
                                                  c.textSecondary)),
                                      Text(l.type,
                                          style: TextStyle(
                                              fontSize: 11,
                                              color:
                                                  c.textSecondary)),
                                    ],
                                  ),
                                ),
                                IconButton(
                                  icon: const Text('📍',
                                      style: TextStyle(fontSize: 22)),
                                  onPressed: () =>
                                      ay.navegarA(context,
                                          l.address, l.label),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
