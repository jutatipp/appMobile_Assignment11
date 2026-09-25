import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking, Modal, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from './ui';
import { colors, ui } from '../theme';
import { errorMessage } from '../utils/format';

type Photo = { uri: string; upload: string };
export function CameraCapture({
  onCapture,
  onClose,
}: {
  onCapture: (photo: Photo) => void;
  onClose: () => void;
}) {
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const lock = useRef(false);
  useEffect(() => {
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') void getPermission().catch(() => {});
    });
    return () => listener.remove();
  }, [getPermission]);
  async function capture() {
    if (!ready || lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const photo = await camera.current?.takePictureAsync({ quality: 0.6, base64: true });
      if (!photo?.base64) throw new Error('กล้องยังไม่พร้อม กรุณาลองอีกครั้ง');
      if (photo.base64.length > 4 * 1024 * 1024)
        throw new Error('ภาพมีขนาดเกิน 3 MB กรุณาเลือกภาพขนาดเล็กจากคลังแทน');
      onCapture({ uri: photo.uri, upload: `data:image/jpeg;base64,${photo.base64}` });
    } catch (err) {
      Alert.alert('ถ่ายรูปไม่สำเร็จ', errorMessage(err));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[ui.page, { backgroundColor: colors.dark }]}>
        <View style={{ padding: 18, gap: 12 }}>
          <Text style={[ui.heading, { color: 'white' }]}>เก็บภาพบรรยากาศ</Text>
          <Text style={{ color: '#DCE8C8' }}>
            ถ่ายภาพเพื่อใช้แนะนำสถานที่ คุณดูตัวอย่างก่อนบันทึกได้
          </Text>
        </View>
        {permission?.granted ? (
          <CameraView
            key={facing}
            ref={camera}
            style={{ flex: 1 }}
            facing={facing}
            onCameraReady={() => setReady(true)}
            onMountError={() => {
              setReady(false);
              Alert.alert('เปิดกล้องไม่ได้', 'ใช้มือถือจริงหรือลองเลือกจากคลังภาพแทน');
            }}
          />
        ) : (
          <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 18 }}>
            <Text style={{ color: 'white', fontSize: 16 }}>
              อนุญาตการใช้กล้องเพื่อถ่ายภาพสถานที่ หรือกลับไปเลือกภาพจากคลังได้
            </Text>
            <Button
              title={permission?.canAskAgain === false ? 'เปิด Settings' : 'อนุญาตใช้กล้อง'}
              onPress={() => {
                if (permission?.canAskAgain === false) void Linking.openSettings();
                else
                  void requestPermission().catch((err) =>
                    Alert.alert('ขอสิทธิ์ไม่สำเร็จ', errorMessage(err)),
                  );
              }}
            />
          </View>
        )}
        <View style={{ padding: 20, gap: 10 }}>
          {permission?.granted && (
            <>
              <Button
                title="ถ่ายรูป"
                icon="camera-outline"
                disabled={!ready}
                loading={busy}
                onPress={() => void capture()}
              />
              <Button
                secondary
                title="สลับกล้อง"
                disabled={busy}
                onPress={() => {
                  setReady(false);
                  setFacing((value) => (value === 'back' ? 'front' : 'back'));
                }}
              />
            </>
          )}
          <Button secondary title="ยกเลิกและกลับฟอร์ม" disabled={busy} onPress={onClose} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
