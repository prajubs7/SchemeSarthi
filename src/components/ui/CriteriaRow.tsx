import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { ColorToken, sizes, spacing } from '../../theme';
import { EligibilityStatus } from '../../utils/eligibilityFormatter';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';

export interface CriteriaRowProps {
  label: string;
  status: EligibilityStatus;
  requiredText: string;
  actualText: string;
  style?: StyleProp<ViewStyle>;
}

const statusMeta: Record<
  EligibilityStatus,
  { icon: IconName; color: ColorToken; spoken: string }
> = {
  pass: {
    icon: 'checkmark-circle',
    color: 'success',
    spoken: 'Meets this criterion',
  },
  fail: {
    icon: 'close-circle',
    color: 'danger',
    spoken: 'Does not meet this criterion',
  },
  unverified: { icon: 'help-circle', color: 'info', spoken: 'Not verified' },
};

/** One eligibility criterion. Spread an EligibilityCheck from formatMatchReasons into it. */
export function CriteriaRow({
  label,
  status,
  requiredText,
  actualText,
  style,
}: CriteriaRowProps) {
  const meta = statusMeta[status];
  return (
    <View
      accessible
      accessibilityLabel={`${label}. ${meta.spoken}. Required: ${requiredText}. You: ${actualText}.`}
      style={[styles.row, style]}
    >
      <Icon name={meta.icon} size="lg" color={meta.color} />
      <View style={styles.text}>
        <AppText variant="title">{label}</AppText>
        <AppText variant="bodySm" color="textSecondary">
          Required: {requiredText} · You: {actualText}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    minHeight: sizes.touchTarget,
    paddingVertical: spacing.sm,
  },
  text: { flex: 1, gap: spacing.xs / 2 },
});
