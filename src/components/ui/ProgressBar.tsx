import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, sizes, spacing } from '../../theme';
import { AppText } from './AppText';
import { Tone, toneColors } from './tones';

export interface ProgressBarProps {
  /** 0..1; values outside the range are clamped. */
  value: number;
  tone?: Tone;
  /** e.g. "Profile 80% complete". */
  label?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function ProgressBar({
  value,
  tone = 'primary',
  label,
  style,
  testID,
}: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  const percent = Math.round(clamped * 100);
  return (
    <View
      style={style}
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
    >
      {label ? (
        <AppText
          variant="bodySm"
          weight="600"
          color="textSecondary"
          style={styles.label}
        >
          {label}
        </AppText>
      ) : null}
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${percent}%`,
              backgroundColor: colors[toneColors[tone].solid],
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: spacing.sm },
  track: {
    height: sizes.progressBar,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
});
