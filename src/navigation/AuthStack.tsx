import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import OtpVerifyScreen from '../screens/auth/OtpVerifyScreen';
import { APP_CONFIG } from '../constants/config';
import { AuthStackParamList } from './types';
import { navHeader } from '../components/common/navHeader';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ header: navHeader }}>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Scheme Sarthi' }}
      />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ title: 'Create your account' }}
      />
      {APP_CONFIG.otpVerificationEnabled && (
        <Stack.Screen
          name="OtpVerify"
          component={OtpVerifyScreen}
          options={{ title: 'Verify your email' }}
        />
      )}
    </Stack.Navigator>
  );
}
