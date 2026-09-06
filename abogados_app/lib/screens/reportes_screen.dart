import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../services/pdf_service.dart';
import '../theme/app_theme.dart';
import '../utils/ayudas.dart' as ay;

const List<Color> kColoresPie = [
  Color(0xFF1A237E), Color(0xFFC5A028), Color(0xFF388E3C),
  Color(0xFFD32F2F), Color(0xFFF57C00), Color(0xFF1976D2),
  Color(0xFF7B1FA2),
];

/// Replica src/screens/ReportsScreen.js (gráficas + resumen + PDF).
class ReportesScreen extends StatefulWidget {
  final ThemeController themeController;
  const ReportesScreen({super.key, required this.themeController});

  @override
  State<ReportesScreen> createState() => _ReportesScreenState();
}

class _ReportesScreenState extends State<ReportesScreen> {
  bool _cargando = true;
  List<Map<String, dynamic>> _expedientes = [];
  List<Map<String, dynamic>> _cobros = [];
  int _totalCitas = 0;

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar() async {
    setState(() => _cargando = true);
    try {
      final uid = FirebaseAuth.instance.currentUser!.uid;
      final db = FirebaseFirestore.instance;
      final exp = await db
          .collection('expedientes')
          .where('abogadoId', isEqualTo: uid)
          .get();
      final cob = await db
          .collection('cobros')
          .where('abogadoId', isEqualTo: uid)
          .get();
      final cit = await db
          .collection('citas')
          .where('abogadoId', isEqualTo: uid)
          .count()
          .get();
      if (!mounted) return;
      setState(() {
        _expedientes = exp.docs.map((d) => d.data()).toList();
        _cobros = cob.docs.map((d) => d.data()).toList();
        _totalCitas = cit.count ?? 0;
      });
    } finally {
      if (mounted) setState(() => _cargando = false);
    }
  }

  Map<String, int> _contar(List<Map<String, dynamic>> docs, String campo) {
    final m = <String, int>{};
    for (final d in docs) {
      final k = '${d[campo] ?? 'Sin dato'}';
      m[k] = (m[k] ?? 0) + 1;
    }
    return m;
  }

  double _totalCobrado() {
    var total = 0.0;
    for (final c in _cobros) {
      if ('${c['estado'] ?? ''}' == 'pagado') {
        total += ay.montoDe(c['monto']);
      }
    }
    return total;
  }

  int _activos() {
    return _expedientes
        .where((e) => '${e['estado'] ?? ''}' == 'Activo')
        .length;
  }

  List<MapEntry<String, double>> _cobrosPorMes() {
    final m = <String, double>{};
    final orden = <String, DateTime>{};
    for (final c in _cobros) {
      if ('${c['estado'] ?? ''}' != 'pagado') continue;
      final f = ay.fechaDe(c['createdAt']) ?? ay.fechaDe(c['fecha']);
      if (f == null) continue;
      final clave = '${f.month}/${f.year}';
      m[clave] = (m[clave] ?? 0) + ay.montoDe(c['monto']);
      orden[clave] = DateTime(f.year, f.month);
    }
    final lista = m.entries.toList()
      ..sort((a, b) => orden[a.key]!.compareTo(orden[b.key]!));
    return lista.length > 6 ? lista.sublist(lista.length - 6) : lista;
  }

  Future<void> _pdf() async {
    await PdfService.reporteGeneral(
      context,
      totalExpedientes: _expedientes.length,
      activos: _activos(),
      totalCobrado: _totalCobrado(),
      totalCitas: _totalCitas,
      expedientes: _expedientes,
      cobros: _cobros,
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
        title: const Text('Reportes y Estadísticas'),
        actions: [
          IconButton(
            icon: const Text('📄', style: TextStyle(fontSize: 22)),
            onPressed: _pdf,
          ),
        ],
      ),
      body: _cargando
          ? const Center(child: Text('Generando reportes...'))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _cardTipos(c),
                  const SizedBox(height: 12),
                  _cardEstados(c),
                  const SizedBox(height: 12),
                  _cardCobrosMes(c),
                  const SizedBox(height: 12),
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.5,
                    children: [
                      _mini(c, '📁', '${_expedientes.length}',
                          'Total Expedientes'),
                      _mini(c, '⚖️', '${_activos()}', 'Activos'),
                      _mini(c, '💰', ay.moneda(_totalCobrado()),
                          'Total Cobrado'),
                      _mini(c, '📅', '$_totalCitas', 'Total Citas'),
                    ],
                  ),
                ],
              ),
            ),
    );
  }

  Widget _tituloCard(String t, AppColors c) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(t,
          style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
              color: c.text)),
    );
  }

  Widget _cardTipos(AppColors c) {
    final conteo = _contar(_expedientes, 'tipo');
    final top = conteo.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    final datos = top.take(7).toList();
    final total =
        datos.fold<int>(0, (s, e) => s + e.value);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _tituloCard('Expedientes por Tipo', c),
            if (datos.isEmpty)
              const Text('Sin datos disponibles')
            else
              SizedBox(
                height: 200,
                child: PieChart(
                  PieChartData(
                    sections: datos.asMap().entries.map((en) {
                      final i = en.key;
                      final e = en.value;
                      final nombre = e.key.length > 10
                          ? '${e.key.substring(0, 10)}…'
                          : e.key;
                      return PieChartSectionData(
                        value: e.value.toDouble(),
                        title:
                            '${(e.value / total * 100).toStringAsFixed(0)}%',
                        color: kColoresPie[i % kColoresPie.length],
                        radius: 70,
                        titleStyle: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.white),
                        badgeWidget: Text(nombre,
                            style: TextStyle(
                                fontSize: 10, color: c.text)),
                        badgePositionPercentageOffset: 1.4,
                      );
                    }).toList(),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _cardEstados(AppColors c) {
    final conteo = _contar(_expedientes, 'estado');
    final entradas = conteo.entries.toList();
    final maxVal = entradas.isEmpty
        ? 1.0
        : entradas
                .map((e) => e.value)
                .reduce((a, b) => a > b ? a : b)
                .toDouble();
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _tituloCard('Estado de Expedientes', c),
            if (entradas.isEmpty)
              const Text('Sin datos disponibles')
            else
              SizedBox(
                height: 200,
                child: BarChart(
                  BarChartData(
                    maxY: maxVal + 1,
                    barGroups: entradas.asMap().entries.map((en) {
                      return BarChartGroupData(
                        x: en.key,
                        barRods: [
                          BarChartRodData(
                            toY: en.value.value.toDouble(),
                            color: kColoresPie[
                                en.key % kColoresPie.length],
                            width: 22,
                          ),
                        ],
                      );
                    }).toList(),
                    titlesData: FlTitlesData(
                      leftTitles: const AxisTitles(
                          sideTitles:
                              SideTitles(showTitles: true)),
                      rightTitles: const AxisTitles(
                          sideTitles:
                              SideTitles(showTitles: false)),
                      topTitles: const AxisTitles(
                          sideTitles:
                              SideTitles(showTitles: false)),
                      bottomTitles: AxisTitles(
                        sideTitles: SideTitles(
                          showTitles: true,
                          getTitlesWidget: (v, _) {
                            final i = v.toInt();
                            if (i < 0 || i >= entradas.length) {
                              return const SizedBox.shrink();
                            }
                            final nombre = entradas[i].key;
                            return Text(
                                nombre.length > 5
                                    ? nombre.substring(0, 5)
                                    : nombre,
                                style: const TextStyle(
                                    fontSize: 10));
                          },
                        ),
                      ),
                    ),
                    gridData:
                        const FlGridData(show: false),
                    borderData: FlBorderData(show: false),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _cardCobrosMes(AppColors c) {
    final meses = _cobrosPorMes();
    if (meses.isEmpty) return const SizedBox.shrink();
    final maxVal = meses
        .map((e) => e.value)
        .reduce((a, b) => a > b ? a : b);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _tituloCard('Cobros Mensuales', c),
            SizedBox(
              height: 200,
              child: LineChart(
                LineChartData(
                  minY: 0,
                  maxY: maxVal * 1.2,
                  lineBarsData: [
                    LineChartBarData(
                      spots: meses.asMap().entries
                          .map((en) => FlSpot(
                              en.key.toDouble(), en.value.value))
                          .toList(),
                      isCurved: true,
                      color: c.primary,
                      barWidth: 3,
                      dotData:
                          const FlDotData(show: true),
                    ),
                  ],
                  titlesData: FlTitlesData(
                    leftTitles: const AxisTitles(
                        sideTitles: SideTitles(
                            showTitles: true,
                            reservedSize: 50)),
                    rightTitles: const AxisTitles(
                        sideTitles:
                            SideTitles(showTitles: false)),
                    topTitles: const AxisTitles(
                        sideTitles:
                            SideTitles(showTitles: false)),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (v, _) {
                          final i = v.toInt();
                          if (i < 0 || i >= meses.length) {
                            return const SizedBox.shrink();
                          }
                          return Text(meses[i].key,
                              style: const TextStyle(
                                  fontSize: 10));
                        },
                      ),
                    ),
                  ),
                  gridData:
                      const FlGridData(show: false),
                  borderData: FlBorderData(show: false),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _mini(AppColors c, String icono, String valor, String titulo) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('$icono $valor',
                style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: c.text)),
            Text(titulo,
                style:
                    TextStyle(fontSize: 12, color: c.textSecondary)),
          ],
        ),
      ),
    );
  }
}
