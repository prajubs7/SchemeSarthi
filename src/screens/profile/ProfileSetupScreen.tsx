import React, { ReactNode, useEffect, useState } from 'react';
import { Alert, BackHandler, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { upsertProfile } from '../../services/profileApi';
import { runSchemeMatch } from '../../services/schemesApi';
import {
  AppText,
  Banner,
  Button,
  ChipGroup,
  ChipOption,
  IconCircle,
  ProgressBar,
  Screen,
  StatusPill,
  TextField,
} from '../../components/ui';
import {
  DEFAULT_STATE,
  GENDER_OPTIONS,
  getAgeGroup,
  INCOME_BRACKETS,
  MAX_AGE,
  MIN_AGE,
  OCCUPATION_OPTIONS,
  SOCIAL_CATEGORY_OPTIONS,
  STATE_OPTIONS,
  toIncomeBracket,
} from '../../constants/profileOptions';
import { spacing } from '../../theme';
import { RootState } from '../../store';
import { RootStackScreenProps } from '../../navigation/types';
import { Profile } from '../../types/profile';

// Also mounted by OnboardingStack, whose ProfileSetup route has the same params.
type Props = RootStackScreenProps<'ProfileSetup'>;

interface Form {
  age: string;
  gender: string | null;
  occupation: string | null;
  income: string | null;
  state: string | null;
  category: string | null;
}

type FormErrors = Partial<Record<keyof Form, string>>;

const STEPS = [
  {
    title: 'About you',
    subtitle: 'Many schemes depend on your age and gender.',
  },
  {
    title: 'Work & income',
    subtitle: 'Income limits decide who can apply for most schemes.',
  },
  {
    title: 'Where & category',
    subtitle: 'State and category unlock schemes meant for you.',
  },
];
const LAST_STEP = STEPS.length - 1;

function parseAge(text: string): number | null {
  const age = parseInt(text, 10);
  return Number.isInteger(age) ? age : null;
}

function validateStep(step: number, form: Form): FormErrors {
  const errors: FormErrors = {};
  if (step === 0) {
    const age = parseAge(form.age);
    if (age === null) errors.age = 'Enter your age';
    else if (age < MIN_AGE || age > MAX_AGE)
      errors.age = `Enter an age between ${MIN_AGE} and ${MAX_AGE}`;
    if (!form.gender) errors.gender = 'Choose your gender';
  } else if (step === 1) {
    if (!form.occupation) errors.occupation = 'Choose what you do';
    if (!form.income) errors.income = 'Choose your family income';
  } else {
    if (!form.state) errors.state = 'Choose your state';
    if (!form.category) errors.category = 'Choose your category';
  }
  return errors;
}

function initialForm(profile: Profile | null): Form {
  return {
    age: profile?.age ? String(profile.age) : '',
    gender: profile?.gender ?? null,
    occupation: profile?.occupation_category ?? null,
    income: toIncomeBracket(profile?.income_bracket),
    state: profile?.state ?? DEFAULT_STATE,
    category: profile?.social_category ?? null,
  };
}

interface ChipFieldProps {
  label: string;
  hint?: string;
  options: ChipOption<string>[];
  value: string | null;
  onChange: (value: string) => void;
  error?: string;
}

function ChipField({ label, hint, options, value, onChange, error }: ChipFieldProps) {
  return (
    <View style={styles.field}>
      <AppText variant="title">{label}</AppText>
      {hint ? (
        <AppText variant="bodySm" color="textSecondary">
          {hint}
        </AppText>
      ) : null}
      <ChipGroup
        options={options}
        value={value}
        onChange={onChange}
        accessibilityLabel={label}
      />
      {error ? <FieldError message={error} /> : null}
    </View>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <AppText variant="caption" color="danger" accessibilityLiveRegion="polite">
      {message}
    </AppText>
  );
}

interface MatchResult {
  profile: Profile;
  /** null when matching failed; the profile itself is saved. */
  count: number | null;
}

export default function ProfileSetupScreen({ navigation, route }: Props) {
  const isOnboarding = route.params?.mode === 'onboarding';
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const existingProfile = useSelector(
    (state: RootState) => state.profile.profile,
  );

  const [form, setForm] = useState<Form>(() => initialForm(existingProfile));
  const [step, setStep] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);

  const errors = showErrors ? validateStep(step, form) : {};
  const ageGroup = getAgeGroup(parseAge(form.age));

  const update = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const goBackStep = () => {
    setShowErrors(false);
    setStep(s => Math.max(0, s - 1));
  };

  // Android back steps back through the wizard before leaving the screen.
  useEffect(() => {
    if (step === 0 || result) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goBackStep();
      return true;
    });
    return () => sub.remove();
  }, [step, result]);

  // In onboarding, a saved profile in the cache makes RootNavigator swap to the app
  // and unmount this screen, so onboarding holds this until the success state is left.
  const publishProfile = (profile: Profile) => {
    if (!user) return;
    queryClient.setQueryData(['profile', user.id], profile);
    queryClient.invalidateQueries({ queryKey: ['profile'] });
  };

  const matchSchemes = async (userId: string): Promise<number | null> => {
    try {
      const count = await runSchemeMatch(userId);
      queryClient.invalidateQueries({ queryKey: ['schemeMatches', userId] });
      return count;
    } catch {
      return null;
    }
  };

  const finish = async () => {
    if (!user) return;
    const age = parseAge(form.age) as number;
    setSaving(true);
    let profile: Profile;
    try {
      profile = await upsertProfile(user.id, {
        age,
        gender: form.gender,
        occupation_category: form.occupation,
        income_bracket: form.income,
        state: form.state,
        social_category: form.category,
        metadata: {
          ...(existingProfile?.metadata ?? {}),
          age_group: getAgeGroup(age)?.key ?? null,
        },
      });
    } catch (err: any) {
      setSaving(false);
      Alert.alert(
        "Couldn't save your profile",
        err?.message ?? 'Please check your connection and try again.',
      );
      return;
    }

    if (!isOnboarding) publishProfile(profile);
    const count = await matchSchemes(user.id);
    setResult({ profile, count });
    setSaving(false);
  };

  const next = () => {
    if (Object.keys(validateStep(step, form)).length > 0) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    if (step < LAST_STEP) setStep(step + 1);
    else finish();
  };

  const retryMatch = async () => {
    if (!user || !result) return;
    setRetrying(true);
    const count = await matchSchemes(user.id);
    setResult({ ...result, count });
    setRetrying(false);
  };

  const leave = () => {
    if (!result) return;
    if (isOnboarding) publishProfile(result.profile);
    else navigation.goBack();
  };

  if (result) {
    const { count } = result;
    const message =
      count === null
        ? 'Your profile is saved.'
        : count === 0
        ? "We didn't find a matching scheme yet. You can still browse every scheme."
        : `We found ${count} ${count === 1 ? 'scheme' : 'schemes'} for you.`;
    return (
      <Screen
        scroll
        edges={['left', 'right', 'bottom']}
        contentContainerStyle={styles.success}
        footer={
          <Button
            title={isOnboarding ? 'Go to Home' : 'Done'}
            size="lg"
            rightIcon={isOnboarding ? 'arrow-forward' : undefined}
            onPress={leave}
          />
        }
      >
        <IconCircle icon="checkmark" tone="success" size="xl" />
        <AppText variant="h1" align="center">
          {isOnboarding ? "You're all set" : 'Profile updated'}
        </AppText>
        <AppText variant="body" color="textSecondary" align="center">
          {message}
        </AppText>
        {count === null ? (
          <Banner
            tone="warning"
            title="Couldn't match schemes"
            message="We couldn't check schemes for you just now."
            actionLabel={retrying ? 'Trying again…' : 'Try again'}
            onAction={retrying ? undefined : retryMatch}
            style={styles.successBanner}
          />
        ) : null}
      </Screen>
    );
  }

  const current = STEPS[step];
  const isLast = step === LAST_STEP;

  return (
    <Screen
      scroll
      keyboardAware
      edges={['left', 'right', 'bottom']}
      footer={
        <View style={styles.footer}>
          {step > 0 ? (
            <Button
              title="Back"
              variant="outline"
              size="lg"
              leftIcon="arrow-back"
              onPress={goBackStep}
              disabled={saving}
              fullWidth={false}
              style={styles.footerButton}
            />
          ) : null}
          <Button
            title={
              isLast
                ? isOnboarding
                  ? 'Find my schemes'
                  : 'Save changes'
                : 'Next'
            }
            size="lg"
            rightIcon={isLast ? undefined : 'arrow-forward'}
            onPress={next}
            loading={saving}
            fullWidth={false}
            style={styles.footerButton}
          />
        </View>
      }
    >
      <View style={styles.header}>
        <ProgressBar
          value={(step + 1) / STEPS.length}
          label={`Step ${step + 1} of ${STEPS.length}`}
        />
        <AppText variant="h1">{current.title}</AppText>
        <AppText variant="body" color="textSecondary">
          {current.subtitle}
        </AppText>
      </View>

      {step === 0 ? (
        <StepBody>
          <View style={styles.field}>
            <TextField
              label="Your age"
              placeholder="e.g. 26"
              keyboardType="number-pad"
              maxLength={3}
              value={form.age}
              onChangeText={t => update('age', t.replace(/\D/g, ''))}
              error={errors.age}
              returnKeyType="done"
            />
            {ageGroup ? (
              <StatusPill
                tone="primary"
                icon="people-outline"
                label={`You're in: ${ageGroup.label}`}
              />
            ) : null}
          </View>
          <ChipField
            label="Gender"
            options={GENDER_OPTIONS}
            value={form.gender}
            onChange={v => update('gender', v)}
            error={errors.gender}
          />
        </StepBody>
      ) : step === 1 ? (
        <StepBody>
          <ChipField
            label="What do you do?"
            options={OCCUPATION_OPTIONS}
            value={form.occupation}
            onChange={v => update('occupation', v)}
            error={errors.occupation}
          />
          <ChipField
            label="Annual family income"
            hint="Total yearly income of everyone in your household."
            options={INCOME_BRACKETS}
            value={form.income}
            onChange={v => update('income', v)}
            error={errors.income}
          />
        </StepBody>
      ) : (
        <StepBody>
          <ChipField
            label="State"
            options={STATE_OPTIONS}
            value={form.state}
            onChange={v => update('state', v)}
            error={errors.state}
          />
          <ChipField
            label="Social category"
            options={SOCIAL_CATEGORY_OPTIONS}
            value={form.category}
            onChange={v => update('category', v)}
            error={errors.category}
          />
          <Banner
            tone="info"
            icon="lock-closed-outline"
            title="Your details stay private"
            message="We only use them to match you with schemes. They are never shared."
          />
        </StepBody>
      )}
    </Screen>
  );
}

function StepBody({ children }: { children: ReactNode }) {
  return <View style={styles.body}>{children}</View>;
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm, marginBottom: spacing.xl },
  body: { gap: spacing.xl },
  field: { gap: spacing.sm },
  footer: { flexDirection: 'row', gap: spacing.md },
  footerButton: { flex: 1 },
  success: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  successBanner: { alignSelf: 'stretch', marginTop: spacing.lg },
});
