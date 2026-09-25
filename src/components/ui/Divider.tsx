import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, spacing, SpacingToken } from '../../theme';

export interface DividerProps {
  vertical?: boolean;
  /** Space on either side of the line. */
  spacing?: SpacingToken | 'none';
  /** Horizontal inset (for lists with leading icons). */
  inset?: SpacingToken;
  style?: StyleProp<ViewStyle>;
}

export function Divider({
  vertical,
  spacing: gap = 'none',
  inset,
  style,
}: DividerProps) {
  const margin = gap === 'none' ? 0 : spacing[gap];
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[
        vertical
          ? [styles.vertical, { marginHorizontal: margin }]
          : [styles.horizontal, { marginVertical: margin }],
        inset && { marginLeft: spacing[inset] },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    height: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
  },
  vertical: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
  },
});
