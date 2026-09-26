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
import { Icon, IconName } from './Icon';

export interface InfoRowProps {
  label: string;
  value?: string | number | null;
  icon?: IconName;
  onPress?: () => void;
  /** Defaults to true when onPress is set. */
  showChevron?: boolean;
  /** Shown when value is empty. */
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function InfoRow({
  label,
  value,
  icon,
  onPress,
  showChevron = !!onPress,
  placeholder = 'Not set',
  style,
  testID,
}: InfoRowProps) {
  const hasValue = value !== undefined && value !== null && value !== '';
  const display = hasValue ? String(value) : placeholder;

  const content = (
    <>
      {icon ? <Icon name={icon} color="textSecondary" /> : null}
      <AppText variant="body" color="textSecondary" style={styles.label}>
        {label}
      </AppText>
      <AppText
        variant="body"
        weight="600"
        color={hasValue ? 'text' : 'textMuted'}
        align="right"
        style={styles.value}
      >
        {display}
      </AppText>
      {showChevron ? (
        <Icon name="chevron-forward" size="sm" color="textMuted" />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${display}`}
        testID={testID}
        style={({ pressed }) => [styles.row, pressed && styles.pressed, style]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${display}`}
      testID={testID}
      style={[styles.row, style]}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: sizes.touchTarget,
    paddingVertical: spacing.sm,
  },
  label: { flexShrink: 0 },
  value: { flex: 1 },
  pressed: { opacity: opacity.pressed },
});
