/* eslint-disable react/no-unstable-nested-components */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import HomeStack from './HomeStack';
import BookmarksScreen from '../screens/bookmarks/BookmarksScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SchemesScreen from '../screens/schemes/SchemesScreen';
import { MainTabParamList } from './types';
import { colors } from '../constants/colors';


const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) =>  <MaterialCommunityIcons name="home" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="SchemeTab"
        component={SchemesScreen}
        options={{
          title: 'Schemes',
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="BookmarksTab"
        component={BookmarksScreen}
        options={{
          title: 'Bookmarks',
          tabBarIcon: ({ color, size }) =>  <MaterialCommunityIcons name="bookmark" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}