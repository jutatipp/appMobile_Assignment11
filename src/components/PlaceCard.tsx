import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Place } from '../types/place';
import { colors, ui } from '../theme';
import { PlaceImage } from './PlaceImage';

export function PlaceCard({
  place,
  favorite,
  onOpen,
  onFavorite,
}: {
  place: Place;
  favorite: boolean;
  onOpen: () => void;
  onFavorite: () => void;
}) {
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`ดูรายละเอียด ${place.title}`}
        onPress={onOpen}
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <PlaceImage uri={place.imageUrl} style={{ height: 215, borderRadius: 24 }} />
        <View style={styles.category}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
            {place.category}
          </Text>
        </View>
        <View style={styles.body}>
          <Text style={ui.heading}>{place.title}</Text>
          <View style={ui.row}>
            <Ionicons name="location-outline" color={colors.muted} size={15} />
            <Text style={[ui.muted, { flex: 1 }]}>{place.district} · หนองคาย</Text>
          </View>
        </View>
      </Pressable>
      <Pressable
        onPress={onFavorite}
        accessibilityRole="button"
        accessibilityLabel={`${favorite ? 'นำออกจาก' : 'เพิ่มใน'}รายการโปรด ${place.title}`}
        accessibilityState={{ selected: favorite }}
        style={styles.heart}
      >
        <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={23} color={colors.primary} />
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 30,
    padding: 7,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  body: { padding: 13, gap: 7 },
  category: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FFFFFFF0',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 20,
  },
  heart: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFFF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
