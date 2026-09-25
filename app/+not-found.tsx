import { router } from 'expo-router';
import { View } from 'react-native';
import { Button, EmptyState } from '../src/components/ui';
import { ui } from '../src/theme';
export default function NotFound() {
  return (
    <View style={ui.page}>
      <EmptyState
        title="ไม่พบหน้าที่คุณกำลังหา"
        description="ลิงก์อาจไม่ถูกต้อง กลับไปเลือกสถานที่ใหม่ได้เลย"
        action={<Button title="กลับหน้าสำรวจ" onPress={() => router.replace('/(tabs)/explore')} />}
      />
    </View>
  );
}
