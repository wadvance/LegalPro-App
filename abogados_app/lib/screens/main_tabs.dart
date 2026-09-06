import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import 'citas_screen.dart';
import 'clientes_screen.dart';
import 'cobros_screen.dart';
import 'expedientes_screen.dart';
import 'home_screen.dart';
import 'placeholder_screen.dart';

/// Tabs principales (replica AppNavigator: Inicio, Clientes, Exp., Citas, Cobros, GPS).
class MainTabs extends StatefulWidget {
  final ThemeController themeController;
  const MainTabs({super.key, required this.themeController});

  @override
  State<MainTabs> createState() => _MainTabsState();
}

class _MainTabsState extends State<MainTabs> {
  int _indice = 0;

  void _irA(int i) => setState(() => _indice = i);

  @override
  Widget build(BuildContext context) {
    final c = widget.themeController.colors;
    final pantallas = [
      HomeScreen(themeController: widget.themeController, irATab: _irA),
      ClientesScreen(themeController: widget.themeController),
      ExpedientesScreen(themeController: widget.themeController),
      CitasScreen(themeController: widget.themeController),
      CobrosScreen(themeController: widget.themeController),
      PlaceholderScreen(
          themeController: widget.themeController,
          icono: '📍',
          titulo: 'GPS'),
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
        onTap: _irA,
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
