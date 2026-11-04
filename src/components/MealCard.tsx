import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MealImage from './MealImage';
import { colors, radius } from '../theme';
import type { MealPreview } from '../types';

interface Props {
  meal: MealPreview;
  width: number;
  favorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}

export default function MealCard({ meal, width, favorite, onPress, onToggleFavorite }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${meal.name}`}
      style={({ pressed }) => [styles.card, { width }, pressed && { opacity: 0.85 }]}
    >
      <View>
        <MealImage uri={meal.thumb} size="medium" style={{ width, height: width * 0.85 }} />
        <Pressable
          onPress={onToggleFavorite}
          hitSlop={8}
          accessibilityLabel={favorite ? 'Remove from saved' : 'Save meal'}
          style={styles.heart}
        >
          <Ionicons
            name={favorite ? 'heart' : 'heart-outline'}
            size={20}
            color={favorite ? colors.sili : colors.ink}
          />
        </Pressable>
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {meal.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  name: { fontSize: 14, fontWeight: '700', color: colors.ink, padding: 10, minHeight: 56 },
  heart: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
