import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTrips } from '../../src/context/TripContext';
import { useApp } from '../../src/context/AppContext';
import { Button, Loading } from '../../src/components/ui';
import { FormScreen } from '../../src/components/FormScreen';
import { PlaceImage } from '../../src/components/PlaceImage';
import { formatDate } from '../../src/utils/format';
import { tripDays, placeDay } from '../../src/utils/itinerary';
import { colors, ui } from '../../src/theme';
import { errorMessage } from '../../src/utils/format';

export default function AddToTrip() {
  const { placeId, tripId, day } = useLocalSearchParams<{
    placeId: string;
    tripId?: string;
    day?: string;
  }>();
  const [selectedDates, setSelectedDates] = useState<Record<string, string>>({});
  const auth = useAuth();
  const { trips, ready, loading, error, refresh, save } = useTrips();
  const { places } = useApp();
  const [busy, setBusy] = useState('');
  const [failure, setFailure] = useState('');
  const lock = useRef(false);
  if (!auth.ready || !ready) return <Loading />;
  if (!auth.session)
    return (
      <Redirect
        href={{
          pathname: '/login',
          params: {
            next: 'add-trip',
            placeId,
            ...(tripId ? { tripId } : {}),
            ...(day ? { day } : {}),
          },
        }}
      />
    );
  if (typeof placeId !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(placeId))
    return (
      <FormScreen>
        <Text style={ui.error}>ลิงก์สถานที่ไม่ถูกต้อง</Text>
      </FormScreen>
    );
  if (!trips.length && loading) return <Loading />;
  if (!trips.length && !error && !tripId)
    return <Redirect href={{ pathname: '/trips/edit', params: { placeId } }} />;
  return (
    <FormScreen>
      <Text style={[ui.muted, { color: '#20251E', letterSpacing: 2, fontSize: 10 }]}>
        MAKE IT PART OF YOUR JOURNEY
      </Text>
      <Text style={ui.title}>ไปกับทริปไหนดี?</Text>
      <View style={[ui.card, ui.row, { borderWidth: 0 }]}>
        <PlaceImage
          uri={places.find((p) => p.id === placeId)?.imageUrl || ''}
          style={{ width: 72, height: 80, borderRadius: 18 }}
        />
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={ui.label}>สถานที่ที่คุณเลือก</Text>
          <Text style={ui.heading}>
            {places.find((p) => p.id === placeId)?.title || 'สถานที่ที่เลือก'}
          </Text>
        </View>
      </View>
      <Text style={ui.muted}>เลือกทริป แล้วเลือกเวลาเที่ยวในแผนการเดินทาง</Text>
      {error || failure ? <Text style={ui.error}>{failure || error}</Text> : null}
      {error ? (
        <Button
          secondary
          title="โหลดรายการทริปใหม่"
          loading={loading}
          onPress={() => void refresh()}
        />
      ) : null}
      {tripId && !trips.some((trip) => trip.id === tripId) && (
        <Text style={ui.error}>ไม่พบทริปที่เลือก กรุณากลับไปเปิดแผนอีกครั้ง</Text>
      )}
      {trips
        .filter((trip) => !tripId || trip.id === tripId)
        .map((trip) => {
          const dates = tripDays(trip);
          const selected = selectedDates[trip.id] || (day && dates.includes(day) ? day : dates[0]);
          return (
            <View key={trip.id} style={ui.card}>
              <Text style={ui.heading}>{trip.title}</Text>
              <Text style={ui.muted}>
                {formatDate(trip.startsAt)} · {trip.placeIds.length} สถานที่
              </Text>
              <Text style={ui.label}>เลือกวันที่เที่ยว</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {dates.map((date, index) => (
                  <Pressable
                    key={date}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selected === date }}
                    onPress={() => setSelectedDates((current) => ({ ...current, [trip.id]: date }))}
                    style={{
                      padding: 14,
                      borderRadius: 18,
                      backgroundColor: selected === date ? colors.accent : colors.background,
                      gap: 4,
                    }}
                  >
                    <Text style={ui.body}>วันที่ {index + 1}</Text>
                    <Text style={ui.muted}>
                      {new Date(date + 'T00:00:00+07:00').toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'short',
                        timeZone: 'Asia/Bangkok',
                      })}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Button
                title={
                  trip.placeIds.includes(placeId)
                    ? 'มีสถานที่นี้ในทริปแล้ว'
                    : 'ยืนยันวันที่ ' + (dates.indexOf(selected) + 1)
                }
                disabled={!!busy || trip.placeIds.includes(placeId)}
                loading={busy === trip.id}
                onPress={async () => {
                  if (lock.current) return;
                  lock.current = true;
                  setBusy(trip.id);
                  setFailure('');
                  try {
                    await save(
                      {
                        title: trip.title,
                        startsAt: trip.startsAt,
                        placeIds: [...trip.placeIds, placeId],
                        placeDays: [
                          ...trip.placeIds.map((item) => ({
                            placeId: item,
                            date: placeDay(trip, item),
                          })),
                          { placeId, date: selected },
                        ],
                      },
                      trip.id,
                      true,
                    );
                    router.replace({
                      pathname: '/trips/[id]',
                      params: { id: trip.id, day: selected },
                    });
                  } catch (err) {
                    setFailure(errorMessage(err));
                  } finally {
                    lock.current = false;
                    setBusy('');
                  }
                }}
              />
            </View>
          );
        })}
      <Button
        secondary
        title="สร้างทริปใหม่สำหรับสถานที่นี้"
        disabled={!!busy}
        onPress={() => router.push({ pathname: '/trips/edit', params: { placeId } })}
      />
    </FormScreen>
  );
}
