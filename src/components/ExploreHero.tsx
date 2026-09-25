import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { PlaceImage } from './PlaceImage';
import { colors } from '../theme';

export function ExploreHero({ imageUrl }: { imageUrl?: string }) {
  return (
    <View style={styles.hero}>
      <PlaceImage uri={imageUrl || ''} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['#121C160D', '#121C16DB']} style={StyleSheet.absoluteFill} />
      <View style={styles.top}>
        <View style={styles.tag}>
          <Ionicons name="location-outline" size={14} color={colors.text} />
          <Text style={{ color: colors.text, fontSize: 12 }}>หนองคาย, ประเทศไทย</Text>
        </View>
        <Ionicons name="navigate-outline" size={26} color="white" />
      </View>
      <View style={{ gap: 10 }}>
        <Text style={{ color: '#FFFFFFCF', letterSpacing: 2, fontSize: 10 }}>
          YOUR NEXT LITTLE ADVENTURE
        </Text>
        <Text style={styles.title}>
          ออกไปพบ{'\n'}
          <Text style={{ color: colors.accent }}>วันดี ๆ</Text> ที่หนองคาย
        </Text>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Text style={{ color: '#FFFFFFDB', fontSize: 13, flex: 1 }}>
            เลือกสถานที่ แล้วไปทำสิ่งที่ชอบ
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="เปิดแผนที่สถานที่"
            onPress={() => router.push('/(tabs)/map')}
            style={styles.arrow}
          >
            <Ionicons
              name="arrow-up-outline"
              size={24}
              color={colors.text}
              style={{ transform: [{ rotate: '45deg' }] }}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  hero: {
    minHeight: 265,
    borderRadius: 30,
    overflow: 'hidden',
    padding: 22,
    justifyContent: 'space-between',
    gap: 40,
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tag: {
    backgroundColor: '#FFFFFFED',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  title: { color: 'white', fontSize: 30, lineHeight: 42, fontWeight: '700' },
  arrow: {
    width: 48,
    height: 48,
    backgroundColor: colors.accent,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
