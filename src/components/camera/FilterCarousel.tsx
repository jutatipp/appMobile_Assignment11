import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Canvas, ColorMatrix, Image, SkImage } from '@shopify/react-native-skia';
import { Ionicons } from '@expo/vector-icons';
import { FILTER_PRESETS, FilterKey, FilterPreset } from './filterPresets';
import { icon, palette, radius, space, type } from './design';

type Props = {
  image: SkImage;
  value: FilterKey;
  onChange: (key: FilterKey) => void;
  disabled: boolean;
};

export function FilterCarousel({ image, value, onChange, disabled }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
    >
      {FILTER_PRESETS.map((preset) => (
        <FilterThumbnail
          key={preset.key}
          image={image}
          preset={preset}
          selected={value === preset.key}
          disabled={disabled}
          onPress={() => onChange(preset.key)}
        />
      ))}
    </ScrollView>
  );
}

function FilterThumbnail({
  image,
  preset,
  selected,
  disabled,
  onPress,
}: {
  image: SkImage;
  preset: FilterPreset;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`เลือกฟิลเตอร์${preset.title}`}
      accessibilityState={{ selected, disabled }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.item,
        selected && styles.itemSelected,
        (pressed || disabled) && styles.dim,
      ]}
    >
      <View
        pointerEvents="none"
        onLayout={({ nativeEvent }) => setSize(nativeEvent.layout)}
        style={styles.thumbnail}
      >
        {size.width > 0 && size.height > 0 && (
          <Canvas style={size}>
            <Image image={image} x={0} y={0} width={size.width} height={size.height} fit="cover">
              <ColorMatrix matrix={preset.matrix} />
            </Image>
          </Canvas>
        )}
        {selected && (
          <View style={styles.check}>
            <Ionicons name="checkmark" size={icon.sm} color={palette.ink} />
          </View>
        )}
      </View>
      <Text style={[styles.name, selected && styles.nameSelected]}>{preset.title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: space.lg, gap: space.md },
  item: {
    width: 96,
    minHeight: 124,
    padding: 6,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  itemSelected: {
    borderColor: palette.cyan,
    backgroundColor: palette.cyanDark,
  },
  thumbnail: {
    width: 80,
    height: 88,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: palette.panelRaised,
  },
  check: {
    position: 'absolute',
    right: 5,
    top: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.cyan,
  },
  name: {
    color: palette.muted,
    fontSize: type.caption,
    fontWeight: '700',
    marginTop: space.xs,
  },
  nameSelected: { color: palette.cyan },
  dim: { opacity: 0.55 },
});
