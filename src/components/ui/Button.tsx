import React from 'react';
import {
  ActivityIndicator,
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

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: IconName;
  rightIcon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  /** Stretch to the container width. Defaults to true. */
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

interface VariantColors {
  bg: ColorToken | null;
  /** Background while pressed; null falls back to reduced opacity. */
  pressedBg: ColorToken | null;
  fg: ColorToken;
  border: ColorToken | null;
}

const variantColors: Record<ButtonVariant, VariantColors> = {
  primary: {
    bg: 'primary',
    pressedBg: 'primaryDark',
    fg: 'white',
    border: null,
  },
  secondary: {
    bg: 'primarySoft',
    pressedBg: 'surfaceMuted',
    fg: 'primary',
    border: null,
  },
  outline: {
    bg: null,
    pressedBg: 'primarySoft',
    fg: 'primary',
    border: 'primary',
  },
  ghost: { bg: null, pressedBg: 'primarySoft', fg: 'primary', border: null },
  danger: { bg: 'danger', pressedBg: null, fg: 'white', border: null },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  loading,
  disabled,
  fullWidth = true,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const v = variantColors[variant];
  const inactive = !!(disabled || loading);
  const iconSize = size === 'lg' ? 'lg' : 'md';

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: !!loading }}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        fullWidth ? styles.fullWidth : styles.inline,
        v.bg && { backgroundColor: colors[v.bg] },
        v.border && {
          borderWidth: sizes.borderWidthFocused,
          borderColor: colors[v.border],
        },
        pressed &&
          (v.pressedBg
            ? { backgroundColor: colors[v.pressedBg] }
            : styles.pressed),
        inactive && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors[v.fg]} />
      ) : (
        <View style={styles.content}>
          {leftIcon ? (
            <Icon name={leftIcon} size={iconSize} color={v.fg} />
          ) : null}
          <AppText
            variant={size === 'lg' ? 'title' : 'body'}
            weight="600"
            color={v.fg}
            numberOfLines={1}
          >
            {title}
          </AppText>
          {rightIcon ? (
            <Icon name={rightIcon} size={iconSize} color={v.fg} />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  md: { minHeight: sizes.touchTarget },
  lg: { minHeight: sizes.buttonLg, paddingHorizontal: spacing.xl },
  fullWidth: { alignSelf: 'stretch' },
  inline: { alignSelf: 'flex-start' },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pressed: { opacity: opacity.pressed },
  disabled: { opacity: opacity.disabled },
});
