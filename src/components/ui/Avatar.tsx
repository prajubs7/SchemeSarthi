import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, sizes, TypographyVariant } from '../../theme';
import { AppText } from './AppText';
import { Icon } from './Icon';

export type AvatarSize = keyof typeof sizes.avatar;

export interface AvatarProps {
  /** Name or email; initials are taken from it. Falls back to a person icon. */
  name?: string | null;
  size?: AvatarSize;
  style?: StyleProp<ViewStyle>;
}

const textVariant: Record<AvatarSize, TypographyVariant> = {
  sm: 'caption',
  md: 'title',
  lg: 'h2',
};

export function getInitials(name?: string | null): string {
  if (!name) return '';
  const base = name.includes('@') ? name.split('@')[0] : name;
  const parts = base
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return (first + last).toUpperCase();
}

export function Avatar({ name, size = 'md', style }: AvatarProps) {
  const d = sizes.avatar[size];
  const initials = getInitials(name);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={
        name ? `Profile picture for ${name}` : 'Profile picture'
      }
      style={[styles.circle, { width: d, height: d }, style]}
    >
      {initials ? (
        <AppText variant={textVariant[size]} weight="700" color="primary">
          {initials}
        </AppText>
      ) : (
        <Icon
          name="person"
          size={size === 'lg' ? 'lg' : 'md'}
          color="primary"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
