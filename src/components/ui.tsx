import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import type { IconName } from '../theme';

export function TextField({
  label,
  error,
  style,
  ...rest
}: TextInputProps & { label?: string; error?: string | null }) {
  return (
    <View style={{ gap: 6 }}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        {...rest}
        style={[styles.input, rest.multiline && styles.multiline, !!error && { borderColor: colors.sili }, style]}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

type Kind = 'primary' | 'soft' | 'danger' | 'ghost';

const KIND: Record<Kind, { bg: string; fg: string }> = {
  primary: { bg: colors.pandan, fg: colors.white },
  soft: { bg: colors.pandanSoft, fg: colors.pandan },
  danger: { bg: colors.siliSoft, fg: colors.sili },
  ghost: { bg: 'transparent', fg: colors.muted },
};

export function Button({
  label,
  onPress,
  kind = 'primary',
  icon,
  loading,
  disabled,
  small,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: Kind;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const k = KIND[kind];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        { backgroundColor: k.bg },
        (disabled || loading) && { opacity: 0.55 },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={k.fg} />
      ) : (
        icon && <Ionicons name={icon} size={small ? 16 : 18} color={k.fg} />
      )}
      <Text style={[styles.btnText, small && { fontSize: 13 }, { color: k.fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <View style={styles.seg}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.segItem, active && styles.segActive]}
          >
            <Text style={[styles.segText, active && { color: colors.white }]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ProgressBar({ value, color = colors.pandan }: { value: number; color?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '700', color: colors.ink },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    fontSize: 15,
    color: colors.ink,
  },
  multiline: { minHeight: 96, paddingTop: 12, textAlignVertical: 'top' },
  error: { fontSize: 13, color: colors.sili },
  btn: {
    height: 50,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSmall: { height: 38, paddingHorizontal: 14 },
  btnText: { fontSize: 15, fontWeight: '800' },
  seg: { flexDirection: 'row', padding: 4, gap: 4, borderRadius: radius.pill, backgroundColor: colors.pandanSoft },
  segItem: { flex: 1, height: 38, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  segActive: { backgroundColor: colors.pandan },
  segText: { fontSize: 13, fontWeight: '800', color: colors.pandan },
  track: { height: 10, borderRadius: radius.pill, backgroundColor: colors.pandanSoft, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  card: { padding: 16, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, gap: 10 },
});
