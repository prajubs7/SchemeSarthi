import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors, ColorToken, IconSize, sizes } from '../../theme';

/** An Ionicons glyph name, e.g. 'notifications-outline'. */
export type IconName = string;

export interface IconProps {
  name: IconName;
  size?: IconSize;
  color?: ColorToken;
  style?: StyleProp<TextStyle>;
}

/** Ionicons with token-based size and colour. Decorative, so hidden from screen readers. */
export function Icon({ name, size = 'md', color = 'text', style }: IconProps) {
  return (
    <Ionicons
      name={name}
      size={sizes.icon[size]}
      color={colors[color]}
      style={style}
      accessible={false}
      importantForAccessibility="no"
    />
  );
}
