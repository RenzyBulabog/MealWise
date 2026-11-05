import React, { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../../components/EmptyState';
import RecipeEditor from '../../components/RecipeEditor';
import { Button } from '../../components/ui';
import { bus } from '../../events';
import { useAuth } from '../../store/AuthContext';
import { colors, radius, type } from '../../theme';
import type { Meal } from '../../types';

export default function AdminRecipes() {
  const { global, saveFeatured, deleteFeatured } = useAuth();
  const [editor, setEditor] = useState<{ open: boolean; meal: Meal | null }>({ open: false, meal: null });

  const confirmDelete = (m: Meal) =>
    Alert.alert(`Delete ${m.name}?`, 'It disappears from every user\'s Picks tab. Meals users already planned stay in their plans.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteFeatured(m.id);
          bus.emit('toast', { message: `Deleted ${m.name}`, tone: 'info' });
        },
      },
    ]);

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={global.featured}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 16 }}>
            <Text style={type.title}>MealWise picks</Text>
            <Text style={type.small}>Recipes you add here show up in every user's Discover tab under Picks.</Text>
            <Button label="New pick" icon="add" onPress={() => setEditor({ open: true, meal: null })} />
          </View>
        }
        ListEmptyComponent={<EmptyState icon="star-outline" title="No picks yet" message="Add a recipe to share it with all users." />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
              <Text style={type.small} numberOfLines={1}>
                {[item.category, item.area, `${item.ingredients.length} ingredients`].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <Pressable onPress={() => setEditor({ open: true, meal: item })} hitSlop={8} accessibilityLabel="Edit recipe">
              <Ionicons name="create-outline" size={22} color={colors.pandan} />
            </Pressable>
            <Pressable onPress={() => confirmDelete(item)} hitSlop={8} accessibilityLabel="Delete recipe">
              <Ionicons name="trash-outline" size={22} color={colors.sili} />
            </Pressable>
          </View>
        )}
      />

      <RecipeEditor
        visible={editor.open}
        initial={editor.meal}
        source="featured"
        onClose={() => setEditor({ open: false, meal: null })}
        onSave={async (meal) => {
          await saveFeatured(meal);
          setEditor({ open: false, meal: null });
          bus.emit('toast', { message: `Saved ${meal.name}`, tone: 'success' });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 130 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  name: { fontSize: 16, fontWeight: '800', color: colors.ink },
});
