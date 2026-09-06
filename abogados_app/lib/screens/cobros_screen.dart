import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../services/firestore_service.dart';
import '../services/pdf_service.dart';
import '../theme/app_theme.dart';
import '../utils/ayudas.dart' as ay;

const List<String> kMetodosPago = [
  'Efectivo', 'Transferencia Bancaria', 'Tarjeta de Crédito',
  'Tarjeta de Débito', 'Cheque', 'Yappy', 'Depósito Bancario',
];

/// Replica src/screens/PaymentsScreen.js (tabs, resumen, PDF, WhatsApp).
class CobrosScreen extends StatefulWidget {
  final ThemeController themeController;
  const CobrosScreen({super.key, required this.themeController});

  @override
  State<CobrosScreen> createState() => _CobrosScreenState();
}

class _CobrosScreenState extends State<CobrosScreen> {
  String _tab = 'cobros'; // cobros | pendiente | pagado | vencido

  User get _user => FirebaseAuth.instance.currentUser!;

  List<QueryDocumentSnapshot<Map<String, dynamic>>> _filtrar(
      List<QueryDocumentSnapshot<Map<String, dynamic>>> docs) {
    if (_tab == 'cobros') return docs;
    return docs
        .where((d) => '${d.data()['estado'] ?? ''}' == _tab)
        .toList();
  }

  double _sumar(
      List<QueryDocumentSnapshot<Map<String, dynamic>>> docs,
      bool Function(String) condicion) {
    var total = 0.0;
    for (final d in docs) {
      final data = d.data();
      if (condicion('${data['estado'] ?? ''}')) {
        total += ay.montoDe(data['monto']);
      }
    }
    return total;
  }

  Future<void> _marcarPagado(String id, Map<String, dynamic> data) async {
    final res =
        await FirestoreService.actualizar('cobros', id, {'estado': 'pagado'});
    if (!mounted) return;
    if (!res.ok) {
      ay.alerta(context, 'Error', res.error ?? 'No se pudo actualizar');
    } else {
      final tel = '${data['clienteTelefono'] ?? ''}';
      if (tel.isNotEmpty) {
        ay.abrirWhatsApp(
          context,
          tel,
          '✅ *Pago Confirmado*\n\nSu pago de ${ay.moneda(ay.montoDe(data['monto']))} fue registrado. ¡Gracias por su preferencia! Bufete de Abogados.',
        );
      }
    }
  }

  Future<void> _recordar(Map<String, dynamic> data) async {
    ay.abrirWhatsApp(
      context,
      '${data['clienteTelefono'] ?? ''}',
      'Hola ${data['clienteNombre'] ?? ''}, le recordamos su cobro de ${ay.moneda(ay.montoDe(data['monto']))} con vencimiento ${data['fechaVencimiento'] ?? ''}. Bufete de Abogados.',
    );
  }

  Future<void> _abrirFormulario() async {
    final c = widget.themeController.colors;
    final clienteNombre = TextEditingController();
    final numeroFactura = TextEditingController(
        text:
            'FAC-${DateTime.now().millisecondsSinceEpoch.toRadixString(36).toUpperCase()}');
    final monto = TextEditingController();
    final descripcion = TextEditingController();
    final fechaVencimiento = TextEditingController();
    String? clienteId;
    String clienteTelefono = '';
    String metodoPago = 'Transferencia Bancaria';
    bool guardando = false;

    final clientesSnap = await FirebaseFirestore.instance
        .collection('clientes')
        .where('abogadoId', isEqualTo: _user.uid)
        .get();
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
            left: 20, right: 20, top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Nuevo Cobro',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: c.primary)),
                const SizedBox(height: 12),
                if (clientesSnap.docs.isNotEmpty) ...[
                  const Text('Cliente:'),
                  const SizedBox(height: 6),
                  SizedBox(
                    height: 40,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: clientesSnap.docs.length,
                      separatorBuilder: (_, _) =>
                          const SizedBox(width: 8),
                      itemBuilder: (_, i) {
                        final cd = clientesSnap.docs[i].data();
                        final sel =
                            clienteId == clientesSnap.docs[i].id;
                        return ChoiceChip(
                          label: Text(
                              '${cd['nombre'] ?? ''} ${cd['apellido'] ?? ''}'),
                          selected: sel,
                          selectedColor: c.primary,
                          labelStyle: TextStyle(
                              color: sel ? Colors.white : c.text),
                          onSelected: (_) => setModal(() {
                            clienteId = clientesSnap.docs[i].id;
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
                _campo(clienteNombre, 'Cliente'),
                _campo(numeroFactura, 'No. Factura'),
                _campo(monto, 'Monto (B/.) *',
                    teclado: const TextInputType.numberWithOptions(
                        decimal: true)),
                _campo(descripcion, 'Descripción'),
                _campo(fechaVencimiento,
                    'Fecha de Vencimiento (DD/MM/AAAA)'),
                const Text('Método de Pago:'),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  children: kMetodosPago
                      .map((m) => ChoiceChip(
                            label: Text(m),
                            selected: metodoPago == m,
                            selectedColor: c.primary,
                            labelStyle: TextStyle(
                                color: metodoPago == m
                                    ? Colors.white
                                    : c.text),
                            onSelected: (_) =>
                                setModal(() => metodoPago = m),
                          ))
                      .toList(),
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
                                if (clienteNombre.text
                                        .trim()
                                        .isEmpty ||
                                    monto.text.trim().isEmpty) {
                                  ay.alerta(context, 'Error',
                                      'Cliente y monto son obligatorios');
                                  return;
                                }
                                setModal(() => guardando = true);
                                final r =
                                    await FirestoreService.crear(
                                  'cobros',
                                  {
                                    'clienteId': clienteId ?? '',
                                    'clienteNombre':
                                        clienteNombre.text.trim(),
                                    'clienteTelefono': clienteTelefono,
                                    'tipo': 'honorarios',
                                    'monto': double.tryParse(monto.text
                                            .trim()
                                            .replaceAll(',', '.')) ??
                                        0,
                                    'descripcion':
                                        descripcion.text.trim(),
                                    'metodoPago': metodoPago,
                                    'fechaVencimiento':
                                        fechaVencimiento.text.trim(),
                                    'estado': 'pendiente',
                                    'numeroFactura':
                                        numeroFactura.text.trim(),
                                    'abogadoId': _user.uid,
                                  },
                                );
                                if (!ctx.mounted || !mounted) return;
                                if (!r.ok) {
                                  ay.alerta(context, 'Error',
                                      r.error ?? 'No se pudo guardar');
                                } else {
                                  Navigator.pop(ctx);
                                  if (mounted) {
                                    ay.alerta(context, 'Éxito',
                                        'Cobro registrado correctamente');
                                    if (clienteTelefono.isNotEmpty) {
                                      ay.abrirWhatsApp(
                                        context,
                                        clienteTelefono,
                                        'Hola ${clienteNombre.text.trim()}, su factura ${numeroFactura.text.trim()} por ${ay.moneda(double.tryParse(monto.text.trim().replaceAll(',', '.')) ?? 0)} fue registrada. Bufete de Abogados.',
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
                        child: Text(guardando
                            ? 'Guardando...'
                            : 'Registrar Cobro'),
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
      child: TextField(
        controller: ctrl,
        keyboardType: teclado,
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
        title: const Text('Cobros y Facturación'),
        actions: [
          IconButton(
            icon: const Text('+', style: TextStyle(fontSize: 26)),
            onPressed: () => _abrirFormulario(),
          ),
        ],
      ),
      body: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
        stream: FirestoreService.escuchar('cobros', _user.uid),
        builder: (_, snap) {
          if (snap.hasError) {
            return Center(child: Text('Error: ${snap.error}'));
          }
          final List<QueryDocumentSnapshot<Map<String, dynamic>>> todos =
              snap.hasData ? snap.data!.docs : [];
          final pendiente =
              _sumar(todos, (e) => e == 'pendiente' || e == 'vencido');
          final cobrado = _sumar(todos, (e) => e == 'pagado');
          final docs = _filtrar(todos);
          const tabs = [
            ('cobros', 'Todos'),
            ('pendiente', 'Pendientes'),
            ('pagado', 'Pagados'),
            ('vencido', 'Vencidos'),
          ];
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.all(12),
                child: Text('Pendiente: ${ay.moneda(pendiente)}',
                    style:
                        TextStyle(color: c.textSecondary)),
              ),
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12),
                child: Row(
                  children: [
                    _resumen(c, 'Pendiente', ay.moneda(pendiente),
                        c.error),
                    const SizedBox(width: 8),
                    _resumen(c, 'Cobrado', ay.moneda(cobrado),
                        c.success),
                    const SizedBox(width: 8),
                    _resumen(c, 'Total',
                        ay.moneda(pendiente + cobrado), c.text),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding:
                    const EdgeInsets.symmetric(horizontal: 12),
                child: Row(
                  children: tabs
                      .map((t) => Padding(
                            padding:
                                const EdgeInsets.only(right: 8),
                            child: ChoiceChip(
                              label: Text(t.$2),
                              selected: _tab == t.$1,
                              selectedColor: c.primary,
                              labelStyle: TextStyle(
                                  color: _tab == t.$1
                                      ? Colors.white
                                      : c.text),
                              onSelected: (_) =>
                                  setState(() => _tab = t.$1),
                            ),
                          ))
                      .toList(),
                ),
              ),
              const SizedBox(height: 8),
              Expanded(
                child: !snap.hasData
                    ? const Center(
                        child: CircularProgressIndicator())
                    : docs.isEmpty
                        ? const Center(
                            child:
                                Text('Sin registros de cobros'))
                        : ListView.builder(
                            itemCount: docs.length,
                            itemBuilder: (_, i) {
                              final d = docs[i];
                              final data = d.data();
                              final pagado =
                                  '${data['estado'] ?? ''}' ==
                                      'pagado';
                              return Card(
                                margin: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 6),
                                child: InkWell(
                                  onTap: () =>
                                      PdfService.factura(
                                          context, data),
                                  child: Padding(
                                    padding:
                                        const EdgeInsets.all(12),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Text(pagado ? '✅' : '⏳',
                                                style: const TextStyle(
                                                    fontSize: 28)),
                                            const SizedBox(width: 10),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment
                                                        .start,
                                                children: [
                                                  Text(
                                                      '${data['numeroFactura'] ?? 'N/A'}',
                                                      style:
                                                          const TextStyle(
                                                              fontWeight:
                                                                  FontWeight
                                                                      .bold,
                                                              fontSize:
                                                                  16)),
                                                  Text(
                                                      '${data['clienteNombre'] ?? ''}',
                                                      style: TextStyle(
                                                          color: c
                                                              .textSecondary)),
                                                ],
                                              ),
                                            ),
                                            Container(
                                              padding:
                                                  const EdgeInsets
                                                      .symmetric(
                                                      horizontal: 8,
                                                      vertical: 4),
                                              decoration: BoxDecoration(
                                                color: c.primary
                                                    .withValues(
                                                        alpha: 0.1),
                                                borderRadius:
                                                    BorderRadius
                                                        .circular(8),
                                              ),
                                              child: Text(
                                                  '${data['estado'] ?? ''}',
                                                  style: TextStyle(
                                                      color: c.primary,
                                                      fontSize: 12)),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                            '${ay.moneda(ay.montoDe(data['monto']))} · ${data['descripcion'] ?? 'Sin descripción'}'),
                                        if (!pagado) ...[
                                          const SizedBox(height: 8),
                                          Row(
                                            children: [
                                              Expanded(
                                                child: TextButton(
                                                  onPressed: () =>
                                                      _marcarPagado(
                                                          d.id,
                                                          data),
                                                  style: TextButton
                                                      .styleFrom(
                                                    backgroundColor:
                                                        c.success.withValues(
                                                            alpha:
                                                                0.15),
                                                  ),
                                                  child: Text(
                                                      '✅ Marcar Pagado',
                                                      style: TextStyle(
                                                          color: c
                                                              .success)),
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              if ('${data['clienteTelefono'] ?? ''}'
                                                  .isNotEmpty)
                                                Expanded(
                                                  child: TextButton(
                                                    onPressed: () =>
                                                        _recordar(
                                                            data),
                                                    style: TextButton
                                                        .styleFrom(
                                                      backgroundColor: c
                                                          .warning
                                                          .withValues(
                                                              alpha:
                                                                  0.15),
                                                    ),
                                                    child: Text(
                                                        '🔔 Recordar',
                                                        style: TextStyle(
                                                            color: c
                                                                .warning)),
                                                  ),
                                                ),
                                            ],
                                          ),
                                        ],
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
    );
  }

  Widget _resumen(
      AppColors c, String titulo, String valor, Color color) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            children: [
              Text(titulo,
                  style: TextStyle(
                      fontSize: 12, color: c.textSecondary)),
              const SizedBox(height: 4),
              Text(valor,
                  style: TextStyle(
                      fontWeight: FontWeight.bold, color: color)),
            ],
          ),
        ),
      ),
    );
  }
}
