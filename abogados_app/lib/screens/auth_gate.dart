import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';

import '../firebase_options.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import 'login_screen.dart';
import 'main_tabs.dart';

/// Decide entre Login y app principal según sesión (equivale a AuthLoader).
class AuthGate extends StatefulWidget {
  final ThemeController themeController;
  const AuthGate({super.key, required this.themeController});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  bool _listo = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _iniciar();
  }

  Future<void> _iniciar() async {
    try {
      await Firebase.initializeApp(
              options: DefaultFirebaseOptions.currentPlatform)
          .timeout(const Duration(seconds: 15));
      if (!mounted) return;
      setState(() => _listo = true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = 'No se pudo iniciar Firebase: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return Scaffold(
        body: Center(child: Text(_error!)),
      );
    }
    if (!_listo) {
      return const Scaffold(
        body: Center(child: Text('Cargando aplicación...')),
      );
    }
    return StreamBuilder<User?>(
      stream: AuthService.authState(),
      builder: (_, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(child: Text('Cargando aplicación...')),
          );
        }
        if (snap.hasData && snap.data != null && !snap.data!.isAnonymous) {
          return MainTabs(themeController: widget.themeController);
        }
        return LoginScreen(themeController: widget.themeController);
      },
    );
  }
}
