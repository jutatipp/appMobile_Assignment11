import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StopTime } from '../types/trip';
import { TripDatePicker } from './TripDatePicker';
import { Button } from './ui';
import { formatTripInput, parseTripDate } from '../utils/tripDate';
import { errorMessage } from '../utils/format';
import { PlaceImage } from './PlaceImage';
import { colors, ui } from '../theme';

export function TripStop({
  title,
  placeId,
  startsAt,
  endsAt,
  day,
  value,
  disabled,
  onSave,
  imageUrl,
  district,
  onOpen,
  onMenu,
}: {
  imageUrl?: string;
  district?: string;
  onOpen?: () => void;
  onMenu?: () => void;
  title: string;
  placeId: string;
  startsAt: string;
  endsAt: string;
  day: string;
  value?: StopTime;
  disabled: boolean;
  onSave: (value: StopTime | null, date: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save(clear = false) {
    if (busy) return;
    const from = parseTripDate(start),
      to = parseTripDate(end);
    if (
      !clear &&
      (!from ||
        !to ||
        Date.parse(from) < Date.parse(startsAt) ||
        Date.parse(to) <= Date.parse(from) ||
        Date.parse(to) > Date.parse(endsAt) ||
        start.slice(0, 10) !== end.slice(0, 10))
    ) {
      setError('เลือกเวลาเริ่มและสิ้นสุดในวันเดียวกัน ภายในช่วงวันเวลาเที่ยวของทริป');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSave(clear ? null : { placeId, startsAt: from!, endsAt: to! }, start.slice(0, 10));
      setOpen(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  const time = (iso: string) =>
    new Date(iso).toLocaleTimeString('th-TH', {
      timeZone: 'Asia/Bangkok',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`กำหนดเวลาเที่ยว ${title}`}
        disabled={disabled}
        onPress={() => {
          const initial =
            value?.startsAt ||
            new Date(
              Math.max(Date.parse(startsAt), Date.parse(day + 'T09:00:00+07:00')),
            ).toISOString();
          setStart(formatTripInput(initial));
          setEnd(
            formatTripInput(
              value?.endsAt ||
                new Date(
                  Math.min(
                    Date.parse(initial) + 7200000,
                    Date.parse(endsAt),
                    Date.parse(day + 'T23:59:00+07:00'),
                  ),
                ).toISOString(),
            ),
          );
          setError('');
          setOpen(true);
        }}
        style={[
          ui.row,
          {
            paddingVertical: 8,
            gap: 16,
            paddingHorizontal: 8,
            borderRadius: 20,
            backgroundColor: value ? 'transparent' : '#EDF4D9',
          },
        ]}
      >
        <View style={{ width: 43, alignItems: 'center', alignSelf: 'stretch', gap: 8 }}>
          <Text style={[ui.muted, { fontSize: 11 }]}>{value ? time(value.startsAt) : '—'}</Text>
          <View
            style={{
              width: 11,
              height: 11,
              borderRadius: 6,
              backgroundColor: value ? colors.primary : colors.accent,
              borderWidth: 2,
              borderColor: '#DDF876',
            }}
          />
          <View style={{ flex: 1, width: 1, backgroundColor: '#E7E9E2', minHeight: 34 }} />
        </View>
        <View style={{ flex: 1, gap: 6, paddingTop: 20 }}>
          <Text numberOfLines={2} style={[ui.heading, { fontSize: 16, color: '#20251E' }]}>
            {title}
          </Text>
          <Text style={[ui.muted, { fontSize: 12 }]}>
            {value
              ? time(value.startsAt) + ' – ' + time(value.endsAt) + ' น.'
              : 'ยังไม่เลือกเวลา · แตะเพื่อตั้งเวลา'}
          </Text>
          <Text numberOfLines={1} style={[ui.muted, { fontSize: 11 }]}>
            {district}
          </Text>
        </View>
        <PlaceImage
          uri={imageUrl || ''}
          style={{
            width: 70,
            height: 86,
            borderRadius: 20,
            marginTop: 12,
            borderWidth: 3,
            borderColor: 'white',
          }}
        />
      </Pressable>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          marginTop: -8,
          marginBottom: 12,
          gap: 8,
        }}
      >
        <Pressable accessibilityRole="button" onPress={onOpen} style={{ padding: 10 }}>
          <Text style={{ fontSize: 12, color: '#20251E' }}>รายละเอียด</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'จัดการ ' + title}
          disabled={disabled}
          onPress={onMenu}
          style={{ padding: 10 }}
        >
          <Ionicons name="ellipsis-horizontal" size={19} color={colors.muted} />
        </Pressable>
      </View>
      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={() => {
          if (!busy) setOpen(false);
        }}
      >
        <SafeAreaView style={ui.page}>
          <ScrollView contentContainerStyle={ui.content}>
            <Text style={[ui.muted, { letterSpacing: 2, fontSize: 10, color: '#20251E' }]}>
              A LITTLE TIME TO EXPLORE
            </Text>
            <Text style={ui.title}>เลือกเวลาเที่ยว</Text>
            <View style={[ui.card, ui.row, { borderWidth: 0 }]}>
              <PlaceImage
                uri={imageUrl || ''}
                style={{ width: 64, height: 72, borderRadius: 16 }}
              />
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={ui.heading}>{title}</Text>
                <Text style={ui.muted}>{district}</Text>
              </View>
            </View>
            <TripDatePicker
              label="วันที่เที่ยวและเวลาเริ่ม"
              value={start}
              onChange={(next) => {
                setStart(next);
                setEnd(next.slice(0, 10) + ' ' + (end.slice(11) || '11:00'));
              }}
            />
            <TripDatePicker
              label="เวลาสิ้นสุด"
              fields={['time']}
              value={end}
              onChange={(next) => setEnd(start.slice(0, 10) + ' ' + next.slice(11))}
            />
            {error ? (
              <Text accessibilityLiveRegion="polite" style={ui.error}>
                {error}
              </Text>
            ) : null}
            <Button title="บันทึกเวลาเที่ยว" loading={busy} onPress={() => void save()} />
            {!value && (
              <Button
                secondary
                title="บันทึกเฉพาะวัน ยังไม่เลือกเวลา"
                disabled={busy}
                onPress={() => void save(true)}
              />
            )}
            {value && (
              <Button
                secondary
                title="ล้างเวลาเที่ยว"
                disabled={busy}
                onPress={() => void save(true)}
              />
            )}
            <Button secondary title="ยกเลิก" disabled={busy} onPress={() => setOpen(false)} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
