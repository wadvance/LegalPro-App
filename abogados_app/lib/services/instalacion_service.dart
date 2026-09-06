import 'dart:js_interop';

import 'package:flutter/foundation.dart' show kIsWeb;

@JS('window')
external _JSWindow get _window;

extension type _JSWindow(JSObject _) implements JSObject {
  external void addEventListener(String type, JSFunction listener);
  external _MediaQuery matchMedia(String query);
  external _Navigator get navigator;
}

extension type _MediaQuery(JSObject _) implements JSObject {
  external bool get matches;
}

extension type _Navigator(JSObject _) implements JSObject {
  external bool? get standalone;
  external String get userAgent;
}

extension type _InstallEvent(JSObject _) implements JSObject {
  external void preventDefault();
  external void prompt();
  external JSPromise<JSObject> get userChoice;
}

extension type _Choice(JSObject _) implements JSObject {
  external String get outcome;
}

/// Equivale a src/services/installApp.js (PWA install en web).
class InstalacionService {
  static JSObject? _deferred;

  static void inicializar() {
    if (!kIsWeb) return;
    try {
      _window.addEventListener(
        'beforeinstallprompt',
        ((JSAny e) {
          final obj = e as JSObject;
          final ev = _InstallEvent(obj);
          ev.preventDefault();
          _deferred = obj;
        }).toJS,
      );
      _window.addEventListener(
        'appinstalled',
        ((JSAny _) {
          _deferred = null;
        }).toJS,
      );
    } catch (_) {}
  }

  static bool esStandalone() {
    if (!kIsWeb) return false;
    try {
      if (_window
          .matchMedia('(display-mode: standalone)')
          .matches) {
        return true;
      }
    } catch (_) {}
    try {
      return _window.navigator.standalone == true;
    } catch (_) {
      return false;
    }
  }

  static bool puedeInstalar() {
    if (!kIsWeb) return false;
    return !esStandalone();
  }

  static bool tienePrompt() => kIsWeb && _deferred != null;

  /// Devuelve true si el usuario aceptó la instalación.
  static Future<bool> intentarInstalacion() async {
    final prompt = _deferred;
    if (!kIsWeb || prompt == null) return false;
    _deferred = null;
    try {
      final ev = _InstallEvent(prompt);
      ev.prompt();
      final res = await ev.userChoice.toDart;
      if (res == null) return false;
      final choice = _Choice(res);
      return choice.outcome == 'accepted';
    } catch (_) {
      return false;
    }
  }

  /// 'android' | 'ios' | 'web'
  static String navegador() {
    if (!kIsWeb) return 'web';
    try {
      final ua = _window.navigator.userAgent;
      if (RegExp('android', caseSensitive: false).hasMatch(ua)) {
        return 'android';
      }
      if (RegExp('iPad|iPhone|iPod').hasMatch(ua)) return 'ios';
    } catch (_) {}
    return 'web';
  }
}
