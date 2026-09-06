import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import '../services/firestore_service.dart';
import '../theme/app_theme.dart';

/// Replica src/screens/ClientsScreen.js (lista, búsqueda, CRUD).
class ClientesScreen extends StatefulWidget {
  final ThemeController themeController;
  const ClientesScreen({super.key, required this.themeController});

  @override
  State<ClientesScreen> createState() => _ClientesScreenState();
}

class _ClientesScreenState extends State<ClientesScreen> {
  final _busquedaCtrl = TextEditingController();
  String _busqueda = '';

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
      final texto =
          '${data['nombre'] ?? ''} ${data['apellido'] ?? ''} ${data['cedula'] ?? ''} ${data['telefono'] ?? ''}'
              .toLowerCase();
      return texto.contains(q);
    }).toList();
  }

  void _alerta(String titulo, String mensaje) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(titulo),
        content: Text(mensaje),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmarEliminar(
      String id, String nombreCompleto) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Eliminar Cliente'),
        content: const Text(
            '¿Está seguro de eliminar este cliente? Esta acción no se puede deshacer.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Eliminar'),
          ),
        ],
      ),
    );
    if (ok == true) {
      final r = await FirestoreService.eliminar('clientes', id);
      if (!mounted) return;
      if (!r.ok) {
        _alerta('Error', r.error ?? 'No se pudo eliminar');
      }
    }
  }

  Future<void> _abrirFormulario(
      {String? id, Map<String, dynamic>? datos}) async {
    final c = widget.themeController.colors;
    final nombre = TextEditingController(text: '${datos?['nombre'] ?? ''}');
    final apellido =
        TextEditingController(text: '${datos?['apellido'] ?? ''}');
    final cedula = TextEditingController(text: '${datos?['cedula'] ?? ''}');
    final telefono =
        TextEditingController(text: '${datos?['telefono'] ?? ''}');
    final email = TextEditingController(text: '${datos?['email'] ?? ''}');
    final direccion =
        TextEditingController(text: '${datos?['direccion'] ?? ''}');
    final ruc = TextEditingController(text: '${datos?['ruc'] ?? ''}');
    final notas = TextEditingController(text: '${datos?['notas'] ?? ''}');
    bool guardando = false;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModal) => Container(
          constraints: BoxConstraints(
              maxHeight: MediaQuery.of(ctx).size.height * 0.85),
          decoration: BoxDecoration(
            color: c.surface,
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(30)),
          ),
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(id == null ? 'Nuevo Cliente' : 'Editar Cliente',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: c.primary)),
                const SizedBox(height: 16),
                _campo(nombre, 'Nombre *'),
                _campo(apellido, 'Apellido *'),
                _campo(cedula, 'Cédula'),
                _campo(telefono, 'Teléfono',
                    teclado: TextInputType.phone),
                _campo(email, 'Email',
                    teclado: TextInputType.emailAddress),
                _campo(direccion, 'Dirección'),
                _campo(ruc, 'RUC'),
                _campo(notas, 'Notas'),
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
                                if (nombre.text.trim().isEmpty ||
                                    apellido.text.trim().isEmpty) {
                                  _alerta('Error',
                                      'Nombre y apellido son obligatorios');
                                  return;
                                }
                                setModal(() => guardando = true);
                                if (id == null) {
                                  final perfil = await AuthService.perfil(
                                      _user.uid);
                                  final abogadoNombre =
                                      '${perfil?['nombre'] ?? ''} ${perfil?['apellido'] ?? ''}'
                                          .trim();
                                  final r = await FirestoreService.crear(
                                    'clientes',
                                    FirestoreService.nuevoCliente(
                                      uid: _user.uid,
                                      abogadoNombre: abogadoNombre,
                                      nombre: nombre.text,
                                      apellido: apellido.text,
                                      cedula: cedula.text,
                                      telefono: telefono.text,
                                      email: email.text,
                                      direccion: direccion.text,
                                      ruc: ruc.text,
                                      notas: notas.text,
                                    ),
                                  );
                                  if (!ctx.mounted) return;
                                  if (!r.ok) {
                                    _alerta('Error',
                                        r.error ?? 'No se pudo guardar');
                                  } else {
                                    Navigator.pop(ctx);
                                  }
                                } else {
                                  final r =
                                      await FirestoreService.actualizar(
                                    'clientes',
                                    id,
                                    {
                                      'nombre': nombre.text.trim(),
                                      'apellido': apellido.text.trim(),
                                      'cedula': cedula.text.trim(),
                                      'telefono': telefono.text.trim(),
                                      'email': email.text.trim(),
                                      'direccion': direccion.text.trim(),
                                      'ruc': ruc.text.trim(),
                                      'notas': notas.text.trim(),
                                    },
                                  );
                                  if (!ctx.mounted) return;
                                  if (!r.ok) {
                                    _alerta('Error',
                                        r.error ?? 'No se pudo guardar');
                                  } else {
                                    Navigator.pop(ctx);
                                  }
                                }
                                setModal(() => guardando = false);
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: c.primary,
                          foregroundColor: c.textLight,
                        ),
                        child: Text(
                            guardando ? 'Guardando...' : 'Guardar'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _campo(TextEditingController ctrl, String hint,
      {TextInputType teclado = TextInputType.text}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: SizedBox(
        height: 45,
        child: TextField(
          controller: ctrl,
          keyboardType: teclado,
          decoration: InputDecoration(
            hintText: hint,
            border:
                OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 12),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.themeController.colors;

    return Scaffold(
      backgroundColor: c.background,
      appBar: AppBar(
        backgroundColor: c.headerBg,
        foregroundColor: Colors.white,
        leading: const BackButton(),
        title: const Text('Clientes'),
        actions: [
          IconButton(
            icon: const Text('+', style: TextStyle(fontSize: 26)),
            onPressed: () => _abrirFormulario(),
          ),
        ],
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
                hintText: 'Buscar por nombre, cédula o teléfono...',
              ),
            ),
          ),
          Expanded(
            child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
              stream: FirestoreService.escuchar('clientes', _user.uid),
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
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text('${docs.length} registrados',
                          style: TextStyle(color: c.textSecondary)),
                    ),
                    Expanded(
                      child: docs.isEmpty
                          ? Center(
                              child: Text(_busqueda.isEmpty
                                  ? 'No hay clientes registrados. Presione + para agregar.'
                                  : 'No se encontraron clientes'))
                          : ListView.builder(
                              itemCount: docs.length,
                              itemBuilder: (_, i) {
                                final d = docs[i];
                                final data = d.data();
                                final nombreCompleto =
                                    '${data['nombre'] ?? ''} ${data['apellido'] ?? ''}'
                                        .trim();
                                return Card(
                                  margin: const EdgeInsets.symmetric(
                                      horizontal: 12, vertical: 6),
                                  child: InkWell(
                                    onTap: () => _abrirFormulario(
                                        id: d.id, datos: data),
                                    onLongPress: () =>
                                        _confirmarEliminar(
                                            d.id, nombreCompleto),
                                    child: Padding(
                                      padding: const EdgeInsets.all(12),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              const Text('👤',
                                                  style: TextStyle(
                                                      fontSize: 28)),
                                              const SizedBox(width: 10),
                                              Expanded(
                                                child: Column(
                                                  crossAxisAlignment:
                                                      CrossAxisAlignment
                                                          .start,
                                                  children: [
                                                    Text(nombreCompleto,
                                                        style: const TextStyle(
                                                            fontWeight:
                                                                FontWeight
                                                                    .bold,
                                                            fontSize: 16)),
                                                    Text(
                                                        '${data['tipo'] ?? 'Persona Natural'} • ${data['cedula'] ?? 'Sin cédula'}',
                                                        style: TextStyle(
                                                            color: c
                                                                .textSecondary)),
                                                  ],
                                                ),
                                              ),
                                              Container(
                                                padding: const EdgeInsets
                                                    .symmetric(
                                                    horizontal: 8,
                                                    vertical: 4),
                                                decoration: BoxDecoration(
                                                  color: c.primary
                                                      .withValues(alpha: 0.1),
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                          8),
                                                ),
                                                child: Text(
                                                    '${data['telefono'] ?? ''}',
                                                    style: TextStyle(
                                                        color: c.primary,
                                                        fontSize: 12)),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 6),
                                          Text(
                                              '${data['email'] ?? 'Sin email'} · ${data['direccion'] ?? 'Sin dirección'}',
                                              style: TextStyle(
                                                  color:
                                                      c.textSecondary)),
                                        ],
                                      ),
                                    ),
                                  ),
                                );
                              },
                            ),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
