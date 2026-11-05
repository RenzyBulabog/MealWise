import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from './src/components/Toast';
import AuthScreen from './src/screens/AuthScreen';
import AdminShell from './src/screens/admin/AdminShell';
import UserShell from './src/screens/UserShell';
import { AuthProvider, useAuth } from './src/store/AuthContext';
import { PlannerProvider } from './src/store/PlannerContext';
import { colors } from './src/theme';

/** Decides what to show: loading, sign in, the admin side, or the user side. */
function Root() {
  const { ready, account } = useAuth();

  let content: React.ReactNode;
  if (!ready) {
    content = (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.pandan} />
      </View>
    );
  } else if (!account) {
    content = <AuthScreen />;
  } else if (account.role === 'admin') {
    content = <AdminShell />;
  } else {
    // key= makes sure every user gets their own fresh planner data.
    content = (
      <PlannerProvider key={account.id} userId={account.id}>
        <UserShell />
      </PlannerProvider>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      {content}
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
