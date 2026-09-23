import { useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useApp } from '../src/context/AppContext';
import { createEvent, ApiError } from '../src/services/api';
import { choosePhoto, currentLocation } from '../src/services/device';
import { Button, Field, Loading } from '../src/components/ui';
import { EventImage } from '../src/components/EventImage';
import { VenueMap } from '../src/components/VenueMap';
import { CameraCapture } from '../src/components/CameraCapture';
import { FormScreen } from '../src/components/FormScreen';
import { ui } from '../src/theme';
import { errorMessage } from '../src/utils/format';
import { parseEventDate } from '../src/utils/validation';

export default function CreateScreen() {
  const { session, ready, expireSession } = useAuth();
  const { addEvent } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [district, setDistrict] = useState('อำเภอเมืองหนองคาย');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [capacity, setCapacity] = useState('20');
  const [photo, setPhoto] = useState<{ uri: string; upload: string } | null>(null);
  const [coordinate, setCoordinate] = useState({ latitude: 17.886255, longitude: 102.746608 });
  const [locating, setLocating] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const startsAt = parseEventDate(date, time);
  const validDate = startsAt !== null && startsAt.getTime() > Date.now();
  const errors = {
    title: title.trim().length < 4 ? 'กรอกชื่ออย่างน้อย 4 ตัวอักษร' : '',
    description: description.trim().length < 20 ? 'อธิบายกิจกรรมอย่างน้อย 20 ตัวอักษร' : '',
    district: !district.trim() ? 'กรอกสถานที่หรืออำเภอ' : '',
    date: !validDate ? 'ระบุวันเวลาในอนาคต เช่น 2026-12-25 และ 09:00 (เวลาไทย)' : '',
    capacity:
      !/^\d+$/.test(capacity) || Number(capacity) < 1 || Number(capacity) > 100
        ? 'ระบุจำนวน 1–100 คน'
        : '',
  };
  async function pick() {
    setPhotoBusy(true);
    try {
      const image = await choosePhoto();
      if (image) setPhoto(image);
    } catch (err) {
      Alert.alert('เลือกรูปไม่สำเร็จ', errorMessage(err));
    } finally {
      setPhotoBusy(false);
    }
  }
  function photoActions() {
    Alert.alert('เพิ่มรูปกิจกรรม', 'ใช้รูปเพื่อแนะนำบรรยากาศให้ผู้ร่วมกิจกรรม', [
      {
        text: 'ถ่ายรูป',
        onPress: () => {
          setCameraOpen(true);
        },
      },
      {
        text: 'เลือกจากคลัง',
        onPress: () => {
          void pick();
        },
      },
      { text: 'ยกเลิก', style: 'cancel' },
    ]);
  }
  async function locate() {
    setLocating(true);
    try {
      const point = await currentLocation();
      if (point) setCoordinate(point);
    } catch (err) {
      Alert.alert('ใช้ตำแหน่งไม่ได้', `${errorMessage(err)} คุณยังแตะแผนที่เพื่อเลือกจุดนัดพบได้`);
    } finally {
      setLocating(false);
    }
  }
  async function submit() {
    setSubmitted(true);
    if (Object.values(errors).some(Boolean) || !session || !startsAt || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const event = await createEvent(session.token, {
        title: title.trim(),
        description: description.trim(),
        district: district.trim(),
        category: 'กิจกรรมชุมชน',
        startsAt: startsAt.toISOString(),
        capacity: Number(capacity),
        imageUrl: photo?.upload || '',
        ...coordinate,
      });
      await addEvent(event);
      router.replace({ pathname: '/events/[id]', params: { id: event.id } });
    } catch (err) {
      setError(errorMessage(err));
      if (err instanceof ApiError && err.status === 401) await expireSession();
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (!ready) return <Loading />;
  if (!session) return <Redirect href={{ pathname: '/login', params: { next: 'create' } }} />;
  return (
    <FormScreen>
      {cameraOpen && (
        <CameraCapture
          onClose={() => setCameraOpen(false)}
          onCapture={(image) => {
            setPhoto(image);
            setCameraOpen(false);
          }}
        />
      )}
      <Text style={ui.title}>แบ่งปันจุดหมายใหม่</Text>
      <Text style={ui.muted}>ชวนคนอื่นมาสัมผัสหนองคายในมุมของคุณ</Text>
      <View style={ui.card}>
        <Text style={ui.label}>ภาพบรรยากาศ (ไม่บังคับ)</Text>
        {photo && <EventImage uri={photo.uri} style={{ height: 180, borderRadius: 16 }} />}
        <Button
          secondary
          icon="camera-outline"
          title={photo ? 'เปลี่ยนรูป / ถ่ายใหม่' : 'เพิ่มภาพกิจกรรม'}
          loading={photoBusy}
          onPress={photoActions}
        />
        {photo && <Button secondary title="นำรูปออก" onPress={() => setPhoto(null)} />}
        <Text style={ui.muted}>JPEG หรือ PNG ไม่เกิน 3 MB · อัปโหลดเมื่อกดสร้างกิจกรรม</Text>
      </View>
      <Field
        label="ชื่อกิจกรรม"
        placeholder="เช่น เดินเล่นยามเย็นริมโขง"
        value={title}
        onChangeText={setTitle}
        maxLength={100}
        error={submitted ? errors.title : ''}
      />
      <Field
        label="เรื่องราวของกิจกรรม"
        multiline
        placeholder="เราจะทำอะไรบ้าง และต้องเตรียมตัวอย่างไร"
        value={description}
        onChangeText={setDescription}
        maxLength={2000}
        error={submitted ? errors.description : ''}
      />
      <Field
        label="อำเภอ / สถานที่"
        value={district}
        onChangeText={setDistrict}
        maxLength={100}
        error={submitted ? errors.district : ''}
      />
      <Field
        label="วันที่ (ค.ศ. YYYY-MM-DD)"
        placeholder="2026-12-25"
        value={date}
        onChangeText={setDate}
        maxLength={10}
        keyboardType="numbers-and-punctuation"
        error={submitted ? errors.date : ''}
      />
      <Field
        label="เวลาเริ่ม (HH:MM · เวลาไทย)"
        value={time}
        onChangeText={setTime}
        maxLength={5}
        keyboardType="numbers-and-punctuation"
      />
      <Field
        label="จำนวนผู้ร่วมกิจกรรมสูงสุด"
        value={capacity}
        onChangeText={setCapacity}
        keyboardType="number-pad"
        maxLength={3}
        error={submitted ? errors.capacity : ''}
      />
      <Text style={ui.heading}>เลือกจุดนัดพบ</Text>
      <Text style={ui.muted}>
        แตะแผนที่หรือลากหมุดเพื่อเลือกตำแหน่ง ไม่จำเป็นต้องใช้ตำแหน่งปัจจุบัน
      </Text>
      <View style={{ borderRadius: 20, overflow: 'hidden' }}>
        <VenueMap coordinate={coordinate} title="จุดนัดพบ" onSelect={setCoordinate} />
      </View>
      <Text style={ui.muted}>
        {coordinate.latitude.toFixed(5)}, {coordinate.longitude.toFixed(5)}
      </Text>
      <Button
        secondary
        title="ใช้ตำแหน่งปัจจุบัน"
        icon="locate-outline"
        loading={locating}
        onPress={() => void locate()}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" style={ui.error}>
          {error}
        </Text>
      ) : null}
      <Button
        title="สร้างกิจกรรม"
        loading={busy}
        disabled={photoBusy}
        onPress={() => void submit()}
      />
      <Text style={ui.muted}>
        รูปและพิกัดจุดนัดพบที่เลือกจะแสดงให้ผู้ใช้แอปคนอื่นเห็น โปรดเลือกพื้นที่สาธารณะ
      </Text>
    </FormScreen>
  );
}
