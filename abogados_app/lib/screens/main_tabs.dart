import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import 'citas_screen.dart';
import 'clientes_screen.dart';
import 'cobros_screen.dart';
import 'empresas_screen.dart';
import 'expedientes_screen.dart';
import 'gps_screen.dart';
import 'home_screen.dart';
import 'placeholder_screen.dart';
import 'reportes_screen.dart';
import 'seguimiento_screen.dart';

/// Tabs principales + pantallas secundarias (replica AppNavigator).
class MainTabs extends StatefulWidget {
  final ThemeController themeController;
  const MainTabs({super.key, required this.themeController});

  @override
  State<MainTabs> createState() => _MainTabsState();
}

class _MainTabsState extends State<MainTabs> {
  int _indice = 0;

  void _navegar(String destino) {
    const tabs = {
      'inicio': 0,
      'clientes': 1,
      'expedientes': 2,
      'citas': 3,
      'cobros': 4,
      'gps': 5,
    };
    if (tabs.containsKey(destino)) {
      setState(() => _indice = tabs[destino]!);
      return;
    }
    final Widget? pantalla = switch (destino) {
      'empresas' =>
        EmpresasScreen(themeController: widget.themeController),
      'reportes' =>
        ReportesScreen(themeController: widget.themeController),
      'seguimiento' =>
        SeguimientoScreen(themeController: widget.themeController),
      'leyes' => PlaceholderScreen(
          themeController: widget.themeController,
          icono: '⚖️',
          titulo: 'Leyes'),
      'calculadoras' => PlaceholderScreen(
          themeController: widget.themeController,
          icono: '🧮',
          titulo: 'Calculadoras'),
      'chatbot' => PlaceholderScreen(
          themeController: widget.themeController,
          icono: '💬',
          titulo: 'Chatbot'),
      _ => null,
    };
    if (pantalla != null && mounted) {
      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => pantalla),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.themeController.colors;
    final pantallas = [
      HomeScreen(
          themeController: widget.themeController,
          navegar: _navegar),
      ClientesScreen(themeController: widget.themeController),
      ExpedientesScreen(themeController: widget.themeController),
      CitasScreen(themeController: widget.themeController),
      CobrosScreen(themeController: widget.themeController),
      GpsScreen(themeController: widget.themeController),
    ];
    const tabs = [
      ('🏠', 'Inicio'),
      ('👥', 'Clientes'),
      ('📁', 'Exp.'),
      ('📅', 'Citas'),
      ('💰', 'Cobros'),
      ('📍', 'GPS'),
    ];

    return Scaffold(
      body: IndexedStack(index: _indice, children: pantallas),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _indice,
        onTap: (i) => setState(() => _indice = i),
        type: BottomNavigationBarType.fixed,
        backgroundColor: c.surface,
        selectedItemColor: c.tabActive,
        unselectedItemColor: c.tabInactive,
        showSelectedLabels: true,
        showUnselectedLabels: true,
        selectedFontSize: 10,
        unselectedFontSize: 10,
        items: tabs
            .map((t) => BottomNavigationBarItem(
                  icon: Text(t.$1, style: const TextStyle(fontSize: 22)),
                  label: t.$2,
                ))
            .toList(),
      ),
    );
  }
}
