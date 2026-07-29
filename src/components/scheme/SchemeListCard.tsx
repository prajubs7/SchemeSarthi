import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/colors';
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

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={styles.touchable}
    >
      <View style={styles.card}>
        {/* Left accent bar — instant visual cue for central vs state,
            a pattern users already recognize from official govt portals */}
        <View
          style={[
            styles.accentBar,
            {
              backgroundColor:
                scheme.scheme_level === 'central'
                  ? colors.primary
                  : colors.accent,
            },
          ]}
        />

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.title} numberOfLines={2}>
              {scheme.title}
            </Text>
            {isNew && <View style={styles.newDot} />}
          </View>

          <Text style={styles.summary} numberOfLines={2}>
            {scheme.benefit_summary ?? scheme.description}
          </Text>

          <View style={styles.badgeRow}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>
                {scheme.scheme_level === 'central' ? '🇮🇳 Central' : '📍 State'}
              </Text>
            </View>

            {showMatchInfo && matched.match_score != null && (
              <View style={styles.matchBadge}>
                <Text style={styles.matchBadgeText}>✓ Matched for you</Text>
              </View>
            )}

            {scheme.status === 'needs_verification' && (
              <View style={styles.warnBadge}>
                <Text style={styles.warnBadgeText}>⚠ Verify details</Text>
              </View>
            )}
          </View>
        </View>

        {/* Chevron affordance — signals tappability without relying on color alone,
            important for accessibility with an older/less tech-familiar audience */}
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    minHeight: 88, // generous touch target
    alignItems: 'stretch',
  },
  accentBar: {
    width: 5,
  },
  content: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 21,
  },
  newDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.accent,
    marginLeft: 8,
    marginTop: 6,
  },
  summary: {
    fontSize: 13.5,
    color: colors.textSecondary,
    marginTop: 5,
    lineHeight: 19,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 6,
  },
  levelBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: '#F0F4F0',
  },
  levelBadgeText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  matchBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: '#E8F5E9',
  },
  matchBadgeText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.success,
  },
  warnBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: '#FFF3E0',
  },
  warnBadgeText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.warning,
  },
  chevron: {
    fontSize: 26,
    color: colors.border,
    alignSelf: 'center',
    marginRight: 12,
    fontWeight: '300',
  },
});
