import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { spacing } from '../../theme';
import { AppText } from './AppText';
import { Card } from './Card';
import { IconName } from './Icon';
import { IconCircle } from './IconCircle';
import { Tone } from './tones';

export interface StatCardProps {
  value: string | number;
  label: string;
  icon: IconName;
  tone?: Tone;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function StatCard({
  value,
  label,
  icon,
  tone = 'primary',
  onPress,
  style,
}: StatCardProps) {
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`${value} ${label}`}
      style={[styles.card, style]}
    >
      <IconCircle icon={icon} tone={tone} size="sm" />
      <AppText variant="h1" style={styles.value}>
        {value}
      </AppText>
      <AppText variant="bodySm" color="textSecondary" numberOfLines={2}>
        {label}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, gap: spacing.xs },
  value: { marginTop: spacing.sm },
});
