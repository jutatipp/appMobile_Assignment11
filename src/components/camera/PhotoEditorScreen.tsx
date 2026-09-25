import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SkImage } from '@shopify/react-native-skia';
import { EdgeInsets } from 'react-native-safe-area-context';
import { FilteredCanvas } from './FilteredCanvas';
import { FilterCarousel } from './FilterCarousel';
import { FilterKey, FilterPreset } from './filterPresets';
import { icon, palette, radius, space, touchTarget, type } from './design';

type Props = {
  image: SkImage | null;
  preset: FilterPreset;
  selectedFilter: FilterKey;
  saving: boolean;
  insets: EdgeInsets;
  onFilterChange: (key: FilterKey) => void;
  onSave: () => void;
  onDiscard: () => void;
  onDelete: () => void;
};

export function PhotoEditorScreen(props: Props) {
  const {
    image,
    preset,
    selectedFilter,
    saving,
    insets,
    onFilterChange,
    onSave,
    onDiscard,
    onDelete,
  } = props;
  return (
    <View style={styles.screen}>
      <View style={[styles.navigation, { paddingTop: insets.top + space.xs }]}>
        <Pressable
          onPress={onDiscard}
          disabled={saving}
          style={({ pressed }) => [styles.navButton, pressed && styles.dim]}
          accessibilityLabel="ย้อนกลับและถ่ายใหม่"
        >
          <Ionicons name="chevron-back" size={icon.md} color={palette.white} />
        </Pressable>
        <View style={styles.navigationIdentity}>
          <Text style={styles.navigationTitle}>แต่งภาพ</Text>
          <Text style={styles.navigationBrand}>NONG KHAI TRIP</Text>
        </View>
        <Pressable
          onPress={onSave}
          disabled={saving || !image}
          style={({ pressed }) => [styles.saveButton, (pressed || saving || !image) && styles.dim]}
          accessibilityLabel="บันทึกภาพความทรงจำในทริป"
        >
          {saving ? (
            <ActivityIndicator size="small" color={palette.ink} />
          ) : (
            <>
              <Ionicons name="checkmark" size={icon.sm} color={palette.ink} />
              <Text style={styles.saveText}>บันทึก</Text>
            </>
          )}
        </Pressable>
      </View>

      <View style={styles.preview}>
        <FilteredCanvas image={image} matrix={preset.matrix} />
      </View>

      <View style={[styles.tools, { paddingBottom: Math.max(insets.bottom, space.sm) }]}>
        <View style={styles.filterInfo}>
          <View>
            <Text style={styles.filterName}>{preset.title}</Text>
            <Text style={styles.filterCaption}>{preset.caption}</Text>
          </View>
          <Text style={styles.step}>เลือกโทน</Text>
        </View>
        {image ? (
          <FilterCarousel
            image={image}
            value={selectedFilter}
            onChange={onFilterChange}
            disabled={saving}
          />
        ) : (
          <View style={styles.loadingStrip}>
            <ActivityIndicator color={palette.cyan} />
            <Text style={styles.loadingText}>กำลังเตรียมภาพ…</Text>
          </View>
        )}
        <View style={styles.bottomActions}>
          <Pressable
            onPress={onDiscard}
            disabled={saving}
            style={({ pressed }) => [styles.secondaryAction, (pressed || saving) && styles.dim]}
            accessibilityLabel="ถ่ายรูปใหม่"
          >
            <Ionicons name="camera-reverse-outline" size={icon.md} color={palette.white} />
            <Text style={styles.secondaryText}>ถ่ายใหม่</Text>
          </Pressable>
          <Pressable
            onPress={onDelete}
            disabled={saving}
            style={({ pressed }) => [styles.deleteAction, (pressed || saving) && styles.dim]}
            accessibilityLabel="ลบรูป"
          >
            <Ionicons name="trash-outline" size={icon.md} color={palette.danger} />
            <Text style={styles.deleteText}>ลบรูป</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.ink },
  navigation: {
    minHeight: 58,
    paddingHorizontal: space.md,
    paddingBottom: space.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: touchTarget,
    height: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  navigationIdentity: {
    position: 'absolute',
    left: 96,
    right: 96,
    bottom: 10,
    alignItems: 'center',
  },
  navigationTitle: {
    color: palette.white,
    fontSize: type.title,
    fontWeight: '800',
    textAlign: 'center',
  },
  navigationBrand: {
    color: palette.muted,
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: '800',
    marginTop: 1,
  },
  saveButton: {
    minWidth: 92,
    height: 42,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    backgroundColor: palette.cyan,
  },
  saveText: { color: palette.ink, fontSize: type.body, fontWeight: '900' },
  preview: { flex: 1, minHeight: 180, backgroundColor: '#000' },
  tools: { backgroundColor: palette.panel, paddingTop: space.md },
  filterInfo: {
    minHeight: 48,
    paddingHorizontal: space.lg,
    marginBottom: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterName: { color: palette.white, fontSize: type.title, fontWeight: '800' },
  filterCaption: { color: palette.muted, fontSize: type.caption, marginTop: 2 },
  step: { color: palette.cyan, fontSize: type.caption, fontWeight: '800' },
  loadingStrip: {
    height: 112,
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { color: palette.muted, fontSize: type.caption },
  bottomActions: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.md,
    paddingHorizontal: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.line,
    paddingTop: space.sm,
  },
  secondaryAction: {
    flex: 1,
    minHeight: touchTarget,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.panelRaised,
  },
  deleteAction: {
    minWidth: 112,
    minHeight: touchTarget,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: space.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: palette.white,
    fontSize: type.body,
    fontWeight: '700',
  },
  deleteText: { color: palette.danger, fontSize: type.body, fontWeight: '700' },
  dim: { opacity: 0.48 },
});
