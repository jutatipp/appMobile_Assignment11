import { Alert, Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useApp } from '../../src/context/AppContext';
import { Button, Loading } from '../../src/components/ui';
import { colors, ui } from '../../src/theme';
import { errorMessage } from '../../src/utils/format';

const student = { course: 'React Native & Expo', interests: 'ท่องเที่ยว · ชุมชน · ธรรมชาติ' };
export default function ProfileScreen() {
  const { session, ready, signOut, expireSession } = useAuth();
  const { favorites, events, resetCache } = useApp();
  if (!ready) return <Loading />;
  async function logout() {
    try {
      await signOut();
    } catch (err) {
      Alert.alert('ออกจากระบบไม่สำเร็จ', errorMessage(err));
    }
  }
  return (
    <SafeAreaView edges={['top']} style={ui.page}>
      <ScrollView contentContainerStyle={ui.content}>
        <Text style={{ color: colors.primary, fontSize: 11, letterSpacing: 2, fontWeight: '800' }}>
          YOUR LITTLE ESCAPE
        </Text>
        <Text style={ui.title}>พื้นที่ของคุณ</Text>
        <View style={[ui.card, { alignItems: 'center', paddingVertical: 30 }]}>
          <Image
            source={require('../../assets/brand-icon.png')}
            accessibilityLabel="ภาพโปรไฟล์นักเดินทาง"
            style={{ width: 78, height: 78, borderRadius: 26 }}
          />
          <Text style={ui.heading}>{session?.name || 'สวัสดี นักเดินทาง'}</Text>
          <Text style={ui.muted}>{session?.email || 'เข้าสู่ระบบเพื่อร่วมกิจกรรมที่คุณสนใจ'}</Text>
          <Text style={ui.badge}>{student.interests}</Text>
        </View>
        <View style={ui.row}>
          <View style={[ui.card, { flex: 1 }]}>
            <Text style={ui.title}>{favorites.length}</Text>
            <Text style={ui.muted}>รายการที่บันทึกไว้</Text>
          </View>
          <View style={[ui.card, { flex: 1 }]}>
            <Text style={ui.title}>{events.length}</Text>
            <Text style={ui.muted}>กิจกรรมให้สำรวจ</Text>
          </View>
        </View>
        {!session ? (
          <Button title="เข้าสู่ระบบ" icon="log-in-outline" onPress={() => router.push('/login')} />
        ) : (
          <>
            <Button
              title="สร้างกิจกรรมใหม่"
              icon="add-circle-outline"
              onPress={() => router.push('/create')}
            />
            <Button secondary title="ออกจากระบบ" onPress={() => void logout()} />
          </>
        )}
        <View style={ui.card}>
          <Text style={ui.heading}>เกี่ยวกับโปรเจกต์</Text>
          <Text style={ui.body}>Nong Khai Explore</Text>
          <Text style={ui.muted}>
            {student.course}
            {'\n'}นำความรู้ Week 1–11 มารวมเป็นแอปท่องเที่ยวและกิจกรรมเดียวกัน
          </Text>
          <Text style={ui.muted}>
            ข้อมูลกิจกรรมและการลงทะเบียนเป็นข้อมูลจำลองเพื่อการศึกษา ภาพออนไลน์ใช้ประกอบบรรยากาศ
          </Text>
        </View>
        <View style={ui.card}>
          <Text style={ui.heading}>ข้อมูลในเครื่อง</Text>
          <Text style={ui.muted}>
            รายการโปรดจะยังอยู่เมื่อปิดแอป ข้อมูลที่เคยโหลดจะเปิดดูได้ขณะออฟไลน์ การล้าง cache
            จะไม่ลบรายการโปรด
          </Text>
          <Button
            secondary
            title="ล้าง cache และโหลดใหม่"
            onPress={() => {
              void resetCache().catch((err) => Alert.alert('ล้างไม่สำเร็จ', errorMessage(err)));
            }}
          />
        </View>
        {__DEV__ && session && (
          <Button
            secondary
            title="ทดสอบ session หมดอายุ"
            onPress={() => {
              void expireSession().catch((err) => Alert.alert('เกิดข้อผิดพลาด', errorMessage(err)));
            }}
          />
        )}
        <Text style={[ui.muted, { textAlign: 'center' }]}>
          Made for little adventures in Nong Khai
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
