import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { File, Paths } from 'expo-file-system';

export async function selectMemoryPhoto() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
  });
  return result.canceled ? null : result.assets[0].uri;
}
export async function saveMemoryToGallery(imageUrl: string) {
  const permission = await MediaLibrary.requestPermissionsAsync(true);
  if (!permission.granted) throw new Error('กรุณาอนุญาตการเพิ่มรูปลงคลังภาพในการตั้งค่าเครื่อง');
  const base64 = imageUrl.split(',')[1];
  if (!base64) throw new Error('ไม่พบข้อมูลรูป');
  const file = new File(Paths.cache, `trip-memory-${Date.now()}.jpg`);
  try {
    file.create();
    file.write(base64, { encoding: 'base64' });
    await MediaLibrary.saveToLibraryAsync(file.uri);
  } finally {
    if (file.exists) file.delete();
  }
}
