import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import '../theme/app_theme.dart';

/// Replica src/screens/LoginScreen.js (login + registro + recuperar + Google).
class LoginScreen extends StatefulWidget {
  final ThemeController themeController;
  const LoginScreen({super.key, required this.themeController});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _verPass = false;
  bool _cargandoLogin = false;
  bool _cargandoGoogle = false;
  bool _buscandoReset = false;
  String _mensajeReset = '';
  bool _modoRegistro = false;

  // Registro
  final _nombreCtrl = TextEditingController();
  final _apellidoCtrl = TextEditingController();
  final _telefonoCtrl = TextEditingController();
  final _cedulaCtrl = TextEditingController();
  bool _cargandoRegistro = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _nombreCtrl.dispose();
    _apellidoCtrl.dispose();
    _telefonoCtrl.dispose();
    _cedulaCtrl.dispose();
    super.dispose();
  }

  void _alerta(String titulo, String mensaje) {
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

  Future<void> _ingresar() async {
    final email = _emailCtrl.text.trim();
    final pass = _passCtrl.text;
    if (email.isEmpty || pass.isEmpty) {
      _alerta('Error', 'Por favor ingrese su correo y contraseña');
      return;
    }
    setState(() => _cargandoLogin = true);
    final r = await AuthService.login(email, pass);
    if (!mounted) return;
    setState(() => _cargandoLogin = false);
    if (!r.ok) {
      _alerta('Error de inicio de sesión', r.error ?? 'Credenciales inválidas');
    }
    // Si ok, el AuthGate redirige solo.
  }

  Future<void> _registrar() async {
    final email = _emailCtrl.text.trim();
    final pass = _passCtrl.text;
    if (_nombreCtrl.text.trim().isEmpty ||
        _apellidoCtrl.text.trim().isEmpty ||
        email.isEmpty ||
        pass.isEmpty) {
      _alerta('Error', 'Nombre, apellido, correo y contraseña son obligatorios');
      return;
    }
    setState(() => _cargandoRegistro = true);
    final r = await AuthService.register(
      email: email,
      password: pass,
      nombre: _nombreCtrl.text,
      apellido: _apellidoCtrl.text,
      telefono: _telefonoCtrl.text,
      cedula: _cedulaCtrl.text,
    );
    if (!mounted) return;
    setState(() => _cargandoRegistro = false);
    if (!r.ok) {
      _alerta('Error de registro', r.error ?? 'No se pudo registrar');
    }
  }

  Future<void> _recuperar() async {
    final email = _emailCtrl.text.trim();
    if (email.isEmpty) {
      setState(
          () => _mensajeReset = 'Ingrese su correo electrónico primero');
      return;
    }
    setState(() {
      _buscandoReset = true;
      _mensajeReset = '';
    });
    final r = await AuthService.resetPassword(email);
    if (!mounted) return;
    setState(() {
      _buscandoReset = false;
      _mensajeReset = r.ok
          ? 'Revise su bandeja de entrada. Le enviamos un enlace para restablecer su contraseña.'
          : (r.error ?? 'Error al enviar correo de restablecimiento');
    });
  }

  Future<void> _google() async {
    setState(() => _cargandoGoogle = true);
    final r = await AuthService.loginWithGoogle();
    if (!mounted) return;
    setState(() => _cargandoGoogle = false);
    if (!r.ok && (r.error ?? '').isNotEmpty) {
      _alerta('Error', r.error!);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.themeController.colors;
    final isDark = widget.themeController.isDark;

    return Scaffold(
      backgroundColor: c.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Align(
                alignment: Alignment.topRight,
                child: IconButton(
                  onPressed: () => widget.themeController.toggle(),
                  icon: Text(isDark ? '☀️' : '🌙',
                      style: const TextStyle(fontSize: 22)),
                ),
              ),
              const SizedBox(height: 8),
              const Text('⚖️', style: TextStyle(fontSize: 56)),
              const SizedBox(height: 4),
              Text('Bufete de Abogados',
                  style: TextStyle(
                      fontSize: 32, fontWeight: FontWeight.bold, color: c.text)),
              Text('Justicia cercana, soluciones reales',
                  style: TextStyle(
                      fontStyle: FontStyle.italic,
                      fontSize: 12,
                      color: c.textSecondary)),
              const SizedBox(height: 24),
              Card(
                color: c.surface,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20)),
                elevation: 4,
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 30, vertical: 40),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(_modoRegistro ? 'Crear Cuenta' : 'Iniciar Sesión',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: c.text)),
                      const SizedBox(height: 24),
                      if (_modoRegistro) ...[
                        TextField(
                          controller: _nombreCtrl,
                          decoration: const InputDecoration(
                              hintText: 'Nombre *'),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _apellidoCtrl,
                          decoration: const InputDecoration(
                              hintText: 'Apellido *'),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _telefonoCtrl,
                          keyboardType: TextInputType.phone,
                          decoration: const InputDecoration(
                              hintText: 'Teléfono'),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _cedulaCtrl,
                          decoration:
                              const InputDecoration(hintText: 'Cédula'),
                        ),
                        const SizedBox(height: 12),
                      ],
                      TextField(
                        controller: _emailCtrl,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(
                            prefixText: '✉️ ',
                            hintText: 'Correo electrónico'),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _passCtrl,
                        obscureText: !_verPass,
                        decoration: InputDecoration(
                          prefixText: '🔒 ',
                          hintText: 'Contraseña',
                          suffixIcon: IconButton(
                            icon: Text(_verPass ? '🙈' : '👁️'),
                            onPressed: () =>
                                setState(() => _verPass = !_verPass),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      if (_modoRegistro)
                        ElevatedButton(
                          onPressed:
                              _cargandoRegistro ? null : _registrar,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: c.surface,
                            foregroundColor: c.primary,
                            side: BorderSide(color: c.border),
                          ),
                          child: Text(_cargandoRegistro
                              ? 'Registrando...'
                              : 'Registrarse'),
                        )
                      else
                        ElevatedButton(
                          onPressed: _cargandoLogin ? null : _ingresar,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: c.surface,
                            foregroundColor: c.primary,
                            side: BorderSide(color: c.border),
                          ),
                          child: Text(_cargandoLogin
                              ? 'Ingresando...'
                              : 'Ingresar'),
                        ),
                      TextButton(
                        onPressed: () => setState(() {
                          _modoRegistro = !_modoRegistro;
                          _mensajeReset = '';
                        }),
                        child: Text(
                          _modoRegistro
                              ? '¿Ya tienes cuenta? Inicia sesión'
                              : '¿No tienes cuenta? Regístrate',
                          style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              decoration: TextDecoration.underline,
                              color: c.textSecondary),
                        ),
                      ),
                      if (!_modoRegistro) ...[
                        TextButton(
                          onPressed:
                              _buscandoReset ? null : _recuperar,
                          child: Text(
                            _buscandoReset
                                ? 'Buscando...'
                                : '¿Olvidó su contraseña?',
                            style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                decoration: TextDecoration.underline,
                                color: c.textSecondary),
                          ),
                        ),
                        if (_mensajeReset.isNotEmpty)
                          Padding(
                            padding:
                                const EdgeInsets.only(top: 4, bottom: 8),
                            child: Text(_mensajeReset,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                    color: c.primary,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13)),
                          ),
                        Row(
                          children: [
                            Expanded(
                                child: Divider(color: c.border)),
                            Padding(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8),
                              child: Text('O',
                                  style: TextStyle(
                                      color: c.textSecondary)),
                            ),
                            Expanded(
                                child: Divider(color: c.border)),
                          ],
                        ),
                        const SizedBox(height: 12),
                        ElevatedButton(
                          onPressed: _cargandoGoogle ? null : _google,
                          style: ElevatedButton.styleFrom(
                            minimumSize:
                                const Size.fromHeight(50),
                            backgroundColor: isDark
                                ? const Color(0xFF2A2A2A)
                                : Colors.white,
                            foregroundColor: isDark
                                ? c.textSecondary
                                : const Color(0xFF555555),
                            side: BorderSide(color: c.border),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                width: 28,
                                height: 28,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? const Color(0xFF333333)
                                      : Colors.white,
                                  borderRadius:
                                      BorderRadius.circular(14),
                                ),
                                child: const Text('G',
                                    style: TextStyle(
                                        color: Color(0xFF4285F4),
                                        fontWeight: FontWeight.bold,
                                        fontSize: 18)),
                              ),
                              const SizedBox(width: 10),
                              Text(_cargandoGoogle
                                  ? 'Conectando...'
                                  : 'Continuar con Google'),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
