import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, ui } from '../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
export function Button({
  title,
  onPress,
  loading = false,
  secondary = false,
  icon,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  secondary?: boolean;
  icon?: IconName;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 52,
        borderRadius: 15,
        padding: 14,
        backgroundColor: secondary ? '#EAF1E2' : colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,
        opacity: pressed || disabled || loading ? 0.6 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? colors.primary : 'white'} />
      ) : icon ? (
        <Ionicons name={icon} size={20} color={secondary ? colors.primary : 'white'} />
      ) : null}
      <Text
        style={{
          color: secondary ? colors.primary : 'white',
          fontSize: 15,
          fontWeight: '700',
          flexShrink: 1,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View>
      <Text style={ui.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        accessibilityLabel={label}
        {...props}
        style={[
          ui.input,
          props.multiline && { minHeight: 110, textAlignVertical: 'top' },
          props.style,
        ]}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" style={ui.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
export function EmptyState({
  title,
  description,
  action,
  icon = 'leaf-outline',
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: IconName;
}) {
  return (
    <View style={{ padding: 28, gap: 14, alignItems: 'center' }}>
      <View style={{ padding: 20, borderRadius: 30, backgroundColor: '#EAF1E2' }}>
        <Ionicons name={icon} size={32} color={colors.primary} />
      </View>
      <Text style={[ui.heading, { textAlign: 'center' }]}>{title}</Text>
      <Text style={[ui.muted, { textAlign: 'center' }]}>{description}</Text>
      {action}
    </View>
  );
}
export function Loading() {
  return (
    <View style={[ui.page, { justifyContent: 'center', gap: 12 }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[ui.muted, { textAlign: 'center' }]}>กำลังเตรียมข้อมูล…</Text>
    </View>
  );
}
