import React from 'react';
import { FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import EmptyState from '../components/EmptyState';
import MealCard from '../components/MealCard';
import { usePlanner } from '../store/PlannerContext';
import { type } from '../theme';
import type { MealPreview } from '../types';

export default function SavedScreen({
  onOpenMeal,
  onGoDiscover,
}: {
  onOpenMeal: (meal: MealPreview) => void;
  onGoDiscover: () => void;
}) {
  const { favorites, toggleFavorite } = usePlanner();
  const { width } = useWindowDimensions();
  const cardWidth = (width - 40 - 12) / 2;

  return (
    <FlatList
      data={favorites}
      keyExtractor={(m) => m.id}
      numColumns={2}
      columnWrapperStyle={{ gap: 12 }}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={<Text style={[type.title, { marginBottom: 16 }]}>Saved</Text>}
      ListEmptyComponent={
        <EmptyState
          icon="heart-outline"
          title="No saved meals yet"
          message="Tap the heart on any meal to keep it here for quick planning later."
          actionLabel="Find meals"
          onAction={onGoDiscover}
        />
      }
      renderItem={({ item }) => (
        <MealCard
          meal={item}
          width={cardWidth}
          favorite
          onPress={() => onOpenMeal(item)}
          onToggleFavorite={() => toggleFavorite(item)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, paddingBottom: 130 },
});
