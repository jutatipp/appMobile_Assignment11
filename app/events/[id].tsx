import { useEffect, useState } from 'react';
import { Alert, AppState, Linking, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../src/context/AppContext';
import { Button, EmptyState, Loading } from '../../src/components/ui';
import { EventImage } from '../../src/components/EventImage';
import { VenueMap } from '../../src/components/VenueMap';
import { ApiError, getEvent } from '../../src/services/api';
import { cancelReminder, hasReminder, scheduleReminder } from '../../src/services/notifications';
import { Event } from '../../src/types/event';
import { colors, ui } from '../../src/theme';
import { errorMessage, formatDate } from '../../src/utils/format';

export default function DetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const { events, favorites, toggleFavorite, ready } = useApp();
  const cached = events.find((event) => event.id === id);
  const [remote, setRemote] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [missing, setMissing] = useState(false);
  const [retry, setRetry] = useState(0);
  const [reminder, setReminder] = useState(false);
  const [busy, setBusy] = useState(false);
  const event = remote || cached;
  useEffect(() => {
    const controller = new AbortController();
    setRemote(null);
    setMissing(false);
    setError('');
    setLoading(true);
    if (!/^[a-zA-Z0-9-]{1,80}$/.test(id)) {
      setMissing(true);
      setLoading(false);
      return;
    }
    getEvent(id, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setRemote(value);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 404) setMissing(true);
        else setError(errorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, retry]);
  useEffect(() => {
    const update = () => {
      void hasReminder(id)
        .then(setReminder)
        .catch(() => setReminder(false));
    };
    update();
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') update();
    });
    return () => listener.remove();
  }, [id]);
  async function changeReminder(test = false) {
    if (!event || busy) return;
    setBusy(true);
    try {
      if (reminder && !test) {
        await cancelReminder(id);
        setReminder(false);
      } else {
        await scheduleReminder(event, test);
        if (!test) setReminder(true);
        Alert.alert(
          'ตั้งเตือนแล้ว',
          test ? 'คุณจะได้รับแจ้งเตือนในอีกประมาณ 10 วินาที' : 'เราจะเตือนก่อนเริ่มกิจกรรม 30 นาที',
        );
      }
    } catch (err) {
      Alert.alert('ตั้งเตือนไม่สำเร็จ', errorMessage(err), [
        { text: 'ปิด' },
        {
          text: 'เปิด Settings',
          onPress: () => {
            void Linking.openSettings();
          },
        },
      ]);
    } finally {
      setBusy(false);
    }
  }
  if (!ready || (!event && loading)) return <Loading />;
  if (missing || !event)
    return (
      <View style={ui.page}>
        <EmptyState
          title={missing ? 'ไม่พบกิจกรรมนี้' : 'ยังโหลดรายละเอียดไม่ได้'}
          description={missing ? 'กิจกรรมอาจถูกลบหรือลิงก์ไม่ถูกต้อง' : error}
          action={
            <Button
              title={missing ? 'กลับหน้าสำรวจ' : 'ลองอีกครั้ง'}
              onPress={() =>
                missing ? router.replace('/(tabs)/explore') : setRetry((value) => value + 1)
              }
            />
          }
        />
      </View>
    );
  return (
    <SafeAreaView edges={['bottom']} style={ui.page}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <EventImage uri={event.imageUrl} style={{ height: 260 }} />
        <View style={ui.content}>
          <View style={[ui.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}>
            <Text style={ui.badge}>{event.category}</Text>
            <Text style={ui.muted}>หนองคาย / THAILAND</Text>
          </View>
          <Text style={ui.title}>{event.title}</Text>
          <Text style={ui.muted}>
            {event.district} · โดย {event.organizer}
          </Text>
          {error ? (
            <View style={ui.card}>
              <Text style={ui.muted}>กำลังแสดงข้อมูลที่บันทึกไว้ · {error}</Text>
              <Button
                secondary
                title="โหลดรายละเอียดใหม่"
                onPress={() => setRetry((value) => value + 1)}
              />
            </View>
          ) : null}
          <View style={ui.card}>
            <Text style={ui.label}>วันเวลานัดหมาย</Text>
            <Text style={ui.heading}>{formatDate(event.startsAt)}</Text>
            <Text style={ui.muted}>รับ {event.capacity} คน · กิจกรรมจำลอง ไม่มีค่าใช้จ่ายจริง</Text>
          </View>
          <Text style={ui.heading}>ช่วงเวลาดี ๆ เริ่มต้นที่นี่</Text>
          <Text style={ui.body}>{event.description}</Text>
          <Button
            secondary
            icon={favorites.includes(id) ? 'heart' : 'heart-outline'}
            title={favorites.includes(id) ? 'บันทึกในรายการโปรดแล้ว' : 'เก็บไว้ในรายการโปรด'}
            onPress={() => void toggleFavorite(id)}
          />
          <Text style={ui.heading}>จุดนัดพบ</Text>
          <View style={{ borderRadius: 20, overflow: 'hidden' }}>
            <VenueMap coordinate={event} title={event.title} />
          </View>
          <Text style={ui.muted}>
            {event.latitude.toFixed(5)}, {event.longitude.toFixed(5)} ·
            ดูแผนที่ได้โดยไม่ต้องเปิดตำแหน่งของคุณ
          </Text>
          <View style={ui.card}>
            <Text style={ui.heading}>ให้เราช่วยเตือนคุณ</Text>
            <Text style={ui.muted}>
              ตั้งเตือนล่วงหน้า 30 นาที แล้วแตะการแจ้งเตือนเพื่อกลับมาดูรายละเอียด
            </Text>
            <Button
              secondary
              icon="notifications-outline"
              title={reminder ? 'ยกเลิกการแจ้งเตือน' : 'เตือนฉันก่อนเริ่มกิจกรรม'}
              loading={busy}
              onPress={() => void changeReminder()}
            />
            <Button
              secondary
              title="ทดลองแจ้งเตือนใน 10 วินาที"
              disabled={busy}
              onPress={() => void changeReminder(true)}
            />
          </View>
          <Button
            title="ลงทะเบียนร่วมกิจกรรม"
            icon="arrow-forward-outline"
            disabled={new Date(event.startsAt).getTime() <= Date.now()}
            onPress={() => router.push({ pathname: '/register', params: { eventId: id } })}
          />
          <Text style={[ui.muted, { textAlign: 'center', fontSize: 11 }]}>
            ภาพประกอบบรรยากาศ ไม่ใช่ภาพยืนยันสถานที่จริง
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
