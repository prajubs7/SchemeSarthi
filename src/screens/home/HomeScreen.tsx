import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { useSchemeMatches } from '../../hooks/useSchemeMatches';
import { useBookmarks } from '../../hooks/useBookmarks';
import { useNotifications } from '../../hooks/useNotifications';
import {
  AppText,
  Banner,
  Button,
  Card,
  CategoryTile,
  ErrorState,
  IconButton,
  IconCircle,
  IconName,
  ProgressBar,
  SchemeCardSkeleton,
  Screen,
  SectionHeader,
  Skeleton,
  StatCard,
  StatusPill,
  Tone,
} from '../../components/ui';
import SchemeListCard from '../../components/scheme/SchemeListCard';
import { colors, radius, sizes, spacing } from '../../theme';
import { RootState } from '../../store';
import { MainTabScreenProps } from '../../navigation/types';
import { AgeGroup, getAgeGroup } from '../../constants/profileOptions';
import { Profile } from '../../types/profile';
import { MatchedScheme } from '../../types/scheme';
import { AppNotification, NotificationType } from '../../types/notification';
import { formatRelativeTime } from '../../utils/relativeTime';

type Props = MainTabScreenProps<'HomeTab'>;

const TOP_MATCHES = 3;
const WHATS_NEW_LIMIT = 3;
const AGE_ROW_LIMIT = 8;

// `filter` is passed to the Schemes tab as initialCategory.
const CATEGORIES: { label: string; icon: IconName; filter: string }[] = [
  { label: 'Students', icon: 'school-outline', filter: 'student' },
  { label: 'Farmers', icon: 'leaf-outline', filter: 'farmer' },
  { label: 'Women', icon: 'woman-outline', filter: 'woman' },
  { label: 'Senior citizens', icon: 'people-outline', filter: 'senior' },
  { label: 'Housing', icon: 'home-outline', filter: 'housing' },
  { label: 'Business', icon: 'briefcase-outline', filter: 'business' },
  { label: 'Health', icon: 'medkit-outline', filter: 'health' },
];

const NOTIFICATION_STYLE: Record<
  NotificationType,
  { icon: IconName; tone: Tone }
> = {
  new_match: { icon: 'sparkles', tone: 'success' },
  deadline_soon: { icon: 'time-outline', tone: 'warning' },
  newly_launched: { icon: 'rocket-outline', tone: 'accent' },
  scheme_updated: { icon: 'refresh', tone: 'info' },
};

// The six fields the matcher uses; completeness is the share that are filled in.
const PROFILE_FIELDS: { key: keyof Profile; label: string }[] = [
  { key: 'age', label: 'age' },
  { key: 'gender', label: 'gender' },
  { key: 'occupation_category', label: 'occupation' },
  { key: 'income_bracket', label: 'income' },
  { key: 'state', label: 'state' },
  { key: 'social_category', label: 'category' },
];

function missingProfileFields(profile: Profile | null) {
  return PROFILE_FIELDS.filter(f => {
    const value = profile?.[f.key];
    return value === null || value === undefined || value === '';
  });
}

function ageRangeLabel(group: AgeGroup) {
  if (group.key === 'child') return 'under 18';
  if (group.key === 'senior') return '60+';
  return `${group.min}–${group.max}`;
}

/** Matched schemes whose eligibility rules set an age bound that includes `age`. */
function schemesForAge(schemes: MatchedScheme[], age: number) {
  return schemes.filter(s => {
    const { min_age: min, max_age: max } = s.eligibility_rules ?? {};
    const hasMin = typeof min === 'number';
    const hasMax = typeof max === 'number';
    if (!hasMin && !hasMax) return false;
    return (!hasMin || age >= min) && (!hasMax || age <= max);
  });
}

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const profile = useSelector((state: RootState) => state.profile.profile);
  const matches = useSchemeMatches(user?.id);
  const bookmarks = useBookmarks(user?.id);
  const notifications = useNotifications(user?.id);
  const [refreshing, setRefreshing] = useState(false);

  const schemes = useMemo(() => matches.data ?? [], [matches.data]);
  const ageGroup = getAgeGroup(profile?.age);
  const missing = missingProfileFields(profile);
  const completeness =
    (PROFILE_FIELDS.length - missing.length) / PROFILE_FIELDS.length;
  const newCount = schemes.filter(s => !s.viewed).length;
  const whatsNew = notifications.unread.slice(0, WHATS_NEW_LIMIT);

  const ageSchemes = useMemo(() => {
    const forAge =
      profile?.age != null ? schemesForAge(schemes, profile.age) : [];
    return {
      forAge: forAge.length > 0,
      list: (forAge.length > 0 ? forAge : schemes).slice(0, AGE_ROW_LIMIT),
    };
  }, [schemes, profile?.age]);

  const { refetch: refetchMatches } = matches;
  const { refetch: refetchNotifications } = notifications;
  const { refetch: refetchBookmarks } = bookmarks;
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchMatches(),
        refetchNotifications(),
        refetchBookmarks(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchMatches, refetchNotifications, refetchBookmarks]);

  const openScheme = (schemeId: string) =>
    navigation.navigate('SchemeDetail', { schemeId });
  const openAllMatches = () => navigation.navigate('AllMatchedSchemes');
  const editProfile = () =>
    navigation.navigate('ProfileSetup', { mode: 'edit' });

  const header = (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <AppText variant="display">Namaste</AppText>
        {ageGroup ? (
          <StatusPill
            tone="primary"
            size="sm"
            icon="person-outline"
            label={ageGroup.label}
            accessibilityLabel={`Age group: ${ageGroup.label}`}
          />
        ) : null}
      </View>
      <IconButton
        icon="notifications-outline"
        accessibilityLabel="Notifications"
        badgeCount={notifications.unreadCount}
        onPress={() => navigation.navigate('Notifications')}
      />
    </View>
  );

  if (matches.isLoading) {
    return (
      <Screen
        edges={['top', 'left', 'right']}
        scroll
        contentContainerStyle={styles.content}
      >
        {header}
        <HomeSkeleton />
      </Screen>
    );
  }

  if (matches.isError) {
    return (
      <Screen edges={['top', 'left', 'right']}>
        {header}
        <ErrorState
          message="We couldn't load your matched schemes. Check your connection and try again."
          onRetry={() => refetchMatches()}
        />
      </Screen>
    );
  }

  const hasMatches = schemes.length > 0;
  const ageTitle = ageGroup
    ? `For your age group (${ageRangeLabel(ageGroup)})`
    : 'Picked for you';

  return (
    <Screen
      edges={['top', 'left', 'right']}
      scroll
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {header}

      {/* Hero: the one number the user came for */}
      <View style={styles.hero}>
        <View style={styles.heroOrb} />
        {hasMatches ? (
          <>
            <AppText variant="bodySm" color="white" style={styles.heroMuted}>
              You may be eligible for
            </AppText>
            <AppText variant="display" color="white">
              {schemes.length} {schemes.length === 1 ? 'scheme' : 'schemes'}
            </AppText>
            <AppText variant="bodySm" color="white" style={styles.heroMuted}>
              Based on your age group, income and state
            </AppText>
            <Button
              title="View all"
              variant="secondary"
              rightIcon="arrow-forward"
              fullWidth={false}
              onPress={openAllMatches}
              accessibilityLabel={`View all ${schemes.length} matched schemes`}
              style={styles.heroButton}
            />
          </>
        ) : (
          <>
            <AppText variant="h1" color="white">
              No matches yet
            </AppText>
            <AppText variant="body" color="white" style={styles.heroMuted}>
              Schemes are matched on your age, income, state and occupation.
              Adding or correcting these details often finds more.
            </AppText>
            <Button
              title="Update profile"
              variant="secondary"
              leftIcon="create-outline"
              fullWidth={false}
              onPress={editProfile}
              style={styles.heroButton}
            />
          </>
        )}
      </View>

      {missing.length > 0 ? (
        <View style={styles.section}>
          <Banner
            tone="info"
            icon="person-circle-outline"
            title="Complete your profile"
            message={`Add your ${missing
              .map(f => f.label)
              .join(', ')} to get more accurate matches.`}
            actionLabel="Complete profile"
            onAction={editProfile}
          />
          <ProgressBar
            value={completeness}
            label={`Profile ${Math.round(completeness * 100)}% complete`}
            style={styles.progress}
          />
        </View>
      ) : null}

      {whatsNew.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader
            title="What's new for you"
            onActionPress={() => navigation.navigate('Notifications')}
          />
          <Card padding="none">
            {whatsNew.map((n, i) => (
              <NotificationRow
                key={n.id}
                notification={n}
                divider={i > 0}
                onPress={
                  n.scheme_id
                    ? () => openScheme(n.scheme_id as string)
                    : () => navigation.navigate('Notifications')
                }
              />
            ))}
          </Card>
        </View>
      ) : null}

      <View style={[styles.statRow, styles.section]}>
        <StatCard
          value={schemes.length}
          label="Matched"
          icon="checkmark-circle-outline"
          tone="success"
          onPress={openAllMatches}
        />
        <StatCard
          value={newCount}
          label="New"
          icon="sparkles-outline"
          tone="accent"
          onPress={openAllMatches}
        />
        <StatCard
          value={bookmarks.data?.length ?? 0}
          label="Saved"
          icon="bookmark-outline"
          tone="info"
          onPress={() => navigation.navigate('SavedTab')}
        />
      </View>

      {ageSchemes.list.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader
            title={ageSchemes.forAge ? ageTitle : 'Picked for you'}
            subtitle={
              ageSchemes.forAge
                ? 'Schemes with age rules that fit you'
                : undefined
            }
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bleed}
            contentContainerStyle={styles.hRow}
          >
            {ageSchemes.list.map(s => (
              <CompactSchemeCard
                key={s.id}
                scheme={s}
                onPress={() => openScheme(s.id)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Browse by category" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.bleed}
          contentContainerStyle={styles.hRow}
        >
          {CATEGORIES.map(cat => (
            <CategoryTile
              key={cat.filter}
              icon={cat.icon}
              label={cat.label}
              onPress={() =>
                navigation.navigate('SchemeTab', {
                  initialCategory: cat.filter,
                })
              }
            />
          ))}
        </ScrollView>
      </View>

      {hasMatches ? (
        <View style={styles.section}>
          <SectionHeader title="Top matches" />
          {schemes.slice(0, TOP_MATCHES).map(s => (
            <SchemeListCard
              key={s.id}
              scheme={s}
              showMatchInfo
              onPress={() => openScheme(s.id)}
            />
          ))}
          {schemes.length > TOP_MATCHES ? (
            <Button
              title={`See all ${schemes.length} matches`}
              variant="outline"
              rightIcon="chevron-forward"
              onPress={openAllMatches}
            />
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

function NotificationRow({
  notification,
  divider,
  onPress,
}: {
  notification: AppNotification;
  divider: boolean;
  onPress: () => void;
}) {
  const style =
    NOTIFICATION_STYLE[notification.notification_type] ??
    NOTIFICATION_STYLE.scheme_updated;
  const when = formatRelativeTime(notification.created_at);
  return (
    <Card
      variant="outlined"
      padding="md"
      onPress={onPress}
      accessibilityLabel={`${notification.change_summary}, ${when}`}
      accessibilityHint="Opens the scheme"
      style={[styles.notifRow, divider && styles.notifDivider]}
    >
      <IconCircle icon={style.icon} tone={style.tone} size="sm" />
      <View style={styles.notifText}>
        <AppText variant="bodySm" numberOfLines={2}>
          {notification.change_summary}
        </AppText>
        <AppText variant="caption" color="textMuted">
          {when}
        </AppText>
      </View>
      <View style={styles.unreadDot} />
    </Card>
  );
}

function CompactSchemeCard({
  scheme,
  onPress,
}: {
  scheme: MatchedScheme;
  onPress: () => void;
}) {
  const { min_age: min, max_age: max } = scheme.eligibility_rules ?? {};
  const ageLabel =
    typeof min === 'number' && typeof max === 'number'
      ? `Age ${min}–${max}`
      : typeof min === 'number'
      ? `Age ${min}+`
      : typeof max === 'number'
      ? `Up to age ${max}`
      : null;
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={[scheme.title, ageLabel].filter(Boolean).join(', ')}
      accessibilityHint="Opens scheme details"
      style={styles.compactCard}
    >
      <AppText variant="title" numberOfLines={2}>
        {scheme.title}
      </AppText>
      <AppText
        variant="bodySm"
        color="textSecondary"
        numberOfLines={3}
        style={styles.compactBody}
      >
        {scheme.benefit_summary ?? scheme.description}
      </AppText>
      <View style={styles.compactPills}>
        {ageLabel ? (
          <StatusPill
            size="sm"
            tone="primary"
            icon="person-outline"
            label={ageLabel}
          />
        ) : null}
        {!scheme.viewed ? (
          <StatusPill size="sm" tone="accent" label="New" />
        ) : null}
      </View>
    </Card>
  );
}

function HomeSkeleton() {
  return (
    <View accessibilityLabel="Loading your schemes" style={styles.skeleton}>
      <Skeleton height={sizes.heroOrb * 0.8} radius="lg" />
      <View style={styles.statRow}>
        <Skeleton height={spacing.xxl * 3} radius="lg" style={styles.flex} />
        <Skeleton height={spacing.xxl * 3} radius="lg" style={styles.flex} />
        <Skeleton height={spacing.xxl * 3} radius="lg" style={styles.flex} />
      </View>
      <Skeleton width="50%" height={spacing.xl} />
      <SchemeCardSkeleton />
      <SchemeCardSkeleton />
      <SchemeCardSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingTop: 0, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerText: { flex: 1, gap: spacing.xs },
  section: { marginTop: spacing.xl },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.xs,
    overflow: 'hidden',
  },
  // No gradient library is installed, so a large primaryDark circle shades the
  // lower-right corner to give the primary → primaryDark feel.
  heroOrb: {
    position: 'absolute',
    width: sizes.heroOrb,
    height: sizes.heroOrb,
    borderRadius: sizes.heroOrb / 2,
    right: -sizes.heroOrb / 3,
    bottom: -sizes.heroOrb / 2,
    backgroundColor: colors.primaryDark,
  },
  heroMuted: { opacity: 0.85 },
  heroButton: { marginTop: spacing.md },
  progress: { marginTop: spacing.md },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 0,
    borderRadius: 0,
  },
  notifDivider: {
    borderTopWidth: sizes.borderWidth,
    borderTopColor: colors.border,
  },
  notifText: { flex: 1, gap: spacing.xs / 2 },
  unreadDot: {
    width: sizes.dot,
    height: sizes.dot,
    borderRadius: sizes.dot / 2,
    backgroundColor: colors.accent,
  },
  statRow: { flexDirection: 'row', gap: spacing.md },
  // Horizontal rows run edge to edge while their first item lines up with the gutter.
  bleed: { marginHorizontal: -spacing.gutter },
  hRow: { paddingHorizontal: spacing.gutter, gap: spacing.md },
  compactCard: { width: sizes.compactCard, gap: spacing.xs },
  compactBody: { flex: 1 },
  compactPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  skeleton: { gap: spacing.lg },
});
