import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../src/context/AppContext';
import { AuthProvider } from '../src/context/AuthContext';
import { NotificationObserver } from '../src/components/NotificationObserver';
import { colors } from '../src/theme';

export function SuspenseFallback() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        padding: 28,
        gap: 16,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ textAlign: 'center', color: colors.text }}>กำลังเปิด Nong Khai Explore…</Text>
    </View>
  );
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        padding: 28,
        gap: 16,
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>
        เปิดหน้านี้ไม่สำเร็จ
      </Text>
      <Text selectable style={{ color: colors.danger }}>
        {error.message}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => void retry()}
        style={{ padding: 16, borderRadius: 14, backgroundColor: colors.primary }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>ลองอีกครั้ง</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.primary,
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.background },
              headerBackTitle: 'กลับ',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="events/[id]" options={{ title: 'รายละเอียดกิจกรรม' }} />
            <Stack.Screen name="login" options={{ title: 'เข้าสู่ระบบ' }} />
            <Stack.Screen name="register" options={{ title: 'ลงทะเบียนกิจกรรม' }} />
            <Stack.Screen name="create" options={{ title: 'สร้างกิจกรรมใหม่' }} />
            <Stack.Screen name="+not-found" options={{ title: 'ไม่พบหน้านี้' }} />
          </Stack>
          <NotificationObserver />
        </AppProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
