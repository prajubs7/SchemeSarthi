# SchemeSarthi — Project Context

## Overview

SchemeSarthi is a React Native app that helps users in India find government schemes relevant to their profile. The current launch configuration supports Maharashtra and schemes marked `ALL`.

## Stack

- React Native 0.86 with TypeScript
- React Navigation 7 (native stack and bottom tabs)
- Redux Toolkit / React Redux for app state (auth session mirror, current profile)
- TanStack Query for server data fetching and caching
- Supabase for auth, Postgres data and edge functions (`supabase/functions`, Deno)
- Reanimated 4 (skeleton shimmer), react-native-vector-icons (Ionicons)
- AsyncStorage for persisted Supabase sessions and the per-scheme document checklist
- Jest + @testing-library/react-native (v14: `render`, `rerender` and `fireEvent` are async; `await` them)

## Directory layout

- `App.tsx`: Gesture Handler, Redux, TanStack Query and `AuthProvider`, then `RootNavigator`.
- `src/theme/`: design tokens. **Import all colours, type, spacing, radii, sizes, shadows and opacities from `src/theme`.** No hex values, raw `fontSize`s or emoji in screens/components.
  - `colors.ts`: `ColorToken`s. Text tokens (`text`, `textSecondary`, `textMuted`, and the tone foregrounds `primary`/`success`/`warning`/`danger`/`info`) are ≥ 4.5:1 on every surface and soft background. `accent` (saffron) is under 3:1 on light surfaces and white, so never use it for text or behind white text; use `warning` instead.
  - `typography.ts`: variants `display`, `h1`, `h2`, `title`, `body`, `bodySm`, `caption`, `overline`. Sizes scale with the OS font setting.
  - `spacing.ts`: 4-pt `spacing` (`xs`–`xxl`, `gutter`) and `radius`.
  - `sizes.ts`: fixed dimensions (`touchTarget` = 48, icon sizes, `chip`, `input` and so on), `iconHitSlop` for bare icon pressables, and `opacity`.
  - `shadows.ts`, `navigation.ts` (`navigationTheme`, `stackScreenOptions`).
- `src/components/ui/`: design-system primitives, all exported from `src/components/ui/index.ts`:
  - Text and icons: `AppText` (typography variant + colour token), `Icon`, `IconCircle`, `Avatar`.
  - Layout: `Screen` (safe area, gutter, optional scroll, sticky footer, keyboard avoidance), `ScreenHeader`, `SectionHeader`, `Card`, `Divider`.
  - Controls: `Button` (variants `primary`, `secondary`, `outline`, `ghost`, `danger`, `dangerGhost`; `loading`), `IconButton` (optional count badge), `TextField`, `Chip`/`ChipGroup` (single select = `radiogroup` of radios, `multiple` = checkboxes), `CategoryTile`, `InfoRow`.
  - Status: `StatusPill`, `Banner` (tones `info`/`warning`/`success`/`accent`/`danger`, optional action and dismiss; also used as the inline snackbar/toast), `ProgressBar`, `StatCard`, `CriteriaRow` (one eligibility criterion: pass/fail/unverified).
  - Data states: `Skeleton`, `SchemeCardSkeleton`, `ListRowSkeleton`, `EmptyState`, `ErrorState` (retry), `LoadingSpinner` (only for the boot splash and in-button work).
  - `tones.ts`: `Tone` → foreground/soft background/solid colour tokens.
- `src/components/scheme/SchemeListCard.tsx`, `src/components/notifications/NotificationRow.tsx`: domain cards.
- `src/screens/`: `auth/` (Login, Signup, OtpVerify), `home/` (Home, MatchedSchemes, SchemeDetail), `schemes/`, `bookmarks/`, `notifications/`, `qa/` (SchemeQA chat), `profile/` (Profile, ProfileSetup wizard), `dev/ComponentGallery` (dev builds only).
- `src/hooks/`: `useAuth` (single `onAuthStateChange` subscription), `useProfile`, `useSchemeMatches` / `useNearMatches` / `useAllSchemes`, `useBookmarks`, `useNotifications` (+ realtime), `useDocumentChecklist`, `useDebouncedValue`.
- `src/services/`: Supabase data access (`supabase.ts` client, `profileApi`, `schemesApi`, `bookmarksApi`, `notificationsApi`, `qaApi`).
- `src/utils/`:
  - `eligibility.ts`: client copy of `supabase/functions/_shared/eligibility.ts` `checkEligibility`. **Keep the two in sync.** `__tests__/eligibility.test.ts` checks that they agree case by case.
  - `eligibilityFormatter.ts`: turns `match_reason` into `EligibilityCheck`s for `CriteriaRow`, gives an overall verdict, explains failed checks, and builds near-match "Needs: …" text.
  - `profileCompleteness`, `authValidation`, `authErrors`, `relativeTime`.
- `src/constants/`: `config.ts` (supported states), `profileOptions.ts` (age groups, `INCOME_BRACKETS` whose `max` must equal `bracketUpper(value)`, chip options), `schemeCategories.ts`.
- `src/store/`: Redux store with `authSlice` and `profileSlice`.
- `src/types/`: `profile`, `scheme`, `notification`.

## Navigation

`RootNavigator` (inside `NavigationContainer` with `navigationTheme`) gates on auth and profile:

1. Booting, or signed in with the profile still loading: splash with `LoadingSpinner`. If the profile fails to load: `ErrorState` with retry and a sign-out button.
2. Signed out: `AuthStack`: `Login` → `Signup` → `OtpVerify { email }`.
3. Signed in without age or state: `OnboardingStack`: `ProfileSetup` (wizard, `mode: 'onboarding'`).
4. Otherwise `AppStack` (root native stack, `RootStackParamList`):
   - `MainTabs` (bottom tabs): `HomeTab`, `SchemeTab { initialCategory? }`, `SavedTab`, `ProfileTab`.
   - Pushed over the tabs: `SchemeDetail { schemeId }`, `SchemeQA { schemeId, schemeTitle }`, `Notifications`, `ProfileSetup { mode: 'edit', step? }`, `AllMatchedSchemes`, and `ComponentGallery` (`__DEV__` only).

`src/navigation/types.ts` declares the global `ReactNavigation.RootParamList`, so `useNavigation()` is typed without a generic.

## Main flows

1. **Auth**: email + OTP through Supabase; `useAuth` exposes `session`, `user`, `loading` and `signOut`.
2. **Onboarding/profile**: the `ProfileSetup` wizard writes the profile (and `metadata.age_group`), then calls the `match-schemes` edge function. From Profile, each row reopens the wizard at its step.
3. **Matching**: `match-schemes` runs `checkEligibility` for every active scheme and stores matches with a `match_reason` per criterion. Schemes that fail exactly one changeable criterion (age within 2 years, income, occupation) are stored as near matches.
4. **Home**: hero with the match count, stats, category shortcuts, top matches, "Almost eligible" and "Coming up for you", and recent notifications.
5. **Schemes tab**: searchable, filterable catalogue (all or matched).
6. **Scheme detail**: status and verification, "Your eligibility" verdict with a `CriteriaRow` per criterion (from `match_reason`, or local `checkEligibility` for unmatched schemes), a warning `Banner` when exactly one criterion fails, the document checklist, how-to-apply steps, and CTAs to ask Sarthi or open the official site.
7. **Saved**: bookmarks; removing one shows an inline `Banner` snackbar with Undo.
8. **Q&A**: chat with the `scheme-qa` edge function: suggested questions, follow-ups, helpful votes, history.
9. **Notifications**: grouped by recency (Today / This week / Earlier), mark read and mark all read. `generate-awareness-digest` creates them.

## UI conventions

- **Data states**: every data screen handles loading with a skeleton (`SchemeCardSkeleton`, `ListRowSkeleton` or a screen-shaped `Skeleton` layout), empty (`EmptyState`, with a CTA where useful), error (`ErrorState` with `onRetry` → `refetch`), and pull to refresh where it is a list. There is no offline banner: `@react-native-community/netinfo` was deliberately not added, so offline shows as the error state with retry.
- **Feedback**: no `Alert.alert` for success. Use an inline `Banner` (or the Bookmarks-style snackbar). `Alert.alert` remains only for the destructive sign-out confirmation and two failure messages (sign-out, profile save).
- **Accessibility**:
  - Every `Pressable` sets `accessibilityRole` and `accessibilityLabel` (and `accessibilityState` for toggles).
  - Touch targets are ≥ 48dp: `minHeight: sizes.touchTarget`, or `hitSlop` for smaller visuals (`Chip`, `IconButton` 44, `iconHitSlop` for bare icons).
  - Layouts use `minHeight` and wrapping, not fixed heights, so text can grow with the font scale (checked for 1.3).
  - `Icon` is decorative and hidden from screen readers. Skeleton blocks are hidden, and each skeleton group has one "Loading" progressbar label.

## Data and query behaviour

- Supabase client: `src/services/supabase.ts`; sessions persist in AsyncStorage.
- TanStack Query: one retry, five-minute default stale time.
- Query keys: `['schemeMatches', userId]`, `['scheme', schemeId]`, `['profile', userId]`, and so on. Re-running matching invalidates `['schemeMatches']`.

## Testing

- `jest.config.js` uses the RN preset, transforms the ESM packages (react-redux, @reduxjs, immer, @tanstack, react-native-*), and runs `jest.setup.js`. The setup file mocks Reanimated, Worklets, Gesture Handler, safe-area-context and AsyncStorage (in memory), and Ionicons (renders the icon name as text, so tests can assert on icons).
- `__tests__/`:
  - `eligibility.test.ts`: `checkEligibility` cases plus client/edge parity.
  - `eligibilityFormatter.test.ts`, `profileOptions.test.ts`: `getAgeGroup`, `INCOME_BRACKETS` parsing, `toIncomeBracket`.
  - `components/`: `Button`, `ChipGroup`, `CriteriaRow`.
  - `App.test.tsx`: smoke render, with Supabase stubbed and fake timers.
- `tsconfig.json` excludes `supabase/functions` (Deno code: typecheck it with `deno check`). `supabase/functions/_shared/eligibility.ts` is still typechecked through the test that imports it.

## Development commands

- `npm start`: start Metro
- `npm run android` / `npm run ios`: build and run (iOS needs CocoaPods)
- `npm run lint`: ESLint
- `npm test`: Jest
- `npx tsc --noEmit`: typecheck

Node.js 22.11 or newer is required (`package.json` engines).

## Known follow-ups

- `generate-awareness-digest` weekly run selects all profiles in one query. Supabase returns at most 1000 rows by default, so it should page with the unused `PAGE_SIZE` constant (currently a lint error).
- Edge function changes (for example the eligibility fix in `_shared/eligibility.ts`) take effect only after `supabase functions deploy`.
