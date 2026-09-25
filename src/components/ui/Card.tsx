import React, { ReactNode } from 'react';
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
  opacity,
  radius,
  shadows,
  sizes,
  spacing,
  SpacingToken,
} from '../../theme';

export type CardVariant = 'default' | 'outlined' | 'soft' | 'highlight';

export interface CardProps {
  children: ReactNode;
  /**
   * default: white surface with a border (the standard card).
   * outlined: transparent with a border, for secondary content on the screen background.
   * soft: muted fill, no border. highlight: saffron-soft fill for new/updated content.
   */
  variant?: CardVariant;
  padding?: SpacingToken | 'none';
  /** Adds the single elevation level. Use sparingly. */
  elevated?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Card({
  children,
  variant = 'default',
  padding = 'lg',
  elevated,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: CardProps) {
  const cardStyle = [
    styles.base,
    styles[variant],
    { padding: padding === 'none' ? 0 : spacing[padding] },
    elevated && shadows.card,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        testID={testID}
        style={({ pressed }) => [cardStyle, pressed && styles.pressed, style]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      style={[cardStyle, style]}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.lg },
  default: {
    backgroundColor: colors.surface,
    borderWidth: sizes.borderWidth,
    borderColor: colors.border,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: sizes.borderWidth,
    borderColor: colors.border,
  },
  soft: { backgroundColor: colors.surfaceMuted },
  highlight: { backgroundColor: colors.accentSoft },
  pressed: { opacity: opacity.pressed },
});
