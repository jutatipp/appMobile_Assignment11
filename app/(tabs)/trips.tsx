import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTrips } from '../../src/context/TripContext';
import { Button, EmptyState, Loading } from '../../src/components/ui';
import { colors, ui } from '../../src/theme';
import { tripDays, tripEnd } from '../../src/utils/itinerary';
import { formatDate } from '../../src/utils/format';

export default function TripsScreen() {
  const auth = useAuth();
  const { trips, ready, loading, error, refresh } = useTrips();
  const insets = useSafeAreaInsets();
  if (!auth.ready || !ready) return <Loading />;
  return (
    <SafeAreaView edges={['top']} style={ui.page}>
      <FlatList
        data={auth.session ? trips : []}
        keyExtractor={(trip) => trip.id}
        refreshing={loading}
        onRefresh={() => void refresh()}
        contentContainerStyle={[ui.content, { paddingBottom: 100 + insets.bottom }]}
        ListHeaderComponent={
          <View style={{ gap: 14 }}>
            <Text style={{ color: colors.muted, letterSpacing: 2, fontSize: 11 }}>
              YOUR NONG KHAI JOURNEY
            </Text>
            <Text style={ui.title}>ทริปของฉัน</Text>
            <Text style={ui.muted}>เลือกวันเที่ยว แล้ววางแผนสถานที่ที่อยากไป</Text>
            <Button
              title="สร้างทริปใหม่"
              icon="add-outline"
              onPress={() => router.push('/trips/edit')}
            />
            {error ? (
              <View style={ui.card}>
                <Text style={ui.error}>{error}</Text>
                <Text style={ui.muted}>
                  กำลังแสดงข้อมูลในเครื่อง หากมีรูปที่รอส่ง กดดึงข้อมูลเพื่อลองอีกครั้ง
                </Text>
                <Button
                  secondary
                  title="ดึงข้อมูลอีกครั้ง"
                  loading={loading}
                  onPress={() => void refresh()}
                />
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`เปิดทริป ${item.title}`}
            onPress={() => router.push({ pathname: '/trips/[id]', params: { id: item.id } })}
            style={[ui.card, { marginTop: 16 }]}
          >
            <Text style={ui.badge}>
              {tripDays(item).length} วัน · {item.placeIds.length} สถานที่
            </Text>
            <Text style={ui.heading}>{item.title}</Text>
            <Text style={ui.muted}>
              ไป {formatDate(item.startsAt)}
              {'\n'}กลับ {formatDate(tripEnd(item))}
            </Text>
            <Text style={{ color: colors.primary }}>เปิดแผนการเดินทาง →</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            title={auth.session ? 'ทริปแรกของคุณเริ่มที่นี่' : 'เก็บทริปไว้ในบัญชีของคุณ'}
            description={
              auth.session
                ? 'สร้างทริปแล้วเพิ่มสถานที่ที่ชอบได้จากหน้าสำรวจ'
                : 'เข้าสู่ระบบเพื่อวางแผนวันเที่ยวและสถานที่ของคุณ'
            }
            action={
              !auth.session ? (
                <Button
                  title="เข้าสู่ระบบ"
                  onPress={() => router.push({ pathname: '/login', params: { next: 'trips' } })}
                />
              ) : undefined
            }
          />
        }
      />
    </SafeAreaView>
  );
}
