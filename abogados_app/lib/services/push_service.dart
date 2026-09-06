import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import 'firestore_service.dart';

/// Avisos push en el dispositivo cuando hay notificaciones nuevas.
/// En web no aplica: ahí los avisos se ven en la campana de la app.
class PushService {
  static final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();
  static bool _listo = false;
  static final Set<String> _mostradas = {};

  static Future<void> inicializar() async {
    if (kIsWeb || _listo) return;
    const android =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios = DarwinInitializationSettings();
    await _plugin.initialize(
      settings: const InitializationSettings(
          android: android, iOS: ios),
    );
    await _plugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.requestNotificationsPermission();
    await _plugin
        .resolvePlatformSpecificImplementation<
            IOSFlutterLocalNotificationsPlugin>()
        ?.requestPermissions(alert: true, badge: true, sound: true);
    _listo = true;
  }

  /// Escucha avisos no leídos y muestra push del sistema (solo móvil).
  static void escuchar(String uid) {
    if (kIsWeb) return;
    FirestoreService.notificaciones(uid).listen((snap) async {
      if (!_listo) await inicializar();
      for (final d in snap.docs) {
        final data = d.data();
        if (data['leida'] == true || _mostradas.contains(d.id)) {
          continue;
        }
        _mostradas.add(d.id);
        await _plugin.show(
          id: d.id.hashCode,
          title: '${data['titulo'] ?? 'Bufete de Abogados'}',
          body: '${data['mensaje'] ?? ''}',
          notificationDetails: const NotificationDetails(
            android: AndroidNotificationDetails(
              'expedientes',
              'Expedientes y edictos',
              importance: Importance.high,
              priority: Priority.high,
            ),
            iOS: DarwinNotificationDetails(),
          ),
        );
      }
    });
  }
}
