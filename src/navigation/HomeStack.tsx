import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MatchedSchemesScreen from '../screens/home/MatchedSchemesScreen';
import SchemeDetailScreen from '../screens/home/SchemeDetailScreen';
import SchemeQAScreen from '../screens/qa/SchemeQAScreen';
import { HomeStackParamList } from './types';
import { colors } from '../constants/colors';
import HomeScreen from '../screens/home/HomeScreen';

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
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Stack.Screen
        name="AllMatchedSchemes"
        component={MatchedSchemesScreen}
        options={{ title: 'All Matched Schemes' }}
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
