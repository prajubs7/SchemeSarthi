import React, { ReactNode, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  AppText,
  Avatar,
  Badge,
  Banner,
  BannerTone,
  Button,
  ButtonVariant,
  Card,
  CardVariant,
  CategoryTile,
  Chip,
  ChipGroup,
  CriteriaRow,
  Divider,
  EmptyState,
  ErrorState,
  IconButton,
  InfoRow,
  LoadingSpinner,
  ProgressBar,
  Screen,
  SectionHeader,
  Skeleton,
  SchemeCardSkeleton,
  StatCard,
  StatusPill,
  TextField,
  Tone,
} from '../../components/ui';
import SchemeListCard from '../../components/scheme/SchemeListCard';
import { spacing, TypographyVariant } from '../../theme';
import { MatchedScheme } from '../../types/scheme';

// Dev-only: renders every UI component in every variant. Registered only when __DEV__.

const TEXT_VARIANTS: TypographyVariant[] = [
  'display',
  'h1',
  'h2',
  'title',
  'body',
  'bodySm',
  'caption',
  'overline',
];
const BUTTON_VARIANTS: ButtonVariant[] = [
  'primary',
  'secondary',
  'outline',
  'ghost',
  'danger',
];
const CARD_VARIANTS: CardVariant[] = [
  'default',
  'outlined',
  'soft',
  'highlight',
];
const TONES: Tone[] = [
  'success',
  'warning',
  'danger',
  'info',
  'neutral',
  'accent',
];
const BANNER_TONES: BannerTone[] = ['info', 'warning', 'success', 'accent'];

const CATEGORY_OPTIONS = [
  { value: 'student', label: 'Students', icon: 'school-outline' },
  { value: 'farmer', label: 'Farmers', icon: 'leaf-outline' },
  { value: 'woman', label: 'Women', icon: 'woman-outline' },
  { value: 'senior', label: 'Seniors', icon: 'accessibility-outline' },
];
const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const SAMPLE_SCHEME: MatchedScheme = {
  id: 'gallery-sample',
  title: 'Pradhan Mantri Kisan Samman Nidhi',
  description: 'Income support for landholding farmer families.',
  benefit_summary:
    '₹6,000 per year paid in three instalments directly to your bank account.',
  eligibility_rules: {},
  required_documents: null,
  official_link: null,
  source_document_ref: null,
  scheme_level: 'central',
  states: ['ALL'],
  status: 'needs_verification',
  last_verified_at: null,
  created_at: '2026-01-01T00:00:00Z',
  match_score: 0.9,
  match_reason: null,
  viewed: false,
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="overline" color="textMuted" style={styles.sectionTitle}>
        {title}
      </AppText>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const noop = () => {};

export default function ComponentGallery() {
  const [single, setSingle] = useState<string | null>('female');
  const [multi, setMulti] = useState<string[]>(['student', 'farmer']);
  const [chipOn, setChipOn] = useState(true);
  const [name, setName] = useState('');
  const [bannerVisible, setBannerVisible] = useState(true);

  return (
    <Screen scroll padded>
      <Section title="AppText">
        {TEXT_VARIANTS.map(v => (
          <AppText key={v} variant={v}>
            {v} · Scheme Sarthi
          </AppText>
        ))}
        <AppText color="primary" weight="700">
          body, color primary, weight 700
        </AppText>
      </Section>

      <Section title="Button">
        {BUTTON_VARIANTS.map(v => (
          <Button key={v} title={`${v} md`} variant={v} onPress={noop} />
        ))}
        <Button
          title="primary lg with icons"
          size="lg"
          leftIcon="search"
          rightIcon="arrow-forward"
          onPress={noop}
        />
        <Button title="Loading" loading onPress={noop} />
        <Button title="Disabled" disabled onPress={noop} />
        <View style={styles.row}>
          <Button title="Inline" fullWidth={false} onPress={noop} />
          <Button
            title="Inline outline"
            variant="outline"
            fullWidth={false}
            onPress={noop}
          />
        </View>
      </Section>

      <Section title="IconButton">
        <View style={styles.row}>
          <IconButton
            icon="notifications-outline"
            accessibilityLabel="Notifications"
            badgeCount={3}
            onPress={noop}
          />
          <IconButton
            icon="notifications-outline"
            accessibilityLabel="Notifications"
            badgeCount={24}
            onPress={noop}
          />
          <IconButton
            icon="bookmark-outline"
            accessibilityLabel="Bookmark"
            variant="plain"
            onPress={noop}
          />
          <IconButton
            icon="share-outline"
            accessibilityLabel="Share"
            variant="filled"
            onPress={noop}
          />
          <IconButton
            icon="close"
            accessibilityLabel="Close"
            size={44}
            onPress={noop}
          />
          <IconButton
            icon="trash-outline"
            accessibilityLabel="Delete"
            disabled
            onPress={noop}
          />
        </View>
      </Section>

      <Section title="TextField">
        <TextField
          label="Full name"
          placeholder="e.g. Asha Patil"
          helperText="As written on your Aadhaar card"
          leftIcon="person-outline"
          value={name}
          onChangeText={setName}
        />
        <TextField
          label="Password"
          placeholder="Enter password"
          secureTextEntry
          leftIcon="lock-closed-outline"
        />
        <TextField
          label="Age"
          placeholder="Your age"
          keyboardType="number-pad"
          error="Enter an age between 1 and 120"
        />
        <TextField
          label="Your question"
          placeholder="Ask anything about this scheme"
          multiline
        />
        <TextField label="Disabled" value="Maharashtra" editable={false} />
      </Section>

      <Section title="Card">
        {CARD_VARIANTS.map(v => (
          <Card key={v} variant={v}>
            <AppText variant="title">{v}</AppText>
            <AppText variant="bodySm" color="textSecondary">
              Card content
            </AppText>
          </Card>
        ))}
        <Card
          elevated
          onPress={noop}
          accessibilityLabel="Pressable elevated card"
        >
          <AppText variant="title">elevated + onPress</AppText>
        </Card>
      </Section>

      <Section title="Chip / ChipGroup">
        <View style={styles.row}>
          <Chip label="Unselected" onPress={noop} />
          <Chip
            label="Toggle"
            selected={chipOn}
            onPress={() => setChipOn(s => !s)}
          />
          <Chip label="With icon" icon="leaf-outline" onPress={noop} />
          <Chip label="Disabled" disabled onPress={noop} />
        </View>
        <AppText variant="bodySm" color="textSecondary">
          Single select
        </AppText>
        <ChipGroup
          options={GENDER_OPTIONS}
          value={single}
          onChange={setSingle}
          accessibilityLabel="Gender"
        />
        <AppText variant="bodySm" color="textSecondary">
          Multi select, horizontal
        </AppText>
        <ChipGroup
          multiple
          horizontal
          options={CATEGORY_OPTIONS}
          value={multi}
          onChange={setMulti}
        />
      </Section>

      <Section title="StatusPill / Badge">
        <View style={styles.wrapRow}>
          {TONES.map(t => (
            <StatusPill key={t} tone={t} label={t} />
          ))}
        </View>
        <View style={styles.wrapRow}>
          {TONES.map(t => (
            <Badge
              key={t}
              tone={t}
              size="sm"
              icon="ellipse"
              label={`${t} sm`}
            />
          ))}
        </View>
      </Section>

      <Section title="SectionHeader">
        <SectionHeader title="Your top matches" />
        <SectionHeader
          title="Your top matches"
          subtitle="Based on your profile"
          onActionPress={noop}
        />
      </Section>

      <Section title="StatCard">
        <View style={styles.row}>
          <StatCard
            value={12}
            label="Schemes matched"
            icon="sparkles-outline"
            onPress={noop}
          />
          <StatCard
            value={3}
            label="Saved"
            icon="bookmark-outline"
            tone="accent"
          />
        </View>
        <View style={styles.row}>
          <StatCard
            value={2}
            label="Need action"
            icon="alert-circle-outline"
            tone="warning"
          />
          <StatCard
            value={5}
            label="Updated"
            icon="refresh-outline"
            tone="info"
          />
        </View>
      </Section>

      <Section title="CategoryTile">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {CATEGORY_OPTIONS.map(c => (
            <CategoryTile
              key={c.value}
              icon={c.icon}
              label={c.label}
              onPress={noop}
            />
          ))}
          <CategoryTile
            icon="home-outline"
            label="Housing"
            tone="accent"
            onPress={noop}
          />
          <CategoryTile
            icon="briefcase-outline"
            label="Business & Self-employed"
            tone="info"
            onPress={noop}
          />
        </ScrollView>
      </Section>

      <Section title="InfoRow">
        <Card padding="md">
          <InfoRow icon="calendar-outline" label="Age" value={34} />
          <Divider />
          <InfoRow
            icon="location-outline"
            label="State"
            value="Maharashtra"
            onPress={noop}
          />
          <Divider />
          <InfoRow icon="people-outline" label="Category" value={null} />
        </Card>
      </Section>

      <Section title="Banner">
        {BANNER_TONES.map(t => (
          <Banner
            key={t}
            tone={t}
            title={`${t} banner`}
            message="Some details may have changed since you last looked."
          />
        ))}
        {bannerVisible ? (
          <Banner
            tone="accent"
            title="3 schemes updated"
            message="Deadlines changed for schemes you saved."
            actionLabel="Review changes"
            onAction={noop}
            onDismiss={() => setBannerVisible(false)}
          />
        ) : (
          <Button
            title="Show dismissible banner"
            variant="ghost"
            onPress={() => setBannerVisible(true)}
          />
        )}
      </Section>

      <Section title="ProgressBar">
        <ProgressBar value={0.8} label="Profile 80% complete" />
        <ProgressBar value={0.35} tone="warning" label="35%" />
        <ProgressBar value={1} tone="success" />
        <ProgressBar value={0} />
      </Section>

      <Section title="CriteriaRow">
        <Card padding="md">
          <CriteriaRow
            label="Age"
            status="pass"
            requiredText="18 – 60"
            actualText="34"
          />
          <Divider />
          <CriteriaRow
            label="Income"
            status="fail"
            requiredText="Below ₹2.5 lakh"
            actualText="₹4 lakh"
          />
          <Divider />
          <CriteriaRow
            label="Occupation"
            status="unverified"
            requiredText="Farmer"
            actualText="Not provided"
          />
        </Card>
      </Section>

      <Section title="Avatar / Divider">
        <View style={styles.row}>
          <Avatar name="Asha Patil" size="sm" />
          <Avatar name="Asha Patil" />
          <Avatar name="rahul.deshmukh@example.com" size="lg" />
          <Avatar size="lg" />
        </View>
        <Divider spacing="sm" />
        <View style={styles.dividerRow}>
          <AppText>Left</AppText>
          <Divider vertical spacing="md" />
          <AppText>Right</AppText>
        </View>
      </Section>

      <Section title="Skeleton">
        <Skeleton width="60%" height={spacing.xl} />
        <Skeleton height={spacing.md} radius="pill" />
        <SchemeCardSkeleton />
      </Section>

      <Section title="SchemeListCard">
        <SchemeListCard scheme={SAMPLE_SCHEME} showMatchInfo onPress={noop} />
        <SchemeListCard
          scheme={{
            ...SAMPLE_SCHEME,
            scheme_level: 'state',
            status: 'active',
            title: 'Mahatma Jyotiba Phule Jan Arogya Yojana',
          }}
          onPress={noop}
        />
      </Section>

      <Section title="LoadingSpinner">
        <View style={styles.stateBox}>
          <LoadingSpinner label="Finding schemes for you…" />
        </View>
      </Section>

      <Section title="EmptyState">
        <View style={styles.stateBox}>
          <EmptyState
            icon="bookmark-outline"
            title="No saved schemes"
            subtitle="Tap the bookmark on any scheme to keep it here."
            actionLabel="Browse schemes"
            onAction={noop}
          />
        </View>
      </Section>

      <Section title="ErrorState">
        <View style={styles.stateBox}>
          <ErrorState onRetry={noop} />
        </View>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.xxl },
  sectionTitle: { marginBottom: spacing.md },
  sectionBody: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dividerRow: { flexDirection: 'row', alignItems: 'center' },
  stateBox: { minHeight: spacing.xxl * 10 },
});
