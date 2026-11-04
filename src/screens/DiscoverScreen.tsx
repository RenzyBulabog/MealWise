import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Chip from '../components/Chip';
import EmptyState from '../components/EmptyState';
import MealCard from '../components/MealCard';
import { filterByCategory, listCategories, randomMeal, searchMeals } from '../api/mealdb';
import { bus } from '../events';
import { usePlanner } from '../store/PlannerContext';
import { colors, radius, slotMeta, type } from '../theme';
import type { MealPreview, Target } from '../types';
import { formatDay } from '../utils/dates';

const FALLBACK_CATEGORIES = ['Chicken', 'Beef', 'Pork', 'Seafood', 'Vegetarian', 'Pasta', 'Breakfast', 'Dessert'];

interface Props {
  target: Target | null;
  onClearTarget: () => void;
  onOpenMeal: (meal: MealPreview) => void;
}

export default function DiscoverScreen({ target, onClearTarget, onOpenMeal }: Props) {
  const { isFavorite, toggleFavorite } = usePlanner();
  const { width } = useWindowDimensions();
  const cardWidth = (width - 40 - 12) / 2;

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Chicken');
  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);
  const [results, setResults] = useState<MealPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [surprising, setSurprising] = useState(false);
  const [retry, setRetry] = useState(0);
  const requestId = useRef(0);

  useEffect(() => {
    listCategories().then(setCategories).catch(() => {});
  }, []);

  // Re-runs on every change to the search text or category.
  // The debounce waits for the user to stop typing; requestId ignores stale responses.
  useEffect(() => {
    const q = query.trim();
    const id = ++requestId.current;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = q ? await searchMeals(q) : await filterByCategory(category);
        if (id === requestId.current) setResults(data);
      } catch (e) {
        if (id === requestId.current) {
          setResults([]);
          setError(e instanceof Error ? e.message : 'Something went wrong.');
        }
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    };
    const timer = setTimeout(run, q ? 400 : 0);
    return () => clearTimeout(timer);
  }, [query, category, retry]);

  const surprise = async () => {
    setSurprising(true);
    try {
      onOpenMeal(await randomMeal());
    } catch (e) {
      bus.emit('toast', { message: e instanceof Error ? e.message : 'Could not pick a meal.', tone: 'danger' });
    } finally {
      setSurprising(false);
    }
  };

  const searching = query.trim().length > 0;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={type.title}>Discover</Text>

        {target && (
          <View style={styles.banner}>
            <Ionicons name={slotMeta[target.slot].icon} size={18} color={colors.pandanDeep} />
            <Text style={styles.bannerText} numberOfLines={1}>
              Choose {slotMeta[target.slot].label.toLowerCase()} for {formatDay(target.date)}
            </Text>
            <Pressable onPress={onClearTarget} hitSlop={8} accessibilityRole="button">
              <Text style={styles.bannerCancel}>Cancel</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.searchRow}>
          <View style={styles.search}>
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => Keyboard.dismiss()}
              placeholder="Search adobo, sinigang, pancit"
              placeholderTextColor={colors.muted}
              returnKeyType="search"
              autoCorrect={false}
              style={styles.input}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={surprise}
            disabled={surprising}
            accessibilityLabel="Surprise me"
            style={({ pressed }) => [styles.dice, pressed && { opacity: 0.8 }]}
          >
            {surprising ? (
              <ActivityIndicator color={colors.pandanDeep} />
            ) : (
              <Ionicons name="shuffle" size={22} color={colors.pandanDeep} />
            )}
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          keyboardShouldPersistTaps="handled"
        >
          {categories.map((c) => (
            <Chip
              key={c}
              label={c}
              active={!searching && c === category}
              onPress={() => {
                setQuery('');
                setCategory(c);
              }}
            />
          ))}
        </ScrollView>
      </View>

      {loading && results.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.pandan} />
        </View>
      ) : error ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Couldn't load meals"
          message={error}
          actionLabel="Try again"
          onAction={() => setRetry((n) => n + 1)}
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(m) => m.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="No meals found"
              message={`Nothing matches "${query.trim()}". Try a shorter word like "chicken", or pick a category.`}
            />
          }
          renderItem={({ item }) => (
            <MealCard
              meal={item}
              width={cardWidth}
              favorite={isFavorite(item.id)}
              onPress={() => onOpenMeal(item)}
              onToggleFavorite={() => toggleFavorite(item)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 20, gap: 14 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: colors.calamansiSoft,
  },
  bannerText: { flex: 1, fontWeight: '700', color: colors.pandanDeep, fontSize: 14 },
  bannerCancel: { fontWeight: '800', color: colors.sili, fontSize: 14 },
  searchRow: { flexDirection: 'row', gap: 10 },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  input: { flex: 1, fontSize: 15, color: colors.ink, paddingVertical: 0 },
  dice: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.calamansi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { gap: 8, paddingBottom: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 20, paddingBottom: 130 },
});
