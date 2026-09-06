import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import '../utils/ayudas.dart' as ay;

/// Replica src/screens/LegalCalculatorsScreen.js (fórmulas de utils/calculators.js).
class CalculadorasScreen extends StatefulWidget {
  final ThemeController themeController;
  const CalculadorasScreen({super.key, required this.themeController});

  @override
  State<CalculadorasScreen> createState() => _CalculadorasScreenState();
}

class _CalculadorasScreenState extends State<CalculadorasScreen> {
  String _tab = 'laboral';

  // Laboral
  final _salarioCtrl = TextEditingController();
  final _ingresoCtrl = TextEditingController();
  final _salidaCtrl = TextEditingController();
  String _contrato = 'indefinido';
  String _causa = 'renuncia';

  // Intereses
  final _montoIntCtrl = TextEditingController();
  final _tasaCtrl = TextEditingController(text: '6');
  final _inicioIntCtrl = TextEditingController();
  final _finIntCtrl = TextEditingController();
  String _tipoTasa = 'legal';

  // ANATI
  final _valorInmCtrl = TextEditingController();
  String _operacion = 'compraventa';
  bool _hipoteca = false;
  final _valorHipCtrl = TextEditingController();

  // Honorarios
  String _tipoHonorario = 'tarifa_fija';
  final _cuantiaCtrl = TextEditingController();
  final _porcContCtrl = TextEditingController(text: '30');
  final _tarifaHoraCtrl = TextEditingController(text: '150');
  final _horasCtrl = TextEditingController(text: '0');
  String _complejidad = 'media';

  // Procesal
  final _inicioProcCtrl = TextEditingController();
  final _diasHabCtrl = TextEditingController();

  List<(String, String)>? _resultado;
  String _tituloResultado = '';

  @override
  void dispose() {
    _salarioCtrl.dispose();
    _ingresoCtrl.dispose();
    _salidaCtrl.dispose();
    _montoIntCtrl.dispose();
    _tasaCtrl.dispose();
    _inicioIntCtrl.dispose();
    _finIntCtrl.dispose();
    _valorInmCtrl.dispose();
    _valorHipCtrl.dispose();
    _cuantiaCtrl.dispose();
    _porcContCtrl.dispose();
    _tarifaHoraCtrl.dispose();
    _horasCtrl.dispose();
    _inicioProcCtrl.dispose();
    _diasHabCtrl.dispose();
    super.dispose();
  }

  double _num(String s) =>
      double.tryParse(s.trim().replaceAll(',', '.')) ?? 0.0;

  DateTime? _fecha(String s) => DateTime.tryParse(s.trim());

  void _calcular() {
    switch (_tab) {
      case 'laboral':
        _calcLaboral();
        break;
      case 'intereses':
        _calcIntereses();
        break;
      case 'anati':
        _calcAnati();
        break;
      case 'honorarios':
        _calcHonorarios();
        break;
      case 'procesal':
        _calcProcesal();
        break;
    }
  }

  void _calcLaboral() {
    final mensual = _num(_salarioCtrl.text);
    final ingreso = _fecha(_ingresoCtrl.text);
    if (mensual <= 0 || ingreso == null) {
      ay.alerta(context, 'Error',
          'Salario mensual y fecha de ingreso requeridos');
      return;
    }
    final salida = _fecha(_salidaCtrl.text) ?? DateTime.now();
    final dias = salida.difference(ingreso).inDays;
    final anos = dias / 365.25;
    final meses = anos * 12;
    final diario = mensual / 30;
    final semanal = mensual / 4.33;

    final aniosServ = salida.year - ingreso.year;
    int semanas;
    if (aniosServ < 1) {
      semanas = 0;
    } else if (aniosServ < 2) {
      semanas = 2;
    } else if (aniosServ < 5) {
      semanas = 4;
    } else if (aniosServ < 10) {
      semanas = 6;
    } else {
      semanas = 8;
    }
    final preaviso = semanal * semanas;

    double indemnizacion = 0;
    if (_causa == 'despido_injustificado') {
      indemnizacion = diario * (meses > 36 ? 36 : meses);
    } else if (_causa == 'mutuo_acuerdo') {
      indemnizacion = diario * (meses > 36 ? 36 : meses) * 0.5;
    }
    final prima = anos >= 1
        ? semanal * (((anos * 2).floor() + 1) > 20 ? 20 : ((anos * 2).floor() + 1))
        : 0.0;
    final vacaciones = diario * (meses * 1.25 > 30 ? 30 : meses * 1.25);
    final decimo = (mensual / 12) * (meses > 12 ? 12 : meses);
    final total =
        indemnizacion + prima + vacaciones + decimo + preaviso;

    setState(() {
      _tituloResultado = 'Resultado de Prestaciones Laborales';
      _resultado = [
        ('Salario Mensual', ay.moneda(mensual)),
        ('Años de Servicio', anos.toStringAsFixed(2)),
        ('Meses Trabajados', meses.floor().toString()),
        ('Indemnización', ay.moneda(indemnizacion)),
        ('Prima de Antigüedad', ay.moneda(prima)),
        ('Vacaciones', ay.moneda(vacaciones)),
        ('Décimo Tercer Mes', ay.moneda(decimo)),
        ('Preaviso', ay.moneda(preaviso)),
        ('TOTAL', ay.moneda(total)),
      ];
    });
  }

  void _calcIntereses() {
    final monto = _num(_montoIntCtrl.text);
    final inicio = _fecha(_inicioIntCtrl.text);
    if (monto <= 0 || inicio == null) {
      ay.alerta(
          context, 'Error', 'Monto y fecha de inicio requeridos');
      return;
    }
    final fin = _fecha(_finIntCtrl.text) ?? DateTime.now();
    double tasa;
    if (_tipoTasa == 'legal') {
      tasa = 6;
    } else if (_tipoTasa == 'mora_bancaria') {
      tasa = 10;
    } else {
      tasa = _num(_tasaCtrl.text);
    }
    final dias = fin.difference(inicio).inDays;
    final intereses = monto * (tasa / 100 / 360) * dias;
    setState(() {
      _tituloResultado = 'Cálculo de Intereses Moratorios';
      _resultado = [
        ('Monto Original', ay.moneda(monto)),
        ('Tasa Anual', '$tasa%'),
        ('Días Transcurridos', '$dias'),
        ('Intereses Generados', ay.moneda(intereses)),
        ('Monto Total a Pagar', ay.moneda(monto + intereses)),
      ];
    });
  }

  void _calcAnati() {
    final valor = _num(_valorInmCtrl.text);
    if (valor <= 0) {
      ay.alerta(context, 'Error', 'Valor del inmueble requerido');
      return;
    }
    final registro = valor * 0.01;
    double transmision = 0;
    if (_operacion == 'compraventa' || _operacion == 'transmision') {
      transmision = valor <= 30000 ? 0 : (valor - 30000) * 0.02;
    }
    final timbre = valor * 0.001 > 50 ? valor * 0.001 : 50.0;
    final hipoteca =
        _hipoteca ? _num(_valorHipCtrl.text) * 0.005 : 0.0;
    const otros = 0.0;
    final total = registro + transmision + timbre + hipoteca + otros;
    setState(() {
      _tituloResultado = 'Tasas Registrales ANATI';
      _resultado = [
        ('Base Imponible', ay.moneda(valor)),
        ('Derecho de Registro (1%)', ay.moneda(registro)),
        ('Impuesto de Transmisión', ay.moneda(transmision)),
        ('Timbre de Registro', ay.moneda(timbre)),
        ('Inscripción Hipoteca', ay.moneda(hipoteca)),
        ('Otros', ay.moneda(otros)),
        ('TOTAL', ay.moneda(total)),
      ];
    });
  }

  void _calcHonorarios() {
    final factor =
        _complejidad == 'baja' ? 0.7 : _complejidad == 'alta' ? 1.5 : 1.0;
    double base;
    if (_tipoHonorario == 'contingencia') {
      base = _num(_cuantiaCtrl.text) * _num(_porcContCtrl.text) / 100;
    } else if (_tipoHonorario == 'tarifa_hora') {
      base = _num(_tarifaHoraCtrl.text) * _num(_horasCtrl.text);
    } else {
      base = 2000 * factor;
    }
    final itbm = base * 0.07;
    setState(() {
      _tituloResultado = 'Honorarios del Abogado';
      _resultado = [
        ('Honorarios Base', ay.moneda(base)),
        ('Factor Complejidad', '$factor'),
        ('ITBM 7%', ay.moneda(itbm)),
        ('TOTAL', ay.moneda(base + itbm)),
      ];
    });
  }

  void _calcProcesal() {
    final inicio = _fecha(_inicioProcCtrl.text);
    final habiles = int.tryParse(_diasHabCtrl.text.trim()) ?? 0;
    if (inicio == null || habiles <= 0) {
      ay.alerta(context, 'Error',
          'Fecha de inicio y días hábiles requeridos');
      return;
    }
    var fecha = inicio;
    var contados = 0;
    while (contados < habiles) {
      fecha = fecha.add(const Duration(days: 1));
      if (fecha.weekday != DateTime.saturday &&
          fecha.weekday != DateTime.sunday) {
        contados++;
      }
    }
    final calendario = fecha.difference(inicio).inDays;
    setState(() {
      _tituloResultado = 'Fechas Procesales';
      _resultado = [
        ('Fecha de Inicio', _inicioProcCtrl.text.trim()),
        ('Días Hábiles', '$habiles'),
        ('Días Calendario', '$calendario'),
        ('Fecha de Vencimiento',
            '${fecha.day}/${fecha.month}/${fecha.year}'),
      ];
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.themeController.colors;
    const tabs = [
      ('laboral', '👷', 'Laboral'),
      ('intereses', '💰', 'Intereses'),
      ('anati', '🏠', 'ANATI'),
      ('honorarios', '⚖️', 'Honorarios'),
      ('procesal', '📅', 'Procesal'),
    ];

    return Scaffold(
      backgroundColor: c.background,
      appBar: AppBar(
        backgroundColor: c.headerBg,
        foregroundColor: Colors.white,
        leading: const BackButton(),
        title: const Text('Calculadoras Legales'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: tabs
                    .map((t) => Padding(
                          padding:
                              const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text('${t.$2} ${t.$3}'),
                            selected: _tab == t.$1,
                            selectedColor: c.primary,
                            labelStyle: TextStyle(
                                color: _tab == t.$1
                                    ? Colors.white
                                    : c.text),
                            onSelected: (_) => setState(() {
                              _tab = t.$1;
                              _resultado = null;
                            }),
                          ),
                        ))
                    .toList(),
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment:
                      CrossAxisAlignment.stretch,
                  children: [
                    ..._formulario(c),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: _calcular,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: c.primary,
                        foregroundColor: c.textLight,
                      ),
                      child: const Text('Calcular'),
                    ),
                  ],
                ),
              ),
            ),
            if (_resultado != null) ...[
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment:
                        CrossAxisAlignment.start,
                    children: [
                      Text(_tituloResultado,
                          style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16)),
                      const Divider(),
                      ..._resultado!.map((r) => Padding(
                            padding:
                                const EdgeInsets.symmetric(
                                    vertical: 4),
                            child: Row(
                              mainAxisAlignment:
                                  MainAxisAlignment
                                      .spaceBetween,
                              children: [
                                Text(r.$1),
                                Text(r.$2,
                                    style: const TextStyle(
                                        fontWeight:
                                            FontWeight.bold)),
                              ],
                            ),
                          )),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  List<Widget> _formulario(AppColors c) {
    switch (_tab) {
      case 'laboral':
        return [
          _campo(_salarioCtrl, 'Salario Mensual (B/.) *',
              numerico: true),
          _campo(_ingresoCtrl, 'Fecha de Ingreso (YYYY-MM-DD) *'),
          _campo(_salidaCtrl, 'Fecha de Salida (YYYY-MM-DD)'),
          _etiqueta('Tipo de Contrato:'),
          _chips(c, ['indefinido', 'determinado'], _contrato,
              (v) => setState(() => _contrato = v)),
          _etiqueta('Causa de Terminación:'),
          _chips(
              c,
              [
                'renuncia',
                'despido_injustificado',
                'despido_justificado',
                'mutuo_acuerdo'
              ],
              _causa,
              (v) => setState(() => _causa = v)),
        ];
      case 'intereses':
        return [
          _campo(_montoIntCtrl, 'Monto (B/.) *',
              numerico: true),
          _campo(_tasaCtrl, 'Tasa Anual (%)', numerico: true),
          _campo(_inicioIntCtrl, 'Fecha de Inicio (YYYY-MM-DD) *'),
          _campo(_finIntCtrl, 'Fecha de Fin (YYYY-MM-DD, opcional)'),
          _etiqueta('Tipo de Tasa:'),
          _chips(c, ['legal', 'convencional', 'mora_bancaria'],
              _tipoTasa, (v) => setState(() => _tipoTasa = v)),
        ];
      case 'anati':
        return [
          _campo(_valorInmCtrl, 'Valor del Inmueble (B/.) *',
              numerico: true),
          _etiqueta('Tipo de Operación:'),
          _chips(c, ['compraventa', 'transmision', 'donacion'],
              _operacion, (v) => setState(() => _operacion = v)),
          CheckboxListTile(
            value: _hipoteca,
            onChanged: (v) =>
                setState(() => _hipoteca = v ?? false),
            title: const Text('¿Incluye Hipoteca?'),
            controlAffinity: ListTileControlAffinity.leading,
            contentPadding: EdgeInsets.zero,
          ),
          if (_hipoteca)
            _campo(_valorHipCtrl, 'Valor de la Hipoteca (B/.)',
                numerico: true),
        ];
      case 'honorarios':
        return [
          _etiqueta('Tipo de Honorario:'),
          _chips(
              c,
              ['tarifa_fija', 'contingencia', 'tarifa_hora'],
              _tipoHonorario,
              (v) => setState(() => _tipoHonorario = v)),
          _campo(_cuantiaCtrl, 'Cuantía (B/.)', numerico: true),
          if (_tipoHonorario == 'contingencia')
            _campo(_porcContCtrl, '% Contingencia',
                numerico: true),
          if (_tipoHonorario == 'tarifa_hora') ...[
            _campo(_tarifaHoraCtrl, 'Tarifa por Hora (B/.)',
                numerico: true),
            _campo(_horasCtrl, 'Horas Estimadas',
                numerico: true),
          ],
          _etiqueta('Complejidad:'),
          _chips(c, ['baja', 'media', 'alta'], _complejidad,
              (v) => setState(() => _complejidad = v)),
        ];
      default:
        return [
          _campo(
              _inicioProcCtrl, 'Fecha de Inicio (YYYY-MM-DD) *'),
          _campo(_diasHabCtrl, 'Días Hábiles *', numerico: true),
        ];
    }
  }

  Widget _etiqueta(String t) => Padding(
        padding: const EdgeInsets.only(top: 8, bottom: 6),
        child: Text(t),
      );

  Widget _chips(AppColors c, List<String> opciones, String actual,
      void Function(String) alElegir) {
    return Wrap(
      spacing: 8,
      children: opciones
          .map((o) => ChoiceChip(
                label: Text(o.replaceAll('_', ' ')),
                selected: actual == o,
                selectedColor: c.primary,
                labelStyle: TextStyle(
                    color:
                        actual == o ? Colors.white : c.text),
                onSelected: (_) => alElegir(o),
              ))
          .toList(),
    );
  }

  Widget _campo(TextEditingController ctrl, String hint,
      {bool numerico = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextField(
        controller: ctrl,
        keyboardType: numerico
            ? const TextInputType.numberWithOptions(decimal: true)
            : TextInputType.text,
        decoration: InputDecoration(hintText: hint),
      ),
    );
  }
}
