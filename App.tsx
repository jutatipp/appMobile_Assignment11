import { useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

type Coordinates = { latitude: number; longitude: number };
type PointOfInterest = {
  id: string;
  name: string;
  category: string;
  district: string;
  coordinates: Coordinates;
};

const MAP_DELTA = { latitudeDelta: 0.025, longitudeDelta: 0.025 };

const PLACES: PointOfInterest[] = [
  { id: 'bridge', name: 'สะพานมิตรภาพไทย–ลาว แห่งที่ 1', category: 'แลนด์มาร์ก', district: 'อำเภอเมืองหนองคาย', coordinates: { latitude: 17.880222, longitude: 102.715056 } },
  { id: 'sala-keoku', name: 'ศาลาแก้วกู่', category: 'ศิลปวัฒนธรรม', district: 'อำเภอเมืองหนองคาย', coordinates: { latitude: 17.887058, longitude: 102.788045 } },
  { id: 'wat-pho-chai', name: 'วัดโพธิ์ชัย', category: 'วัดสำคัญ', district: 'อำเภอเมืองหนองคาย', coordinates: { latitude: 17.881903, longitude: 102.760343 } },
  { id: 'tha-sadet', name: 'ตลาดท่าเสด็จ', category: 'ตลาดและชุมชน', district: 'อำเภอเมืองหนองคาย', coordinates: { latitude: 17.886255, longitude: 102.746608 } },
  { id: 'nong-thin', name: 'สวนสาธารณะหนองถิ่น', category: 'สวนสาธารณะ', district: 'อำเภอเมืองหนองคาย', coordinates: { latitude: 17.871083, longitude: 102.721409 } },
  { id: 'klang-nam', name: 'พระธาตุกลางน้ำ', category: 'โบราณสถาน', district: 'อำเภอเมืองหนองคาย', coordinates: { latitude: 17.892054, longitude: 102.766819 } },
  { id: 'aquarium', name: 'พิพิธภัณฑ์สัตว์น้ำจังหวัดหนองคาย', category: 'แหล่งเรียนรู้', district: 'อำเภอเมืองหนองคาย', coordinates: { latitude: 17.747221, longitude: 102.741269 } },
  { id: 'bang-phuan', name: 'วัดพระธาตุบังพวน', category: 'โบราณสถาน', district: 'อำเภอเมืองหนองคาย', coordinates: { latitude: 17.811824, longitude: 102.584393 } },
  { id: 'pha-tak-suea', name: 'สกายวอล์ควัดผาตากเสื้อ', category: 'จุดชมวิว', district: 'อำเภอสังคม', coordinates: { latitude: 17.953904, longitude: 102.303859 } },
  { id: 'hin-mak-peng', name: 'วัดหินหมากเป้ง', category: 'วัดสำคัญ', district: 'อำเภอศรีเชียงใหม่', coordinates: { latitude: 17.948596, longitude: 102.164597 } },
];

export default function App() {
  const mapRef = useRef<MapView>(null);
  const [selectedPlace, setSelectedPlace] = useState<PointOfInterest>(PLACES[0]);

  const selectPlace = (place: PointOfInterest) => {
    if (place.id === selectedPlace.id) return;
    setSelectedPlace(place);
    mapRef.current?.animateToRegion({ ...place.coordinates, ...MAP_DELTA }, 650);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{ ...PLACES[0].coordinates, ...MAP_DELTA }}
        showsCompass
        showsMyLocationButton={false}
      >
        <Marker coordinate={selectedPlace.coordinates}>
          <View style={styles.markerWrap}>
            <View style={styles.markerLabel}>
              <Text style={styles.markerText} numberOfLines={2}>{selectedPlace.name}</Text>
            </View>
            <View style={styles.markerPin}><View style={styles.markerCenter} /></View>
          </View>
        </Marker>
      </MapView>

      <SafeAreaView style={styles.headerSafeArea} pointerEvents="box-none">
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>NONG KHAI POI</Text>
            <Text style={styles.headerTitle}>สถานที่สำคัญในหนองคาย</Text>
          </View>
          <View style={styles.countBadge} accessibilityElementsHidden>
            <Text style={styles.countNumber}>10</Text>
            <Text style={styles.countLabel}>สถานที่</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.bottomDock} pointerEvents="box-none">
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>เลือกสถานที่</Text>
          <Text style={styles.listHint}>เลื่อนเพื่อดูเพิ่มเติม</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.placeList}>
          {PLACES.map((place, index) => {
            const selected = place.id === selectedPlace.id;
            return (
              <Pressable
                key={place.id}
                accessibilityRole="button"
                accessibilityLabel={`แสดง ${place.name} บนแผนที่`}
                accessibilityState={{ selected }}
                onPress={() => selectPlace(place)}
                style={({ pressed }) => [styles.placeChip, selected && styles.placeChipSelected, pressed && styles.pressed]}
              >
                <View style={[styles.placeNumber, selected && styles.placeNumberSelected]}>
                  <Text style={[styles.placeNumberText, selected && styles.selectedText]}>{index + 1}</Text>
                </View>
                <Text style={[styles.placeChipText, selected && styles.selectedText]} numberOfLines={2}>{place.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.detailCard}>
          <View style={styles.handle} />
          <View style={styles.detailHeader}>
            <View style={styles.detailText}>
              <Text style={styles.selectedLabel}>สถานที่ที่เลือก</Text>
              <Text style={styles.placeName}>{selectedPlace.name}</Text>
              <Text style={styles.district}>{selectedPlace.district}</Text>
            </View>
            <View style={styles.categoryBadge}><Text style={styles.categoryText}>{selectedPlace.category}</Text></View>
          </View>
          <View style={styles.coordinatesBox}>
            <View style={styles.coordinateDot} />
            <Text style={styles.coordinateLabel}>พิกัด</Text>
            <Text style={styles.coordinateValue} numberOfLines={1}>
              {selectedPlace.coordinates.latitude.toFixed(6)}, {selectedPlace.coordinates.longitude.toFixed(6)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEF0F6' },
  map: { ...StyleSheet.absoluteFillObject },
  headerSafeArea: { position: 'absolute', top: 0, right: 0, left: 0 },
  header: { minHeight: 68, marginTop: 8, marginHorizontal: 14, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#182044', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.14, shadowRadius: 16, elevation: 6 },
  eyebrow: { color: '#5B5FEF', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.4 },
  headerTitle: { marginTop: 2, color: '#171B2E', fontSize: 18, fontWeight: '800' },
  countBadge: { minWidth: 52, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 13, backgroundColor: '#EEF0FF', alignItems: 'center' },
  countNumber: { color: '#4A4ED9', fontSize: 15, fontWeight: '900' },
  countLabel: { color: '#686E88', fontSize: 9, fontWeight: '700' },
  markerWrap: { alignItems: 'center', paddingBottom: 2 },
  markerLabel: { maxWidth: 190, marginBottom: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, backgroundColor: '#FFF', shadowColor: '#182044', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.22, shadowRadius: 6, elevation: 5 },
  markerText: { color: '#252B42', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  markerPin: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#5B5FEF', borderWidth: 3, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#182044', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 5, elevation: 5 },
  markerCenter: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFF' },
  bottomDock: { position: 'absolute', right: 0, bottom: 0, left: 0 },
  listHeader: { marginHorizontal: 16, marginBottom: 7, flexDirection: 'row', justifyContent: 'space-between' },
  listTitle: { color: '#252B42', fontSize: 13, fontWeight: '800', textShadowColor: '#FFF', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  listHint: { color: '#596075', fontSize: 10, fontWeight: '600', textShadowColor: '#FFF', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  placeList: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  placeChip: { width: 146, minHeight: 58, paddingHorizontal: 9, paddingVertical: 8, borderWidth: 1, borderColor: '#E3E5ED', borderRadius: 16, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', shadowColor: '#182044', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 7, elevation: 4 },
  placeChipSelected: { borderColor: '#5B5FEF', backgroundColor: '#5B5FEF' },
  placeNumber: { width: 28, height: 28, marginRight: 8, borderRadius: 9, backgroundColor: '#EEF0FF', alignItems: 'center', justifyContent: 'center' },
  placeNumberSelected: { backgroundColor: 'rgba(255,255,255,0.2)' },
  placeNumberText: { color: '#4A4ED9', fontSize: 11, fontWeight: '900' },
  placeChipText: { flex: 1, color: '#383E54', fontSize: 11, lineHeight: 15, fontWeight: '700' },
  selectedText: { color: '#FFF' },
  pressed: { opacity: 0.78 },
  detailCard: { marginHorizontal: 10, marginBottom: 24, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14, borderRadius: 24, backgroundColor: '#FFF', shadowColor: '#182044', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 22, elevation: 12 },
  handle: { width: 36, height: 4, marginBottom: 9, alignSelf: 'center', borderRadius: 2, backgroundColor: '#D8DCE8' },
  detailHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  detailText: { flex: 1 },
  selectedLabel: { marginBottom: 2, color: '#5B5FEF', fontSize: 10, fontWeight: '800' },
  placeName: { color: '#171B2E', fontSize: 17, fontWeight: '800' },
  district: { marginTop: 3, color: '#687087', fontSize: 12, fontWeight: '600' },
  categoryBadge: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 14, backgroundColor: '#EEF0FF' },
  categoryText: { color: '#4A4ED9', fontSize: 10, fontWeight: '700' },
  coordinatesBox: { minHeight: 42, marginTop: 11, paddingHorizontal: 11, borderRadius: 12, backgroundColor: '#F6F7FB', flexDirection: 'row', alignItems: 'center' },
  coordinateDot: { width: 9, height: 9, marginRight: 8, borderRadius: 5, backgroundColor: '#5B5FEF' },
  coordinateLabel: { marginRight: 8, color: '#737A90', fontSize: 10.5, fontWeight: '700' },
  coordinateValue: { flex: 1, color: '#252B42', fontSize: 12, fontWeight: '700', textAlign: 'right', fontVariant: ['tabular-nums'] },
});
