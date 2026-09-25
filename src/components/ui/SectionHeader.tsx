import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { opacity, sizes, spacing } from '../../theme';
import { AppText } from './AppText';
import { Icon } from './Icon';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  /** Shows the action when set. */
  onActionPress?: () => void;
  actionLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function SectionHeader({
  title,
  subtitle,
  onActionPress,
  actionLabel = 'See all',
  style,
}: SectionHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.text}>
        <AppText variant="h2">{title}</AppText>
        {subtitle ? (
          <AppText variant="bodySm" color="textSecondary">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {onActionPress ? (
        <Pressable
          onPress={onActionPress}
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel}, ${title}`}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <AppText variant="bodySm" weight="600" color="primary">
            {actionLabel}
          </AppText>
          <Icon name="chevron-forward" size="sm" color="primary" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  text: { flex: 1, gap: spacing.xs / 2 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    minHeight: sizes.touchTarget,
    paddingLeft: spacing.sm,
  },
  pressed: { opacity: opacity.pressed },
});
