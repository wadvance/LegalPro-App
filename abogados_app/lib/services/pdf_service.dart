import 'package:flutter/material.dart'
    show BuildContext, ScaffoldMessenger, SnackBar, Text;
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

/// Genera y comparte PDFs (equivale a pdfGenerator.js).
class PdfService {
  static pw.Widget _encabezado(String titulo) {
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text('Bufete de Abogados',
            style: pw.TextStyle(
                fontSize: 20,
                fontWeight: pw.FontWeight.bold,
                color: PdfColor.fromHex('#1A237E'))),
        pw.Text(
            'Vía España, Edificio Arauz Barraza • Piso 8, Oficina 801'),
        pw.Text('Ciudad de Panamá, Panamá • Tel: +507 0000-0000'),
        pw.SizedBox(height: 8),
        pw.Text(titulo,
            style: pw.TextStyle(
                fontSize: 16, fontWeight: pw.FontWeight.bold)),
        pw.Divider(),
      ],
    );
  }

  static pw.Widget _pie() {
    return pw.Column(children: [
      pw.Divider(),
      pw.Text('Bufete de Abogados - Su confianza, nuestro compromiso'),
      pw.Text(
          'Documento generado el ${DateTime.now().day}/${DateTime.now().month}/${DateTime.now().year}'),
    ]);
  }

  static pw.Widget _tabla(List<String> cabeceras, List<List<String>> filas) {
    return pw.TableHelper.fromTextArray(
      headers: cabeceras,
      data: filas,
      headerStyle: pw.TextStyle(
          fontWeight: pw.FontWeight.bold, color: PdfColors.white),
      headerDecoration:
          pw.BoxDecoration(color: PdfColor.fromHex('#1A237E')),
      cellPadding: const pw.EdgeInsets.all(6),
    );
  }

  static Future<pw.Document> _armar(
      String titulo, List<pw.Widget> cuerpo) async {
    final doc = pw.Document();
    doc.addPage(pw.MultiPage(
      build: (_) => [_encabezado(titulo), ...cuerpo, _pie()],
    ));
    return doc;
  }

  static Future<void> _compartir(
      BuildContext context, String titulo, String nombreArchivo,
      List<pw.Widget> cuerpo) async {
    try {
      final doc = await _armar(titulo, cuerpo);
      await Printing.sharePdf(
          bytes: await doc.save(), filename: '$nombreArchivo.pdf');
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se pudo generar el PDF')),
        );
      }
    }
  }

  /// Abre el diálogo de impresión del sistema.
  static Future<void> _imprimir(
      BuildContext context, String titulo, String nombreArchivo,
      List<pw.Widget> cuerpo) async {
    try {
      final doc = await _armar(titulo, cuerpo);
      await Printing.layoutPdf(
          name: nombreArchivo,
          onLayout: (_) async => doc.save());
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se pudo imprimir')),
        );
      }
    }
  }

  static pw.Widget _fila(String etiqueta, String valor) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 3),
      child: pw.Row(children: [
        pw.SizedBox(
            width: 140,
            child: pw.Text('$etiqueta:',
                style: pw.TextStyle(fontWeight: pw.FontWeight.bold))),
        pw.Expanded(child: pw.Text(valor)),
      ]),
    );
  }

  static List<pw.Widget> cuerpoExpediente(
      Map<String, dynamic> exp) {
    return [
      _fila('Número', '${exp['numero'] ?? ''}'),
      _fila('Cliente', '${exp['clienteNombre'] ?? ''}'),
      _fila('Tipo', '${exp['tipo'] ?? ''}'),
      _fila('Estado', '${exp['estado'] ?? ''}'),
      _fila('Descripción', '${exp['descripcion'] ?? ''}'),
    ];
  }

  static Future<void> reporteCaso(
      BuildContext context, Map<String, dynamic> exp,
      {bool imprimir = false}) async {
    final titulo = 'Expediente #${exp['numero'] ?? ''}';
    final nombre = 'Expediente_${exp['numero'] ?? 'SN'}';
    if (imprimir) {
      await _imprimir(context, titulo, nombre, cuerpoExpediente(exp));
    } else {
      await _compartir(
          context, titulo, nombre, cuerpoExpediente(exp));
    }
  }

  static Future<void> documento(
      BuildContext context,
      {required String titulo,
      required String tipo,
      required String contenido,
      bool imprimir = false}) async {
    final cuerpo = <pw.Widget>[
      _fila('Tipo', tipo),
      pw.SizedBox(height: 8),
      ...contenido.split('\n').map((linea) => pw.Padding(
            padding: const pw.EdgeInsets.only(bottom: 6),
            child: pw.Text(linea, textAlign: pw.TextAlign.justify),
          )),
    ];
    final limpio = titulo.replaceAll(RegExp(r'[^A-Za-z0-9]+'), '_');
    final nombre = limpio.isEmpty ? 'Documento' : limpio;
    if (imprimir) {
      await _imprimir(context, titulo, nombre, cuerpo);
    } else {
      await _compartir(context, titulo, nombre, cuerpo);
    }
  }

  static Future<void> factura(
      BuildContext context, Map<String, dynamic> cobro) async {
    final monto = cobro['monto'];
    final montoStr = monto is num
        ? 'B/. ${monto.toStringAsFixed(2)}'
        : 'B/. $monto';
    await _compartir(
      context,
      'Factura #${cobro['numeroFactura'] ?? ''}',
      'Factura_${cobro['numeroFactura'] ?? 'SN'}',
      [
        _fila('Factura', '${cobro['numeroFactura'] ?? ''}'),
        _fila('Cliente', '${cobro['clienteNombre'] ?? ''}'),
        _fila('Monto', montoStr),
        _fila('Estado', '${cobro['estado'] ?? ''}'),
        _fila('Método', '${cobro['metodoPago'] ?? ''}'),
        _fila('Vence', '${cobro['fechaVencimiento'] ?? ''}'),
        _fila('Descripción', '${cobro['descripcion'] ?? ''}'),
      ],
    );
  }

  static Future<void> reporteGeneral(
    BuildContext context, {
    required int totalExpedientes,
    required int activos,
    required double totalCobrado,
    required int totalCitas,
    required List<Map<String, dynamic>> expedientes,
    required List<Map<String, dynamic>> cobros,
  }) async {
    await _compartir(
      context,
      'Reporte General',
      'Reporte_General_${DateTime.now().millisecondsSinceEpoch}',
      [
        _fila('Total Expedientes', '$totalExpedientes'),
        _fila('Activos', '$activos'),
        _fila('Total Cobrado', 'B/. ${totalCobrado.toStringAsFixed(2)}'),
        _fila('Total Citas', '$totalCitas'),
        pw.SizedBox(height: 12),
        pw.Text('Expedientes',
            style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
        _tabla(
          const ['Número', 'Cliente', 'Tipo', 'Estado'],
          expedientes
              .map((e) => [
                    '${e['numero'] ?? ''}',
                    '${e['clienteNombre'] ?? ''}',
                    '${e['tipo'] ?? ''}',
                    '${e['estado'] ?? ''}',
                  ])
              .toList(),
        ),
        pw.SizedBox(height: 12),
        pw.Text('Cobros',
            style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
        _tabla(
          const ['Factura', 'Cliente', 'Monto', 'Estado'],
          cobros
              .map((e) => [
                    '${e['numeroFactura'] ?? ''}',
                    '${e['clienteNombre'] ?? ''}',
                    'B/. ${e['monto'] ?? ''}',
                    '${e['estado'] ?? ''}',
                  ])
              .toList(),
        ),
      ],
    );
  }
}
