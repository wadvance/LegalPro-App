import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Pantalla temporal para módulos de la fase 2.
class PlaceholderScreen extends StatelessWidget {
  final ThemeController themeController;
  final String icono;
  final String titulo;
  const PlaceholderScreen(
      {super.key,
      required this.themeController,
      required this.icono,
      required this.titulo});

  @override
  Widget build(BuildContext context) {
    final c = themeController.colors;
    return Scaffold(
      backgroundColor: c.background,
      appBar: AppBar(
        backgroundColor: c.headerBg,
        foregroundColor: Colors.white,
        title: Text(titulo),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(icono, style: const TextStyle(fontSize: 64)),
            const SizedBox(height: 12),
            Text(titulo,
                style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: c.text)),
            const SizedBox(height: 8),
            Text('Disponible en la fase 2',
                style: TextStyle(color: c.textSecondary)),
          ],
        ),
      ),
    );
  }
}
