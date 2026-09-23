import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../src/context/AppContext';
import { AuthProvider } from '../src/context/AuthContext';
import { NotificationObserver } from '../src/components/NotificationObserver';
import { colors } from '../src/theme';

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
