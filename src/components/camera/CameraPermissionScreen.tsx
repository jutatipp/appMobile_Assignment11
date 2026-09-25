import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EdgeInsets } from 'react-native-safe-area-context';
import { palette, radius, space } from './design';

type Props = {
  canAskAgain: boolean;
  requesting: boolean;
  insets: EdgeInsets;
  onRequest: () => void;
};

export function CameraPermissionScreen({ canAskAgain, requesting, insets, onRequest }: Props) {
  const label = canAskAgain ? 'เปิดใช้งานกล้อง' : 'เปิดการตั้งค่า';
  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: insets.top + space.xl,
          paddingBottom: insets.bottom + space.xl,
        },
      ]}
    >
      <View style={styles.icon}>
        <Ionicons name="camera-outline" size={36} color={palette.cyan} />
      </View>
      <Text style={styles.brand}>NONG KHAI TRIP</Text>
      <Text style={styles.title}>ภาพความทรงจำของทริป</Text>
      <Text style={styles.tagline}>เก็บทุกบรรยากาศของธรรมชาติ</Text>
      <Text style={styles.body}>
        อนุญาตการใช้กล้องเพื่อถ่ายภาพทริป คุณเลือกโทนและดูตัวอย่างก่อนบันทึกได้
        รูปที่บันทึกจะอยู่ในทริปของคุณและส่งไปยัง API เมื่อเชื่อมต่อได้
      </Text>
      <Pressable
        onPress={onRequest}
        disabled={requesting}
        accessibilityLabel={label}
        style={({ pressed }) => [styles.button, (pressed || requesting) && styles.pressed]}
      >
        {requesting ? (
          <ActivityIndicator color={palette.ink} />
        ) : (
          <Text style={styles.buttonText}>{label}</Text>
        )}
      </Pressable>
      {!canAskAgain && (
        <Text style={styles.hint}>เปิด Camera ใน Settings แล้วกลับมาที่แอปอีกครั้ง</Text>
      )}
    </View>
  );
}

export function CameraPermissionLoading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={palette.cyan} />
      <Text style={styles.hint}>กำลังตรวจสอบกล้อง…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.ink,
    justifyContent: 'center',
    padding: space.xl,
  },
  loading: {
    flex: 1,
    backgroundColor: palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: palette.cyanDark,
    borderWidth: 1,
    borderColor: palette.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xl,
  },
  brand: {
    color: palette.cyan,
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: '900',
  },
  title: {
    color: palette.white,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '900',
    marginTop: space.sm,
  },
  tagline: {
    color: palette.cyan,
    fontSize: 16,
    fontWeight: '700',
    marginTop: space.sm,
  },
  body: {
    color: palette.muted,
    fontSize: 16,
    lineHeight: 25,
    marginTop: space.md,
    marginBottom: space.xl,
  },
  button: {
    height: 56,
    borderRadius: radius.md,
    backgroundColor: palette.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: palette.ink, fontSize: 16, fontWeight: '900' },
  hint: {
    color: palette.muted,
    fontSize: 13,
    marginTop: space.md,
    textAlign: 'center',
  },
  pressed: { opacity: 0.58 },
});
