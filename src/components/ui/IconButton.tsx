import React from 'react';
import {
  GestureResponderEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import {
  colors,
  ColorToken,
  opacity,
  radius,
  sizes,
  spacing,
} from '../../theme';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';

export type IconButtonVariant = 'plain' | 'soft' | 'filled';

export interface IconButtonProps {
  icon: IconName;
  onPress: (event: GestureResponderEvent) => void;
  /** Required: icon-only buttons have no visible text. */
  accessibilityLabel: string;
  accessibilityHint?: string;
  /** 44 or 48. The 44 size gets hitSlop so the touch target is still 48. */
  size?: 44 | 48;
  variant?: IconButtonVariant;
  color?: ColorToken;
  /** Unread count shown on a small badge; hidden when 0 or undefined. */
  badgeCount?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const MAX_BADGE = 9;

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  size = 48,
  variant = 'soft',
  color,
  badgeCount,
  disabled,
  style,
  testID,
}: IconButtonProps) {
  const dimension = size === 44 ? sizes.iconButtonSm : sizes.touchTarget;
  const slop = (sizes.touchTarget - dimension) / 2;
  const iconColor: ColorToken =
    color ?? (variant === 'filled' ? 'white' : 'text');
  const showBadge = !!badgeCount && badgeCount > 0;
  const badgeText = showBadge
    ? badgeCount > MAX_BADGE
      ? `${MAX_BADGE}+`
      : String(badgeCount)
    : '';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={slop}
      accessibilityRole="button"
      accessibilityLabel={
        showBadge
          ? `${accessibilityLabel}, ${badgeCount} unread`
          : accessibilityLabel
      }
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        { width: dimension, height: dimension },
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Icon name={icon} size="lg" color={iconColor} />
      {showBadge ? (
        <View style={styles.badge}>
          <AppText variant="caption" weight="700" color="white">
            {badgeText}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plain: { backgroundColor: 'transparent' },
  soft: { backgroundColor: colors.surfaceMuted },
  filled: { backgroundColor: colors.primary },
  pressed: { opacity: opacity.pressed },
  disabled: { opacity: opacity.disabled },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: sizes.countBadge,
    height: sizes.countBadge,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    borderWidth: sizes.borderWidthFocused,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
