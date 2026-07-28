import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MatchedSchemesScreen from '../screens/home/MatchedSchemesScreen';
import SchemeDetailScreen from '../screens/home/SchemeDetailScreen';
import SchemeQAScreen from '../screens/qa/SchemeQAScreen';
import { HomeStackParamList } from './types';
import { colors } from '../constants/colors';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen
        name="MatchedSchemes"
        component={MatchedSchemesScreen}
        options={{ title: 'Your Matched Schemes' }}
      />
      <Stack.Screen
        name="SchemeDetail"
        component={SchemeDetailScreen}
        options={{ title: 'Scheme Details' }}
      />
      <Stack.Screen
        name="SchemeQA"
        component={SchemeQAScreen}
        options={({ route }) => ({ title: route.params.schemeTitle })}
      />
    </Stack.Navigator>
  );
}
