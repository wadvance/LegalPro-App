import 'dart:convert';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

import '../services/ia_service.dart';
import '../theme/app_theme.dart';

const List<(String, String, String)> kPortalesJusticia = [
  (
    '⚖️',
    'Consultas y Aplicaciones (Órgano Judicial)',
    'https://www.organojudicial.gob.pa/consultas-y-aplicaciones'
  ),
  (
    '📁',
    'Expedientes Electrónicos SAGJ',
    'https://ojpanama.organojudicial.gob.pa'
  ),
  (
    '📜',
    'Sentencias y Registro Judicial',
    'https://www.organojudicial.gob.pa/consultas'
  ),
  (
    '📰',
    'Gaceta Oficial de Panamá',
    'https://www.gacetaoficial.gob.pa'
  ),
  (
    '🏢',
    'Registro Público de Panamá',
    'https://www.registro-publico.gob.pa'
  ),
];

const List<String> kSugerenciasIa = [
  '¿Qué es el divorcio en Panamá?',
  '¿Cuánto me toca de liquidación por despido injustificado?',
  '¿Qué dice el Código Penal sobre homicidio?',
  '¿Cómo se constituye una sociedad anónima?',
];

/// Asistente IA Legal: responde con tus códigos como base, entrelaza tus
/// expedientes y enlaza a la justicia en línea de Panamá.
class IaLegalScreen extends StatefulWidget {
  final ThemeController themeController;
  const IaLegalScreen({super.key, required this.themeController});

  @override
  State<IaLegalScreen> createState() => _IaLegalScreenState();
}

class _IaLegalScreenState extends State<IaLegalScreen> {
  static const _keyGemini = '@arauz_gemini_key';
  final _preguntaCtrl = TextEditingController();
  final _claveCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  bool _consultando = false;
  bool _verClave = false;
  String _respuesta = '';
  List<Map<String, dynamic>> _contexto = [];
  List<Map<String, dynamic>> _expedientes = [];
  List<Map<String, dynamic>> _indice = [];
  final Map<String, List<Map<String, dynamic>>> _cacheArts = {};

  @override
  void initState() {
    super.initState();
    _cargarIndice();
    _cargarClave();
  }

  Future<void> _cargarClave() async {
    final prefs = await SharedPreferences.getInstance();
    final k = prefs.getString(_keyGemini) ?? '';
    if (!mounted) return;
    setState(() => _claveCtrl.text = k);
  }

  Future<void> _guardarClave() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyGemini, _claveCtrl.text.trim());
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Clave guardada en este dispositivo')),
    );
  }

  @override
  void dispose() {
    _preguntaCtrl.dispose();
    _claveCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _cargarIndice() async {
    try {
      final raw = await rootBundle
          .loadString('assets/data/leyes/indice.json');
      if (!mounted) return;
      setState(() {
        _indice =
            (jsonDecode(raw) as List).cast<Map<String, dynamic>>();
      });
    } catch (_) {}
  }

  Future<List<Map<String, dynamic>>> _articulosDe(String key) async {
    if (_cacheArts.containsKey(key)) return _cacheArts[key]!;
    final raw = await rootBundle
        .loadString('assets/data/leyes/$key.json');
    final data = jsonDecode(raw) as Map<String, dynamic>;
    final arts = (data['articulos'] as List).cast<Map<String, dynamic>>();
    _cacheArts[key] = arts;
    return arts;
  }

  Future<List<Map<String, dynamic>>> _buscarContexto(String q) async {
    final res = <Map<String, dynamic>>[];
    for (final e in _indice) {
      final arts = await _articulosDe(e['key'] as String);
      for (final a in arts) {
        if ('${a['titulo']} ${a['contenido']} ${a['categoria']}'
            .toLowerCase()
            .contains(q)) {
          res.add({...a, '_label': e['label']});
          if (res.length >= 12) break;
        }
      }
      if (res.length >= 12) break;
    }
    return res;
  }

  Future<void> _preguntar([String? sugerida]) async {
    final pregunta = (sugerida ?? _preguntaCtrl.text).trim();
    if (pregunta.isEmpty || _consultando) return;
    setState(() {
      _consultando = true;
      _respuesta = 'Consultando la IA...';
      _contexto = [];
      _expedientes = [];
    });
    try {
      final q = pregunta.toLowerCase();
      final contexto = await _buscarContexto(q);
      final expedientes = await _buscarExpedientes(q);
      final r = await IaService.preguntar(
          pregunta, contexto, _claveCtrl.text);
      if (!mounted) return;
      setState(() {
        _respuesta = r.texto;
        _contexto = contexto.take(3).toList();
        _expedientes = expedientes;
      });
      _bajar();
    } catch (e) {
      if (!mounted) return;
      setState(() => _respuesta = 'Error: $e');
    } finally {
      if (mounted) setState(() => _consultando = false);
    }
  }

  Future<List<Map<String, dynamic>>> _buscarExpedientes(String q) async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return [];
    final snap = await FirebaseFirestore.instance
        .collection('expedientes')
        .where('abogadoId', isEqualTo: uid)
        .get();
    final palabras =
        q.split(RegExp(r'\s+')).where((w) => w.length > 3).toList();
    return snap.docs.map((d) => {'id': d.id, ...d.data()}).where((e) {
      final texto =
          '${e['numero']} ${e['clienteNombre']} ${e['tipo']} ${e['descripcion']} ${e['estado']}'
              .toLowerCase();
      return palabras.any(texto.contains);
    }).take(5).toList();
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

  Future<void> _abrirPortal(String url) async {
    final uri = Uri.parse(url);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se pudo abrir el portal')),
        );
      }
    }
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
            Text('🤖 IA Legal'),
            Text('Leyes de Panamá y tus casos',
                style: TextStyle(fontSize: 12)),
          ],
        ),
      ),
      body: SingleChildScrollView(
        controller: _scrollCtrl,
        padding: const EdgeInsets.all(12),
        child:           Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment:
                      CrossAxisAlignment.start,
                  children: [
                    Text('Clave gratuita de Gemini',
                        style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: c.text)),
                    const SizedBox(height: 4),
                    const Text(
                        'Consíguela gratis en aistudio.google.com (Get API key). Se guarda solo en tu dispositivo.',
                        style: TextStyle(fontSize: 12)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _claveCtrl,
                            obscureText: !_verClave,
                            decoration: InputDecoration(
                              hintText: 'Pega tu API key aquí',
                              suffixIcon: IconButton(
                                icon: Text(
                                    _verClave ? '🙈' : '👁️'),
                                onPressed: () => setState(() =>
                                    _verClave = !_verClave),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          onPressed: _guardarClave,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: c.primary,
                            foregroundColor: Colors.white,
                          ),
                          child: const Text('Guardar'),
                        ),
                      ],
                    ),
                  ],
                ),
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
                    TextField(
                      controller: _preguntaCtrl,
                      maxLines: 3,
                      onSubmitted: (_) => _preguntar(),
                      decoration: const InputDecoration(
                        hintText:
                            'Ej: ¿Qué artículos hablan del despido injustificado?',
                      ),
                    ),
                    const SizedBox(height: 8),
                    ElevatedButton(
                      onPressed:
                          _consultando ? null : () => _preguntar(),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: c.primary,
                        foregroundColor: Colors.white,
                        minimumSize:
                            const Size.fromHeight(48),
                      ),
                      child: Text(_consultando
                          ? 'Consultando...'
                          : '🤖 Preguntar a la IA'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: kSugerenciasIa
                  .map((s) => ActionChip(
                        label: Text(s),
                        onPressed: _consultando
                            ? null
                            : () {
                                _preguntaCtrl.text = s;
                                _preguntar(s);
                              },
                      ))
                  .toList(),
            ),
            if (_respuesta.isNotEmpty) ...[
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment:
                        CrossAxisAlignment.start,
                    children: [
                      Text('Respuesta de la IA',
                          style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              color: c.text)),
                      const SizedBox(height: 8),
                      if (_consultando &&
                          _respuesta == 'Consultando la IA...')
                        const Center(
                            child: CircularProgressIndicator())
                      else
                        Text(_respuesta),
                    ],
                  ),
                ),
              ),
            ],
            if (_contexto.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text('📖 Artículos relacionados',
                  style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: c.text)),
              const SizedBox(height: 8),
              ..._contexto.map((a) => Card(
                    child: ListTile(
                      title: Text(
                          'Art. ${a['articulo']} - ${a['titulo']}'),
                      subtitle: Text(
                          '${a['_label'] ?? ''} • ${a['categoria'] ?? ''}',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis),
                    ),
                  )),
            ],
            if (_expedientes.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text('📁 Tus expedientes relacionados',
                  style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: c.text)),
              const SizedBox(height: 8),
              ..._expedientes.map((e) => Card(
                    child: ListTile(
                      leading: const Text('📁',
                          style: TextStyle(fontSize: 26)),
                      title:
                          Text('Exp. #${e['numero'] ?? ''}'),
                      subtitle: Text(
                          '${e['clienteNombre'] ?? ''} • ${e['estado'] ?? ''}'),
                    ),
                  )),
            ],
            const SizedBox(height: 12),
            Text('🏛️ Justicia en línea (Panamá)',
                style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: c.text)),
            const SizedBox(height: 8),
            ...kPortalesJusticia.map((p) => Card(
                  child: ListTile(
                    leading: Text(p.$1,
                        style:
                            const TextStyle(fontSize: 26)),
                    title: Text(p.$2),
                    trailing: const Text('↗'),
                    onTap: () => _abrirPortal(p.$3),
                  ),
                )),
            const SizedBox(height: 8),
            Text(
              'La IA usa tus 13 códigos como base y es gratuita. Las consultas de expedientes oficiales se hacen en los portales del Órgano Judicial.',
              style:
                  TextStyle(fontSize: 11, color: c.textSecondary),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
