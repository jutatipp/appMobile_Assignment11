import { useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './ui';
import { colors, ui } from '../theme';
import { formatTripInput, parseTripDate } from '../utils/tripDate';

export function TripDatePicker({
  value,
  onChange,
  label = 'วันและเวลาออกเดินทาง (เวลาไทย)',
  fields = ['date', 'time'],
}: {
  value: string;
  label?: string;
  fields?: ('date' | 'time')[];
  onChange: (value: string) => void;
}) {
  const [mode, setMode] = useState<'date' | 'time' | null>(null);
  const [draft, setDraft] = useState(new Date());
  const iso = parseTripDate(value);
  function open(next: 'date' | 'time') {
    const tomorrow = formatTripInput(new Date(Date.now() + 86400000).toISOString()).slice(0, 10);
    setDraft(new Date(iso || parseTripDate(tomorrow + ' 09:00')!));
    setMode(next);
  }
  const picker = mode && (
    <DateTimePicker
      value={draft}
      mode={mode}
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      locale="th-TH"
      timeZoneName="Asia/Bangkok"
      is24Hour
      themeVariant="light"
      onChange={(event, date) => {
        if (Platform.OS === 'android') {
          setMode(null);
          if (event.type === 'set' && date) onChange(formatTripInput(date.toISOString()));
        } else if (date) setDraft(date);
      }}
    />
  );
  return (
    <View style={{ gap: 10 }}>
      <Text style={ui.label}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {fields.map((kind) => (
          <Pressable
            key={kind}
            accessibilityRole="button"
            accessibilityLabel={kind === 'date' ? 'เลือกวัน ' + label : 'เลือกเวลา ' + label}
            onPress={() => open(kind)}
            style={{
              flexGrow: 1,
              flexBasis: kind === 'date' ? 160 : 100,
              minHeight: 72,
              padding: 14,
              borderRadius: 18,
              backgroundColor: '#F5F6F2',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Ionicons
              name={kind === 'date' ? 'calendar-outline' : 'time-outline'}
              size={21}
              color="#20251E"
            />
            <View style={{ flexShrink: 1, gap: 4 }}>
              <Text style={{ fontSize: 11, color: colors.muted }}>
                {kind === 'date' ? 'วันที่' : 'เวลา'}
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#20251E' }}>
                {iso
                  ? kind === 'date'
                    ? new Date(iso).toLocaleDateString('th-TH', {
                        timeZone: 'Asia/Bangkok',
                        day: 'numeric',
                        month: 'short',
                        year: '2-digit',
                      })
                    : new Date(iso).toLocaleTimeString('th-TH', {
                        timeZone: 'Asia/Bangkok',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      }) + ' น.'
                  : kind === 'date'
                    ? 'เลือกวัน'
                    : 'เลือกเวลา'}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
      {Platform.OS === 'ios' ? (
        <Modal
          visible={mode !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setMode(null)}
        >
          <View
            style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#00000066' }}
          >
            <View style={[ui.card, { backgroundColor: colors.white }]}>
              <Text style={ui.heading}>
                {mode === 'date' ? 'เลือกวันเดินทาง' : 'เลือกเวลาเดินทาง'}
              </Text>
              {picker}
              <Button
                title="ยืนยัน"
                onPress={() => {
                  onChange(formatTripInput(draft.toISOString()));
                  setMode(null);
                }}
              />
              <Button secondary title="ยกเลิก" onPress={() => setMode(null)} />
            </View>
          </View>
        </Modal>
      ) : (
        picker
      )}
    </View>
  );
}
