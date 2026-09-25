// ปรับจาก jutatipp/Photo_camera-_expo: CameraScreen และ PhotoEditorScreen
import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking, Modal, Pressable, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useImage, ImageFormat, drawAsImage, Image, ColorMatrix } from '@shopify/react-native-skia';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { CameraScreen } from './camera/CameraScreen';
import { PhotoEditorScreen } from './camera/PhotoEditorScreen';
import { CameraPermissionLoading, CameraPermissionScreen } from './camera/CameraPermissionScreen';
import { FilterKey, presetFor } from './camera/filterPresets';
import { errorMessage } from '../utils/format';
import { colors } from '../theme';

export function TripCamera({
  initialUri,
  onSave,
  onClose,
}: {
  initialUri?: string;
  onSave: (imageUrl: string) => Promise<void>;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [uri, setUri] = useState<string | null>(initialUri || null);
  const [filter, setFilter] = useState<FilterKey>('normal');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState(0);
  const [active, setActive] = useState(true);
  const lock = useRef(false);
  const image = useImage(uri, () =>
    Alert.alert('เปิดภาพไม่สำเร็จ', 'กรุณากลับไปถ่ายใหม่หรือเลือกรูปอื่น'),
  );
  useEffect(() => {
    const listener = AppState.addEventListener('change', (state) => {
      setActive(state === 'active');
      if (state === 'active') {
        setReady(false);
        setSession((value) => value + 1);
        void getPermission().catch(() => {});
      }
    });
    return () => listener.remove();
  }, [getPermission]);
  async function capture() {
    if (!ready || lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const photo = await camera.current?.takePictureAsync({ quality: 0.8, exif: false });
      if (!photo?.uri) throw new Error('กล้องยังไม่พร้อม');
      setFilter('normal');
      setUri(photo.uri);
    } catch (err) {
      Alert.alert('ถ่ายรูปไม่สำเร็จ', errorMessage(err));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function save() {
    if (!image || lock.current) return;
    lock.current = true;
    setBusy(true);
    let output;
    try {
      const scale = Math.min(1, 1600 / Math.max(image.width(), image.height()));
      const width = Math.round(image.width() * scale),
        height = Math.round(image.height() * scale);
      output = await drawAsImage(
        <Image image={image} x={0} y={0} width={width} height={height} fit="contain">
          <ColorMatrix matrix={presetFor(filter).matrix} />
        </Image>,
        { width, height },
      );
      if (!output) throw new Error('เตรียมภาพไม่สำเร็จ กรุณาลองอีกครั้ง');
      const base64 = output.encodeToBase64(ImageFormat.JPEG, 80);
      if (base64.length > 4 * 1024 * 1024)
        throw new Error('รูปใหญ่เกิน 3 MB กรุณาเลือกรูปที่เล็กลง');
      await onSave(`data:image/jpeg;base64,${base64}`);
      onClose();
    } catch (err) {
      Alert.alert('ยังบันทึกไม่ได้', errorMessage(err));
    } finally {
      output?.dispose();
      lock.current = false;
      setBusy(false);
    }
  }
  function discard() {
    Alert.alert('ทิ้งภาพที่ยังไม่ได้บันทึก?', 'ภาพเดิมในทริปจะไม่ถูกลบ', [
      { text: 'กลับไปดูภาพ', style: 'cancel' },
      {
        text: 'ทิ้งภาพ',
        style: 'destructive',
        onPress: () => {
          setUri(null);
          setReady(false);
          if (initialUri) onClose();
        },
      },
    ]);
  }
  return (
    <Modal
      animationType="slide"
      onRequestClose={() => {
        if (!busy) uri ? discard() : onClose();
      }}
    >
      <StatusBar style="light" />
      {uri ? (
        <PhotoEditorScreen
          image={image}
          preset={presetFor(filter)}
          selectedFilter={filter}
          saving={busy}
          insets={insets}
          onFilterChange={setFilter}
          onSave={() => void save()}
          onDiscard={discard}
          onDelete={discard}
        />
      ) : (
        <View style={{ flex: 1, backgroundColor: colors.dark }}>
          {!permission ? (
            <CameraPermissionLoading />
          ) : !permission.granted ? (
            <CameraPermissionScreen
              canAskAgain={permission.canAskAgain}
              requesting={busy}
              insets={insets}
              onRequest={() => {
                if (busy) return;
                setBusy(true);
                void (permission.canAskAgain ? requestPermission() : Linking.openSettings())
                  .catch((err) => Alert.alert('ขอสิทธิ์ไม่สำเร็จ', errorMessage(err)))
                  .finally(() => setBusy(false));
              }}
            />
          ) : active ? (
            <CameraScreen
              cameraRef={camera}
              session={session}
              facing={facing}
              ready={ready}
              taking={busy}
              error={error}
              insets={insets}
              onReady={() => {
                setReady(true);
                setError(null);
              }}
              onError={(message) => {
                setReady(false);
                setError(message);
              }}
              onFlip={() => {
                setReady(false);
                setFacing((value) => (value === 'back' ? 'front' : 'back'));
                setSession((value) => value + 1);
              }}
              onCapture={() => void capture()}
              onRetry={() => {
                setError(null);
                setReady(false);
                setSession((value) => value + 1);
              }}
            />
          ) : null}
          <Pressable
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="ปิดกล้อง"
            onPress={onClose}
            style={{
              position: 'absolute',
              left: 20,
              bottom: insets.bottom + 24,
              padding: 12,
              borderRadius: 24,
              backgroundColor: '#20251ECC',
            }}
          >
            <Ionicons name="close" size={24} color="white" />
            <Text style={{ color: 'white', fontSize: 11 }}>กลับทริป</Text>
          </Pressable>
        </View>
      )}
    </Modal>
  );
}
