import React, { useMemo } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useSchemeMatches } from '../../hooks/useSchemeMatches';
import {
  AppText,
  Avatar,
  Banner,
  Button,
  Card,
  ChipOption,
  Divider,
  IconName,
  InfoRow,
  ProgressBar,
  Screen,
  ScreenHeader,
  SectionHeader,
  StatusPill,
} from '../../components/ui';
import {
  GENDER_OPTIONS,
  getAgeGroup,
  INCOME_BRACKETS,
  OCCUPATION_OPTIONS,
  SOCIAL_CATEGORY_OPTIONS,
  STATE_OPTIONS,
  toIncomeBracket,
} from '../../constants/profileOptions';
import { runSchemeMatch } from '../../services/schemesApi';
import { clearProfile } from '../../store/slices/profileSlice';
import { spacing } from '../../theme';
import { RootState } from '../../store';
import { MainTabScreenProps } from '../../navigation/types';
import { Profile } from '../../types/profile';
import {
  missingProfileFields,
  profileCompleteness,
} from '../../utils/profileCompleteness';
import { formatRelativeTime } from '../../utils/relativeTime';
import { version as appVersion } from '../../../package.json';

type Props = MainTabScreenProps<'ProfileTab'>;

interface DetailRow {
  key: keyof Profile;
  label: string;
  icon: IconName;
  /** ProfileSetup wizard step that edits this field. */
  step: number;
  format: (profile: Profile) => string | null;
}

function optionLabel(options: ChipOption<string>[], value: string | null) {
  if (!value) return null;
  const match = options.find(
    o => o.value.toLowerCase() === value.toLowerCase(),
  );
  return match?.label ?? value;
}

const DETAIL_ROWS: DetailRow[] = [
  {
    key: 'age',
    label: 'Age',
    icon: 'calendar-outline',
    step: 0,
    format: p => (p.age != null ? `${p.age} years` : null),
  },
  {
    key: 'gender',
    label: 'Gender',
    icon: 'person-outline',
    step: 0,
    format: p => optionLabel(GENDER_OPTIONS, p.gender),
  },
  {
    key: 'occupation_category',
    label: 'Occupation',
    icon: 'briefcase-outline',
    step: 1,
    format: p => optionLabel(OCCUPATION_OPTIONS, p.occupation_category),
  },
  {
    key: 'income_bracket',
    label: 'Family income',
    icon: 'wallet-outline',
    step: 1,
    format: p =>
      optionLabel(INCOME_BRACKETS, toIncomeBracket(p.income_bracket)),
  },
  {
    key: 'state',
    label: 'State',
    icon: 'location-outline',
    step: 2,
    format: p => optionLabel(STATE_OPTIONS, p.state),
  },
  {
    key: 'social_category',
    label: 'Category',
    icon: 'people-outline',
    step: 2,
    format: p => optionLabel(SOCIAL_CATEGORY_OPTIONS, p.social_category),
  },
];

function stepFor(key: keyof Profile) {
  return DETAIL_ROWS.find(r => r.key === key)?.step ?? 0;
}

function pluralSchemes(count: number) {
  return `${count} ${count === 1 ? 'scheme' : 'schemes'}`;
}

export default function ProfileScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const profile = useSelector((state: RootState) => state.profile.profile);
  const matches = useSchemeMatches(user?.id);
  const userId = user?.id;

  const ageGroup = getAgeGroup(profile?.age);
  const completeness = profileCompleteness(profile);
  const missing = missingProfileFields(profile);
  const percent = Math.round(completeness * 100);

  const matchCount = matches.data?.length ?? 0;
  const lastMatchedAt = useMemo(() => {
    const times = (matches.data ?? [])
      .map(m => (m.matched_at ? new Date(m.matched_at).getTime() : NaN))
      .filter(Number.isFinite);
    return times.length > 0 ? new Date(Math.max(...times)).toISOString() : null;
  }, [matches.data]);

  const recheck = useMutation({
    mutationFn: (id: string) => runSchemeMatch(id),
    onSuccess: (_count, id) =>
      queryClient.invalidateQueries({ queryKey: ['schemeMatches', id] }),
  });

  const editAt = (step: number) =>
    navigation.navigate('ProfileSetup', { mode: 'edit', step });

  const confirmSignOut = () =>
    Alert.alert(
      'Sign out?',
      "You'll need your email to sign in again. Your profile and saved schemes stay safe.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (err: any) {
              Alert.alert(
                "Couldn't sign out",
                err?.message ?? 'Please try again.',
              );
              return;
            }
            // Signing out swaps to the auth stack; drop everything cached for this user.
            dispatch(clearProfile());
            queryClient.clear();
          },
        },
      ],
    );

  return (
    <Screen
      scroll
      edges={['top', 'left', 'right']}
      contentContainerStyle={styles.content}
    >
      <ScreenHeader title="Profile" style={styles.header} />

      <Card style={styles.card}>
        <View style={styles.identity}>
          <Avatar name={user?.email} size="lg" />
          <View style={styles.identityText}>
            <AppText variant="title" numberOfLines={1}>
              {user?.email ?? 'Signed in'}
            </AppText>
            {ageGroup ? (
              <StatusPill
                size="sm"
                tone="primary"
                icon="people-outline"
                label={ageGroup.label}
                accessibilityLabel={`Age group: ${ageGroup.label}`}
              />
            ) : null}
          </View>
        </View>
        <ProgressBar
          value={completeness}
          tone={completeness < 1 ? 'warning' : 'success'}
          label={`Profile ${percent}% complete`}
          style={styles.progress}
        />
        {missing.length > 0 ? (
          <Button
            title="Complete your profile"
            variant="secondary"
            leftIcon="create-outline"
            onPress={() => editAt(stepFor(missing[0].key))}
            accessibilityHint={`Missing: ${missing.map(f => f.label).join(', ')}`}
            style={styles.cardAction}
          />
        ) : null}
      </Card>

      <SectionHeader
        title="Your details"
        subtitle="Tap a detail to change it."
        style={styles.sectionHeader}
      />
      <Card padding="none" style={styles.card}>
        {DETAIL_ROWS.map((row, i) => (
          <React.Fragment key={row.key}>
            {i > 0 ? <Divider /> : null}
            <InfoRow
              label={row.label}
              icon={row.icon}
              value={profile ? row.format(profile) : null}
              onPress={() => editAt(row.step)}
              style={styles.row}
            />
          </React.Fragment>
        ))}
      </Card>

      <SectionHeader title="Your matches" style={styles.sectionHeader} />
      <Card style={styles.card}>
        <InfoRow
          label="Matched schemes"
          icon="checkmark-circle-outline"
          value={matches.isLoading ? '…' : String(matchCount)}
        />
        <InfoRow
          label="Last checked"
          icon="time-outline"
          value={lastMatchedAt ? formatRelativeTime(lastMatchedAt) : null}
          placeholder="Not yet"
        />
        {recheck.isSuccess ? (
          <Banner
            tone="success"
            title="Eligibility re-checked"
            message={
              recheck.data === 0
                ? "You don't match any scheme right now. Completing your profile can help."
                : `You match ${pluralSchemes(recheck.data)}.`
            }
            onDismiss={recheck.reset}
            style={styles.banner}
          />
        ) : recheck.isError ? (
          <Banner
            tone="danger"
            title="Couldn't check your eligibility"
            message="Please check your connection and try again."
            onDismiss={recheck.reset}
            style={styles.banner}
          />
        ) : null}
        <Button
          title="Re-check my eligibility"
          variant="secondary"
          leftIcon="refresh"
          loading={recheck.isPending}
          disabled={!userId}
          onPress={() => userId && recheck.mutate(userId)}
          style={styles.cardAction}
        />
      </Card>

      <SectionHeader title="About" style={styles.sectionHeader} />
      <Card style={styles.card}>
        <View style={styles.aboutBlock}>
          <AppText variant="title">How matching works</AppText>
          <AppText variant="body" color="textSecondary">
            We compare your details (age, gender, work, family income, state and
            category) with each scheme's rules. A scheme is shown as a match when
            you meet every rule we can check. Keeping your details up to date
            gives better matches.
          </AppText>
        </View>
        <Divider spacing="lg" />
        <View style={styles.aboutBlock}>
          <AppText variant="title">Always confirm on the official site</AppText>
          <AppText variant="body" color="textSecondary">
            SchemeSarthi helps you find schemes, but rules and dates can change.
            The official government website is the final word on who can apply.
          </AppText>
        </View>
        <Divider spacing="lg" />
        <InfoRow
          label="App version"
          icon="information-circle-outline"
          value={appVersion}
        />
      </Card>

      <Button
        title="Sign out"
        variant="dangerGhost"
        leftIcon="log-out-outline"
        onPress={confirmSignOut}
        style={styles.signOut}
      />

      {__DEV__ && (
        <Button
          title="Component gallery (dev)"
          variant="ghost"
          leftIcon="color-palette-outline"
          onPress={() => navigation.navigate('ComponentGallery')}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  header: { paddingHorizontal: 0 },
  card: { marginBottom: spacing.xl },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  identityText: { flex: 1, gap: spacing.sm },
  progress: { marginTop: spacing.lg },
  cardAction: { marginTop: spacing.lg },
  sectionHeader: { marginBottom: spacing.sm },
  row: { paddingHorizontal: spacing.lg },
  banner: { marginTop: spacing.md },
  aboutBlock: { gap: spacing.xs },
  signOut: { marginBottom: spacing.sm },
});
