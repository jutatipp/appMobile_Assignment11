import { useRef, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useApp } from '../../src/context/AppContext';
import { useTrips } from '../../src/context/TripContext';
import { Button, Loading } from '../../src/components/ui';
import { colors, ui } from '../../src/theme';
import { errorMessage, formatDate } from '../../src/utils/format';
import { tripDays, tripEnd } from '../../src/utils/itinerary';

type IconName = ComponentProps<typeof Ionicons>['name'];
function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
  last = false,
  disabled = false,
  danger = false,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
  last?: boolean;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        !last && styles.divider,
        { opacity: disabled || pressed ? 0.55 : 1 },
      ]}
    >
      <View style={[styles.menuIcon, danger && { backgroundColor: '#FAEFEC' }]}>
        <Ionicons name={icon} size={21} color={danger ? colors.danger : colors.primary} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[styles.menuTitle, danger && { color: colors.danger }]}>{title}</Text>
        <Text style={styles.caption}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={17} color={colors.muted} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { session, ready, signOut } = useAuth();
  const { resetCache, offline } = useApp();
  const { trips, ready: tripsReady, pendingIds } = useTrips();
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  if (!ready) return <Loading />;
  const upcoming = trips
    .filter((trip) => Date.parse(tripEnd(trip)) >= Date.now())
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))[0];
  const openTrips = () => router.push('/(tabs)/trips');
  async function perform(task: () => Promise<void>, title: string) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await task();
    } catch (error) {
      Alert.alert(title, errorMessage(error));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const tripCount = !session ? '0' : tripsReady ? String(trips.length) : '—';
  return (
    <SafeAreaView edges={['top']} style={ui.page}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: 110 + insets.bottom }]}
      >
        <View style={[ui.row, { justifyContent: 'space-between' }]}>
          <View style={{ gap: 5 }}>
            <Text style={styles.eyebrow}>YOUR LITTLE ESCAPE</Text>
            <Text style={ui.title}>โปรไฟล์ของคุณ</Text>
          </View>
          <View style={styles.brandMark}>
            <Ionicons name="leaf-outline" size={24} color={colors.primary} />
          </View>
        </View>
        <LinearGradient colors={[colors.primary, colors.dark]} style={styles.hero}>
          <View pointerEvents="none" style={styles.orbit} />
          <View style={[ui.row, { justifyContent: 'space-between' }]}>
            <View style={styles.avatar}>
              {session ? (
                <Text style={styles.initial}>{(session.name.trim()[0] || 'J').toUpperCase()}</Text>
              ) : (
                <Ionicons name="person-outline" size={34} color={colors.primary} />
              )}
            </View>
            <View style={styles.status}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                {session ? 'พื้นที่ส่วนตัวของคุณ' : 'เริ่มการเดินทางของคุณ'}
              </Text>
            </View>
          </View>
          <View style={{ gap: 6 }}>
            <Text style={styles.name}>{session?.name || 'สวัสดี นักเดินทาง'}</Text>
            <Text selectable={!!session} style={styles.heroSubtitle}>
              {session?.email || 'เก็บสถานที่ที่ชอบ วางแผนวันที่ใช่\nแล้วออกไปสร้างความทรงจำ'}
            </Text>
          </View>
          <View style={styles.heroFooter}>
            <Ionicons name="location-outline" size={15} color={colors.accent} />
            <Text style={styles.heroSmall}>NONG KHAI, THAILAND</Text>
          </View>
        </LinearGradient>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`ทริปของฉัน ${tripCount}`}
          onPress={openTrips}
          style={({ pressed }) => [styles.stat, { opacity: pressed ? 0.65 : 1 }]}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="briefcase-outline" size={23} color={colors.primary} />
          </View>
          <Text style={[styles.menuTitle, { flex: 1 }]}>ทริปของฉัน</Text>
          <Text style={styles.statValue}>{tripCount}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>
        <Button
          title={session ? 'วางแผนทริปใหม่' : 'เข้าสู่ระบบเพื่อเริ่มวางแผน'}
          icon={session ? 'add-outline' : 'log-in-outline'}
          onPress={() => router.push(session ? '/trips/edit' : '/login')}
        />
        {session && tripsReady && upcoming && (
          <View style={{ gap: 12 }}>
            <Text style={styles.sectionTitle}>การเดินทางของคุณ</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`เปิดทริป ${upcoming.title}`}
              onPress={() => router.push({ pathname: '/trips/[id]', params: { id: upcoming.id } })}
              style={({ pressed }) => [styles.tripCard, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={[ui.row, { justifyContent: 'space-between' }]}>
                <Text style={styles.tripTag}>
                  {Date.parse(upcoming.startsAt) <= Date.now()
                    ? 'อยู่ในช่วงเดินทาง'
                    : 'ทริปที่กำลังจะมาถึง'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color={colors.primary} />
              </View>
              <Text numberOfLines={2} style={ui.heading}>
                {upcoming.title}
              </Text>
              <Text style={styles.caption}>{formatDate(upcoming.startsAt)}</Text>
              <Text style={styles.tripMeta}>
                {tripDays(upcoming).length} วัน · {upcoming.placeIds.length} สถานที่
              </Text>
            </Pressable>
          </View>
        )}
        <View style={{ gap: 12 }}>
          <Text style={styles.sectionTitle}>การเดินทางและสถานที่</Text>
          <View style={styles.menuCard}>
            <MenuRow
              icon="heart-outline"
              title="สถานที่โปรด"
              subtitle="เก็บไว้เลือกลงแผนเที่ยวในแต่ละวัน"
              onPress={() => router.push('/(tabs)/favorites')}
            />
            <MenuRow
              icon="briefcase-outline"
              title="ทริปและภาพความทรงจำ"
              subtitle="เปิดแผนรายวันและอัลบั้มของแต่ละทริป"
              onPress={openTrips}
            />
            <MenuRow
              icon="map-outline"
              title="สำรวจผ่านแผนที่"
              subtitle="ค้นพบสถานที่รอบหนองคาย"
              onPress={() => router.push('/(tabs)/map')}
              last
            />
          </View>
        </View>
        <View style={{ gap: 12 }}>
          <Text style={styles.sectionTitle}>แอปและบัญชี</Text>
          <View style={styles.menuCard}>
            <MenuRow
              icon="refresh-outline"
              title={busy ? 'กำลังดำเนินการ…' : 'โหลดข้อมูลสถานที่ใหม่'}
              subtitle={
                offline
                  ? 'ขณะนี้ออฟไลน์ · ข้อมูลเดิมยังเปิดดูได้'
                  : 'จัดการข้อมูลสถานที่ที่เก็บไว้บนเครื่อง'
              }
              disabled={busy || offline}
              onPress={() =>
                Alert.alert(
                  'โหลดข้อมูลสถานที่ใหม่?',
                  'ล้างข้อมูลสถานที่ที่เก็บไว้แล้วโหลดอีกครั้ง รายการโปรด ทริป และภาพความทรงจำยังอยู่',
                  [
                    { text: 'ยกเลิก', style: 'cancel' },
                    {
                      text: 'โหลดใหม่',
                      onPress: () => void perform(resetCache, 'โหลดข้อมูลไม่สำเร็จ'),
                    },
                  ],
                )
              }
            />
            <MenuRow
              icon="information-circle-outline"
              title="เกี่ยวกับ Nong Khai Trip"
              subtitle="พื้นที่สำหรับการเดินทางเล็ก ๆ ที่มีความหมาย"
              last={!session}
              onPress={() =>
                Alert.alert(
                  'Nong Khai Trip',
                  'แอปวางแผนเที่ยวหนองคาย เก็บสถานที่โปรดและภาพความทรงจำ\n\nพัฒนาด้วย React Native และ Expo ประยุกต์บทเรียน Week 1–11\n\nบัญชีสาธิตสำหรับการศึกษา ภาพสถานที่ออนไลน์เป็นภาพประกอบบรรยากาศ',
                )
              }
            />
            {session && (
              <MenuRow
                icon="log-out-outline"
                title="ออกจากระบบ"
                subtitle="รายการโปรดในเครื่องยังคงอยู่"
                danger
                disabled={busy}
                last
                onPress={() =>
                  Alert.alert('ออกจากระบบ?', 'กลับเข้าสู่ระบบอีกครั้งเพื่อเปิดทริปของคุณ', [
                    { text: 'อยู่ต่อ', style: 'cancel' },
                    {
                      text: 'ออกจากระบบ',
                      style: 'destructive',
                      onPress: () => void perform(signOut, 'ออกจากระบบไม่สำเร็จ'),
                    },
                  ])
                }
              />
            )}
          </View>
        </View>
        {busy && <ActivityIndicator color={colors.primary} />}
        {session && pendingIds.length > 0 && (
          <View style={[ui.row, { justifyContent: 'center' }]}>
            <Ionicons name="cloud-upload-outline" size={16} color={colors.muted} />
            <Text style={styles.caption}>{pendingIds.length} ภาพรอส่งเมื่อเชื่อมต่อได้</Text>
          </View>
        )}
        <View style={styles.footer}>
          <Ionicons name="leaf-outline" size={17} color={colors.muted} />
          <Text style={styles.footerBrand}>NONG KHAI TRIP</Text>
          <Text style={styles.caption}>เดินทางช้า ๆ เก็บความทรงจำให้มากขึ้น</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  content: { padding: 22, gap: 24, width: '100%', maxWidth: 650, alignSelf: 'center' },
  eyebrow: { color: colors.muted, fontSize: 10, letterSpacing: 2.3, fontWeight: '600' },
  brandMark: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { padding: 24, borderRadius: 30, gap: 24, overflow: 'hidden' },
  orbit: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    right: -100,
    top: -70,
    borderWidth: 35,
    borderColor: '#DDF8760B',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { fontSize: 32, fontWeight: '700', color: colors.primary },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF0D',
    flexShrink: 1,
    marginLeft: 12,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent },
  statusText: { fontSize: 10, color: '#E5EAD9', flexShrink: 1, lineHeight: 16 },
  name: { color: colors.white, fontSize: 26, fontWeight: '700', lineHeight: 36 },
  heroSubtitle: { color: '#BAC1B4', fontSize: 13, lineHeight: 22 },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF16',
  },
  heroSmall: { fontSize: 10, letterSpacing: 1.7, color: '#DDE4D4' },
  stat: {
    flexDirection: 'row',
    minWidth: 0,
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 8,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: 27, fontWeight: '700', color: colors.primary },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  menuCard: {
    borderRadius: 24,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 18,
    minHeight: 82,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  caption: { fontSize: 12, color: colors.muted, lineHeight: 19 },
  tripCard: { backgroundColor: '#EDF4D9', borderRadius: 24, padding: 20, gap: 10 },
  tripTag: { fontSize: 11, fontWeight: '600', color: colors.primary, flexShrink: 1 },
  tripMeta: { fontSize: 12, fontWeight: '600', color: colors.primary },
  footer: { alignItems: 'center', gap: 8, paddingVertical: 6 },
  footerBrand: { fontSize: 10, color: colors.muted, letterSpacing: 2, fontWeight: '600' },
});
