import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing } from '../../theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { Icon, IconName } from './Icon';
import { toneColors } from './tones';

export type BannerTone = 'info' | 'warning' | 'success' | 'accent' | 'danger';

export interface BannerProps {
  tone?: BannerTone;
  /** Defaults to an icon matching the tone. */
  icon?: IconName;
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Shows a close button when set. */
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const defaultIcons: Record<BannerTone, IconName> = {
  info: 'information-circle',
  warning: 'warning',
  success: 'checkmark-circle',
  accent: 'sparkles',
  danger: 'alert-circle',
};

export function Banner({
  tone = 'info',
  icon,
  title,
  message,
  actionLabel,
  onAction,
  onDismiss,
  style,
  testID,
}: BannerProps) {
  const t = toneColors[tone];
  return (
    <View
      testID={testID}
      accessibilityLiveRegion="polite"
      style={[styles.banner, { backgroundColor: colors[t.bg] }, style]}
    >
      <Icon
        name={icon ?? defaultIcons[tone]}
        color={tone === 'accent' ? 'accent' : t.fg}
      />
      <View style={styles.body}>
        {title ? (
          <AppText variant="title" color="text">
            {title}
          </AppText>
        ) : null}
        <AppText variant="bodySm" color="textSecondary">
          {message}
        </AppText>
        {actionLabel && onAction ? (
          <Button
            title={actionLabel}
            onPress={onAction}
            variant="ghost"
            fullWidth={false}
            style={styles.action}
          />
        ) : null}
      </View>
      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          hitSlop={spacing.md}
          accessibilityRole="button"
          accessibilityLabel={title ? `Dismiss ${title}` : 'Dismiss'}
          style={styles.close}
        >
          <Icon name="close" color="textSecondary" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  body: { flex: 1, gap: spacing.xs },
  // Ghost button's own padding would indent it; pull it back to align with the text.
  action: { marginLeft: -spacing.lg, marginBottom: -spacing.sm },
  close: { marginTop: -spacing.xs / 2 },
});
