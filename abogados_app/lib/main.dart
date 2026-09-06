import 'package:flutter/material.dart';

import 'screens/auth_gate.dart';
import 'services/instalacion_service.dart';
import 'theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  InstalacionService.inicializar();
  runApp(const MyApp());
}

/// Bufete de Abogados - Fase 1: Login + Inicio + Clientes (Firebase).
class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  late final ThemeController _themeController;

  @override
  void initState() {
    super.initState();
    _themeController = ThemeController()..addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _themeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = _themeController.isDark;
    return MaterialApp(
      title: 'Bufete de Abogados',
      theme: buildTheme(AppColors.light, false),
      darkTheme: buildTheme(AppColors.dark, true),
      themeMode: isDark ? ThemeMode.dark : ThemeMode.light,
      home: AuthGate(themeController: _themeController),
    );
  }
}
