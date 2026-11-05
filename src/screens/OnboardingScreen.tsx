import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PreferencesForm from '../components/PreferencesForm';
import { Button } from '../components/ui';
import { useAuth } from '../store/AuthContext';
import { usePlanner } from '../store/PlannerContext';
import { colors, type } from '../theme';

export default function OnboardingScreen() {
  const { account } = useAuth();
  const { profile, setProfile } = usePlanner();
  const [draft, setDraft] = useState(profile);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={type.title}>Set up your kitchen</Text>
        <Text style={[type.body, { color: colors.muted, marginTop: 6, marginBottom: 26 }]}>
          {account ? `Hi ${account.name.split(' ')[0]}. ` : ''}Tell us how you eat so MealWise can flag meals that do not fit. You can change this anytime in Me.
        </Text>
        <PreferencesForm value={draft} onChange={setDraft} />
        <View style={{ gap: 10, marginTop: 32 }}>
          <Button label="Start planning" onPress={() => setProfile({ ...draft, onboarded: true })} />
          <Button label="Skip for now" kind="ghost" onPress={() => setProfile({ ...profile, onboarded: true })} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 24, paddingTop: 40, paddingBottom: 48 },
});
