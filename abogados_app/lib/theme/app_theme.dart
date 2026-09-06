import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Colores del Bufete (replica src/utils/theme.js de la app original).
class AppColors {
  final Color primary;
  final Color secondary;
  final Color accent;
  final Color background;
  final Color surface;
  final Color cardBorder;
  final Color text;
  final Color textSecondary;
  final Color textLight;
  final Color border;
  final Color error;
  final Color success;
  final Color warning;
  final Color info;
  final Color headerBg;
  final Color tabActive;
  final Color tabInactive;

  const AppColors({
    required this.primary,
    required this.secondary,
    required this.accent,
    required this.background,
    required this.surface,
    required this.cardBorder,
    required this.text,
    required this.textSecondary,
    required this.textLight,
    required this.border,
    required this.error,
    required this.success,
    required this.warning,
    required this.info,
    required this.headerBg,
    required this.tabActive,
    required this.tabInactive,
  });

  static const light = AppColors(
    primary: Color(0xFF1A237E),
    secondary: Color(0xFFC5A028),
    accent: Color(0xFFD32F2F),
    background: Color(0xFFF5F5F5),
    surface: Color(0xFFFFFFFF),
    cardBorder: Color(0xFFE8E8E8),
    text: Color(0xFF212121),
    textSecondary: Color(0xFF757575),
    textLight: Color(0xFFFFFFFF),
    border: Color(0xFFE0E0E0),
    error: Color(0xFFD32F2F),
    success: Color(0xFF388E3C),
    warning: Color(0xFFF57C00),
    info: Color(0xFF1976D2),
    headerBg: Color(0xFF1A237E),
    tabActive: Color(0xFFC5A028),
    tabInactive: Color(0xFF9E9E9E),
  );

  static const dark = AppColors(
    primary: Color(0xFF5C6BC0),
    secondary: Color(0xFFF9D14A),
    accent: Color(0xFFEF5350),
    background: Color(0xFF121212),
    surface: Color(0xFF1E1E1E),
    cardBorder: Color(0xFF3A3A3A),
    text: Color(0xFFE0E0E0),
    textSecondary: Color(0xFFAAAAAA),
    textLight: Color(0xFFFFFFFF),
    border: Color(0xFF333333),
    error: Color(0xFFEF5350),
    success: Color(0xFF66BB6A),
    warning: Color(0xFFFFA726),
    info: Color(0xFF42A5F5),
    headerBg: Color(0xFF1A1A2E),
    tabActive: Color(0xFFF9D14A),
    tabInactive: Color(0xFF666666),
  );
}

ThemeData buildTheme(AppColors c, bool isDark) {
  final scheme = ColorScheme(
    brightness: isDark ? Brightness.dark : Brightness.light,
    primary: c.primary,
    onPrimary: c.textLight,
    secondary: c.secondary,
    onSecondary: c.textLight,
    error: c.error,
    onError: c.textLight,
    surface: c.surface,
    onSurface: c.text,
    tertiary: c.accent,
    onTertiary: c.textLight,
  );
  return ThemeData(
    colorScheme: scheme,
    useMaterial3: true,
    scaffoldBackgroundColor: c.background,
    appBarTheme: AppBarTheme(
      backgroundColor: c.headerBg,
      foregroundColor: Colors.white,
    ),
    cardTheme: CardThemeData(
      color: c.surface,
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: c.cardBorder),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: isDark ? const Color(0xFF2A2A2A) : c.background,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(15),
        borderSide: BorderSide(color: c.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(15),
        borderSide: BorderSide(color: c.border),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        minimumSize: const Size.fromHeight(55),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(15),
        ),
      ),
    ),
  );
}

/// Maneja modo claro/oscuro con persistencia (equivale a ThemeContext).
class ThemeController extends ChangeNotifier {
  static const _key = '@arauz_theme';
  bool _isDark = false;
  bool get isDark => _isDark;
  AppColors get colors => _isDark ? AppColors.dark : AppColors.light;

  ThemeController() {
    _cargar();
  }

  Future<void> _cargar() async {
    final prefs = await SharedPreferences.getInstance();
    _isDark = prefs.getString(_key) == 'dark';
    notifyListeners();
  }

  Future<void> toggle() async {
    _isDark = !_isDark;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, _isDark ? 'dark' : 'light');
    notifyListeners();
  }
}
