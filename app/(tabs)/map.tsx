import { useRef, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { Button, EmptyState, Loading } from '../../src/components/ui';
import { currentLocation } from '../../src/services/device';
import { colors, ui } from '../../src/theme';
import { errorMessage } from '../../src/utils/format';

export default function MapScreen() {
  const { events, ready } = useApp();
  const [selectedId, setSelectedId] = useState('');
  const [locating, setLocating] = useState(false);
  const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const map = useRef<MapView>(null);
  const selected = events.find((event) => event.id === selectedId) || events[0];
  async function locate() {
    setLocating(true);
    try {
      const point = await currentLocation();
      if (point) {
        setPosition(point);
        map.current?.animateToRegion({ ...point, latitudeDelta: 0.04, longitudeDelta: 0.04 });
      }
    } catch (error) {
      Alert.alert('หาตำแหน่งไม่ได้', errorMessage(error));
    } finally {
      setLocating(false);
    }
  }
  if (!ready) return <Loading />;
  if (!selected)
    return (
      <SafeAreaView style={ui.page}>
        <EmptyState
          title="ยังไม่มีสถานที่บนแผนที่"
          description="โหลดกิจกรรมจากหน้าสำรวจก่อน แล้วกลับมาดูสถานที่ได้ที่นี่"
          action={<Button title="ไปหน้าสำรวจ" onPress={() => router.push('/(tabs)/explore')} />}
        />
      </SafeAreaView>
    );
  return (
    <SafeAreaView edges={['top']} style={ui.page}>
      <View style={{ padding: 20, gap: 4 }}>
        <Text style={ui.title}>หนองคายในมุมใหม่</Text>
        <Text style={ui.muted}>เลือกหมุด แล้วออกไปพบสถานที่ที่คุณชอบ</Text>
      </View>
      <View style={{ flex: 1, minHeight: 160 }}>
        <MapView
          ref={map}
          style={{ flex: 1 }}
          initialRegion={{
            latitude: selected.latitude,
            longitude: selected.longitude,
            latitudeDelta: 0.12,
            longitudeDelta: 0.12,
          }}
        >
          {events.map((event) => (
            <Marker
              key={event.id}
              coordinate={event}
              title={event.title}
              pinColor={event.id === selected.id ? '#C56F43' : colors.primary}
              onPress={() => setSelectedId(event.id)}
            />
          ))}
          {position && <Marker coordinate={position} title="ตำแหน่งของฉัน" pinColor="#3677C6" />}
        </MapView>
      </View>
      <View style={{ padding: 16, gap: 12 }}>
        <FlatList
          horizontal
          data={events}
          keyExtractor={(event) => event.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: selected.id === item.id }}
              onPress={() => {
                setSelectedId(item.id);
                map.current?.animateToRegion({
                  latitude: item.latitude,
                  longitude: item.longitude,
                  latitudeDelta: 0.03,
                  longitudeDelta: 0.03,
                });
              }}
              style={{
                padding: 13,
                borderRadius: 14,
                backgroundColor: selected.id === item.id ? colors.primary : 'white',
              }}
            >
              <Text style={{ color: selected.id === item.id ? 'white' : colors.text }}>
                {item.title}
              </Text>
            </Pressable>
          )}
        />
        <Text style={ui.heading}>{selected.title}</Text>
        <Text style={ui.muted}>{selected.district}</Text>
        <View style={ui.row}>
          <View style={{ flex: 1 }}>
            <Button
              secondary
              icon="locate-outline"
              title="ตำแหน่งฉัน"
              loading={locating}
              onPress={() => void locate()}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title="ดูรายละเอียด"
              onPress={() => router.push({ pathname: '/events/[id]', params: { id: selected.id } })}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
