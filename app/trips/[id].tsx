import { useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { useTrips } from '../../src/context/TripContext';
import { useApp } from '../../src/context/AppContext';
import { Button, EmptyState, Loading } from '../../src/components/ui';
import { PlaceImage } from '../../src/components/PlaceImage';
import { TripStop } from '../../src/components/TripStop';
import { TripMap } from '../../src/components/TripMap';
import { TripCamera } from '../../src/components/TripCamera';
import { selectMemoryPhoto, saveMemoryToGallery } from '../../src/services/memoryPhotos';
import { newId } from '../../src/services/trips';
import {
  cancelReminder,
  hasReminder,
  scheduleStops,
  scheduleTestNotification,
} from '../../src/services/notifications';
import { errorMessage, formatDate } from '../../src/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { tripDays, tripEnd, placeDay } from '../../src/utils/itinerary';
import { PlaceCard } from '../../src/components/PlaceCard';
import { colors, ui } from '../../src/theme';

export default function TripDetail() {
  const { id, day: requestedDay } = useLocalSearchParams<{ id: string; day?: string }>();
  const auth = useAuth();
  const { trips, ready, loading, error, pendingIds, refresh, save, remove, addMemory } = useTrips();
  const { places, favorites, toggleFavorite } = useApp();
  const trip = trips.find((item) => item.id === id);
  const [camera, setCamera] = useState<{ uri?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const memoryId = useRef(newId());
  const [reminder, setReminder] = useState(false);
  const [selectedDay, setSelectedDay] = useState(requestedDay || '');
  const [picker, setPicker] = useState(false);
  const [album, setAlbum] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  useEffect(() => {
    void hasReminder(id)
      .then(setReminder)
      .catch(() => setReminder(false));
  }, [id, trip?.updatedAt]);
  async function action(task: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await task();
    } catch (err) {
      Alert.alert('ดำเนินการไม่สำเร็จ', errorMessage(err));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (!auth.ready || !ready) return <Loading />;
  if (!auth.session)
    return <Redirect href={{ pathname: '/login', params: { next: 'trip', tripId: id } }} />;
  if (!trip)
    return loading ? (
      <Loading />
    ) : (
      <View style={ui.page}>
        <EmptyState
          title="ไม่พบทริปนี้"
          description={error || 'ทริปอาจถูกลบ หรือไม่ได้อยู่ในบัญชีนี้'}
          action={<Button title="โหลดทริปอีกครั้ง" onPress={() => void refresh()} />}
        />
      </View>
    );
  const stops = trip.placeIds
    .map((placeId) => places.find((place) => place.id === placeId))
    .filter((place) => place !== undefined);
  async function updatePlaces(ids: string[]) {
    if (trip)
      await save({ title: trip.title, startsAt: trip.startsAt, placeIds: ids }, trip.id, true);
  }
  function move(index: number, direction: number) {
    const ids = [...trip!.placeIds];
    [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]];
    void action(() => updatePlaces(ids));
  }
  const days = tripDays(trip);
  const activeDay = days.includes(selectedDay) ? selectedDay : days[0];
  const visibleIds = trip.placeIds
    .filter((placeId) => placeDay(trip, placeId) === activeDay)
    .sort((a, b) => {
      const from = trip.stopTimes?.find((stop) => stop.placeId === a)?.startsAt;
      const to = trip.stopTimes?.find((stop) => stop.placeId === b)?.startsAt;
      return (from ? Date.parse(from) : Infinity) - (to ? Date.parse(to) : Infinity);
    });
  const cameraView = camera && (
    <TripCamera
      initialUri={camera.uri}
      onClose={() => setCamera(null)}
      onSave={(imageUrl) =>
        addMemory(id, { id: memoryId.current, imageUrl, createdAt: new Date().toISOString() })
      }
    />
  );
  function deleteTrip() {
    Alert.alert('ลบทริปนี้?', 'แผนและภาพในทริปจะถูกลบ รูปที่บันทึกลงมือถือยังคงอยู่', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบทริป',
        style: 'destructive',
        onPress: () =>
          void action(async () => {
            await remove(id);
            router.replace('/(tabs)/trips');
          }),
      },
    ]);
  }
  return (
    <SafeAreaView edges={['top', 'bottom']} style={[ui.page, { backgroundColor: '#F5F6F2' }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="กลับไปทริปของฉัน"
          onPress={() => router.replace('/(tabs)/trips')}
          style={{ padding: 12, borderRadius: 20, backgroundColor: 'white' }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[ui.muted, { fontSize: 10, letterSpacing: 2 }]}>MY TRAVEL PLAN</Text>
          <Text numberOfLines={1} style={ui.heading}>
            {trip.title}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="จัดการทริป"
          disabled={busy}
          style={{ padding: 12 }}
          onPress={() =>
            Alert.alert('จัดการทริป', trip.title, [
              {
                text: 'แก้ไขชื่อและวันเดินทาง',
                onPress: () => router.push({ pathname: '/trips/edit', params: { id } }),
              },
              { text: 'ลบทริป', style: 'destructive', onPress: deleteTrip },
              { text: 'ปิด', style: 'cancel' },
            ])
          }
        >
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={[ui.content, { gap: 20, paddingTop: 10 }]}>
        <View style={[ui.row, { justifyContent: 'space-between' }]}>
          <Text style={ui.muted}>
            {trip.placeIds.length} สถานที่ · {days.length} วัน {days.length - 1} คืน
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={!stops.length}
            onPress={() => setMapVisible(true)}
            style={{ padding: 10 }}
          >
            <Text style={{ color: '#20251E', fontSize: 13 }}>ดูแผนที่ ↗</Text>
          </Pressable>
        </View>
        <Text style={ui.muted}>
          เริ่ม {formatDate(trip.startsAt)}
          {'\n'}กลับ {formatDate(tripEnd(trip))}
        </Text>
        {error ? (
          <View style={ui.card}>
            <Text style={ui.error}>{error}</Text>
            <Button
              secondary
              title="ลองอีกครั้ง"
              loading={loading}
              onPress={() => void refresh()}
            />
          </View>
        ) : null}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
        >
          {days.map((day, index) => (
            <Pressable
              key={day}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeDay === day }}
              onPress={() => setSelectedDay(day)}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 14,
                borderRadius: 20,
                backgroundColor: activeDay === day ? '#DDF876' : 'white',
                borderBottomWidth: 3,
                borderBottomColor: activeDay === day ? '#20251E' : 'transparent',
                gap: 5,
              }}
            >
              <Text style={{ color: '#20251E', fontWeight: '700' }}>วันที่ {index + 1}</Text>
              <Text style={[ui.muted, { fontSize: 11 }]}>
                {new Date(day + 'T00:00:00+07:00').toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  timeZone: 'Asia/Bangkok',
                })}
              </Text>
              <Text style={[ui.muted, { fontSize: 11 }]}>
                {trip.placeIds.filter((placeId) => placeDay(trip, placeId) === day).length} สถานที่
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={[ui.muted, { fontSize: 12 }]}>แตะสถานที่เพื่อเลือกหรือแก้ไขเวลาเที่ยว</Text>
        <View>
          {visibleIds.map((placeId) => {
            const place = places.find((item) => item.id === placeId);
            const index = trip.placeIds.indexOf(placeId);
            return (
              <TripStop
                key={placeId}
                title={place?.title || 'สถานที่ในทริป'}
                imageUrl={place?.imageUrl}
                district={place?.district}
                placeId={placeId}
                startsAt={trip.startsAt}
                endsAt={tripEnd(trip)}
                day={activeDay}
                value={trip.stopTimes?.find((stop) => stop.placeId === placeId)}
                disabled={busy}
                onOpen={() => router.push({ pathname: '/places/[id]', params: { id: placeId } })}
                onMenu={() =>
                  Alert.alert('จัดการสถานที่', place?.title, [
                    ...(index > 0 ? [{ text: 'เลื่อนขึ้น', onPress: () => move(index, -1) }] : []),
                    ...(index < trip.placeIds.length - 1
                      ? [{ text: 'เลื่อนลง', onPress: () => move(index, 1) }]
                      : []),
                    {
                      text: 'นำออกจากทริป',
                      style: 'destructive',
                      onPress: () =>
                        Alert.alert('นำสถานที่ออก?', place?.title, [
                          { text: 'ยกเลิก', style: 'cancel' },
                          {
                            text: 'นำออก',
                            style: 'destructive',
                            onPress: () =>
                              void action(() =>
                                updatePlaces(trip.placeIds.filter((value) => value !== placeId)),
                              ),
                          },
                        ]),
                    },
                    { text: 'ปิด', style: 'cancel' },
                  ])
                }
                onSave={async (value, date) => {
                  const stopTimes = (trip.stopTimes || []).filter(
                    (stop) => stop.placeId !== placeId,
                  );
                  if (value) stopTimes.push(value);
                  await save(
                    {
                      title: trip.title,
                      startsAt: trip.startsAt,
                      placeIds: trip.placeIds,
                      stopTimes,
                      placeDays: trip.placeIds.map((item) => ({
                        placeId: item,
                        date: item === placeId ? date : placeDay(trip, item),
                      })),
                    },
                    trip.id,
                    true,
                  );
                  setSelectedDay(date);
                }}
              />
            );
          })}
          {!visibleIds.length && (
            <EmptyState
              icon="trail-sign-outline"
              title="วันนี้ยังไม่มีแผน"
              description="เลือกสถานที่สำหรับวันนี้ แล้วค่อยกำหนดเวลาเที่ยวได้"
            />
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setPicker(true)}
          style={{ alignItems: 'center', alignSelf: 'center', gap: 8, padding: 12 }}
        >
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: '#DDF876',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="add" size={27} color="#20251E" />
          </View>
          <Text style={{ color: '#20251E', fontSize: 13 }}>เลือกสถานที่ของวันนี้</Text>
        </Pressable>
        <Button
          secondary
          icon={reminder ? 'notifications' : 'notifications-outline'}
          title={reminder ? 'เปิดเตือนแล้ว · แตะเพื่อปิด' : 'เตือนเมื่อถึงเวลาเที่ยว'}
          disabled={busy}
          onPress={() =>
            void action(async () => {
              if (reminder) await cancelReminder(id);
              else
                await scheduleStops(
                  trip,
                  Object.fromEntries(places.map((place) => [place.id, place.title])),
                );
              setReminder(!reminder);
            })
          }
        />
        <Button
          secondary
          icon="notifications-circle-outline"
          title="ทดลองแจ้งเตือนใน 10 วินาที"
          disabled={busy}
          onPress={() =>
            void action(async () => {
              await scheduleTestNotification(trip);
              Alert.alert(
                'ตั้งการทดสอบแล้ว',
                'รอ 10 วินาที ลองกลับหน้าหลักของมือถือแล้วแตะการแจ้งเตือนเพื่อเปิดทริปนี้ กดซ้ำจะเริ่มนับใหม่',
              );
            })
          }
        />
      </ScrollView>
      <View
        style={{
          backgroundColor: 'white',
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          accessibilityLabel="ถ่ายรูปความทรงจำ"
          onPress={() => {
            memoryId.current = newId();
            setCamera({});
          }}
          style={{
            backgroundColor: colors.accent,
            borderRadius: 18,
            padding: 12,
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Ionicons name="camera-outline" size={23} color={colors.text} />
          <Text style={{ fontSize: 11 }}>ถ่ายรูป</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="เปิดภาพความทรงจำทั้งหมด"
          onPress={() => setAlbum(true)}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}
        >
          {trip.memories.slice(-2).map((memory) => (
            <PlaceImage
              key={memory.id}
              uri={memory.imageUrl}
              style={{ width: 52, height: 58, borderRadius: 15 }}
            />
          ))}
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#20251E' }}>ภาพความทรงจำ</Text>
            <Text style={ui.muted}>
              {trip.memories.length
                ? trip.memories.length + ' ภาพ · ดูทั้งหมด'
                : 'เก็บช่วงเวลาดี ๆ ของทริป'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>
      </View>
      <Modal visible={picker} animationType="slide" onRequestClose={() => setPicker(false)}>
        <SafeAreaView style={ui.page}>
          <View style={[ui.row, { padding: 20, justifyContent: 'space-between' }]}>
            <Text style={ui.heading}>เลือกสถานที่ · วันที่ {days.indexOf(activeDay) + 1}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="ปิดรายการสถานที่"
              onPress={() => setPicker(false)}
              style={{ padding: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={ui.content}>
            <Text style={ui.muted}>
              เลือกจากรายการโปรดของคุณ เปิดอ่านรายละเอียดก่อนเพิ่มลงวันนี้
            </Text>
            {places
              .filter((place) => favorites.includes(place.id) && !trip.placeIds.includes(place.id))
              .map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  favorite={favorites.includes(place.id)}
                  onFavorite={() => void toggleFavorite(place.id)}
                  onOpen={() => {
                    setPicker(false);
                    router.push({
                      pathname: '/places/[id]',
                      params: { id: place.id, tripId: trip.id, day: activeDay },
                    });
                  }}
                />
              ))}
            {!places.some(
              (place) => favorites.includes(place.id) && !trip.placeIds.includes(place.id),
            ) && (
              <EmptyState
                icon="heart-outline"
                title={favorites.length ? 'ยังไม่มีรายการโปรดที่เพิ่มได้' : 'ยังไม่มีรายการโปรด'}
                description={
                  favorites.length
                    ? 'สถานที่โปรดที่โหลดไว้ถูกเพิ่มในทริปแล้ว เลือกวันใหม่ได้จากสถานที่ในแผน หรือบันทึกสถานที่อื่นเพิ่ม'
                    : 'ไปหน้าสำรวจแล้วแตะหัวใจบนสถานที่ที่ชอบ จากนั้นกลับมาเลือกลงวันเที่ยว'
                }
                action={
                  <Button
                    title="ไปสำรวจสถานที่"
                    onPress={() => {
                      setPicker(false);
                      router.push('/(tabs)/explore');
                    }}
                  />
                }
              />
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
      <Modal visible={mapVisible} animationType="slide" onRequestClose={() => setMapVisible(false)}>
        <SafeAreaView style={ui.page}>
          <View style={{ flex: 1, gap: 12, paddingBottom: 12 }}>
            <Text style={[ui.heading, { paddingHorizontal: 20, paddingTop: 14 }]}>
              แผนที่ทั้งทริป · {stops.length} สถานที่
            </Text>
            <TripMap places={stops} fullScreen />
            <Button secondary title="กลับแผนการเดินทาง" onPress={() => setMapVisible(false)} />
          </View>
        </SafeAreaView>
      </Modal>
      <Modal visible={album} animationType="slide" onRequestClose={() => setAlbum(false)}>
        <SafeAreaView style={ui.page}>
          <ScrollView contentContainerStyle={ui.content}>
            <View style={[ui.row, { justifyContent: 'space-between' }]}>
              <Text style={ui.heading}>ภาพความทรงจำ</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="ปิดคลังรูป"
                onPress={() => setAlbum(false)}
                style={{ padding: 12 }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <View style={ui.row}>
              <View style={{ flex: 1 }}>
                <Button
                  title="ถ่ายรูป"
                  icon="camera-outline"
                  disabled={busy}
                  onPress={() => {
                    memoryId.current = newId();
                    setCamera({});
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  secondary
                  title="เพิ่มจากคลัง"
                  icon="images-outline"
                  disabled={busy}
                  onPress={() =>
                    void action(async () => {
                      const uri = await selectMemoryPhoto();
                      if (uri) {
                        memoryId.current = newId();
                        setCamera({ uri });
                      }
                    })
                  }
                />
              </View>
            </View>
            {!trip.memories.length && (
              <EmptyState
                icon="images-outline"
                title="เก็บภาพแรกของทริปนี้"
                description="เปิดกล้องหรือเลือกภาพจากคลัง เพื่อเก็บความทรงจำไว้ด้วยกัน"
              />
            )}
            {trip.memories.map((memory) => (
              <View key={memory.id} style={ui.card}>
                <PlaceImage uri={memory.imageUrl} style={{ height: 260, borderRadius: 20 }} />
                <Text style={ui.muted}>
                  {formatDate(memory.createdAt)}
                  {pendingIds.includes(memory.id) ? ' · อยู่ในเครื่อง รอส่ง' : ' · บันทึกแล้ว'}
                </Text>
                <Button
                  secondary
                  title="บันทึกลงคลังภาพมือถือ"
                  icon="download-outline"
                  disabled={busy}
                  onPress={() =>
                    void action(async () => {
                      await saveMemoryToGallery(memory.imageUrl);
                      Alert.alert('บันทึกแล้ว', 'รูปอยู่ในคลังภาพของมือถือแล้ว');
                    })
                  }
                />
              </View>
            ))}
          </ScrollView>
          {album && cameraView}
        </SafeAreaView>
      </Modal>
      {!album && cameraView}
    </SafeAreaView>
  );
}
