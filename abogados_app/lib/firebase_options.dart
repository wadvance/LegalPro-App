import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// Opciones de Firebase del proyecto existente `bufete-abogados`
/// (reutiliza la configuracion de firebase/config.js).
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.iOS:
      case TargetPlatform.macOS:
      case TargetPlatform.android:
      case TargetPlatform.windows:
      case TargetPlatform.linux:
      case TargetPlatform.fuchsia:
        // Usa los mismos valores del proyecto. Para apps nativas publicadas
        // se recomienda registrar cada app en la consola de Firebase,
        // pero Auth + Firestore funcionan con estos valores base.
        return web;
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyDzer5VsFrJj4PG_4ooXsgv2NjdXJKFVWM',
    authDomain: 'bufete-abogados.firebaseapp.com',
    projectId: 'bufete-abogados',
    storageBucket: 'bufete-abogados.firebasestorage.app',
    messagingSenderId: '697819738127',
    appId: '1:697819738127:web:31a9e4cd06eb2eaa6a337a',
  );
}
