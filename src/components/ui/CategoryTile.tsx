import React from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { opacity, sizes, spacing } from '../../theme';
import { AppText } from './AppText';
import { IconName } from './Icon';
import { IconCircle } from './IconCircle';
import { Tone } from './tones';

export interface CategoryTileProps {
  icon: IconName;
  label: string;
  onPress?: () => void;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Fixed-width tile for horizontal category rows. */
export function CategoryTile({
  icon,
  label,
  onPress,
  tone = 'primary',
  style,
  testID,
}: CategoryTileProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed, style]}
    >
      <IconCircle icon={icon} tone={tone} size="lg" />
      <AppText variant="caption" weight="600" align="center" numberOfLines={2}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: sizes.categoryTile,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pressed: { opacity: opacity.pressed },
});
