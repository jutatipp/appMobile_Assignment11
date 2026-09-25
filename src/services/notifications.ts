import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Trip } from '../types/trip';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
const CHANNEL = 'trip-reminders';

export async function hasReminder(tripId: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.some(
    (item) =>
      item.identifier === `trip-${tripId}` || item.identifier.startsWith(`trip-${tripId}-stop-`),
  );
}
export async function cancelReminder(tripId: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const item of scheduled) {
    if (item.identifier.startsWith(`trip-${tripId}-stop-`))
      await Notifications.cancelScheduledNotificationAsync(item.identifier);
  }
  await Notifications.cancelScheduledNotificationAsync(`trip-${tripId}`);
  await Notifications.cancelScheduledNotificationAsync(`trip-${tripId}-test`);
}

// เลิกใช้การเตือนกิจกรรมรุ่นเก่า ป้องกันแจ้งเตือนวันนัดหมายหลังอัปเดตแอป
export async function clearLegacyReminders() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const item of scheduled) {
    if (item.identifier.startsWith('event-') || item.identifier.startsWith('place-'))
      await Notifications.cancelScheduledNotificationAsync(item.identifier);
  }
}

export async function scheduleStops(trip: Trip, titles: Record<string, string>) {
  const upcoming = (trip.stopTimes || []).filter((stop) => Date.parse(stop.startsAt) > Date.now());
  if (!upcoming.length) throw new Error('กำหนดเวลาเที่ยวในอนาคตอย่างน้อย 1 สถานที่ก่อนตั้งเตือน');
  if (upcoming.length > 50) throw new Error('ตั้งเตือนได้สูงสุด 50 สถานที่ต่อทริป');
  if (Platform.OS === 'android')
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'แจ้งเตือนการเดินทาง',
      importance: Notifications.AndroidImportance.HIGH,
    });
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) throw new Error('กรุณาอนุญาตการแจ้งเตือนในการตั้งค่าเครื่อง');
  await cancelReminder(trip.id);
  try {
    for (const stop of upcoming)
      await Notifications.scheduleNotificationAsync({
        identifier: `trip-${trip.id}-stop-${stop.placeId}`,
        content: {
          title: `ถึงเวลาเที่ยว ${titles[stop.placeId] || 'สถานที่ในทริป'}`,
          body: trip.title,
          data: { tripId: trip.id, placeId: stop.placeId },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(stop.startsAt),
          channelId: CHANNEL,
        },
      });
  } catch (error) {
    await cancelReminder(trip.id);
    throw error;
  }
}

export async function scheduleTestNotification(trip: Trip) {
  if (Platform.OS === 'android')
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'แจ้งเตือนการเดินทาง',
      importance: Notifications.AndroidImportance.HIGH,
    });
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) throw new Error('กรุณาอนุญาตการแจ้งเตือนในการตั้งค่าเครื่อง');
  const identifier = `trip-${trip.id}-test`;
  await Notifications.cancelScheduledNotificationAsync(identifier);
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title: 'ทดสอบการแจ้งเตือนสำเร็จ 🌿',
      body: trip.title + ' · แตะเพื่อเปิดแผนการเดินทาง',
      data: { tripId: trip.id },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 10,
      repeats: false,
      channelId: CHANNEL,
    },
  });
}
