import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import AuthStack from './AuthStack';
import OnboardingStack from './OnboardingStack';
import AppStack from './AppStack';
import { Button, ErrorState, LoadingSpinner } from '../components/ui';
import { colors, navigationTheme, spacing } from '../theme';

export default function RootNavigator() {
  const { session, loading, signOut } = useAuth();
  const profileQuery = useProfile(session?.user.id);

  // Session known but the profile row hasn't arrived yet: stay on the splash
  // so a returning user never sees onboarding flash by.
  if (loading || (session && profileQuery.isPending)) {
    return (
      <SafeAreaView style={styles.splash}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  // Only block when there is nothing to show; a failed background refetch keeps the old data.
  if (session && profileQuery.isError && profileQuery.data === undefined) {
    return (
      <SafeAreaView style={styles.splash}>
        <ErrorState
          message="We couldn't load your profile. Check your connection and try again."
          onRetry={() => profileQuery.refetch()}
        />
        <Button
          title="Sign out"
          variant="ghost"
          onPress={signOut}
          style={styles.signOut}
        />
      </SafeAreaView>
    );
  }

  const profile = profileQuery.data;
  const needsOnboarding = !profile || !profile.age || !profile.state;

  return (
    <NavigationContainer theme={navigationTheme}>
      {!session ? (
        <AuthStack />
      ) : needsOnboarding ? (
        <OnboardingStack />
      ) : (
        <AppStack />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: colors.background },
  signOut: { margin: spacing.gutter },
});
