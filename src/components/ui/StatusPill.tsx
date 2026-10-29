import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';
import { Tone, toneColors } from './tones';

export interface StatusPillProps {
  label: string;
  tone?: Tone;
  icon?: IconName;
  size?: 'sm' | 'md';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function StatusPill({
  label,
  tone = 'neutral',
  icon,
  size = 'md',
  accessibilityLabel,
  style,
  testID,
}: StatusPillProps) {
  const t = toneColors[tone];
  const small = size === 'sm';
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
      style={[
        styles.pill,
        small ? styles.sm : styles.md,
        { backgroundColor: colors[t.bg] },
        style,
      ]}
    >
      {icon ? (
        <Icon name={icon} size={small ? 'xs' : 'sm'} color={t.fg} />
      ) : null}
      <AppText
        variant={small ? 'caption' : 'bodySm'}
        weight="600"
        color={t.fg}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </View>
  );
}

/** Alias: a badge is a status pill. */
export const Badge = StatusPill;
export type BadgeProps = StatusPillProps;

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    gap: spacing.xs,
  },
  sm: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs / 2 },
  md: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
});
