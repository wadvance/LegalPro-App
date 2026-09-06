import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

String moneda(double v) => 'B/. ${v.toStringAsFixed(2)}';

double montoDe(dynamic m) {
  if (m is num) return m.toDouble();
  if (m is String) return double.tryParse(m) ?? 0;
  return 0;
}

DateTime? fechaDe(dynamic f) {
  if (f is Timestamp) return f.toDate();
  if (f is DateTime) return f;
  if (f is String) return DateTime.tryParse(f);
  return null;
}

String fechaCorta(dynamic f) {
  final d = fechaDe(f);
  if (d == null) return '';
  const meses = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
  ];
  return '${d.day} ${meses[d.month - 1]}';
}

/// Abre WhatsApp con un mensaje (equivale a sendWhatsAppMessage con wa.me).
Future<void> abrirWhatsApp(
    BuildContext context, String telefono, String mensaje) async {
  final tel = telefono.replaceAll(RegExp(r'[^0-9+]'), '');
  if (tel.isEmpty) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Sin teléfono registrado')),
    );
    return;
  }
  final uri = Uri.parse(
      'https://wa.me/$tel?text=${Uri.encodeComponent(mensaje)}');
  if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No se pudo abrir WhatsApp')),
      );
    }
  }
}

/// Abre la dirección en Google Maps o Waze.
Future<void> navegarA(
    BuildContext context, String direccion, String etiqueta) async {
  if (direccion.trim().isEmpty) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Sin dirección'),
        content: const Text('No hay una dirección registrada'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
    return;
  }
  final eleccion = await showDialog<String>(
    context: context,
    builder: (_) => AlertDialog(
      title: Text('Navegar a ${etiqueta.isNotEmpty ? etiqueta : direccion}'),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, 'maps'),
          child: const Text('Google Maps'),
        ),
        TextButton(
          onPressed: () => Navigator.pop(context, 'waze'),
          child: const Text('Waze'),
        ),
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancelar'),
        ),
      ],
    ),
  );
  final enc = Uri.encodeComponent(direccion);
  final uri = eleccion == 'waze'
      ? Uri.parse('https://waze.com/ul?q=$enc&navigate=yes')
      : eleccion == 'maps'
          ? Uri.parse(
              'https://www.google.com/maps/dir/?api=1&destination=$enc')
          : null;
  if (uri != null && !await launchUrl(uri, mode: LaunchMode.externalApplication)) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No se pudo abrir la aplicación')),
      );
    }
  }
}

void alerta(BuildContext context, String titulo, String mensaje) {
  showDialog(
    context: context,
    builder: (_) => AlertDialog(
      title: Text(titulo),
      content: Text(mensaje),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('OK'),
        ),
      ],
    ),
  );
}
