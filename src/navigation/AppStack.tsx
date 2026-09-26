import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabNavigator from './MainTabNavigator';
import SchemeDetailScreen from '../screens/home/SchemeDetailScreen';
import SchemeQAScreen from '../screens/qa/SchemeQAScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileSetupScreen from '../screens/profile/ProfileSetupScreen';
import MatchedSchemesScreen from '../screens/home/MatchedSchemesScreen';
import { RootStackParamList } from './types';
import { stackScreenOptions } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SchemeDetail"
        component={SchemeDetailScreen}
        options={{ title: 'Scheme details' }}
      />
      <Stack.Screen
        name="SchemeQA"
        component={SchemeQAScreen}
        options={({ route }) => ({ title: route.params.schemeTitle })}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen
        name="ProfileSetup"
        component={ProfileSetupScreen}
        options={{ title: 'Edit profile' }}
      />
      <Stack.Screen
        name="AllMatchedSchemes"
        component={MatchedSchemesScreen}
        options={{ title: 'Your matched schemes' }}
      />
      {__DEV__ && (
        <Stack.Screen
          name="ComponentGallery"
          getComponent={() => require('../screens/dev/ComponentGallery').default}
          options={{ title: 'Component gallery' }}
        />
      )}
    </Stack.Navigator>
  );
}
