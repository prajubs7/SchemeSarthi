import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, IconSize, radius, sizes } from '../../theme';
import { Icon, IconName } from './Icon';
import { Tone, toneColors } from './tones';

export interface IconCircleProps {
  icon: IconName;
  tone?: Tone;
  size?: keyof typeof sizes.iconCircle;
  style?: StyleProp<ViewStyle>;
}

const iconSizeFor: Record<keyof typeof sizes.iconCircle, IconSize> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl',
};

/** An icon on a soft tinted circle. Used by tiles, stat cards and empty states. */
export function IconCircle({
  icon,
  tone = 'primary',
  size = 'md',
  style,
}: IconCircleProps) {
  const t = toneColors[tone];
  const d = sizes.iconCircle[size];
  return (
    <View
      style={[
        styles.circle,
        { width: d, height: d, backgroundColor: colors[t.bg] },
        style,
      ]}
    >
      <Icon name={icon} size={iconSizeFor[size]} color={t.fg} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
