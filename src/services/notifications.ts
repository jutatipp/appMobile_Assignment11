import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Event } from '../types/event';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
const CHANNEL = 'event-reminders';

export async function scheduleReminder(event: Event, test = false) {
  if (Platform.OS === 'android')
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'เตือนกิจกรรมท่องเที่ยว',
      importance: Notifications.AndroidImportance.HIGH,
    });
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted)
    throw new Error('ยังไม่ได้รับอนุญาตแจ้งเตือน เปิดสิทธิ์ได้จากการตั้งค่าเครื่อง');
  const date = new Date(new Date(event.startsAt).getTime() - 30 * 60000);
  if (!test && date.getTime() <= Date.now())
    throw new Error('เลยเวลาเตือนแล้ว กรุณาเลือกกิจกรรมที่เริ่มในอีกมากกว่า 30 นาที');
  const id = `event-${event.id}${test ? '-test' : ''}`;
  await Notifications.cancelScheduledNotificationAsync(id);
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title: test ? 'ทดสอบการแจ้งเตือน' : 'อีก 30 นาที กิจกรรมจะเริ่มแล้ว',
      body: 'แตะเพื่อเปิดรายละเอียดกิจกรรมของคุณ',
      data: { eventId: event.id },
      sound: true,
    },
    trigger: test
      ? {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 10,
          channelId: CHANNEL,
        }
      : { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL },
  });
  return id;
}
export async function hasReminder(eventId: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.some((item) => item.identifier === `event-${eventId}`);
}
export async function cancelReminder(eventId: string) {
  await Notifications.cancelScheduledNotificationAsync(`event-${eventId}`);
}
