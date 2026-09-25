import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTrips } from '../../src/context/TripContext';
import { useApp } from '../../src/context/AppContext';
import { Button, Field, Loading } from '../../src/components/ui';
import { TripDatePicker } from '../../src/components/TripDatePicker';
import { FormScreen } from '../../src/components/FormScreen';
import { newId } from '../../src/services/trips';
import { formatTripInput, parseTripDate } from '../../src/utils/tripDate';
import { errorMessage } from '../../src/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PlaceImage } from '../../src/components/PlaceImage';
import { tripDays, tripEnd, tripDay } from '../../src/utils/itinerary';
import { ui } from '../../src/theme';

export default function EditTrip() {
  const { id, placeId } = useLocalSearchParams<{ id?: string; placeId?: string }>();
  const auth = useAuth();
  const { trips, ready, save, loading, error: loadError, refresh } = useTrips();
  const { places } = useApp();
  const existing = trips.find((trip) => trip.id === id);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [end, setEnd] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const initialized = useRef('');
  const draftId = useRef(newId());
  const lock = useRef(false);
  useEffect(() => {
    if (existing && initialized.current !== existing.id) {
      setTitle(existing.title);
      setDate(formatTripInput(existing.startsAt));
      setEnd(formatTripInput(tripEnd(existing)));
      initialized.current = existing.id;
    }
  }, [existing]);
  if (!auth.ready || !ready) return <Loading />;
  if (!auth.session)
    return (
      <Redirect
        href={{
          pathname: '/login',
          params: id
            ? { next: 'trip', tripId: id }
            : { next: 'new-trip', ...(placeId ? { placeId } : {}) },
        }}
      />
    );
  if (id && !existing)
    return loading ? (
      <Loading />
    ) : (
      <FormScreen>
        <Text style={ui.error}>{loadError || 'ไม่พบทริปนี้'}</Text>
        <Button title="ลองใหม่" onPress={() => void refresh()} />
      </FormScreen>
    );
  const startsAt = parseTripDate(date);
  const endsAt = parseTripDate(end);
  const selectedPlace = places.find((place) => place.id === placeId);
  const needsVisit = !!placeId && !id;
  return (
    <FormScreen>
      <LinearGradient
        colors={['#EDF4D9', '#F5F6F2']}
        style={{ padding: 24, borderRadius: 28, gap: 12 }}
      >
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 16,
            backgroundColor: 'white',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="paper-plane-outline" size={24} color="#20251E" />
        </View>
        <Text style={{ color: '#20251E', letterSpacing: 2, fontSize: 10 }}>
          YOUR NEXT LITTLE ESCAPE
        </Text>
        <Text style={[ui.title, { color: '#20251E' }]}>
          {id ? 'ปรับแผนให้ลงตัว' : 'ทริปดี ๆ เริ่มตรงนี้'}
        </Text>
        <Text style={ui.muted}>
          {needsVisit
            ? 'เลือกช่วงวันเที่ยว แล้วค่อยจัดสถานที่และเวลาในแต่ละวัน'
            : 'ตั้งชื่อ เลือกวัน แล้วออกไปพบความทรงจำใหม่'}
        </Text>
      </LinearGradient>
      <View style={[ui.card, { borderRadius: 24, borderWidth: 0 }]}>
        <Field
          label="ชื่อทริปของคุณ"
          placeholder="เช่น วันหยุดที่หนองคาย"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
          error={submitted && title.trim().length < 2 ? 'กรอกชื่ออย่างน้อย 2 ตัวอักษร' : ''}
        />
      </View>
      <View style={[ui.card, { borderRadius: 24, borderWidth: 0 }]}>
        <TripDatePicker
          label="วันและเวลาเริ่มเที่ยว / ไปถึง"
          value={date}
          onChange={(next) => {
            setDate(next);
            const iso = parseTripDate(next);
            if (iso && (!endsAt || Date.parse(endsAt) <= Date.parse(iso)))
              setEnd(formatTripInput(new Date(Date.parse(iso) + 86400000).toISOString()));
          }}
        />
        {submitted && !startsAt ? <Text style={ui.error}>เลือกวันและเวลาเดินทางก่อนนะ</Text> : null}
      </View>
      <View style={[ui.card, { borderWidth: 0 }]}>
        <TripDatePicker label="วันและเวลากลับ" value={end} onChange={setEnd} />
        {submitted && (!endsAt || !startsAt || Date.parse(endsAt) <= Date.parse(startsAt)) && (
          <Text style={ui.error}>เลือกวันและเวลากลับหลังเวลาเริ่มเที่ยว</Text>
        )}
        {startsAt && endsAt && Date.parse(endsAt) > Date.parse(startsAt) && (
          <Text style={ui.badge}>
            เที่ยว {tripDays({ startsAt, endsAt }).length} วัน ·{' '}
            {tripDays({ startsAt, endsAt }).length - 1} คืน
          </Text>
        )}
      </View>
      {needsVisit && (
        <View style={[ui.card, { borderRadius: 24, borderWidth: 0 }]}>
          <Text style={[ui.label, { color: '#20251E' }]}>สถานที่แรกของทริป</Text>
          <View style={ui.row}>
            <PlaceImage
              uri={selectedPlace?.imageUrl || ''}
              style={{ width: 64, height: 72, borderRadius: 18 }}
            />
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={ui.heading}>{selectedPlace?.title || 'สถานที่ที่เลือกไว้'}</Text>
              <Text style={ui.muted}>{selectedPlace?.district}</Text>
            </View>
          </View>
        </View>
      )}
      {error ? <Text style={ui.error}>{error}</Text> : null}
      <Button
        title={id ? 'บันทึกแผนการเดินทาง' : 'สร้างทริปของฉัน'}
        icon="arrow-forward-outline"
        loading={busy}
        onPress={async () => {
          setSubmitted(true);
          if (
            !startsAt ||
            title.trim().length < 2 ||
            lock.current ||
            !endsAt ||
            Date.parse(endsAt) <= Date.parse(startsAt)
          )
            return;
          lock.current = true;
          setBusy(true);
          setError('');
          try {
            const trip = await save(
              {
                title: title.trim(),
                startsAt,
                endsAt: endsAt!,
                placeIds: existing?.placeIds || (placeId ? [placeId] : []),
                ...(needsVisit
                  ? { placeDays: [{ placeId: placeId!, date: tripDay(startsAt) }] }
                  : {}),
              },
              id || draftId.current,
              !!id,
            );
            router.replace({ pathname: '/trips/[id]', params: { id: trip.id } });
          } catch (err) {
            setError(errorMessage(err));
          } finally {
            lock.current = false;
            setBusy(false);
          }
        }}
      />
    </FormScreen>
  );
}
