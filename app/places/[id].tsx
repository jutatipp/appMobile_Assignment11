import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../src/context/AppContext';
import { Button, EmptyState, Loading } from '../../src/components/ui';
import { PlaceImage } from '../../src/components/PlaceImage';
import { VenueMap } from '../../src/components/VenueMap';
import { ApiError, getPlace } from '../../src/services/api';
import { Place } from '../../src/types/place';
import { colors, ui } from '../../src/theme';
import { errorMessage } from '../../src/utils/format';

export default function DetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string; tripId?: string; day?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const { places, favorites, toggleFavorite, ready } = useApp();
  const cached = places.find((place) => place.id === id);
  const [remote, setRemote] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [missing, setMissing] = useState(false);
  const [retry, setRetry] = useState(0);
  const place = remote || cached;
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
    getPlace(id, controller.signal)
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
  if (!ready || (!place && loading)) return <Loading />;
  if (missing || !place)
    return (
      <View style={ui.page}>
        <EmptyState
          title={missing ? 'ไม่พบสถานที่นี้' : 'ยังโหลดรายละเอียดไม่ได้'}
          description={missing ? 'สถานที่อาจถูกลบหรือลิงก์ไม่ถูกต้อง' : error}
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
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ height: 370 + insets.top }}>
          <PlaceImage uri={place.imageUrl} style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={['#00000038', '#00000000', '#101C16D9']}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={{
              position: 'absolute',
              top: insets.top + 12,
              left: 20,
              right: 20,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="กลับ"
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace('/(tabs)/explore')
              }
              style={styles.circle}
            >
              <Ionicons name="arrow-back" size={23} color={colors.text} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="บันทึกรายการโปรด"
              accessibilityState={{ selected: favorites.includes(id) }}
              onPress={() => void toggleFavorite(id)}
              style={styles.circle}
            >
              <Ionicons
                name={favorites.includes(id) ? 'heart' : 'heart-outline'}
                size={23}
                color={colors.text}
              />
            </Pressable>
          </View>
          <View style={{ position: 'absolute', bottom: 52, left: 24, right: 24, gap: 8 }}>
            <Text style={{ color: '#E1EACF', fontSize: 12, letterSpacing: 2 }}>
              NONG KHAI / THAILAND
            </Text>
            <Text style={{ color: 'white', fontSize: 30, lineHeight: 40, fontWeight: '700' }}>
              {place.title}
            </Text>
            <Text style={{ color: '#FFFFFFDB', fontSize: 14 }}>
              {place.district} · โดย {place.contributor}
            </Text>
          </View>
        </View>
        <View
          style={[
            ui.content,
            {
              marginTop: -30,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              backgroundColor: colors.background,
            },
          ]}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.border,
            }}
          />
          <View style={[ui.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}>
            <Text style={ui.badge}>{place.category}</Text>
            <Text style={ui.muted}>หนองคาย / THAILAND</Text>
          </View>
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
          <Text style={ui.heading}>เกี่ยวกับสถานที่</Text>
          <Text style={ui.body}>{place.description}</Text>
          <Button
            secondary
            icon={favorites.includes(id) ? 'heart' : 'heart-outline'}
            title={favorites.includes(id) ? 'บันทึกในรายการโปรดแล้ว' : 'เก็บไว้ในรายการโปรด'}
            onPress={() => void toggleFavorite(id)}
          />
          <Text style={ui.heading}>ตำแหน่งสถานที่</Text>
          <View style={{ borderRadius: 20, overflow: 'hidden' }}>
            <VenueMap coordinate={place} title={place.title} />
          </View>
          <Text style={ui.muted}>
            {place.latitude.toFixed(5)}, {place.longitude.toFixed(5)} ·
            ดูแผนที่ได้โดยไม่ต้องเปิดตำแหน่งของคุณ
          </Text>
          <Text style={[ui.muted, { textAlign: 'center', fontSize: 11 }]}>
            ภาพประกอบบรรยากาศ ไม่ใช่ภาพยืนยันสถานที่จริง
          </Text>
        </View>
      </ScrollView>
      <View style={styles.booking}>
        <View style={{ flex: 1 }}>
          <Button
            title="เพิ่มลงทริป"
            icon="add-outline"
            onPress={() =>
              router.push({
                pathname: '/trips/add',
                params: {
                  placeId: id,
                  ...(typeof params.tripId === 'string' ? { tripId: params.tripId } : {}),
                  ...(typeof params.day === 'string' ? { day: params.day } : {}),
                },
              })
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFFE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  booking: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
});
