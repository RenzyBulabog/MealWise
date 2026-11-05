import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Alert,
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
import MealImage from '../components/MealImage';
import RecipeEditor from '../components/RecipeEditor';
import { Button, Segmented } from '../components/ui';
import {
  filterByArea,
  filterByCategory,
  filterByIngredient,
  listAreas,
  listCategories,
  randomMeal,
  searchMeals,
} from '../api/mealdb';
import { bus } from '../events';
import { useAuth } from '../store/AuthContext';
import { usePlanner } from '../store/PlannerContext';
import { colors, radius, slotMeta, type } from '../theme';
import type { Meal, MealPreview, Target } from '../types';
import { formatDay } from '../utils/dates';

type Seg = 'browse' | 'saved' | 'mine' | 'picks';
type Filter = { kind: 'category' | 'area' | 'ingredient'; value: string };

const FALLBACK_CATEGORIES = ['Chicken', 'Beef', 'Pork', 'Seafood', 'Vegetarian', 'Pasta', 'Breakfast', 'Dessert'];
const FALLBACK_AREAS = ['Filipino', 'American', 'Chinese', 'Japanese', 'Thai', 'Italian', 'Indian'];

interface Props {
  target: Target | null;
  /** n changes every time so the same ingredient can be requested again */
  ingredient: { name: string; n: number } | null;
  onClearTarget: () => void;
  onClearIngredient: () => void;
  onOpenMeal: (meal: MealPreview) => void;
}

export default function DiscoverScreen({ target, ingredient, onClearTarget, onClearIngredient, onOpenMeal }: Props) {
  const { isFavorite, toggleFavorite, favorites, custom, saveCustom, deleteCustom } = usePlanner();
  const { global } = useAuth();
  const { width } = useWindowDimensions();
  const cardWidth = (width - 40 - 12) / 2;

  const [seg, setSeg] = useState<Seg>('browse');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>({ kind: 'category', value: 'Chicken' });
  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);
  const [areas, setAreas] = useState<string[]>(FALLBACK_AREAS);
  const [results, setResults] = useState<MealPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [surprising, setSurprising] = useState(false);
  const [retry, setRetry] = useState(0);
  const [editor, setEditor] = useState<{ open: boolean; meal: Meal | null }>({ open: false, meal: null });
  const requestId = useRef(0);

  useEffect(() => {
    listCategories().then(setCategories).catch(() => {});
    listAreas().then((a) => a.length && setAreas(a)).catch(() => {});
  }, []);

  // Event: the pantry asked for recipes with an ingredient.
  useEffect(() => {
    if (ingredient) {
      setSeg('browse');
      setQuery('');
      setFilter({ kind: 'ingredient', value: ingredient.name });
    }
  }, [ingredient]);

  // Re-runs on every change to the search text or filter.
  // The debounce waits for the user to stop typing; requestId ignores stale responses.
  useEffect(() => {
    const q = query.trim();
    const id = ++requestId.current;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        let data: MealPreview[];
        if (q) data = await searchMeals(q);
        else if (filter.kind === 'area') data = await filterByArea(filter.value);
        else if (filter.kind === 'ingredient') data = await filterByIngredient(filter.value);
        else data = await filterByCategory(filter.value);
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
  }, [query, filter, retry]);

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

  const confirmDelete = (meal: Meal) =>
    Alert.alert(`Delete ${meal.name}?`, 'Meals already in your plan stay there.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCustom(meal.id) },
    ]);

  const searching = query.trim().length > 0;

  const grid = (data: MealPreview[], empty: React.ReactElement) => (
    <FlatList
      data={data}
      keyExtractor={(m) => m.id}
      numColumns={2}
      columnWrapperStyle={{ gap: 12 }}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={empty}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      renderItem={({ item }) => (
        <MealCard
          meal={item}
          width={cardWidth}
          favorite={isFavorite(item.id)}
          onPress={() => onOpenMeal(item)}
          onToggleFavorite={() => toggleFavorite(item)}
        />
      )}
    />
  );

  const rows = (data: Meal[], editable: boolean, empty: React.ReactElement) => (
    <FlatList
      data={data}
      keyExtractor={(m) => m.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={empty}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      renderItem={({ item }) => (
        <Pressable onPress={() => onOpenMeal(item)} style={styles.rowCard} accessibilityRole="button">
          <MealImage uri={item.thumb} name={item.name} size="small" style={styles.rowImg} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowName} numberOfLines={2}>{item.name}</Text>
            <Text style={type.small} numberOfLines={1}>
              {[item.category, item.area, item.calories ? `${item.calories} kcal` : ''].filter(Boolean).join(' · ')}
            </Text>
          </View>
          {editable && (
            <>
              <Pressable onPress={() => setEditor({ open: true, meal: item })} hitSlop={8} accessibilityLabel="Edit recipe">
                <Ionicons name="create-outline" size={22} color={colors.pandan} />
              </Pressable>
              <Pressable onPress={() => confirmDelete(item)} hitSlop={8} accessibilityLabel="Delete recipe">
                <Ionicons name="trash-outline" size={22} color={colors.sili} />
              </Pressable>
            </>
          )}
        </Pressable>
      )}
    />
  );

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

        <Segmented
          options={[
            { key: 'browse' as Seg, label: 'Browse' },
            { key: 'saved' as Seg, label: 'Saved' },
            { key: 'mine' as Seg, label: 'Mine' },
            { key: 'picks' as Seg, label: 'Picks' },
          ]}
          value={seg}
          onChange={setSeg}
        />

        {seg === 'browse' && (
          <>
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
                {surprising ? <ActivityIndicator color={colors.pandanDeep} /> : <Ionicons name="shuffle" size={22} color={colors.pandanDeep} />}
              </Pressable>
            </View>

            {filter.kind === 'ingredient' && !searching && (
              <View style={styles.banner}>
                <Ionicons name="basket-outline" size={18} color={colors.pandanDeep} />
                <Text style={styles.bannerText} numberOfLines={1}>Meals with {filter.value}</Text>
                <Pressable
                  onPress={() => {
                    onClearIngredient();
                    setFilter({ kind: 'category', value: 'Chicken' });
                  }}
                  hitSlop={8}
                >
                  <Text style={styles.bannerCancel}>Clear</Text>
                </Pressable>
              </View>
            )}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
              {categories.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  active={!searching && filter.kind === 'category' && filter.value === c}
                  onPress={() => {
                    setQuery('');
                    setFilter({ kind: 'category', value: c });
                  }}
                />
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
              {areas.map((a) => (
                <Chip
                  key={a}
                  label={a}
                  tint={colors.ube}
                  active={!searching && filter.kind === 'area' && filter.value === a}
                  onPress={() => {
                    setQuery('');
                    setFilter({ kind: 'area', value: a });
                  }}
                />
              ))}
            </ScrollView>
          </>
        )}

        {seg === 'mine' && (
          <Button label="New recipe" icon="add" onPress={() => setEditor({ open: true, meal: null })} />
        )}
      </View>

      {seg === 'browse' &&
        (loading && results.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.pandan} />
          </View>
        ) : error ? (
          <EmptyState icon="cloud-offline-outline" title="Couldn't load meals" message={error} actionLabel="Try again" onAction={() => setRetry((n) => n + 1)} />
        ) : (
          grid(
            results,
            <EmptyState
              icon="search-outline"
              title="No meals found"
              message={searching ? `Nothing matches "${query.trim()}". Try a shorter word like "chicken", or pick a category.` : 'Nothing here yet. Try another category or cuisine.'}
            />
          )
        ))}

      {seg === 'saved' &&
        grid(favorites, <EmptyState icon="heart-outline" title="No saved meals yet" message="Tap the heart on any meal to keep it here for quick planning later." />)}

      {seg === 'mine' &&
        rows(custom, true, <EmptyState icon="restaurant-outline" title="No recipes of your own yet" message="Add the dishes your family makes, then plan them like any other meal." />)}

      {seg === 'picks' &&
        rows(global.featured, false, <EmptyState icon="star-outline" title="No picks yet" message="Recipes chosen by the MealWise admin will show up here." />)}

      <RecipeEditor
        visible={editor.open}
        initial={editor.meal}
        source="custom"
        onClose={() => setEditor({ open: false, meal: null })}
        onSave={(meal) => {
          saveCustom(meal);
          setEditor({ open: false, meal: null });
          bus.emit('toast', { message: `Saved ${meal.name}`, tone: 'success' });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 20, gap: 14 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: radius.md, backgroundColor: colors.calamansiSoft },
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
  dice: { width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.calamansi, alignItems: 'center', justifyContent: 'center' },
  chips: { gap: 8, paddingBottom: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 20, paddingBottom: 130 },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  rowImg: { width: 56, height: 56, borderRadius: radius.sm },
  rowName: { fontSize: 16, fontWeight: '700', color: colors.ink },
});
