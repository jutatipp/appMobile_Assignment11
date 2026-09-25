import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView } from 'expo-camera';
import { EdgeInsets } from 'react-native-safe-area-context';
import { icon, palette, radius, space } from './design';

type Props = {
  cameraRef: React.RefObject<CameraView | null>;
  session: number;
  facing: CameraType;
  ready: boolean;
  taking: boolean;
  error: string | null;
  insets: EdgeInsets;
  onReady: () => void;
  onError: (message: string) => void;
  onFlip: () => void;
  onCapture: () => void;
  onRetry: () => void;
};

export function CameraScreen(props: Props) {
  const {
    cameraRef,
    session,
    facing,
    ready,
    taking,
    error,
    insets,
    onReady,
    onError,
    onFlip,
    onCapture,
    onRetry,
  } = props;
  const disabled = taking || !ready;
  return (
    <View style={styles.screen}>
      <CameraView
        key={session}
        ref={cameraRef}
        facing={facing}
        onCameraReady={onReady}
        onMountError={({ message }) => onError(message)}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.top, { paddingTop: insets.top + space.sm }]}>
        <View>
          <Text style={styles.brand}>NONG KHAI TRIP</Text>
          <Text style={styles.subtitle}>เก็บทุกบรรยากาศของธรรมชาติ</Text>
        </View>
        <Pressable
          onPress={onFlip}
          disabled={taking}
          style={({ pressed }) => [styles.flip, (pressed || taking) && styles.pressed]}
          accessibilityLabel="สลับกล้องหน้าและหลัง"
        >
          <Ionicons name="camera-reverse-outline" size={icon.lg} color={palette.white} />
        </Pressable>
      </View>
      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.lg }]}>
        <Text style={styles.tip}>ฟิลเตอร์จะเลือกได้หลังถ่ายภาพ</Text>
        <Pressable
          onPress={onCapture}
          disabled={disabled}
          style={({ pressed }) => [styles.shutter, (pressed || disabled) && styles.pressed]}
          accessibilityLabel="ถ่ายรูป"
        >
          {disabled ? (
            <ActivityIndicator color={palette.white} />
          ) : (
            <View style={styles.shutterCore} />
          )}
        </Pressable>
        <Text style={styles.mode}>ภาพถ่าย</Text>
      </View>
      {error && <CameraError message={error} taking={taking} onRetry={onRetry} />}
    </View>
  );
}

function CameraError({
  message,
  taking,
  onRetry,
}: {
  message: string;
  taking: boolean;
  onRetry: () => void;
}) {
  return (
    <View style={styles.error} accessibilityRole="alert">
      <Text style={styles.errorTitle}>เปิดกล้องไม่สำเร็จ</Text>
      <Text style={styles.errorBody}>{message}</Text>
      <Pressable
        onPress={onRetry}
        disabled={taking}
        style={({ pressed }) => [styles.retry, (pressed || taking) && styles.pressed]}
        accessibilityLabel="ลองเปิดกล้องอีกครั้ง"
      >
        <Text style={styles.retryText}>ลองใหม่</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.ink },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(5,12,22,.50)',
  },
  brand: {
    color: palette.white,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
  },
  subtitle: { color: 'rgba(255,255,255,.7)', fontSize: 12, marginTop: 3 },
  flip: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(8,17,31,.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingTop: space.md,
    backgroundColor: 'rgba(5,12,22,.64)',
  },
  tip: { color: 'rgba(255,255,255,.74)', fontSize: 12, marginBottom: space.md },
  shutter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 5,
    borderColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterCore: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: palette.cyan,
  },
  mode: {
    color: palette.cyan,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '900',
    marginTop: 12,
  },
  error: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    top: '34%',
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(7,17,31,.96)',
    borderWidth: 1,
    borderColor: palette.danger,
  },
  errorTitle: {
    color: palette.white,
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
  },
  errorBody: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: space.sm,
    textAlign: 'center',
  },
  retry: {
    minHeight: 48,
    marginTop: space.md,
    borderRadius: radius.md,
    backgroundColor: palette.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: { color: palette.ink, fontSize: 15, fontWeight: '900' },
  pressed: { opacity: 0.58 },
});
