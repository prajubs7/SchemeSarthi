import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { colors, spacing } from '../../theme';
import { AppText } from './AppText';

export interface LoadingSpinnerProps {
  label?: string;
  size?: 'small' | 'large';
  style?: StyleProp<ViewStyle>;
}

export function LoadingSpinner({
  label,
  size = 'large',
  style,
}: LoadingSpinnerProps) {
  return (
    <View
      style={[styles.container, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? 'Loading'}
      accessibilityState={{ busy: true }}
    >
      <ActivityIndicator size={size} color={colors.primary} />
      {label ? (
        <AppText variant="bodySm" color="textSecondary">
          {label}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
});
