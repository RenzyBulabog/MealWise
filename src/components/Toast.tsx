import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bus } from '../events';
import { colors, floating, radius, slotMeta } from '../theme';
import { formatDay } from '../utils/dates';

interface ToastItem {
  message: string;
  tone: 'success' | 'info' | 'danger';
  action?: { label: string; run: () => void };
}

/**
 * Listens to events on the bus and shows a short message.
 * Nothing calls it directly: it only reacts to events.
 */
export default function Toast() {
  const insets = useSafeAreaInsets();
  const [item, setItem] = useState<ToastItem | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(({ finished }) => {
      if (finished) setItem(null);
    });
  }, [anim]);

  const show = useCallback(
    (t: ToastItem) => {
      if (timer.current) clearTimeout(timer.current);
      setItem(t);
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, bounciness: 6 }).start();
      timer.current = setTimeout(hide, t.action ? 5000 : 2600);
    },
    [anim, hide]
  );

  useEffect(() => {
    const offs = [
      bus.on('meal:added', ({ meal, date, slot, replaced }) =>
        show({
          tone: 'success',
          message: `${replaced ? 'Replaced with' : 'Added'} ${meal.name} · ${formatDay(date)} ${slotMeta[slot].label.toLowerCase()}`,
        })
      ),
      bus.on('meal:removed', ({ meal, undo }) =>
        show({ tone: 'info', message: `Removed ${meal.name}`, action: { label: 'Undo', run: undo } })
      ),
      bus.on('meal:cooked', ({ meal, cooked }) =>
        show({ tone: 'success', message: cooked ? `Marked ${meal.name} as cooked` : `${meal.name} is back on the to-cook list` })
      ),
      bus.on('favorite:toggled', ({ meal, saved }) =>
        show({ tone: 'info', message: saved ? `Saved ${meal.name}` : `Removed ${meal.name} from saved` })
      ),
      bus.on('auth:signedIn', ({ name }) => show({ tone: 'success', message: `Welcome, ${name.split(' ')[0]}` })),
      bus.on('auth:signedOut', () => show({ tone: 'info', message: 'You are signed out' })),
      bus.on('toast', ({ message, tone }) => show({ message, tone: tone ?? 'info' })),
    ];
    return () => {
      offs.forEach((off) => off());
      if (timer.current) clearTimeout(timer.current);
    };
  }, [show]);

  if (!item) return null;

  const bg = item.tone === 'danger' ? colors.sili : colors.pandanDeep;
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { bottom: Math.max(insets.bottom, 12) + 78 },
        { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
      ]}
    >
      <Pressable onPress={hide} style={[styles.toast, floating, { backgroundColor: bg }]} accessibilityRole="alert">
        <Text style={styles.msg} numberOfLines={2}>
          {item.message}
        </Text>
        {item.action && (
          <Pressable
            onPress={() => {
              item.action?.run();
              hide();
            }}
            hitSlop={8}
          >
            <Text style={styles.action}>{item.action.label}</Text>
          </Pressable>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 18, paddingVertical: 14, borderRadius: radius.md, width: '100%' },
  msg: { flex: 1, color: colors.white, fontSize: 14, fontWeight: '600' },
  action: { color: colors.calamansi, fontWeight: '800', fontSize: 14 },
});
