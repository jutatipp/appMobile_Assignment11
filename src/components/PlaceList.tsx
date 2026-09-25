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
import { ExploreHero } from './ExploreHero';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { PlaceCard } from './PlaceCard';
import { Button, EmptyState, Loading } from './ui';
import { colors, ui } from '../theme';
import { formatDate } from '../utils/format';

export function PlaceList({ favoritesOnly = false }: { favoritesOnly?: boolean }) {
  const { places, favorites, ready, loading, offline, error, updatedAt, refresh, toggleFavorite } =
    useApp();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ทั้งหมด');
  const { width } = useWindowDimensions();
  const columns = width >= 700 ? 2 : 1;
  const categories = ['ทั้งหมด', ...new Set(places.map((place) => place.category))];
  const filtered = places.filter(
    (place) =>
      (!favoritesOnly || favorites.includes(place.id)) &&
      (category === 'ทั้งหมด' || category === place.category) &&
      `${place.title} ${place.district}`.toLowerCase().includes(search.trim().toLowerCase()),
  );
  if (!ready) return <Loading />;
  return (
    <SafeAreaView edges={['top']} style={ui.page}>
      <FlatList
        key={columns}
        numColumns={columns}
        data={filtered}
        keyExtractor={(place) => place.id}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 100 + insets.bottom,
          maxWidth: 1050,
          width: '100%',
          alignSelf: 'center',
        }}
        refreshing={loading}
        onRefresh={() => void refresh()}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: 20, marginBottom: 18 }}>
            <View
              style={[
                ui.row,
                { justifyContent: 'space-between', display: favoritesOnly ? 'none' : 'flex' },
              ]}
            >
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: colors.muted, fontSize: 11, letterSpacing: 2 }}>
                  NONG KHAI TRIP
                </Text>
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>
                  {favoritesOnly
                    ? 'สถานที่ที่คุณชอบ'
                    : 'สวัสดี, ' + (session?.name || 'นักเดินทาง')}
                </Text>
                <Text style={ui.muted}>
                  {favoritesOnly
                    ? 'พร้อมไปเมื่อไหร่ ก็เปิดดูได้เลย'
                    : 'วันนี้อยากออกไปพบอะไรใหม่ ๆ?'}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="เปิดโปรไฟล์"
                onPress={() => router.push('/(tabs)/profile')}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="person-outline" size={22} color={colors.text} />
              </Pressable>
            </View>
            {!favoritesOnly && <ExploreHero imageUrl={places[0]?.imageUrl} />}
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
                    backgroundColor: category === item ? colors.accent : colors.white,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text
                    style={{
                      color: category === item ? colors.text : colors.muted,
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
                {favoritesOnly ? 'รายการที่บันทึกไว้' : 'สถานที่น่าไป'}
              </Text>
              <Text style={ui.muted}>{filtered.length} สถานที่</Text>
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
            <PlaceCard
              place={item}
              favorite={favorites.includes(item.id)}
              onFavorite={() => void toggleFavorite(item.id)}
              onOpen={() => router.push({ pathname: '/places/[id]', params: { id: item.id } })}
            />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <Text style={[ui.muted, { textAlign: 'center', padding: 30 }]}>กำลังโหลดสถานที่…</Text>
          ) : (
            <EmptyState
              title={favoritesOnly ? 'ยังไม่มีรายการที่บันทึกไว้' : 'ยังไม่พบสถานที่'}
              description={
                search || category !== 'ทั้งหมด'
                  ? 'ลองเปลี่ยนคำค้นหาหรือหมวดหมู่ดูอีกครั้ง'
                  : favoritesOnly
                    ? 'แตะหัวใจบนสถานที่ที่สนใจเพื่อเก็บไว้ที่นี่'
                    : 'ตรวจการเชื่อมต่อ API แล้วลองดึงข้อมูลอีกครั้ง'
              }
              action={
                <Button
                  secondary
                  title={favoritesOnly ? 'ไปสำรวจสถานที่' : 'ล้างตัวกรอง'}
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
            เดินทางช้า ๆ เก็บความทรงจำให้มากขึ้น{'\n'}สถานที่จำลองเพื่อการศึกษา · ภาพประกอบบรรยากาศ
          </Text>
        }
      />
    </SafeAreaView>
  );
}
