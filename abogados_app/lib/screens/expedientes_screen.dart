import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import '../services/firestore_service.dart';
import '../services/pdf_service.dart';
import '../theme/app_theme.dart';
import '../utils/ayudas.dart' as ay;

const List<String> kTiposExpediente = [
  'Civil', 'Penal', 'Laboral', 'Comercial', 'Administrativo',
  'Familia', 'Constitucional', 'Contencioso', 'Penal Acusatorio',
];

const List<String> kEstadosExpediente = [
  'Activo', 'En Proceso', 'Suspendido', 'Archivado',
  'Cerrado', 'Apelación', 'Cumplimiento de Sentencia',
];

/// Replica src/screens/ExpedientesScreen.js.
class ExpedientesScreen extends StatefulWidget {
  final ThemeController themeController;
  const ExpedientesScreen({super.key, required this.themeController});

  @override
  State<ExpedientesScreen> createState() => _ExpedientesScreenState();
}

class _ExpedientesScreenState extends State<ExpedientesScreen> {
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
      return '${data['numero'] ?? ''} ${data['clienteNombre'] ?? ''} ${data['tipo'] ?? ''} ${data['estado'] ?? ''}'
          .toLowerCase()
          .contains(q);
    }).toList();
  }

  Future<void> _abrirFormulario(
      {String? id, Map<String, dynamic>? datos}) async {
    final c = widget.themeController.colors;
    final numero = TextEditingController(text: '${datos?['numero'] ?? ''}');
    final clienteNombre =
        TextEditingController(text: '${datos?['clienteNombre'] ?? ''}');
    final descripcion =
        TextEditingController(text: '${datos?['descripcion'] ?? ''}');
    String? clienteId = datos?['clienteId'] as String?;
    String clienteTelefono = '${datos?['clienteTelefono'] ?? ''}';
    String tipo = '${datos?['tipo'] ?? 'Civil'}';
    String estado = '${datos?['estado'] ?? 'Activo'}';
    bool guardando = false;

    final clientesSnap = await FirebaseFirestore.instance
        .collection('clientes')
        .where('abogadoId', isEqualTo: _user.uid)
        .get();
    final clientes = clientesSnap.docs;
    if (!mounted) return;

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
                Text(id == null ? 'Nuevo Expediente' : 'Editar Expediente',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: c.primary)),
                const SizedBox(height: 12),
                if (id == null && clientes.isNotEmpty) ...[
                  const Text('Cliente:'),
                  const SizedBox(height: 6),
                  SizedBox(
                    height: 40,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: clientes.length,
                      separatorBuilder: (_, _) =>
                          const SizedBox(width: 8),
                      itemBuilder: (_, i) {
                        final cd = clientes[i].data();
                        final sel = clienteId == clientes[i].id;
                        return ChoiceChip(
                          label: Text(
                              '${cd['nombre'] ?? ''} ${cd['apellido'] ?? ''}'),
                          selected: sel,
                          selectedColor: c.primary,
                          labelStyle: TextStyle(
                              color: sel ? Colors.white : c.text),
                          onSelected: (_) => setModal(() {
                            clienteId = clientes[i].id;
                            clienteNombre.text =
                                '${cd['nombre'] ?? ''} ${cd['apellido'] ?? ''}'
                                    .trim();
                            clienteTelefono = '${cd['telefono'] ?? ''}';
                          }),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                _campo(numero, 'Número de Expediente *'),
                _campo(clienteNombre, 'Cliente'),
                const Text('Tipo:'),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  children: kTiposExpediente
                      .map((t) => ChoiceChip(
                            label: Text(t),
                            selected: tipo == t,
                            selectedColor: c.primary,
                            labelStyle: TextStyle(
                                color: tipo == t ? Colors.white : c.text),
                            onSelected: (_) =>
                                setModal(() => tipo = t),
                          ))
                      .toList(),
                ),
                const SizedBox(height: 12),
                const Text('Estado:'),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  children: kEstadosExpediente
                      .map((e) => ChoiceChip(
                            label: Text(e),
                            selected: estado == e,
                            selectedColor: c.primary,
                            labelStyle: TextStyle(
                                color:
                                    estado == e ? Colors.white : c.text),
                            onSelected: (_) =>
                                setModal(() => estado = e),
                          ))
                      .toList(),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: descripcion,
                  maxLines: 4,
                  decoration: const InputDecoration(
                      hintText: 'Descripción del caso'),
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
                                if (numero.text.trim().isEmpty ||
                                    clienteNombre.text.trim().isEmpty) {
                                  ay.alerta(context, 'Error',
                                      'Número de expediente y cliente son obligatorios');
                                  return;
                                }
                                setModal(() => guardando = true);
                                if (id == null) {
                                  final perfil =
                                      await AuthService.perfil(_user.uid);
                                  final abogadoNombre =
                                      '${perfil?['nombre'] ?? ''} ${perfil?['apellido'] ?? ''}'
                                          .trim();
                                  final r =
                                      await FirestoreService.crear(
                                    'expedientes',
                                    {
                                      'numero': numero.text.trim(),
                                      'tipo': tipo,
                                      'clienteId': clienteId ?? '',
                                      'clienteNombre':
                                          clienteNombre.text.trim(),
                                      'clienteTelefono': clienteTelefono,
                                      'estado': estado,
                                      'descripcion':
                                          descripcion.text.trim(),
                                      'fechaApertura': Timestamp.now(),
                                      'movimientos': [],
                                      'abogadoId': _user.uid,
                                      'abogadoNombre': abogadoNombre,
                                    },
                                  );
                                  if (!ctx.mounted || !mounted) return;
                                  if (!r.ok) {
                                    ay.alerta(context, 'Error',
                                        r.error ?? 'No se pudo guardar');
                                  } else {
                                    Navigator.pop(ctx);
                                  }
                                } else {
                                  final r =
                                      await FirestoreService.actualizar(
                                    'expedientes',
                                    id,
                                    {
                                      'numero': numero.text.trim(),
                                      'tipo': tipo,
                                      'clienteNombre':
                                          clienteNombre.text.trim(),
                                      'estado': estado,
                                      'descripcion':
                                          descripcion.text.trim(),
                                    },
                                  );
                                  if (!ctx.mounted || !mounted) return;
                                  if (!r.ok) {
                                    ay.alerta(context, 'Error',
                                        r.error ?? 'No se pudo guardar');
                                  } else {
                                    Navigator.pop(ctx);
                                    if (clienteTelefono.isNotEmpty) {
                                      ay.abrirWhatsApp(
                                        context,
                                        clienteTelefono,
                                        'Hola ${clienteNombre.text.trim()}, su expediente ${numero.text.trim()} cambió a estado: $estado. Bufete de Abogados.',
                                      );
                                    }
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

  Widget _campo(TextEditingController ctrl, String hint) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextField(
        controller: ctrl,
        decoration: InputDecoration(hintText: hint),
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
        title: const Text('Expedientes'),
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
                hintText: 'Buscar expediente...',
              ),
            ),
          ),
          Expanded(
            child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
              stream:
                  FirestoreService.escuchar('expedientes', _user.uid),
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
                      child: Text('No hay expedientes'));
                }
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 16),
                      child: Text('${docs.length} registrados',
                          style:
                              TextStyle(color: c.textSecondary)),
                    ),
                    Expanded(
                      child: ListView.builder(
                        itemCount: docs.length,
                        itemBuilder: (_, i) {
                          final d = docs[i];
                          final data = d.data();
                          final desc =
                              '${data['descripcion'] ?? ''}';
                          return Card(
                            margin: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 6),
                            child: InkWell(
                              onTap: () => _abrirFormulario(
                                  id: d.id, datos: data),
                              child: Padding(
                                padding: const EdgeInsets.all(12),
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        const Text('📁',
                                            style:
                                                TextStyle(fontSize: 28)),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text('#${data['numero'] ?? ''}',
                                                  style: const TextStyle(
                                                      fontWeight:
                                                          FontWeight.bold,
                                                      fontSize: 16)),
                                              Text(
                                                  '${data['clienteNombre'] ?? ''}',
                                                  style: TextStyle(
                                                      color: c
                                                          .textSecondary)),
                                            ],
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets
                                              .symmetric(
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
                                    const SizedBox(height: 6),
                                    Text(
                                        '${data['tipo'] ?? ''} · ${desc.length > 80 ? '${desc.substring(0, 80)}…' : desc}'),
                                    Align(
                                      alignment: Alignment.centerRight,
                                      child: TextButton(
                                        onPressed: () =>
                                            PdfService.reporteCaso(
                                                context, data),
                                        style: TextButton.styleFrom(
                                          backgroundColor: c.primary
                                              .withValues(alpha: 0.1),
                                        ),
                                        child: Text('📄 PDF',
                                            style: TextStyle(
                                                color: c.primary)),
                                      ),
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
