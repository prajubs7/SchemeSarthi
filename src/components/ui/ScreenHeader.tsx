import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { spacing } from '../../theme';
import { AppText } from './AppText';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Trailing actions, e.g. an IconButton. */
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** In-screen header for tab screens, which have no native stack header. */
export function ScreenHeader({ title, subtitle, right, style }: ScreenHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.text}>
        <AppText variant="h1">{title}</AppText>
        {subtitle ? (
          <AppText variant="bodySm" color="textSecondary">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  text: { flex: 1, gap: spacing.xs },
});
