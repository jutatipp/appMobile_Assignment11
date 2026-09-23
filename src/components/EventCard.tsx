import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Event } from '../types/event';
import { colors, ui } from '../theme';
import { formatDate } from '../utils/format';
import { EventImage } from './EventImage';

export function EventCard({
  event,
  favorite,
  onOpen,
  onFavorite,
}: {
  event: Event;
  favorite: boolean;
  onOpen: () => void;
  onFavorite: () => void;
}) {
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`ดูรายละเอียด ${event.title}`}
        onPress={onOpen}
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <EventImage uri={event.imageUrl} style={{ height: 185 }} />
        <View style={styles.body}>
          <Text style={[ui.badge, { alignSelf: 'flex-start' }]}>{event.category}</Text>
          <Text style={ui.heading}>{event.title}</Text>
          <View style={ui.row}>
            <Ionicons name="location-outline" color={colors.muted} size={15} />
            <Text style={[ui.muted, { flex: 1 }]}>{event.district} · หนองคาย</Text>
          </View>
          <View style={[ui.row, { marginTop: 2 }]}>
            <Ionicons name="calendar-outline" size={15} color={colors.primary} />
            <Text style={[ui.muted, { color: colors.primary, flex: 1 }]}>
              {formatDate(event.startsAt)}
            </Text>
          </View>
        </View>
      </Pressable>
      <Pressable
        onPress={onFavorite}
        accessibilityRole="button"
        accessibilityLabel={`${favorite ? 'นำออกจาก' : 'เพิ่มใน'}รายการโปรด ${event.title}`}
        accessibilityState={{ selected: favorite }}
        style={styles.heart}
      >
        <Ionicons
          name={favorite ? 'heart' : 'heart-outline'}
          size={23}
          color={favorite ? '#C36555' : colors.primary}
        />
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 23,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  body: { padding: 18, gap: 8 },
  heart: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFFF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
