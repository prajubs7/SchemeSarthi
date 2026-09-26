import React from 'react';
import { StyleSheet } from 'react-native';
import {
  BottomTabNavigationOptions,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomeScreen from '../screens/home/HomeScreen';
import SchemesScreen from '../screens/schemes/SchemesScreen';
import BookmarksScreen from '../screens/bookmarks/BookmarksScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { MainTabParamList } from './types';
import { colors, sizes, spacing, typography } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Outline when idle, filled when active.
const tabIcon =
  (outline: string, filled: string): BottomTabNavigationOptions['tabBarIcon'] =>
  ({ focused, color, size }) =>
    <Ionicons name={focused ? filled : outline} color={color} size={size} />;

export default function MainTabNavigator() {
  const insets = useSafeAreaInsets();

  // TODO(Step 10): replace with unreadCount from useNotifications().
  const unreadCount = 0;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: styles.label,
        tabBarStyle: [
          styles.bar,
          { height: sizes.tabBar + insets.bottom, paddingBottom: insets.bottom },
        ],
        tabBarBadgeStyle: styles.badge,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: tabIcon('home-outline', 'home'),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tab.Screen
        name="SchemeTab"
        component={SchemesScreen}
        options={{
          title: 'Schemes',
          tabBarIcon: tabIcon('document-text-outline', 'document-text'),
        }}
      />
      <Tab.Screen
        name="SavedTab"
        component={BookmarksScreen}
        options={{
          title: 'Saved',
          tabBarIcon: tabIcon('bookmark-outline', 'bookmark'),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: tabIcon('person-outline', 'person'),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopWidth: sizes.borderWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  label: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    fontWeight: typography.caption.fontWeight,
  },
  badge: {
    backgroundColor: colors.accent,
    color: colors.white,
  },
});
