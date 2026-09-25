import { useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { Button } from '../src/components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, ui } from '../src/theme';
import { errorMessage, validEmail } from '../src/utils/format';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { next, placeId, tripId, day } = useLocalSearchParams<{
    next?: string;
    placeId?: string;
    tripId?: string;
    day?: string;
  }>();
  const [email, setEmail] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
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
      await signIn(email, password, remember);
      setPassword('');
      if (next === 'add-trip' && typeof placeId === 'string')
        router.replace({
          pathname: '/trips/add',
          params: { placeId, ...(tripId ? { tripId } : {}), ...(day ? { day } : {}) },
        });
      else if (next === 'trip' && typeof tripId === 'string')
        router.replace({ pathname: '/trips/[id]', params: { id: tripId } });
      else if (next === 'new-trip')
        router.replace({
          pathname: '/trips/edit',
          params: typeof placeId === 'string' ? { placeId } : {},
        });
      else if (next === 'trips') router.replace('/(tabs)/trips');
      else if (next === 'create') router.replace('/create');
      else router.replace('/(tabs)/profile');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="กลับ"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))}
            style={{ padding: 10, alignSelf: 'flex-start' }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </Pressable>
          <View style={styles.intro}>
            <Image
              source={require('../assets/brand-icon.png')}
              style={{ width: 94, height: 94, borderRadius: 30 }}
            />
            <Text style={styles.title}>Sign In</Text>
            <Text style={styles.subtitle}>Sign in to my account</Text>
          </View>
          <View style={{ gap: 20 }}>
            <View>
              <Text style={styles.label}>Email</Text>
              <View style={styles.field}>
                <Ionicons name="mail-outline" size={21} color="#8B969C" />
                <TextInput
                  accessibilityLabel="อีเมล"
                  style={styles.input}
                  placeholder="My Email"
                  placeholderTextColor="#8795A9"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  editable={!busy}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
              {submitted && !validEmail(email) && <Text style={ui.error}>กรอกอีเมลให้ถูกต้อง</Text>}
            </View>
            <View>
              <Text style={styles.label}>Password</Text>
              <View style={styles.field}>
                <Ionicons name="lock-closed-outline" size={21} color="#8B969C" />
                <TextInput
                  ref={passwordRef}
                  accessibilityLabel="รหัสผ่าน"
                  style={styles.input}
                  placeholder="My Password"
                  placeholderTextColor="#8795A9"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  editable={!busy}
                  returnKeyType="done"
                  onSubmitEditing={() => void submit()}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ padding: 12 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={21}
                    color="#7F8985"
                  />
                </Pressable>
              </View>
              {submitted && password.length < 6 && (
                <Text style={ui.error}>กรอกรหัสผ่านอย่างน้อย 6 ตัวอักษร</Text>
              )}
              <View style={[ui.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: remember }}
                  onPress={() => setRemember(!remember)}
                  style={[ui.row, { minHeight: 44 }]}
                >
                  <Ionicons
                    name={remember ? 'checkbox-outline' : 'square-outline'}
                    size={18}
                    color="#778075"
                  />
                  <Text style={styles.small}>Remember Me</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    Alert.alert(
                      'บัญชีสำหรับเข้าใช้งาน',
                      'อีเมล jutatip@gmail.com\nรหัสผ่าน 123456\nหากผู้ดูแลเปลี่ยนรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบ',
                    )
                  }
                  style={{ paddingVertical: 12 }}
                >
                  <Text style={[styles.small, { color: '#8795A9' }]}>Forgot Password</Text>
                </Pressable>
              </View>
            </View>
            {error ? (
              <Text accessibilityLiveRegion="polite" style={ui.error}>
                {error}
              </Text>
            ) : null}
            <Button
              title="เข้าสู่ระบบ"
              icon="log-in-outline"
              loading={busy}
              onPress={() => void submit()}
            />
            <View style={ui.row}>
              <View style={styles.line} />
              <Text style={styles.subtitle}>OR</Text>
              <View style={styles.line} />
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/(tabs)/explore')}
              style={{ padding: 12 }}
            >
              <Text style={[styles.small, { textAlign: 'center' }]}>
                สำรวจสถานที่ก่อนเข้าสู่ระบบ
              </Text>
            </Pressable>
          </View>
          <View style={styles.footer}>
            <Text style={[styles.subtitle, { textAlign: 'center' }]}>
              ใช้บัญชี jutatip@gmail.com · รหัสผ่าน 123456
            </Text>
            <Text style={[styles.subtitle, { textAlign: 'center' }]}>
              บัญชีสาธิตสำหรับ Nong Khai Trip
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: 32, maxWidth: 460, width: '100%', alignSelf: 'center' },
  intro: { alignItems: 'center', gap: 8, paddingTop: 22, paddingBottom: 34 },
  title: { fontSize: 25, fontWeight: '700', color: '#082B4C', marginTop: 18 },
  subtitle: { fontSize: 12, color: '#8190A5', lineHeight: 20 },
  label: { fontSize: 12, color: '#8190A5', marginBottom: 7 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#ADB9CB',
    minHeight: 49,
    gap: 10,
  },
  input: { flex: 1, minWidth: 0, paddingVertical: 12, fontSize: 14, color: '#082B4C' },
  small: { fontSize: 12, color: '#082B4C' },
  line: { flex: 1, height: 1, backgroundColor: '#E1E4E8' },
  footer: { flex: 1, justifyContent: 'flex-end', paddingTop: 50, paddingBottom: 14, gap: 6 },
});
