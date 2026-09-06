import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../services/firestore_service.dart';
import '../theme/app_theme.dart';
import '../utils/ayudas.dart' as ay;

const List<String> kTiposSociedad = [
  'Sociedad Anónima', 'S.R.L.', 'Sociedad en Comandita',
  'Sociedad Colectiva', 'Fundación', 'Asociación',
  'Corp.', 'Inc.', 'LLC', 'Otro',
];

/// Replica src/screens/CompaniesScreen.js.
class EmpresasScreen extends StatefulWidget {
  final ThemeController themeController;
  const EmpresasScreen({super.key, required this.themeController});

  @override
  State<EmpresasScreen> createState() => _EmpresasScreenState();
}

class _EmpresasScreenState extends State<EmpresasScreen> {
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
      return '${data['nombre'] ?? ''} ${data['ruc'] ?? ''} ${data['representanteLegal'] ?? ''}'
          .toLowerCase()
          .contains(q);
    }).toList();
  }

  Future<void> _confirmarEliminar(String id) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Eliminar Empresa'),
        content: const Text('¿Está seguro?'),
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
      final r = await FirestoreService.eliminar('empresas', id);
      if (!mounted) return;
      if (!r.ok) ay.alerta(context, 'Error', r.error ?? 'No se pudo eliminar');
    }
  }

  Future<void> _abrirFormulario(
      {String? id, Map<String, dynamic>? datos}) async {
    final c = widget.themeController.colors;
    final nombre = TextEditingController(text: '${datos?['nombre'] ?? ''}');
    final ruc = TextEditingController(text: '${datos?['ruc'] ?? ''}');
    final telefono =
        TextEditingController(text: '${datos?['telefono'] ?? ''}');
    final email = TextEditingController(text: '${datos?['email'] ?? ''}');
    final direccion =
        TextEditingController(text: '${datos?['direccion'] ?? ''}');
    final representante = TextEditingController(
        text: '${datos?['representanteLegal'] ?? ''}');
    final notas = TextEditingController(text: '${datos?['notas'] ?? ''}');
    String tipo = '${datos?['tipo'] ?? 'Sociedad Anónima'}';
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
            left: 20, right: 20, top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(id == null ? 'Nueva Empresa' : 'Editar Empresa',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: c.primary)),
                const SizedBox(height: 12),
                const Text('Tipo de Sociedad:'),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  children: kTiposSociedad
                      .map((t) => ChoiceChip(
                            label: Text(t),
                            selected: tipo == t,
                            selectedColor: c.primary,
                            labelStyle: TextStyle(
                                color: tipo == t
                                    ? Colors.white
                                    : c.text),
                            onSelected: (_) =>
                                setModal(() => tipo = t),
                          ))
                      .toList(),
                ),
                const SizedBox(height: 12),
                _campo(nombre, 'Nombre de la Empresa *'),
                _campo(ruc, 'RUC'),
                _campo(telefono, 'Teléfono',
                    teclado: TextInputType.phone),
                _campo(email, 'Email',
                    teclado: TextInputType.emailAddress),
                _campo(direccion, 'Dirección'),
                _campo(representante, 'Representante Legal'),
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
                                if (nombre.text.trim().isEmpty) {
                                  ay.alerta(context, 'Error',
                                      'El nombre de la empresa es obligatorio');
                                  return;
                                }
                                setModal(() => guardando = true);
                                final datosGuardar = {
                                  'nombre': nombre.text.trim(),
                                  'ruc': ruc.text.trim(),
                                  'tipo': tipo,
                                  'telefono': telefono.text.trim(),
                                  'email': email.text.trim(),
                                  'direccion':
                                      direccion.text.trim(),
                                  'representanteLegal':
                                      representante.text.trim(),
                                  'notas': notas.text.trim(),
                                };
                                final r = id == null
                                    ? await FirestoreService.crear(
                                        'empresas', {
                                        ...datosGuardar,
                                        'abogadoId': _user.uid,
                                      })
                                    : await FirestoreService
                                        .actualizar(
                                            'empresas', id, datosGuardar)
                                        .then((v) => (
                                              ok: v.ok,
                                              id: id,
                                              error: v.error
                                            ));
                                if (!ctx.mounted || !mounted) return;
                                if (!r.ok) {
                                  ay.alerta(context, 'Error',
                                      r.error ?? 'No se pudo guardar');
                                } else {
                                  Navigator.pop(ctx);
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
        title: const Text('Empresas'),
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
                hintText: 'Buscar por nombre, RUC o representante...',
              ),
            ),
          ),
          Expanded(
            child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
              stream: FirestoreService.escuchar('empresas', _user.uid),
              builder: (_, snap) {
                if (snap.hasError) {
                  return Center(child: Text('Error: ${snap.error}'));
                }
                if (!snap.hasData) {
                  return const Center(
                      child: CircularProgressIndicator());
                }
                final docs = _filtrar(snap.data!.docs);
                if (docs.isEmpty) {
                  return const Center(
                      child:
                          Text('No hay empresas registradas'));
                }
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 16),
                      child: Text('${docs.length} registradas',
                          style:
                              TextStyle(color: c.textSecondary)),
                    ),
                    Expanded(
                      child: ListView.builder(
                        itemCount: docs.length,
                        itemBuilder: (_, i) {
                          final d = docs[i];
                          final data = d.data();
                          return Card(
                            margin: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 6),
                            child: InkWell(
                              onTap: () => _abrirFormulario(
                                  id: d.id, datos: data),
                              onLongPress: () =>
                                  _confirmarEliminar(d.id),
                              child: Padding(
                                padding: const EdgeInsets.all(12),
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        const Text('🏢',
                                            style:
                                                TextStyle(fontSize: 28)),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment
                                                    .start,
                                            children: [
                                              Text(
                                                  '${data['nombre'] ?? ''}',
                                                  style: const TextStyle(
                                                      fontWeight:
                                                          FontWeight
                                                              .bold,
                                                      fontSize: 16)),
                                              Text(
                                                  'RUC: ${data['ruc'] ?? 'N/A'}',
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
                                            color: c.primary.withValues(
                                                alpha: 0.1),
                                            borderRadius:
                                                BorderRadius.circular(
                                                    8),
                                          ),
                                          child: Text(
                                              '${data['tipo'] ?? ''}',
                                              style: TextStyle(
                                                  color: c.primary,
                                                  fontSize: 12)),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                              'Rep. Legal: ${data['representanteLegal'] ?? 'N/A'} · ${data['telefono'] ?? 'Sin teléfono'}',
                                              style: TextStyle(
                                                  color:
                                                      c.textSecondary)),
                                        ),
                                        if ('${data['direccion'] ?? ''}'
                                            .isNotEmpty)
                                          IconButton(
                                            icon: const Text('📍',
                                                style: TextStyle(
                                                    fontSize: 22)),
                                            onPressed: () =>
                                                ay.navegarA(
                                                    context,
                                                    '${data['direccion']}',
                                                    '${data['nombre'] ?? ''}'),
                                          ),
                                      ],
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
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
