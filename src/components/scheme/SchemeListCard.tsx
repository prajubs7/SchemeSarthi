import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Card, Icon, StatusPill } from '../ui';
import { colors, sizes, spacing } from '../../theme';
import { Scheme, MatchedScheme } from '../../types/scheme';

interface SchemeListCardProps {
  scheme: Scheme | MatchedScheme;
  onPress: () => void;
  showMatchInfo?: boolean; // true on Home (matched list), false on Schemes (browse all)
}

export default function SchemeListCard({
  scheme,
  onPress,
  showMatchInfo,
}: SchemeListCardProps) {
  const matched = scheme as MatchedScheme;
  const isNew = showMatchInfo && matched.viewed === false;
  const isMatched = showMatchInfo && matched.match_score != null;
  const needsVerification = scheme.status === 'needs_verification';
  const isCentral = scheme.scheme_level === 'central';
  const levelLabel = isCentral ? 'Central' : 'State';

  const a11yLabel = [
    scheme.title,
    isNew && 'New',
    `${levelLabel} scheme`,
    isMatched && 'Matched for you',
    needsVerification && 'Verify details',
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Card
      onPress={onPress}
      padding="none"
      accessibilityLabel={a11yLabel}
      accessibilityHint="Opens scheme details"
      style={styles.card}
    >
      {/* Left accent bar: instant visual cue for central vs state,
          a pattern users already recognize from official govt portals */}
      <View
        style={[
          styles.accentBar,
          { backgroundColor: isCentral ? colors.primary : colors.accent },
        ]}
      />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <AppText variant="title" numberOfLines={2} style={styles.title}>
            {scheme.title}
          </AppText>
          {isNew && <View style={styles.newDot} />}
        </View>

        <AppText variant="bodySm" color="textSecondary" numberOfLines={2}>
          {scheme.benefit_summary ?? scheme.description}
        </AppText>

        <View style={styles.badgeRow}>
          <StatusPill
            size="sm"
            tone="neutral"
            icon={isCentral ? 'business-outline' : 'location-outline'}
            label={levelLabel}
          />
          {isMatched && (
            <StatusPill
              size="sm"
              tone="success"
              icon="checkmark-circle"
              label="Matched for you"
            />
          )}
          {needsVerification && (
            <StatusPill
              size="sm"
              tone="warning"
              icon="alert-circle"
              label="Verify details"
            />
          )}
        </View>
      </View>

      {/* Chevron affordance: signals tappability without relying on color alone,
          important for accessibility with an older/less tech-familiar audience */}
      <Icon name="chevron-forward" color="textMuted" style={styles.chevron} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  accentBar: {
    width: sizes.accentBar,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.xs,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
  },
  newDot: {
    width: sizes.dot,
    height: sizes.dot,
    borderRadius: sizes.dot / 2,
    backgroundColor: colors.accent,
    marginLeft: spacing.sm,
    marginTop: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  chevron: {
    alignSelf: 'center',
    marginRight: spacing.md,
  },
});
