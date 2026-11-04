import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, type } from '../theme';
import type { IconName } from '../theme';

interface Props {
  icon: IconName;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.circle}>
        <Ionicons name={icon} size={30} color={colors.pandan} />
      </View>
      <Text style={[type.h2, { textAlign: 'center' }]}>{title}</Text>
      <Text style={[type.body, { textAlign: 'center', color: colors.muted }]}>{message}</Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} style={styles.btn} accessibilityRole="button">
          <Text style={styles.btnText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 10, paddingHorizontal: 32, paddingVertical: 48 },
  circle: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.pandanSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  btn: {
    marginTop: 8,
    backgroundColor: colors.pandan,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: radius.pill,
  },
  btnText: { color: colors.white, fontWeight: '800', fontSize: 15 },
});
