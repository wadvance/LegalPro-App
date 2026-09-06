import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import '../utils/ayudas.dart' as ay;

const List<String> kConsultasRapidas = [
  'Horarios', 'Dirección', 'Agendar cita',
  'Información de cobros', 'Estado de expediente',
  'Equipo de abogados',
];

String respuestaChatbot(String mensaje) {
  final m = mensaje.toLowerCase();
  if (m.contains('horario')) {
    return 'Nuestro horario es: Lun-Vie 8AM-5PM, Sáb 9AM-12PM, Dom Cerrado.';
  }
  if (m.contains('direcci') || m.contains('ubicaci')) {
    return 'Por el momento no tenemos dirección registrada. Escríbanos a info@arauzcarrillo.com.';
  }
  if (m.contains('contacto') ||
      m.contains('teléfono') ||
      m.contains('telefono')) {
    return '📞 Puede contactarnos al teléfono o al correo info@arauzcarrillo.com.';
  }
  if (m.contains('cita') || m.contains('agendar')) {
    return 'Para agendar una cita necesitamos:\n1. Nombre\n2. Cédula\n3. Motivo\n4. Día y hora deseada';
  }
  if (m.contains('cobro') ||
      m.contains('pago') ||
      m.contains('factura')) {
    return 'Aceptamos transferencia, tarjeta, efectivo y Yappy. Para consultar un cobro indíquenos su cédula.';
  }
  if (m.contains('expediente') || m.contains('caso')) {
    return 'Para consultar su expediente indíquenos el número de expediente y su cédula.';
  }
  if (m.contains('abogado') || m.contains('licenciado')) {
    return 'Nuestro equipo atiende: Civil, Penal, Laboral, Comercial y Administrativo.';
  }
  return '🤖 Gracias por contactar a Bufete de Abogados. ¿Desea consultar citas, casos, cobros, horarios o abogados?';
}

/// Replica src/screens/ChatbotScreen.js (respuestas locales por keywords).
class ChatbotScreen extends StatefulWidget {
  final ThemeController themeController;
  const ChatbotScreen({super.key, required this.themeController});

  @override
  State<ChatbotScreen> createState() => _ChatbotScreenState();
}

class _ChatbotScreenState extends State<ChatbotScreen> {
  final _inputCtrl = TextEditingController();
  final _telCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  bool _verWhatsApp = false;
  final List<({bool mio, String texto, String hora})> _mensajes = [
    (
      mio: false,
      texto:
          '🤖 ¡Hola! Soy el asistente virtual de *Bufete de Abogados*. ¿En qué puedo ayudarle hoy?',
      hora: ''
    ),
    (
      mio: false,
      texto:
          'Puede preguntarme sobre:\n📅 Citas\n⚖️ Casos\n💰 Cobros\n📋 Horarios\n👔 Abogados',
      hora: ''
    ),
  ];

  @override
  void dispose() {
    _inputCtrl.dispose();
    _telCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  String _hora() {
    final ahora = DateTime.now();
    return '${ahora.hour.toString().padLeft(2, '0')}:${ahora.minute.toString().padLeft(2, '0')}';
  }

  void _enviar([String? texto]) {
    final t = (texto ?? _inputCtrl.text).trim();
    if (t.isEmpty) return;
    setState(() {
      _mensajes.add((mio: true, texto: t, hora: _hora()));
      _inputCtrl.clear();
    });
    _bajar();
    Future.delayed(const Duration(milliseconds: 500), () {
      if (!mounted) return;
      setState(() {
        _mensajes.add(
            (mio: false, texto: respuestaChatbot(t), hora: _hora()));
      });
      _bajar();
    });
  }

  void _bajar() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
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
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Chatbot WhatsApp'),
            Text('Asistente Virtual',
                style: TextStyle(fontSize: 12)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Text('📞', style: TextStyle(fontSize: 22)),
            onPressed: () =>
                setState(() => _verWhatsApp = !_verWhatsApp),
          ),
        ],
      ),
      body: Column(
        children: [
          if (_verWhatsApp)
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _telCtrl,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                          hintText:
                              'Teléfono destino (ej: +50760000000)'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: () {
                      if (_telCtrl.text.trim().isEmpty ||
                          _inputCtrl.text.trim().isEmpty) {
                        return;
                      }
                      ay.abrirWhatsApp(context,
                          _telCtrl.text.trim(), _inputCtrl.text.trim());
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Enviar'),
                  ),
                ],
              ),
            ),
          Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Consultas rápidas:',
                    style: TextStyle(color: c.textSecondary)),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  children: kConsultasRapidas
                      .map((q) => ActionChip(
                            label: Text(q),
                            onPressed: () => _enviar(q),
                          ))
                      .toList(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: ListView.builder(
              controller: _scrollCtrl,
              padding: const EdgeInsets.all(12),
              itemCount: _mensajes.length,
              itemBuilder: (_, i) {
                final m = _mensajes[i];
                return Align(
                  alignment: m.mio
                      ? Alignment.centerRight
                      : Alignment.centerLeft,
                  child: Container(
                    constraints: BoxConstraints(
                        maxWidth:
                            MediaQuery.of(context).size.width *
                                0.75),
                    margin:
                        const EdgeInsets.symmetric(vertical: 4),
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: m.mio
                          ? c.primary
                          : c.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: m.mio
                          ? null
                          : Border.all(color: c.border),
                    ),
                    child: Column(
                      crossAxisAlignment:
                          CrossAxisAlignment.end,
                      children: [
                        Text(m.texto,
                            style: TextStyle(
                                color: m.mio
                                    ? Colors.white
                                    : c.text)),
                        if (m.hora.isNotEmpty)
                          Text(m.hora,
                              style: TextStyle(
                                  fontSize: 10,
                                  color: m.mio
                                      ? Colors.white70
                                      : c.textSecondary)),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _inputCtrl,
                    onSubmitted: (_) => _enviar(),
                    decoration: const InputDecoration(
                        hintText: 'Escriba su mensaje...'),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: () => _enviar(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: c.primary,
                    foregroundColor: Colors.white,
                    minimumSize: const Size(0, 48),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16),
                  ),
                  child: const Text('Enviar'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
