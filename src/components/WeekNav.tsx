import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, type } from '../theme';
import { formatRange } from '../utils/dates';

interface Props {
  dates: Date[];
  isCurrentWeek: boolean;
  onShift: (weeks: number) => void;
  onToday: () => void;
}

export default function WeekNav({ dates, isCurrentWeek, onShift, onToday }: Props) {
  return (
    <View style={styles.row}>
      <Text style={type.title}>{formatRange(dates)}</Text>
      <View style={styles.actions}>
        {!isCurrentWeek && (
          <Pressable onPress={onToday} style={styles.today} accessibilityRole="button">
            <Text style={styles.todayText}>Today</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => onShift(-1)}
          style={styles.arrow}
          accessibilityLabel="Previous week"
          hitSlop={6}
        >
          <Ionicons name="chevron-back" size={20} color={colors.pandan} />
        </Pressable>
        <Pressable
          onPress={() => onShift(1)}
          style={styles.arrow}
          accessibilityLabel="Next week"
          hitSlop={6}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.pandan} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arrow: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.pandanSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: {
    paddingHorizontal: 14,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.calamansi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayText: { fontWeight: '800', color: colors.pandanDeep, fontSize: 14 },
});
