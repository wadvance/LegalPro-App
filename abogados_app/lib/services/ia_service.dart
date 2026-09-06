import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

/// IA Legal con Google Gemini (clave gratuita del usuario).
///
/// La clave se obtiene gratis en https://aistudio.google.com
/// (Get API key) y se guarda solo en el dispositivo.
class IaService {
  static const Duration _timeout = Duration(seconds: 90);
  static const String _modelo = 'gemini-2.0-flash';

  static String _recortar(String s, int max) {
    final t = s.trim().replaceAll(RegExp(r'\s+'), ' ');
    return t.length <= max ? t : '${t.substring(0, max)}…';
  }

  /// Arma el prompt con los artículos de contexto y pregunta a Gemini.
  static Future<({bool ok, String texto})> preguntar(
    String pregunta,
    List<Map<String, dynamic>> contexto,
    String apiKey,
  ) async {
    if (apiKey.trim().isEmpty) {
      return (
        ok: false,
        texto: 'Falta tu clave gratuita de Gemini. '
            'Consíguela en https://aistudio.google.com '
            '(Get API key), pégala arriba y vuelve a preguntar.'
      );
    }

    final buf = StringBuffer()
      ..writeln(
          'Eres un asistente legal panameño. Respondes en español, de forma breve y clara (máximo 250 palabras).')
      ..writeln(
          'Usa el siguiente contexto de los códigos de Panamá cuando aplique y cita el artículo (ej: Art. 34 Código Civil).')
      ..writeln()
      ..writeln('CONTEXTO:');
    for (final a in contexto.take(3)) {
      buf.writeln(
          "- Art. ${a['articulo']} ${a['titulo']} (${a['_label'] ?? ''}): ${_recortar('${a['contenido'] ?? ''}', 400)}");
    }
    buf
      ..writeln()
      ..writeln('PREGUNTA: ${_recortar(pregunta, 500)}')
      ..writeln()
      ..writeln(
          'Termina con: "Nota: respuesta orientativa, no constituye asesoría legal."');

    try {
      final uri = Uri.parse(
          'https://generativelanguage.googleapis.com/v1beta/models/$_modelo:generateContent?key=${apiKey.trim()}');
      final resp = await http
          .post(
            uri,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'contents': [
                {
                  'parts': [
                    {'text': buf.toString()}
                  ]
                }
              ],
            }),
          )
          .timeout(_timeout);
      if (resp.statusCode != 200) {
        var detalle = 'HTTP ${resp.statusCode}';
        try {
          final err = jsonDecode(resp.body) as Map<String, dynamic>;
          detalle =
              '${err['error']?['message'] ?? detalle}';
        } catch (_) {}
        return (
          ok: false,
          texto: 'Gemini no respondió: $detalle. '
              'Revisa que tu clave sea válida.'
        );
      }
      final body = jsonDecode(utf8.decode(resp.bodyBytes));
      final partes = body['candidates']?[0]?['content']?['parts']
          as List?;
      final texto = (partes ?? [])
          .map((p) => '${(p as Map)['text'] ?? ''}')
          .join('\n')
          .trim();
      if (texto.isEmpty) {
        return (ok: false, texto: 'Gemini devolvió una respuesta vacía.');
      }
      return (ok: true, texto: texto);
    } on TimeoutException {
      return (
        ok: false,
        texto: 'Gemini tardó demasiado. Intenta con una pregunta más corta.'
      );
    } catch (e) {
      return (ok: false, texto: 'No se pudo consultar la IA: $e');
    }
  }
}
