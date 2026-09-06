import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';

/// Equivale a firebase/auth.js de la app original.
class AuthService {
  static final FirebaseAuth _auth = FirebaseAuth.instance;
  static final FirebaseFirestore _db = FirebaseFirestore.instance;

  static Stream<User?> authState() => _auth.authStateChanges();

  static Future<void> _asegurarPerfil(User user) async {
    final ref = _db.collection('usuarios').doc(user.uid);
    final snap = await ref.get();
    if (!snap.exists) {
      final partes = (user.displayName ?? '').split(' ');
      await ref.set({
        'uid': user.uid,
        'email': user.email ?? '',
        'nombre': partes.isNotEmpty ? partes.first : '',
        'apellido': partes.length > 1 ? partes.sublist(1).join(' ') : '',
        'telefono': '',
        'cedula': '',
        'rol': 'abogado',
        'activo': true,
        'createdAt': FieldValue.serverTimestamp(),
        'lastLogin': FieldValue.serverTimestamp(),
      });
    } else {
      await ref.update({'lastLogin': FieldValue.serverTimestamp()});
    }
  }

  static String _mensajeLogin(FirebaseAuthException e) {
    switch (e.code) {
      case 'user-not-found':
        return 'Correo no registrado';
      case 'wrong-password':
        return 'Contraseña incorrecta';
      case 'invalid-email':
        return 'Correo electrónico inválido';
      case 'too-many-requests':
        return 'Demasiados intentos. Intente más tarde.';
      case 'invalid-credential':
        return 'Credenciales inválidas';
      default:
        return 'Credenciales inválidas';
    }
  }

  static Future<({bool ok, String? error})> login(
      String email, String password) async {
    try {
      final cred = await _auth.signInWithEmailAndPassword(
          email: email.trim(), password: password);
      if (cred.user != null) {
        await _asegurarPerfil(cred.user!);
      }
      return (ok: true, error: null);
    } on FirebaseAuthException catch (e) {
      return (ok: false, error: _mensajeLogin(e));
    } catch (e) {
      return (ok: false, error: 'Credenciales inválidas');
    }
  }

  static Future<({bool ok, String? error})> register({
    required String email,
    required String password,
    required String nombre,
    required String apellido,
    String telefono = '',
    String cedula = '',
  }) async {
    try {
      final cred = await _auth.createUserWithEmailAndPassword(
          email: email.trim(), password: password);
      await _db.collection('usuarios').doc(cred.user!.uid).set({
        'uid': cred.user!.uid,
        'email': email.trim(),
        'nombre': nombre.trim(),
        'apellido': apellido.trim(),
        'telefono': telefono.trim(),
        'cedula': cedula.trim(),
        'rol': 'abogado',
        'activo': true,
        'createdAt': FieldValue.serverTimestamp(),
        'lastLogin': FieldValue.serverTimestamp(),
      });
      return (ok: true, error: null);
    } on FirebaseAuthException catch (e) {
      var msg = e.message ?? 'Error al registrar';
      if (e.code == 'email-already-in-use') {
        msg = 'El correo ya está registrado';
      } else if (e.code == 'weak-password') {
        msg = 'La contraseña debe tener al menos 6 caracteres';
      } else if (e.code == 'invalid-email') {
        msg = 'Correo electrónico inválido';
      }
      return (ok: false, error: msg);
    } catch (e) {
      return (ok: false, error: 'Error al registrar: $e');
    }
  }

  static Future<({bool ok, String? error})> loginWithGoogle() async {
    try {
      final googleUser = await GoogleSignIn.instance.authenticate();
      final googleAuth = googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
          idToken: googleAuth.idToken);
      final cred = await _auth.signInWithCredential(credential);
      if (cred.user != null) {
        await _asegurarPerfil(cred.user!);
      }
      return (ok: true, error: null);
    } on FirebaseAuthException catch (e) {
      return (ok: false, error: '${e.code}: ${e.message}');
    } catch (e) {
      // El usuario cerró el popup: no mostrar error.
      if ('$e'.contains('canceled')) {
        return (ok: false, error: '');
      }
      return (ok: false, error: 'Error al iniciar sesión con Google');
    }
  }

  static Future<({bool ok, String? error})> resetPassword(
      String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email.trim());
      return (ok: true, error: null);
    } on FirebaseAuthException catch (e) {
      var msg = 'Error al enviar correo de restablecimiento';
      if (e.code == 'user-not-found') {
        msg = 'Correo no registrado';
      } else if (e.code == 'invalid-email') {
        msg = 'Correo electrónico inválido';
      }
      return (ok: false, error: msg);
    } catch (e) {
      return (ok: false, error: 'Error al enviar correo de restablecimiento');
    }
  }

  static Future<void> logout() => _auth.signOut();

  static Future<Map<String, dynamic>?> perfil(String uid) async {
    final snap = await _db.collection('usuarios').doc(uid).get();
    return snap.data();
  }
}
