import { Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

function denied(canAskAgain: boolean, name: string) {
  Alert.alert(
    `ยังไม่ได้รับสิทธิ์${name}`,
    canAskAgain
      ? 'คุณยังใช้งานส่วนอื่นต่อได้ และลองใหม่เมื่อพร้อม'
      : 'เปิดสิทธิ์ใน Settings ของเครื่อง แล้วกลับมาลองอีกครั้ง',
    [
      { text: 'ไว้ก่อน', style: 'cancel' },
      ...(!canAskAgain
        ? [
            {
              text: 'เปิด Settings',
              onPress: () => {
                void Linking.openSettings();
              },
            },
          ]
        : []),
    ],
  );
}
export async function choosePhoto() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    denied(permission.canAskAgain, 'คลังภาพ');
    return null;
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.65,
    base64: true,
  };
  const result = await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (
    (asset.fileSize || 0) > 3 * 1024 * 1024 ||
    !asset.base64 ||
    asset.base64.length > 4 * 1024 * 1024
  )
    throw new Error('กรุณาเลือกรูปขนาดไม่เกิน 3 MB');
  // API จำลองรับภาพจริงเป็น data URL; URI ชั่วคราวใช้ preview ในเครื่องเท่านั้น
  const mimeType = asset.base64.startsWith('/9j/')
    ? 'image/jpeg'
    : asset.base64.startsWith('iVBORw0KGgo')
      ? 'image/png'
      : null;
  if (!mimeType) throw new Error('รองรับเฉพาะรูป JPEG หรือ PNG');
  return {
    uri: asset.uri,
    upload: `data:${mimeType};base64,${asset.base64}`,
  };
}
export async function currentLocation() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) {
    denied(permission.canAskAgain, 'ตำแหน่ง');
    return null;
  }
  const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { latitude: location.coords.latitude, longitude: location.coords.longitude };
}
