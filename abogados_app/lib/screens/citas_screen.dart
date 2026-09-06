import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../services/firestore_service.dart';
import '../theme/app_theme.dart';
import '../utils/ayudas.dart' as ay;

const List<String> kTiposCita = [
  'Consulta General', 'Asesoría Legal', 'Revisión de Caso',
  'Firma de Documentos', 'Audiencia', 'Mediación', 'Otro',
];

const Map<String, Color> kColoresEstadoCita = {
  'pendiente': Color(0xFFF57C00),
  'completado': Color(0xFF1976D2),
  'cancelado': Color(0xFFD32F2F),
};

/// Replica src/screens/AppointmentsScreen.js (calendario + agenda del día).
class CitasScreen extends StatefulWidget {
  final ThemeController themeController;
  const CitasScreen({super.key, required this.themeController});

  @override
  State<CitasScreen> createState() => _CitasScreenState();
}

class _CitasScreenState extends State<CitasScreen> {
  late DateTime _mesVisible;
  late String _diaSel;

  @override
  void initState() {
    super.initState();
    final hoy = DateTime.now();
    _mesVisible = DateTime(hoy.year, hoy.month);
    _diaSel = _clave(hoy);
  }

  User get _user => FirebaseAuth.instance.currentUser!;

  String _clave(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  DateTime? _fechaDoc(Map<String, dynamic> data) =>
      ay.fechaDe(data['fecha']);

  bool _esDelDia(Map<String, dynamic> data, String dia) {
    final f = _fechaDoc(data);
    if (f == null) return false;
    return _clave(f) == dia;
  }

  Future<void> _cambiarEstado(String id, String estado) async {
    final r = await FirestoreService.actualizar('citas', id, {'estado': estado});
    if (!mounted) return;
    if (!r.ok) ay.alerta(context, 'Error', r.error ?? 'No se pudo actualizar');
  }

  Future<void> _abrirFormulario(
      {String? id, Map<String, dynamic>? datos}) async {
    final c = widget.themeController.colors;
    final clienteNombre =
        TextEditingController(text: '${datos?['clienteNombre'] ?? ''}');
    final clienteTelefono =
        TextEditingController(text: '${datos?['clienteTelefono'] ?? ''}');
    final titulo = TextEditingController(text: '${datos?['titulo'] ?? ''}');
    final hora = TextEditingController(text: '${datos?['hora'] ?? ''}');
    final duracion =
        TextEditingController(text: '${datos?['duracion'] ?? '60'}');
    final ubicacion =
        TextEditingController(text: '${datos?['ubicacion'] ?? 'Oficina'}');
    final notas = TextEditingController(text: '${datos?['notas'] ?? ''}');
    String? clienteId = datos?['clienteId'] as String?;
    String tipo = '${datos?['tipo'] ?? 'Consulta General'}';
    String fechaDia = id == null
        ? _diaSel
        : _clave(_fechaDoc(datos!) ?? DateTime.now());
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
                Text(id == null ? 'Nueva Cita' : 'Editar Cita',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: c.primary)),
                const SizedBox(height: 12),
                if (id == null &&
                    clientesSnap.docs.isNotEmpty) ...[
                  const Text('Seleccionar Cliente:'),
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
                            clienteTelefono.text =
                                '${cd['telefono'] ?? ''}';
                          }),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                _campo(clienteNombre, 'Cliente *'),
                _campo(clienteTelefono, 'Teléfono',
                    teclado: TextInputType.phone),
                _campo(titulo, 'Título / Motivo'),
                const Text('Tipo de Cita:'),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  children: kTiposCita
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
                Row(
                  children: [
                    Expanded(
                        child: _campo(hora, 'Hora (HH:MM)')),
                    const SizedBox(width: 12),
                    Expanded(
                        child: _campo(duracion, 'Duración (min)',
                            teclado: TextInputType.number)),
                  ],
                ),
                _campo(ubicacion, 'Ubicación'),
                TextField(
                  controller: notas,
                  maxLines: 3,
                  decoration: const InputDecoration(
                      hintText: 'Notas adicionales'),
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
                                    hora.text.trim().isEmpty) {
                                  ay.alerta(context, 'Error',
                                      'Cliente y hora son obligatorios');
                                  return;
                                }
                                setModal(() => guardando = true);
                                final fecha = DateTime.tryParse(
                                        '$fechaDia T${hora.text.trim()}:00'
                                            .replaceFirst(' ', '')) ??
                                    DateTime.now();
                                final datosGuardar = {
                                  'clienteId': clienteId ?? '',
                                  'clienteNombre':
                                      clienteNombre.text.trim(),
                                  'clienteTelefono':
                                      clienteTelefono.text.trim(),
                                  'titulo': titulo.text.trim(),
                                  'tipo': tipo,
                                  'fecha': Timestamp.fromDate(fecha),
                                  'hora': hora.text.trim(),
                                  'duracion': duracion.text.trim().isEmpty
                                      ? '60'
                                      : duracion.text.trim(),
                                  'ubicacion':
                                      ubicacion.text.trim().isEmpty
                                          ? 'Oficina'
                                          : ubicacion.text.trim(),
                                  'notas': notas.text.trim(),
                                };
                                final r = id == null
                                    ? await FirestoreService.crear(
                                        'citas', {
                                        ...datosGuardar,
                                        'estado': 'pendiente',
                                        'abogadoId': _user.uid,
                                      })
                                    : await FirestoreService
                                        .actualizar(
                                            'citas', id, datosGuardar)
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
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Citas y Agenda'),
            Text(_diaSel, style: const TextStyle(fontSize: 12)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Text('+', style: TextStyle(fontSize: 26)),
            onPressed: () => _abrirFormulario(),
          ),
        ],
      ),
      body: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
        stream: FirestoreService.escuchar('citas', _user.uid),
        builder: (_, snap) {
          if (snap.hasError) {
            return Center(child: Text('Error: ${snap.error}'));
          }
          final docs = snap.hasData ? snap.data!.docs : [];
          final delDia =
              docs.where((d) => _esDelDia(d.data(), _diaSel)).toList();
          final diasConCita = <String>{};
          for (final d in docs) {
            final f = _fechaDoc(d.data());
            if (f != null) diasConCita.add(_clave(f));
          }
          return Column(
            children: [
              _calendario(c, diasConCita),
              Padding(
                padding: const EdgeInsets.all(12),
                child: Text(
                    '${delDia.length} cita(s) para este día',
                    style: TextStyle(
                        fontWeight: FontWeight.bold, color: c.text)),
              ),
              Expanded(
                child: !snap.hasData
                    ? const Center(child: CircularProgressIndicator())
                    : delDia.isEmpty
                        ? const Center(
                            child: Text(
                                'No hay citas para esta fecha'))
                        : ListView.builder(
                            itemCount: delDia.length,
                            itemBuilder: (_, i) {
                              final d = delDia[i];
                              final data = d.data();
                              final estado =
                                  '${data['estado'] ?? 'pendiente'}';
                              final colorEstado =
                                  kColoresEstadoCita[estado] ??
                                      c.warning;
                              final ubicacion =
                                  '${data['ubicacion'] ?? 'Oficina'}';
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
                                            const Text('📅',
                                                style: TextStyle(
                                                    fontSize: 28)),
                                            const SizedBox(width: 10),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment
                                                        .start,
                                                children: [
                                                  Text(
                                                      '${data['hora'] ?? ''} - ${data['clienteNombre'] ?? ''}',
                                                      style:
                                                          const TextStyle(
                                                              fontWeight:
                                                                  FontWeight
                                                                      .bold,
                                                              fontSize: 16)),
                                                  Text(
                                                      '${data['tipo'] ?? ''}',
                                                      style: TextStyle(
                                                          color: c
                                                              .textSecondary)),
                                                ],
                                              ),
                                            ),
                                            Container(
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                      horizontal: 8,
                                                      vertical: 4),
                                              decoration: BoxDecoration(
                                                color: colorEstado
                                                    .withValues(
                                                        alpha: 0.15),
                                                borderRadius:
                                                    BorderRadius.circular(
                                                        8),
                                              ),
                                              child: Text(
                                                  estado[0].toUpperCase() +
                                                      estado.substring(1),
                                                  style: TextStyle(
                                                      color: colorEstado,
                                                      fontSize: 12)),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                            '${data['titulo'] ?? data['notas'] ?? 'Sin descripción'}'),
                                        Row(
                                          children: [
                                            Expanded(
                                                child: Text(
                                                    '📍 $ubicacion')),
                                            if (ubicacion.isNotEmpty &&
                                                ubicacion !=
                                                    'Oficina')
                                              IconButton(
                                                icon:
                                                    const Text('🗺️'),
                                                onPressed: () =>
                                                    ay.navegarA(
                                                        context,
                                                        ubicacion,
                                                        '${data['clienteNombre'] ?? ''}'),
                                              ),
                                          ],
                                        ),
                                        const SizedBox(height: 4),
                                        Row(
                                          children: [
                                            'pendiente',
                                            'completado',
                                            'cancelado'
                                          ]
                                              .map((e) => Padding(
                                                    padding:
                                                        const EdgeInsets
                                                            .only(
                                                            right: 6),
                                                    child:
                                                        OutlinedButton(
                                                      onPressed: () =>
                                                          _cambiarEstado(
                                                              d.id, e),
                                                      style: OutlinedButton
                                                          .styleFrom(
                                                        backgroundColor: estado ==
                                                                e
                                                            ? (kColoresEstadoCita[
                                                                        e] ??
                                                                    c.warning)
                                                                .withValues(
                                                                    alpha:
                                                                        0.2)
                                                            : null,
                                                        side: BorderSide(
                                                            color: c.border),
                                                      ),
                                                      child: Text(
                                                        e[0].toUpperCase() +
                                                            e.substring(1),
                                                        style: TextStyle(
                                                            color: kColoresEstadoCita[
                                                                    e] ??
                                                                c.warning,
                                                            fontSize: 12),
                                                      ),
                                                    ),
                                                  ))
                                              .toList(),
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
    );
  }

  Widget _calendario(AppColors c, Set<String> diasConCita) {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    final primero = DateTime(_mesVisible.year, _mesVisible.month, 1);
    final diasMes =
        DateTime(_mesVisible.year, _mesVisible.month + 1, 0).day;
    final desfase = (primero.weekday + 6) % 7; // Lunes primero
    final celdas = <Widget>[];
    for (final d in ['L', 'M', 'X', 'J', 'V', 'S', 'D']) {
      celdas.add(Center(
          child: Text(d,
              style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: c.textSecondary))));
    }
    for (var i = 0; i < desfase; i++) {
      celdas.add(const SizedBox.shrink());
    }
    for (var dia = 1; dia <= diasMes; dia++) {
      final fecha = DateTime(_mesVisible.year, _mesVisible.month, dia);
      final clave = _clave(fecha);
      final sel = clave == _diaSel;
      final tiene = diasConCita.contains(clave);
      celdas.add(GestureDetector(
        onTap: () => setState(() => _diaSel = clave),
        child: Container(
          margin: const EdgeInsets.all(2),
          decoration: BoxDecoration(
            color: sel ? c.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('$dia',
                  style: TextStyle(
                      color: sel ? Colors.white : c.text)),
              if (tiene)
                Container(
                  width: 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color:
                        sel ? Colors.white : c.warning,
                    shape: BoxShape.circle,
                  ),
                ),
            ],
          ),
        ),
      ));
    }

    return Card(
      margin: const EdgeInsets.all(12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  icon: const Text('‹',
                      style: TextStyle(fontSize: 24)),
                  onPressed: () => setState(() {
                    _mesVisible = DateTime(
                        _mesVisible.year, _mesVisible.month - 1);
                  }),
                ),
                Text('${meses[_mesVisible.month - 1]} ${_mesVisible.year}',
                    style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: c.text)),
                IconButton(
                  icon: const Text('›',
                      style: TextStyle(fontSize: 24)),
                  onPressed: () => setState(() {
                    _mesVisible = DateTime(
                        _mesVisible.year, _mesVisible.month + 1);
                  }),
                ),
              ],
            ),
            GridView.count(
              crossAxisCount: 7,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              childAspectRatio: 0.9,
              children: celdas,
            ),
          ],
        ),
      ),
    );
  }
}
