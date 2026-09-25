import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { useSchemeMatches } from '../../hooks/useSchemeMatches';
import { useBookmarks } from '../../hooks/useBookmarks';

import { Button, Card, LoadingSpinner } from '../../components/ui';
import { colors } from '../../constants/colors';
import { RootState } from '../../store';
import { HomeStackParamList } from '../../navigation/types';
import SchemeListCard from '../../components/scheme/SchemeListCard';

type Props = NativeStackScreenProps<HomeStackParamList, 'MatchedSchemes'>;

const CATEGORIES = [
  { label: 'Students', icon: '🎓', filter: 'student' },
  { label: 'Farmers', icon: '🌾', filter: 'farmer' },
  { label: 'Women', icon: '👩', filter: 'woman' },
  { label: 'Senior Citizens', icon: '👴', filter: 'senior' },
  { label: 'Housing', icon: '🏠', filter: 'housing' },
  { label: 'Business', icon: '💼', filter: 'business' },
];

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const profile = useSelector((state: RootState) => state.profile.profile);
  const { data: schemes, isLoading } = useSchemeMatches(user?.id);
  const { data: bookmarks } = useBookmarks(user?.id);

  if (isLoading) return <LoadingSpinner />;

  const topMatches = (schemes ?? []).slice(0, 3);
  const profileIncomplete = !profile?.age || !profile?.state;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
    >
      {/* Greeting */}
      <Text style={styles.greeting}>Namaste 🙏</Text>
      <Text style={styles.subGreeting}>Here's what we found for you</Text>

      {/* Profile completion nudge — only shows when it matters */}
      {profileIncomplete && (
        <Card style={styles.nudgeCard}>
          <Text style={styles.nudgeText}>
            ⚠️ Complete your profile for more accurate scheme matches.
          </Text>
          <Button
            title="Complete Profile"
            variant="outline"
            onPress={() => navigation.getParent()?.navigate('ProfileTab')}
            style={{ marginTop: 10 }}
          />
        </Card>
      )}

      {/* Quick stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{schemes?.length ?? 0}</Text>
          <Text style={styles.statLabel}>Schemes Matched</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{bookmarks?.length ?? 0}</Text>
          <Text style={styles.statLabel}>Bookmarked</Text>
        </View>
      </View>

      {/* Browse by category */}
      <Text style={styles.sectionTitle}>Browse by Category</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.filter}
            style={styles.categoryChip}
            onPress={() =>
              navigation
                .getParent()
                ?.navigate('SchemeTab', { initialFilter: cat.filter } as never)
            }
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text style={styles.categoryLabel}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Top matches */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Your Top Matches</Text>
        {schemes && schemes.length > 3 && (
          <TouchableOpacity
            onPress={() => navigation.navigate('AllMatchedSchemes' as never)}
          >
            <Text style={styles.seeAllLink}>See all →</Text>
          </TouchableOpacity>
        )}
      </View>

      {topMatches.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>
            No matches yet — complete your profile above to get started.
          </Text>
        </Card>
      ) : (
        topMatches.map(scheme => (
          <SchemeListCard
            key={scheme.id}
            scheme={scheme}
            showMatchInfo
            onPress={() =>
              navigation.navigate('SchemeDetail', { schemeId: scheme.id })
            }
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  greeting: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: colors.textPrimary 
  },
  subGreeting: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 16,
  },
  nudgeCard: {
    backgroundColor: '#FFF3E0',
    borderColor: colors.warning,
    marginBottom: 16,
  },
  nudgeText: { 
    color: colors.warning, 
    fontSize: 13.5 
  },
  statsRow: { 
    flexDirection: 'row', 
    gap: 12, 
    marginBottom: 20 
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: { 
    fontSize: 26, 
    fontWeight: '800', 
    color: colors.primary 
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  seeAllLink: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: colors.primary },
  categoryScroll: { 
    marginBottom: 20 
},
  categoryChip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 10,
    minWidth: 84,
  },
  categoryIcon: { 
    fontSize: 22, 
    marginBottom: 4 
},
  categoryLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13.5,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
