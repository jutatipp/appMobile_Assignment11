import { useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { Button, Field } from '../src/components/ui';
import { FormScreen } from '../src/components/FormScreen';
import { colors, ui } from '../src/theme';
import { errorMessage, validEmail } from '../src/utils/format';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { eventId, next } = useLocalSearchParams<{ eventId?: string; next?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const passwordRef = useRef<TextInput>(null);
  async function submit() {
    setSubmitted(true);
    setError('');
    if (!validEmail(email) || password.length < 6 || lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await signIn(email, password);
      setPassword('');
      if (next === 'create') router.replace('/create');
      else if (typeof eventId === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(eventId))
        router.replace({ pathname: '/register', params: { eventId } });
      else router.replace('/(tabs)/profile');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <FormScreen>
      <View
        style={{
          alignSelf: 'flex-start',
          backgroundColor: colors.accent,
          padding: 20,
          borderRadius: 26,
        }}
      >
        <Ionicons name="leaf-outline" size={35} color={colors.primary} />
      </View>
      <Text style={ui.title}>เริ่มต้นการเดินทาง{'\n'}ในแบบของคุณ</Text>
      <Text style={ui.muted}>เข้าสู่ระบบเพื่อลงทะเบียนกิจกรรมและแบ่งปันจุดหมายใหม่ ๆ</Text>
      <Field
        label="อีเมล"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={submitted && !validEmail(email) ? 'กรอกอีเมลให้ถูกต้อง' : ''}
      />
      <View>
        <Text style={ui.label}>รหัสผ่าน</Text>
        <TextInput
          ref={passwordRef}
          accessibilityLabel="รหัสผ่าน"
          style={ui.input}
          placeholder="อย่างน้อย 6 ตัวอักษร"
          placeholderTextColor={colors.muted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          returnKeyType="done"
          onSubmitEditing={() => void submit()}
        />
        {submitted && password.length < 6 && (
          <Text style={ui.error}>กรอกรหัสผ่านอย่างน้อย 6 ตัวอักษร</Text>
        )}
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={ui.error}>
          {error}
        </Text>
      ) : null}
      <Button title="เข้าสู่ระบบ" loading={busy} onPress={() => void submit()} />
      <Button
        secondary
        title="สำรวจกิจกรรมก่อน"
        onPress={() => router.replace('/(tabs)/explore')}
      />
      <Text style={ui.muted}>
        สำหรับการสาธิต: ใช้บัญชีที่แสดงใน Terminal หลังเปิด API ด้วย npm run server
      </Text>
    </FormScreen>
  );
}
