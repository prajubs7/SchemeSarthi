import React, { useEffect, useLayoutEffect, useMemo } from 'react';
import { Linking, Pressable, Share, StyleSheet, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getSchemeById, markSchemeViewed } from '../../services/schemesApi';
import { useAuth } from '../../hooks/useAuth';
import { useBookmarks } from '../../hooks/useBookmarks';
import { useSchemeMatches } from '../../hooks/useSchemeMatches';
import { useDocumentChecklist } from '../../hooks/useDocumentChecklist';
import {
  AppText,
  Banner,
  Button,
  Card,
  CriteriaRow,
  Divider,
  ErrorState,
  Icon,
  IconButton,
  IconCircle,
  IconName,
  InfoRow,
  LoadingSpinner,
  Screen,
  StatusPill,
  Tone,
} from '../../components/ui';
import { colors, ColorToken, opacity, radius, sizes, spacing } from '../../theme';
import { RootState } from '../../store';
import { RootStackScreenProps } from '../../navigation/types';
import { Scheme } from '../../types/scheme';
import { checkEligibility } from '../../utils/eligibility';
import {
  EligibilityVerdict,
  eligibilityVerdict,
  explainFailedCheck,
  formatMatchReasons,
} from '../../utils/eligibilityFormatter';

type Props = RootStackScreenProps<'SchemeDetail'>;

const STATUS_PILL: Record<Scheme['status'], { label: string; tone: Tone }> = {
  active: { label: 'Active', tone: 'success' },
  needs_verification: { label: 'Verify details', tone: 'warning' },
  inactive: { label: 'Closed', tone: 'danger' },
  expired: { label: 'Closed', tone: 'danger' },
};

const VERDICT: Record<
  EligibilityVerdict,
  { title: string; message: string; icon: IconName; tone: Tone; color: ColorToken }
> = {
  eligible: {
    title: "You're eligible",
    message: 'You meet every criterion for this scheme.',
    icon: 'checkmark-circle',
    tone: 'success',
    color: 'success',
  },
  not_eligible: {
    title: 'Not eligible yet',
    message: "You don't meet all the criteria below.",
    icon: 'close-circle',
    tone: 'danger',
    color: 'danger',
  },
  partly_verified: {
    title: 'Partly verified',
    message:
      'You meet every rule we could check. Confirm the rest on the official site.',
    icon: 'help-circle',
    tone: 'info',
    color: 'info',
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Application steps from metadata or eligibility_rules: a string list, or one string with a step per line. */
function howToApplySteps(scheme: Scheme): string[] {
  const sources = [scheme.metadata, scheme.eligibility_rules];
  for (const source of sources) {
    const value = source?.how_to_apply ?? source?.application_steps;
    const steps = Array.isArray(value)
      ? value.map(String)
      : typeof value === 'string'
      ? value.split(/\r?\n/)
      : [];
    const cleaned = steps
      .map(s => s.replace(/^\s*(\d+[.)]|[-*•])\s*/, '').trim())
      .filter(Boolean);
    if (cleaned.length > 0) return cleaned;
  }
  return [];
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card style={styles.section}>
      <AppText variant="h2" style={styles.sectionTitle}>
        {title}
      </AppText>
      {children}
    </Card>
  );
}

interface HeaderActionsProps {
  saved: boolean;
  canSave: boolean;
  onToggleBookmark: () => void;
  onShare: () => void;
}

function HeaderActions({
  saved,
  canSave,
  onToggleBookmark,
  onShare,
}: HeaderActionsProps) {
  return (
    <View style={styles.headerActions}>
      <IconButton
        icon={saved ? 'bookmark' : 'bookmark-outline'}
        variant="plain"
        size={44}
        color={saved ? 'primary' : 'text'}
        onPress={onToggleBookmark}
        disabled={!canSave}
        accessibilityLabel={saved ? 'Remove from saved' : 'Save scheme'}
      />
      <IconButton
        icon="share-social-outline"
        variant="plain"
        size={44}
        onPress={onShare}
        accessibilityLabel="Share scheme"
      />
    </View>
  );
}

// Built outside the screen so the header renderer isn't a component defined during render.
const renderHeaderActions = (props: HeaderActionsProps) => () =>
  <HeaderActions {...props} />;

export default function SchemeDetailScreen({ route, navigation }: Props) {
  const { schemeId } = route.params;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const profile = useSelector((state: RootState) => state.profile.profile);
  const matches = useSchemeMatches(user?.id);
  const bookmarks = useBookmarks(user?.id);
  const checklist = useDocumentChecklist(schemeId);

  const {
    data: scheme,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['scheme', schemeId],
    queryFn: () => getSchemeById(schemeId),
  });

  useEffect(() => {
    if (!user) return;
    markSchemeViewed(user.id, schemeId)
      // Refresh match lists so the "new" dots clear.
      .then(() => queryClient.invalidateQueries({ queryKey: ['schemeMatches'] }))
      .catch(() => {});
  }, [user, schemeId, queryClient]);

  const matchedRow = matches.data?.find(s => s.id === schemeId);
  const checks = useMemo(() => {
    if (matchedRow?.match_reason) return formatMatchReasons(matchedRow.match_reason);
    if (scheme && profile) {
      return formatMatchReasons(checkEligibility(profile, scheme).reason);
    }
    return [];
  }, [matchedRow, scheme, profile]);

  const saved = bookmarks.isBookmarked(schemeId);
  const officialLink = scheme?.official_link ?? null;
  const { addBookmark, removeBookmark } = bookmarks;

  useLayoutEffect(() => {
    if (!scheme) return;
    const toggleBookmark = () =>
      saved ? removeBookmark(scheme.id) : addBookmark(scheme);
    const share = () =>
      Share.share({
        title: scheme.title,
        message: officialLink
          ? `${scheme.title}\n${officialLink}`
          : scheme.title,
        url: officialLink ?? undefined,
      }).catch(() => {});

    navigation.setOptions({
      headerRight: renderHeaderActions({
        saved,
        canSave: !!user,
        onToggleBookmark: toggleBookmark,
        onShare: share,
      }),
    });
  }, [navigation, scheme, saved, officialLink, user, addBookmark, removeBookmark]);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !scheme) {
    return (
      <ErrorState
        message="We couldn't load this scheme."
        onRetry={() => refetch()}
      />
    );
  }

  const openOfficialSite = () => {
    if (officialLink) Linking.openURL(officialLink).catch(() => {});
  };
  const askSarthi = () =>
    navigation.navigate('SchemeQA', {
      schemeId: scheme.id,
      schemeTitle: scheme.title,
    });
  const editProfile = () =>
    navigation.navigate('ProfileSetup', { mode: 'edit' });

  const status = STATUS_PILL[scheme.status];
  const isCentral = scheme.scheme_level === 'central';
  const failed = checks.filter(c => c.status === 'fail');
  const verdict = checks.length > 0 ? VERDICT[eligibilityVerdict(checks)] : null;
  const documents = scheme.required_documents ?? [];
  const readyCount = documents.filter(d => checklist.checked.includes(d)).length;
  const steps = howToApplySteps(scheme);

  const footer = (
    <View style={styles.footer}>
      <Button
        title="Ask Sarthi about this scheme"
        leftIcon="chatbubbles-outline"
        onPress={askSarthi}
      />
      {officialLink ? (
        <Button
          title="Apply on official site"
          variant="outline"
          rightIcon="open-outline"
          onPress={openOfficialSite}
          accessibilityHint="Opens the official website in your browser"
        />
      ) : null}
    </View>
  );

  return (
    <Screen scroll footer={footer} edges={['left', 'right', 'bottom']}>
      {scheme.status === 'needs_verification' && (
        <Banner
          tone="warning"
          title="Verify before applying"
          message="Some details of this scheme may be out of date. Check the official website before you apply."
          style={styles.section}
        />
      )}

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.pillRow}>
          <StatusPill
            size="sm"
            tone="neutral"
            icon={isCentral ? 'business-outline' : 'location-outline'}
            label={isCentral ? 'Central' : 'State'}
          />
          <StatusPill size="sm" tone={status.tone} label={status.label} />
        </View>
        <AppText variant="h1">{scheme.title}</AppText>
        {scheme.benefit_summary ? (
          <AppText variant="bodySm" color="textSecondary">
            {scheme.benefit_summary}
          </AppText>
        ) : null}
        {scheme.last_verified_at ? (
          <AppText variant="caption" color="textMuted">
            Last verified {formatDate(scheme.last_verified_at)}
          </AppText>
        ) : null}
      </View>

      {/* Your eligibility */}
      <Card style={styles.section}>
        <AppText variant="overline" color="textSecondary">
          Your eligibility
        </AppText>
        {verdict ? (
          <>
            <View
              accessible
              accessibilityLabel={`${verdict.title}. ${verdict.message}`}
              style={styles.verdict}
            >
              <IconCircle icon={verdict.icon} tone={verdict.tone} size="lg" />
              <View style={styles.verdictText}>
                <AppText variant="h2" color={verdict.color}>
                  {verdict.title}
                </AppText>
                <AppText variant="bodySm" color="textSecondary">
                  {verdict.message}
                </AppText>
              </View>
            </View>
            {failed.length === 1 && (
              <Banner
                tone="warning"
                title={`${failed[0].label} doesn't match yet`}
                message={explainFailedCheck(failed[0], scheme.eligibility_rules)}
                actionLabel={
                  failed[0].actualText === 'Not provided'
                    ? 'Update profile'
                    : undefined
                }
                onAction={editProfile}
                style={styles.verdictBanner}
              />
            )}
            <Divider />
            {checks.map(check => (
              <CriteriaRow
                key={check.key}
                label={check.label}
                status={check.status}
                requiredText={check.requiredText}
                actualText={check.actualText}
              />
            ))}
          </>
        ) : (
          <Banner
            tone="info"
            title="Complete your profile"
            message="Add your age, state and other details to see if you qualify."
            actionLabel="Complete profile"
            onAction={editProfile}
            style={styles.verdictBanner}
          />
        )}
      </Card>

      {scheme.benefit_summary ? (
        <Section title="Benefits">
          <AppText variant="body">{scheme.benefit_summary}</AppText>
        </Section>
      ) : null}

      <Section title="About this scheme">
        <AppText variant="body">{scheme.description}</AppText>
      </Section>

      {documents.length > 0 && (
        <Section title="Documents you'll need">
          <AppText
            variant="bodySm"
            color="textSecondary"
            style={styles.sectionHint}
          >
            Tick each one as you get it ready. {readyCount} of{' '}
            {documents.length} ready.
          </AppText>
          {documents.map(doc => {
            const done = checklist.checked.includes(doc);
            return (
              <Pressable
                key={doc}
                onPress={() => checklist.toggle(doc)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: done }}
                accessibilityLabel={doc}
                style={({ pressed }) => [
                  styles.checkRow,
                  pressed && styles.pressed,
                ]}
              >
                <Icon
                  name={done ? 'checkbox' : 'square-outline'}
                  size="lg"
                  color={done ? 'primary' : 'textMuted'}
                />
                <AppText
                  variant="body"
                  color={done ? 'textSecondary' : 'text'}
                  style={[styles.flex, done && styles.checkedText]}
                >
                  {doc}
                </AppText>
              </Pressable>
            );
          })}
        </Section>
      )}

      {steps.length > 0 && (
        <Section title="How to apply">
          {steps.map((step, index) => (
            <View key={`${index}-${step}`} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <AppText variant="bodySm" weight="700" color="primary">
                  {index + 1}
                </AppText>
              </View>
              <AppText variant="body" style={styles.flex}>
                {step}
              </AppText>
            </View>
          ))}
        </Section>
      )}

      {officialLink ? (
        <Card style={styles.section} padding="md">
          <InfoRow
            icon="globe-outline"
            label="Official website"
            value={officialLink.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
            onPress={openOfficialSite}
          />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  hero: { gap: spacing.sm, marginBottom: spacing.xl },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  section: { marginBottom: spacing.lg },
  sectionTitle: { marginBottom: spacing.sm },
  sectionHint: { marginBottom: spacing.sm },
  verdict: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  verdictText: { flex: 1, gap: spacing.xs },
  verdictBanner: { marginTop: spacing.md },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: sizes.touchTarget,
  },
  checkedText: { textDecorationLine: 'line-through' },
  pressed: { opacity: opacity.pressed },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  stepNumber: {
    width: sizes.iconCircle.sm,
    height: sizes.iconCircle.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { gap: spacing.sm },
});
