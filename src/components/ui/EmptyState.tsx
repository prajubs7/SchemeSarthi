import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { spacing } from '../../theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { IconName } from './Icon';
import { IconCircle } from './IconCircle';
import { Tone } from './tones';

export interface EmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  tone?: Tone;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function EmptyState({
  title,
  subtitle,
  icon = 'file-tray-outline',
  tone = 'primary',
  actionLabel,
  onAction,
  style,
  testID,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]} testID={testID}>
      <IconCircle icon={icon} tone={tone} size="xl" />
      <AppText variant="h2" align="center" style={styles.title}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="body" color="textSecondary" align="center">
          {subtitle}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          onPress={onAction}
          fullWidth={false}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  title: { marginTop: spacing.md },
  action: { alignSelf: 'center', marginTop: spacing.md },
});
