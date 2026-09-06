import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import '../services/firestore_service.dart';
import '../theme/app_theme.dart';
import '../utils/ayudas.dart' as ay;

const List<String> kTiposMovimiento = [
  'Avance', 'Audiencia', 'Notificación', 'Resolución', 'Apelación',
  'Prueba', 'Acuerdo', 'Sentencia', 'Archivo', 'Otro',
];

const Map<String, Color> kColoresMovimiento = {
  'Avance': Color(0xFF1976D2),
  'Audiencia': Color(0xFFF57C00),
  'Notificación': Color(0xFF388E3C),
  'Resolución': Color(0xFF7B1FA2),
  'Apelación': Color(0xFFD32F2F),
  'Prueba': Color(0xFF00897B),
  'Acuerdo': Color(0xFF43A047),
  'Sentencia': Color(0xFF1A237E),
  'Archivo': Color(0xFF757575),
  'Otro': Color(0xFF757575),
};

/// Replica src/screens/CaseTrackingScreen.js (lista + detalle + movimientos).
class SeguimientoScreen extends StatefulWidget {
  final ThemeController themeController;
  const SeguimientoScreen({super.key, required this.themeController});

  @override
  State<SeguimientoScreen> createState() => _SeguimientoScreenState();
}

class _SeguimientoScreenState extends State<SeguimientoScreen> {
  final _busquedaCtrl = TextEditingController();
  String _busqueda = '';
  String? _selId;
  Map<String, dynamic>? _selDatos;

  @override
  void dispose() {
    _busquedaCtrl.dispose();
    super.dispose();
  }

  User get _user => FirebaseAuth.instance.currentUser!;

  List<QueryDocumentSnapshot<Map<String, dynamic>>> _filtrar(
      List<QueryDocumentSnapshot<Map<String, dynamic>>> docs) {
    if (_busqueda.isEmpty) return docs;
    final q = _busqueda.toLowerCase();
    return docs.where((d) {
      final data = d.data();
      return '${data['numero'] ?? ''} ${data['clienteNombre'] ?? ''} ${data['tipo'] ?? ''}'
          .toLowerCase()
          .contains(q);
    }).toList();
  }

  Future<void> _agregarMovimiento() async {
    final c = widget.themeController.colors;
    final descripcion = TextEditingController();
    String tipo = 'Avance';
    bool guardando = false;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModal) => Container(
          decoration: BoxDecoration(
            color: c.surface,
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(30)),
          ),
          padding: EdgeInsets.only(
            left: 20, right: 20, top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Nuevo Movimiento',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: c.primary)),
              const SizedBox(height: 12),
              const Text('Tipo:'),
              const SizedBox(height: 6),
              Wrap(
                spacing: 8,
                children: kTiposMovimiento
                    .map((t) => ChoiceChip(
                          label: Text(t),
                          selected: tipo == t,
                          selectedColor: c.primary,
                          labelStyle: TextStyle(
                              color:
                                  tipo == t ? Colors.white : c.text),
                          onSelected: (_) =>
                              setModal(() => tipo = t),
                        ))
                    .toList(),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: descripcion,
                maxLines: 3,
                decoration: const InputDecoration(
                    hintText: 'Descripción del movimiento *'),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('Cancelar'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: guardando
                          ? null
                          : () async {
                              if (descripcion.text.trim().isEmpty) {
                                ay.alerta(context, 'Error',
                                    'La descripción es obligatoria');
                                return;
                              }
                              setModal(() => guardando = true);
                              final perfil = await AuthService.perfil(
                                  _user.uid);
                              final usuario =
                                  '${perfil?['nombre'] ?? ''} ${perfil?['apellido'] ?? ''}'
                                          .trim()
                                          .isEmpty
                                      ? 'Usuario'
                                      : '${perfil?['nombre'] ?? ''} ${perfil?['apellido'] ?? ''}'
                                          .trim();
                              final actuales = List<Map<String,
                                  dynamic>>.from(
                                  (_selDatos?['movimientos'] as List?) ??
                                      []);
                              actuales.add({
                                'id': DateTime.now()
                                    .millisecondsSinceEpoch
                                    .toString(),
                                'fecha': Timestamp.now(),
                                'tipo': tipo,
                                'descripcion':
                                    descripcion.text.trim(),
                                'usuario': usuario,
                              });
                              final r =
                                  await FirestoreService.actualizar(
                                'expedientes',
                                _selId!,
                                {
                                  'movimientos': actuales,
                                  'ultimaActualizacion':
                                      Timestamp.now(),
                                },
                              );
                              if (!ctx.mounted) return;
                              if (!mounted) return;
                              if (!r.ok) {
                                ay.alerta(context, 'Error',
                                    r.error ?? 'No se pudo guardar');
                              } else {
                                final nuevos =
                                    Map<String, dynamic>.from(
                                        _selDatos!);
                                nuevos['movimientos'] = actuales;
                                setState(
                                    () => _selDatos = nuevos);
                                Navigator.pop(ctx);
                                await FirestoreService.notificar(
                                  uid: _user.uid,
                                  tipo: 'movimiento',
                                  titulo:
                                      'Nuevo movimiento en Exp. #${_selDatos?['numero'] ?? ''}',
                                  mensaje:
                                      '$tipo: ${descripcion.text.trim()}',
                                  expedienteId: _selId!,
                                  numero:
                                      '${_selDatos?['numero'] ?? ''}',
                                );
                              }
                              setModal(() => guardando = false);
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: c.primary,
                        foregroundColor: c.textLight,
                      ),
                      child: Text(
                          guardando ? 'Guardando...' : 'Agregar'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.themeController.colors;

    if (_selId != null && _selDatos != null) {
      return _detalle(c);
    }

    return Scaffold(
      backgroundColor: c.background,
      appBar: AppBar(
        backgroundColor: c.headerBg,
        foregroundColor: Colors.white,
        leading: const BackButton(),
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Seguimiento de Expedientes'),
            Text('Sistema Penal Acusatorio y más',
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
              decoration: const InputDecoration(
                prefixText: '🔍 ',
                hintText: 'Buscar expediente...',
              ),
            ),
          ),
          Expanded(
            child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
              stream: FirestoreService.escuchar(
                  'expedientes', _user.uid),
              builder: (_, snap) {
                if (snap.hasError) {
                  return Center(
                      child: Text('Error: ${snap.error}'));
                }
                if (!snap.hasData) {
                  return const Center(
                      child: CircularProgressIndicator());
                }
                final docs = _filtrar(snap.data!.docs);
                if (docs.isEmpty) {
                  return const Center(
                      child:
                          Text('Sin expedientes registrados'));
                }
                return ListView.builder(
                  itemCount: docs.length,
                  itemBuilder: (_, i) {
                    final d = docs[i];
                    final data = d.data();
                    final movs =
                        (data['movimientos'] as List?) ?? [];
                    final ult = ay.fechaDe(
                        data['ultimaActualizacion']);
                    return Card(
                      margin: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      child: InkWell(
                        onTap: () => setState(() {
                          _selId = d.id;
                          _selDatos = data;
                        }),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            children: [
                              const Text('⚖️',
                                  style:
                                      TextStyle(fontSize: 28)),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                        'Expediente #${data['numero'] ?? ''}',
                                        style: const TextStyle(
                                            fontWeight:
                                                FontWeight.bold,
                                            fontSize: 16)),
                                    Text(
                                        '${data['clienteNombre'] ?? ''}',
                                        style: TextStyle(
                                            color:
                                                c.textSecondary)),
                                    Text(
                                        '${data['tipo'] ?? ''} · ${movs.length} movimientos'),
                                    if (ult != null)
                                      Text(
                                          'Última actualización: ${ult.day}/${ult.month}/${ult.year}',
                                          style: TextStyle(
                                              fontSize: 12,
                                              color:
                                                  c.textSecondary)),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: c.primary.withValues(
                                      alpha: 0.1),
                                  borderRadius:
                                      BorderRadius.circular(8),
                                ),
                                child: Text(
                                    '${data['estado'] ?? ''}',
                                    style: TextStyle(
                                        color: c.primary,
                                        fontSize: 12)),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _detalle(AppColors c) {
    final data = _selDatos!;
    final movs = List<Map<String, dynamic>>.from(
        (data['movimientos'] as List?) ?? []);
    movs.sort((a, b) {
      final fa = ay.fechaDe(a['fecha']);
      final fb = ay.fechaDe(b['fecha']);
      if (fa == null || fb == null) return 0;
      return fb.compareTo(fa);
    });

    return Scaffold(
      backgroundColor: c.background,
      appBar: AppBar(
        backgroundColor: c.headerBg,
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Text('←', style: TextStyle(fontSize: 24)),
          onPressed: () => setState(() {
            _selId = null;
            _selDatos = null;
          }),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('#${data['numero'] ?? ''}'),
            Text('${data['clienteNombre'] ?? ''}',
                style: const TextStyle(fontSize: 12)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Text('+', style: TextStyle(fontSize: 26)),
            onPressed: _agregarMovimiento,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('📋 Información del Expediente',
                        style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16)),
                    const SizedBox(height: 8),
                    _filaInfo('Cliente',
                        '${data['clienteNombre'] ?? ''}'),
                    _filaInfo(
                        'Tipo', '${data['tipo'] ?? ''}'),
                    _filaInfo(
                        'Estado', '${data['estado'] ?? ''}'),
                    _filaInfo('Descripción',
                        '${data['descripcion'] ?? 'Sin descripción'}'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text('Movimientos (${movs.length})',
                style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: c.text)),
            const SizedBox(height: 8),
            if (movs.isEmpty)
              const Card(
                  child: Padding(
                      padding: EdgeInsets.all(12),
                      child: Text(
                          'Sin movimientos registrados'))),
            ...movs.map((m) {
              final tipo = '${m['tipo'] ?? 'Otro'}';
              final color =
                  kColoresMovimiento[tipo] ?? c.textSecondary;
              final f = ay.fechaDe(m['fecha']);
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color:
                                  color.withValues(alpha: 0.15),
                              borderRadius:
                                  BorderRadius.circular(8),
                            ),
                            child: Text(tipo,
                                style: TextStyle(
                                    color: color, fontSize: 12)),
                          ),
                          const SizedBox(width: 8),
                          if (f != null)
                            Text('${f.day}/${f.month}/${f.year}',
                                style: TextStyle(
                                    color: c.textSecondary,
                                    fontSize: 12)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text('${m['descripcion'] ?? ''}'),
                      const SizedBox(height: 4),
                      Text('${m['usuario'] ?? ''}',
                          style: TextStyle(
                              fontSize: 12,
                              color: c.textSecondary)),
                    ],
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _filaInfo(String etiqueta, String valor) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
              width: 90,
              child: Text('$etiqueta:',
                  style: const TextStyle(
                      fontWeight: FontWeight.bold))),
          Expanded(child: Text(valor)),
        ],
      ),
    );
  }
}
