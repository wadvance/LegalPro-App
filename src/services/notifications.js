import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { addDocument } from './localStorage';
import { parseDate } from '../utils/helpers';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const registerForPushNotifications = async (userId) => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notificaciones Arauz Carrillo',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1A237E',
    });
  }

  return { success: true, token: 'local-only' };
};

export const scheduleLocalNotification = async (title, body, trigger = null) => {
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: trigger || null,
    });
    return { success: true, identifier };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const scheduleAppointmentReminder = async (appointment) => {
  const notifTime = parseDate(appointment.fecha) || new Date();
  notifTime.setHours(notifTime.getHours() - 1);

  if (notifTime > new Date()) {
    return scheduleLocalNotification(
      'Recordatorio de Cita',
      `Tienes una cita con ${appointment.clienteNombre} a las ${appointment.hora}`,
      { date: notifTime }
    );
  }
  return { success: false, error: 'La hora ya pasó' };
};

export const cancelNotification = async (identifier) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addNotificationToHistory = async (userId, notification) => {
  try {
    await addDocument('notificaciones', { userId, ...notification, leida: false });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
