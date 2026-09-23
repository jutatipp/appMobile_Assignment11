import { useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';
import { EventCard } from './EventCard';
import { Button, EmptyState, Loading } from './ui';
import { colors, ui } from '../theme';
import { formatDate } from '../utils/format';

export function EventList({ favoritesOnly = false }: { favoritesOnly?: boolean }) {
  const { events, favorites, ready, loading, offline, error, updatedAt, refresh, toggleFavorite } =
    useApp();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ทั้งหมด');
  const { width } = useWindowDimensions();
  const columns = width >= 700 ? 2 : 1;
  const categories = ['ทั้งหมด', ...new Set(events.map((event) => event.category))];
  const filtered = events.filter(
    (event) =>
      (!favoritesOnly || favorites.includes(event.id)) &&
      (category === 'ทั้งหมด' || category === event.category) &&
      `${event.title} ${event.district}`.toLowerCase().includes(search.trim().toLowerCase()),
  );
  if (!ready) return <Loading />;
  return (
    <SafeAreaView edges={['top']} style={ui.page}>
      <FlatList
        key={columns}
        numColumns={columns}
        data={filtered}
        keyExtractor={(event) => event.id}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 30,
          maxWidth: 1050,
          width: '100%',
          alignSelf: 'center',
        }}
        refreshing={loading}
        onRefresh={() => void refresh()}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: 20, marginBottom: 18 }}>
            <View style={[ui.row, { justifyContent: 'space-between' }]}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: 11,
                    fontWeight: '800',
                    letterSpacing: 2,
                  }}
                >
                  NONG KHAI / EXPLORE
                </Text>
                <Text style={[ui.title, { marginTop: 5 }]}>
                  {favoritesOnly ? 'ความทรงจำครั้งต่อไป' : 'ออกไปเจอเรื่องดี ๆ'}
                </Text>
              </View>
              <View style={{ padding: 13, borderRadius: 22, backgroundColor: colors.accent }}>
                <Ionicons
                  name={favoritesOnly ? 'heart-outline' : 'leaf-outline'}
                  size={25}
                  color={colors.primary}
                />
              </View>
            </View>
            {!favoritesOnly && (
              <LinearGradient
                colors={['#194F42', '#30725A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 24, borderRadius: 26, gap: 12 }}
              >
                <Text
                  style={{ color: '#DCE8C8', letterSpacing: 1.5, fontWeight: '600', fontSize: 11 }}
                >
                  SLOW DOWN. DISCOVER MORE.
                </Text>
                <Text style={{ color: 'white', fontSize: 30, fontWeight: '800', lineHeight: 40 }}>
                  หนองคาย…{'\n'}ใกล้กว่าที่คิด
                </Text>
                <Text style={{ color: '#DDE9DF', fontSize: 14, lineHeight: 23 }}>
                  สถานที่น่าไป กิจกรรมน่าลอง{'\n'}และวันธรรมดาที่พิเศษกว่าเดิม
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/(tabs)/map')}
                  style={{
                    alignSelf: 'flex-start',
                    backgroundColor: colors.accent,
                    paddingHorizontal: 17,
                    paddingVertical: 12,
                    borderRadius: 13,
                  }}
                >
                  <Text style={{ color: colors.dark, fontWeight: '700' }}>เปิดแผนที่ ↗</Text>
                </Pressable>
              </LinearGradient>
            )}
            {favoritesOnly && (
              <Text style={ui.muted}>เก็บสถานที่ที่ชอบไว้ แล้วค่อยออกเดินทางในวันที่พร้อม</Text>
            )}
            <View style={[ui.row, ui.input]}>
              <Ionicons name="search-outline" size={21} color={colors.muted} />
              <TextInput
                accessibilityLabel="ค้นหาชื่อหรืออำเภอ"
                placeholder="อยากไปที่ไหนในหนองคาย?"
                placeholderTextColor={colors.muted}
                value={search}
                onChangeText={setSearch}
                style={{ flex: 1, fontSize: 15, color: colors.text, minHeight: 26 }}
              />
              {search ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="ล้างคำค้น"
                  onPress={() => setSearch('')}
                  style={{ padding: 8 }}
                >
                  <Ionicons name="close" size={20} color={colors.muted} />
                </Pressable>
              ) : null}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {categories.map((item) => (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityState={{ selected: category === item }}
                  onPress={() => setCategory(item)}
                  style={{
                    paddingHorizontal: 17,
                    paddingVertical: 13,
                    borderRadius: 24,
                    backgroundColor: category === item ? colors.primary : colors.white,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text
                    style={{
                      color: category === item ? 'white' : colors.muted,
                      fontWeight: '600',
                      fontSize: 13,
                    }}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            {(offline || error) && (
              <View style={{ backgroundColor: colors.warm, padding: 15, borderRadius: 15, gap: 8 }}>
                <Text style={ui.body}>
                  {offline ? 'ออฟไลน์ · กำลังแสดงข้อมูลที่บันทึกไว้' : 'เชื่อมต่อข้อมูลใหม่ไม่ได้'}
                </Text>
                <Text style={ui.muted}>
                  {error || 'เชื่อมต่ออินเทอร์เน็ตแล้วดึงข้อมูลอีกครั้งได้'}
                  {updatedAt
                    ? `\nอัปเดตล่าสุด ${formatDate(updatedAt)}`
                    : '\nเปิด API ตาม README แล้วลองอีกครั้ง'}
                </Text>
                <Button
                  secondary
                  title="ลองอีกครั้ง"
                  loading={loading}
                  onPress={() => void refresh()}
                />
              </View>
            )}
            <View style={[ui.row, { justifyContent: 'space-between' }]}>
              <Text style={ui.heading}>
                {favoritesOnly ? 'รายการที่บันทึกไว้' : 'เลือกการเดินทางของคุณ'}
              </Text>
              <Text style={ui.muted}>{filtered.length} กิจกรรม</Text>
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <View
            style={{
              width: `${100 / columns}%`,
              paddingRight: columns === 2 && index % 2 === 0 ? 9 : 0,
              paddingLeft: columns === 2 && index % 2 === 1 ? 9 : 0,
            }}
          >
            <EventCard
              event={item}
              favorite={favorites.includes(item.id)}
              onFavorite={() => void toggleFavorite(item.id)}
              onOpen={() => router.push({ pathname: '/events/[id]', params: { id: item.id } })}
            />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <Text style={[ui.muted, { textAlign: 'center', padding: 30 }]}>กำลังโหลดกิจกรรม…</Text>
          ) : (
            <EmptyState
              title={favoritesOnly ? 'ยังไม่มีรายการที่บันทึกไว้' : 'ยังไม่พบกิจกรรม'}
              description={
                search || category !== 'ทั้งหมด'
                  ? 'ลองเปลี่ยนคำค้นหาหรือหมวดหมู่ดูอีกครั้ง'
                  : favoritesOnly
                    ? 'แตะหัวใจบนกิจกรรมที่สนใจเพื่อเก็บไว้ที่นี่'
                    : 'ตรวจการเชื่อมต่อ API แล้วลองดึงข้อมูลอีกครั้ง'
              }
              action={
                <Button
                  secondary
                  title={favoritesOnly ? 'ไปสำรวจกิจกรรม' : 'ล้างตัวกรอง'}
                  onPress={() => {
                    setSearch('');
                    setCategory('ทั้งหมด');
                    if (favoritesOnly) router.push('/(tabs)/explore');
                  }}
                />
              }
            />
          )
        }
        ListFooterComponent={
          <Text style={[ui.muted, { textAlign: 'center', padding: 15, fontSize: 11 }]}>
            เดินทางช้า ๆ เก็บความทรงจำให้มากขึ้น{'\n'}กิจกรรมจำลองเพื่อการศึกษา · ภาพประกอบบรรยากาศ
          </Text>
        }
      />
    </SafeAreaView>
  );
}
