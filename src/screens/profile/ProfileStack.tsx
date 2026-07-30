import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../../constants/colors';
import ProfileScreen from './ProfileScreen';
import ProfileSetupScreen from '../onboarding/ProfileSetupScreen';


export type ProfileStackParamList = {
  ProfileView: undefined;
  ProfileSetup: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen name="ProfileView" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} options={{ title: 'Edit Profile' }} />
    </Stack.Navigator>
  );
}
