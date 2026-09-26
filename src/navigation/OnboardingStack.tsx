import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileSetupScreen from '../screens/profile/ProfileSetupScreen';
import { OnboardingStackParamList } from './types';
import { stackScreenOptions } from '../theme';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

// Once the profile is saved, RootNavigator swaps this for AppStack, so there is nothing to go back to.
export default function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="ProfileSetup"
        component={ProfileSetupScreen}
        initialParams={{ mode: 'onboarding' }}
        options={{
          title: 'Set up your profile',
          headerBackVisible: false,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}
