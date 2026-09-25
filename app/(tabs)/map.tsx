import { useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { Button, EmptyState, Loading } from '../../src/components/ui';
import { PlaceImage } from '../../src/components/PlaceImage';
import { currentLocation } from '../../src/services/device';
import { colors, ui } from '../../src/theme';
import { errorMessage } from '../../src/utils/format';

export default function MapScreen() {
  const { places, ready } = useApp();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [locating, setLocating] = useState(false);
  const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const map = useRef<MapView>(null);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const filtered = places.filter((place) =>
    `${place.title} ${place.district}`.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const selected = filtered.find((place) => place.id === selectedId) || filtered[0];
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
  if (!places.length)
    return (
      <View style={ui.page}>
        <EmptyState
          title="ยังไม่มีสถานที่บนแผนที่"
          description="โหลดสถานที่จากหน้าสำรวจก่อน แล้วกลับมาดูสถานที่ได้ที่นี่"
          action={<Button title="ไปหน้าสำรวจ" onPress={() => router.push('/(tabs)/explore')} />}
        />
      </View>
    );
  return (
    <View style={ui.page}>
      <MapView
        ref={map}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: places[0].latitude,
          longitude: places[0].longitude,
          latitudeDelta: 0.12,
          longitudeDelta: 0.12,
        }}
      >
        {filtered.map((place) => (
          <Marker
            key={place.id}
            coordinate={place}
            title={place.title}
            onPress={() => setSelectedId(place.id)}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View
              style={[
                styles.marker,
                { backgroundColor: place.id === selected?.id ? '#547B24' : '#729BA5' },
              ]}
            >
              <Ionicons name="pin" size={22} color="white" />
            </View>
          </Marker>
        ))}
        {position && <Marker coordinate={position} title="ตำแหน่งของฉัน" pinColor="#3677C6" />}
      </MapView>
      <View style={[styles.search, { top: insets.top + 12 }]}>
        <Ionicons name="search-outline" size={20} color={colors.muted} />
        <TextInput
          accessibilityLabel="ค้นหาสถานที่บนแผนที่"
          value={search}
          onChangeText={setSearch}
          placeholder="ค้นหาสถานที่ในหนองคาย"
          placeholderTextColor={colors.muted}
          style={{ flex: 1, color: colors.text, minHeight: 44, fontSize: 14 }}
        />
        {search ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="ล้างคำค้น"
            onPress={() => setSearch('')}
            style={{ padding: 10 }}
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </Pressable>
        ) : (
          <Ionicons name="map-outline" size={20} color={colors.text} />
        )}
      </View>
      <View style={[styles.bottom, { bottom: Math.max(insets.bottom, 12) + 80 }]}>
        <View style={{ alignSelf: 'flex-end' }}>
          <Button
            secondary
            icon="locate-outline"
            title="ตำแหน่งฉัน"
            loading={locating}
            onPress={() => void locate()}
          />
        </View>
        <View style={styles.card}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'ย่อแผงสถานที่เพื่อดูแผนที่' : 'ขยายแผงสถานที่'}
            accessibilityState={{ expanded }}
            onPress={() => setExpanded((value) => !value)}
            style={styles.panelToggle}
          >
            <View style={{ flex: 1, gap: 3 }}>
              <Text numberOfLines={1} style={ui.heading}>
                {selected?.title || 'ไม่พบสถานที่'}
              </Text>
              <Text style={ui.muted}>
                {expanded
                  ? 'ย่อเพื่อดูแผนที่มากขึ้น'
                  : selected
                    ? selected.district + ' · หนองคาย'
                    : 'ลองเปลี่ยนคำค้นอีกครั้ง'}
              </Text>
            </View>
            <Ionicons
              name={expanded ? 'chevron-down' : 'chevron-up'}
              size={24}
              color={colors.primary}
            />
          </Pressable>
          {!expanded && selected && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="ขยายรายละเอียดสถานที่"
              onPress={() => setExpanded(true)}
              style={{ paddingBottom: 12 }}
            >
              <PlaceImage uri={selected.imageUrl} style={{ height: 125, borderRadius: 22 }} />
            </Pressable>
          )}
          {expanded && (
            <ScrollView
              style={{ maxHeight: height * 0.42 }}
              contentContainerStyle={{ gap: 12, paddingBottom: 8 }}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              <FlatList
                horizontal
                data={filtered}
                keyExtractor={(place) => place.id}
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ gap: 8 }}
                renderItem={({ item }) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: selected?.id === item.id }}
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
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 24,
                      backgroundColor: selected?.id === item.id ? colors.accent : colors.white,
                    }}
                  >
                    <Text style={{ color: colors.text, fontSize: 12 }}>{item.title}</Text>
                  </Pressable>
                )}
              />
              {selected ? (
                <View>
                  <PlaceImage uri={selected.imageUrl} style={{ height: 115, borderRadius: 22 }} />
                  <View style={{ padding: 10, gap: 8 }}>
                    <View style={[ui.row, { justifyContent: 'space-between' }]}>
                      <Text style={ui.badge}>{selected.category}</Text>
                      <Text style={ui.muted}>ตำแหน่งสถานที่</Text>
                    </View>
                    <Text numberOfLines={2} style={ui.heading}>
                      {selected.title}
                    </Text>
                    <Text style={ui.muted}>{selected.district} · หนองคาย</Text>
                    <Button
                      title="สำรวจสถานที่นี้"
                      onPress={() =>
                        router.push({ pathname: '/places/[id]', params: { id: selected.id } })
                      }
                    />
                  </View>
                </View>
              ) : (
                <View>
                  <Text style={[ui.body, { padding: 16 }]}>
                    ไม่พบสถานที่ ลองเปลี่ยนคำค้นอีกครั้ง
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  marker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#20342C',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  search: {
    position: 'absolute',
    left: 20,
    right: 20,
    paddingHorizontal: 16,
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFFF5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#23332D',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  bottom: {
    position: 'absolute',
    left: 20,
    right: 20,
    gap: 10,
    alignSelf: 'center',
  },
  panelToggle: {
    minHeight: 64,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  card: {
    padding: 8,
    borderRadius: 32,
    backgroundColor: colors.white,
    shadowColor: '#23332D',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
});
