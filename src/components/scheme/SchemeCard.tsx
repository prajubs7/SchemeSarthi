import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Card from '../common/Card';
import { colors } from '../../constants/colors';
import { MatchedScheme } from '../../types/scheme';

export default function SchemeCard({
  scheme,
  onPress,
}: {
  scheme: MatchedScheme;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{scheme.title}</Text>
          {!scheme.viewed && <View style={styles.newDot} />}
        </View>
        <Text numberOfLines={2} style={styles.summary}>
          {scheme.benefit_summary ?? scheme.description}
        </Text>
        <View style={styles.footerRow}>
          <Text style={styles.levelTag}>{scheme.scheme_level === 'central' ? 'Central' : 'State'}</Text>
          {scheme.status === 'needs_verification' && (
            <Text style={styles.verifyTag}>Please verify latest details</Text>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  newDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginLeft: 8 },
  summary: { fontSize: 14, color: colors.textSecondary, marginTop: 6 },
  footerRow: { flexDirection: 'row', marginTop: 10, gap: 8 },
  levelTag: {
    fontSize: 12,
    color: colors.primary,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  verifyTag: {
    fontSize: 12,
    color: colors.warning,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
