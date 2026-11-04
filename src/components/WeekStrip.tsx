import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, slotMeta } from '../theme';
import { SLOT_ORDER, type Plan } from '../types';
import { dayShort, toISO } from '../utils/dates';

interface Props {
  dates: Date[];
  selected: string;
  today: string;
  plan: Plan;
  onSelect: (iso: string) => void;
}

/** Seven day pills. The four dots under each day light up in the slot's color once a meal is planned. */
export default function WeekStrip({ dates, selected, today, plan, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {dates.map((d) => {
        const iso = toISO(d);
        const active = iso === selected;
        const isToday = iso === today;
        const day = plan[iso] ?? {};
        return (
          <Pressable
            key={iso}
            onPress={() => onSelect(iso)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={[styles.dayName, active && styles.onActive]}>{dayShort(d)}</Text>
            <View style={[styles.dateWrap, isToday && !active && styles.todayRing]}>
              <Text style={[styles.dateNum, active && styles.onActive]}>{d.getDate()}</Text>
            </View>
            <View style={styles.dots}>
              {SLOT_ORDER.map((s) => (
                <View
                  key={s}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: day[s]
                        ? slotMeta[s].color
                        : active
                        ? 'rgba(255,255,255,0.3)'
                        : colors.line,
                    },
                  ]}
                />
              ))}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pillActive: { backgroundColor: colors.pandan, borderColor: colors.pandan },
  dayName: { fontSize: 12, fontWeight: '600', color: colors.muted },
  dateWrap: {
    marginVertical: 4,
    minWidth: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  todayRing: { borderColor: colors.calamansi },
  dateNum: { fontSize: 16, fontWeight: '800', color: colors.ink },
  onActive: { color: colors.white },
  dots: { flexDirection: 'row', flexWrap: 'wrap', width: 18, gap: 3, justifyContent: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
