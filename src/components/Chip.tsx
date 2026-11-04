import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius } from '../theme';

interface Props {
  label: string;
  active?: boolean;
  onPress: () => void;
  tint?: string;
}

export default function Chip({ label, active, onPress, tint = colors.pandan }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && { backgroundColor: tint, borderColor: tint },
        pressed && { opacity: 0.75 },
      ]}
    >
      <Text style={[styles.text, active && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  text: { fontSize: 14, fontWeight: '600', color: colors.ink },
});
