import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HomeStack from './HomeStack';
import BookmarksScreen from '../screens/bookmarks/BookmarksScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
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
          tabBarIcon: ({ color, size }) => <Icon name="home-outline" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="BookmarksTab"
        component={BookmarksScreen}
        options={{
          title: 'Bookmarks',
          tabBarIcon: ({ color, size }) => <Icon name="bookmark-outline" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Icon name="account-outline" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
