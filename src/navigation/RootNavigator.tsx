import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import AuthStack from './AuthStack';
import MainTabNavigator from './MainTabNavigator';
import { colors } from '../constants/colors';

export default function RootNavigator() {
  const { session, loading } = useAuth();
  useProfile(session?.user.id);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <NavigationContainer>{session ? <MainTabNavigator /> : <AuthStack />}</NavigationContainer>;
}
