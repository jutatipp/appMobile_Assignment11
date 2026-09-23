import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useApp } from '../src/context/AppContext';
import { ApiError, getEvent, registerEvent } from '../src/services/api';
import { Button, EmptyState, Field, Loading } from '../src/components/ui';
import { FormScreen } from '../src/components/FormScreen';
import { Event } from '../src/types/event';
import { ui } from '../src/theme';
import { errorMessage, validEmail } from '../src/utils/format';

export default function RegisterScreen() {
  const params = useLocalSearchParams<{ eventId: string }>();
  const id = typeof params.eventId === 'string' ? params.eventId : '';
  const { session, ready, expireSession } = useAuth();
  const { events } = useApp();
  const [event, setEvent] = useState<Event | undefined>(events.find((item) => item.id === id));
  const [name, setName] = useState(session?.name || '');
  const [email, setEmail] = useState(session?.email || '');
  const [guests, setGuests] = useState('1');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    if (session) {
      setName(session.name);
      setEmail(session.email);
    }
  }, [session?.email]);
  useEffect(() => {
    const controller = new AbortController();
    getEvent(id, controller.signal)
      .then(setEvent)
      .catch((err) => {
        if (!controller.signal.aborted) setError(errorMessage(err));
      });
    return () => controller.abort();
  }, [id]);
  const errors = {
    name: name.trim().length < 2 ? 'กรอกชื่ออย่างน้อย 2 ตัวอักษร' : '',
    email: !validEmail(email) ? 'กรอกอีเมลให้ถูกต้อง' : '',
    guests: !/^[1-5]$/.test(guests) ? 'ระบุจำนวนผู้ร่วมกิจกรรม 1–5 คน' : '',
  };
  async function submit() {
    setSubmitted(true);
    if (Object.values(errors).some(Boolean) || !session || !event || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await registerEvent(session.token, id, name.trim(), email.trim(), Number(guests));
      setSuccess(true);
    } catch (err) {
      setError(errorMessage(err));
      if (err instanceof ApiError && err.status === 401) await expireSession();
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (!ready) return <Loading />;
  if (!session) return <Redirect href={{ pathname: '/login', params: { eventId: id } }} />;
  if (success)
    return (
      <View style={ui.page}>
        <EmptyState
          icon="checkmark-circle-outline"
          title="ลงทะเบียนเรียบร้อยแล้ว"
          description={`แล้วพบกันที่ ${event?.title}\nตั้งเตือนได้จากหน้ารายละเอียดกิจกรรม`}
          action={
            <Button
              title="กลับไปดูกิจกรรม"
              onPress={() => router.replace({ pathname: '/events/[id]', params: { id } })}
            />
          }
        />
      </View>
    );
  return (
    <FormScreen>
      <Text style={ui.title}>จองช่วงเวลาดี ๆ</Text>
      <Text style={ui.muted}>{event?.title || 'กำลังโหลดกิจกรรม…'}</Text>
      <View style={ui.card}>
        <Text style={ui.body}>กรอกข้อมูลผู้ร่วมกิจกรรมให้ครบถ้วน</Text>
        <Text style={ui.muted}>เป็นการลงทะเบียนจำลองสำหรับการเรียน ไม่มีการเรียกเก็บเงิน</Text>
      </View>
      <Field
        label="ชื่อผู้ร่วมกิจกรรม"
        value={name}
        onChangeText={setName}
        maxLength={80}
        error={submitted ? errors.name : ''}
        autoComplete="name"
      />
      <Field
        label="อีเมลติดต่อ"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        error={submitted ? errors.email : ''}
      />
      <Field
        label="จำนวนผู้ร่วมกิจกรรม (1–5 คน)"
        value={guests}
        onChangeText={setGuests}
        keyboardType="number-pad"
        maxLength={1}
        error={submitted ? errors.guests : ''}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" style={ui.error}>
          {error}
        </Text>
      ) : null}
      <Button
        title="ยืนยันการลงทะเบียน"
        loading={busy}
        disabled={!event}
        onPress={() => void submit()}
      />
      <Text style={ui.muted}>
        ข้อมูลจะส่งไปยัง API จำลองของโปรเจกต์ และไม่ถูกเผยแพร่ในหน้ารายการกิจกรรม
      </Text>
    </FormScreen>
  );
}
