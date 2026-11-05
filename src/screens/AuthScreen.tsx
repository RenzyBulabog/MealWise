import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Segmented, TextField } from '../components/ui';
import { useAuth } from '../store/AuthContext';
import { colors, radius, type } from '../theme';

type Mode = 'login' | 'register';

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const err = mode === 'login' ? await login(email, password) : await register(name, email, password);
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <Text style={styles.logoText}>M</Text>
          </View>
          <Text style={[type.title, { marginTop: 18 }]}>MealWise</Text>
          <Text style={[type.body, { color: colors.muted, marginTop: 4 }]}>
            Plan your week, cook with less stress, and shop once.
          </Text>

          <View style={{ marginTop: 28 }}>
            <Segmented
              options={[
                { key: 'login' as Mode, label: 'Sign in' },
                { key: 'register' as Mode, label: 'Create account' },
              ]}
              value={mode}
              onChange={(m) => {
                setMode(m);
                setError(null);
              }}
            />
          </View>

          <View style={{ gap: 14, marginTop: 20 }}>
            {mode === 'register' && (
              <TextField label="Name" value={name} onChangeText={setName} autoCapitalize="words" placeholder="Juan dela Cruz" />
            )}
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCorrect={false}
              placeholder="you@example.com"
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder={mode === 'register' ? 'At least 8 characters, letters and numbers' : 'Your password'}
              onSubmitEditing={submit}
            />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Button label={mode === 'login' ? 'Sign in' : 'Create account'} onPress={submit} loading={busy} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 24, paddingTop: 48 },
  logo: { width: 64, height: 64, borderRadius: radius.lg, backgroundColor: colors.pandan, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: colors.calamansi, fontSize: 34, fontWeight: '800' },
  error: { color: colors.sili, fontWeight: '700', fontSize: 14 },
});
