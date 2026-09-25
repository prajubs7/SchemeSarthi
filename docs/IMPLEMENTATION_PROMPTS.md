# SchemeSarthi — Step-by-step implementation prompts

**Product goal:** help people learn which government schemes fit their **age group** and profile,
show them **why they qualify (or what they're missing)**, help them **take the benefit**
(documents, how to apply, official link), and let them **ask questions** about a scheme's
current status and get notified when schemes change.

**How to use this file**
- Run **one prompt per session** with Claude Code, in order. Each one depends on the steps before it.
- After each step, run `npx tsc --noEmit` and `npm run lint`, then test on a device. **Commit before starting the next step.**
- Every prompt starts with "Read context.md and docs/IMPLEMENTATION_PROMPTS.md (Design system section)", so each session has the same context.

---

## Design system (every step uses this)

Look: **calm, trustworthy, civic.** Deep forest green as the main colour, with a small saffron accent.
Warm off-white backgrounds, white cards, soft borders, very little shadow. Use big readable type, because
many users are older or new to smartphones. Use no more than one bright accent per screen.

| Token | Value | Use |
|---|---|---|
| `primary` | `#1E5B3A` | buttons, active tab, headers |
| `primaryDark` | `#133D27` | pressed state, hero gradient end |
| `primarySoft` | `#E7F1EB` | selected chip bg, matched badge bg |
| `accent` | `#D9822B` | "new" dots, highlights only (saffron) |
| `accentSoft` | `#FCF0E3` | new/updated banners |
| `background` | `#F6F7F4` | screen background |
| `surface` | `#FFFFFF` | cards |
| `surfaceMuted` | `#EEF1EC` | inputs, secondary tiles |
| `text` | `#17221C` | primary text |
| `textSecondary` | `#56625B` | body secondary |
| `textMuted` | `#8B958F` | captions, placeholders |
| `border` | `#E1E5DF` | card/input borders |
| `success` / `successSoft` | `#1F7A4D` / `#E4F3EA` | eligible, passed criteria |
| `warning` / `warningSoft` | `#A86412` / `#FDF3E2` | verify details, deadlines |
| `danger` / `dangerSoft` | `#B42318` / `#FDECEA` | not eligible, errors |
| `info` / `infoSoft` | `#1D4E89` / `#E8F0FA` | tips, unverified criteria |

- **Typography** (system font, sizes scale with the OS font setting): `display 28/34 bold`, `h1 22/28 bold`, `h2 18/24 semibold`, `title 16/22 semibold`, `body 15/22 regular`, `bodySm 13/19`, `caption 12/16`, `overline 11/14 semibold uppercase, letterSpacing 0.6`.
- **Spacing** (4-pt scale): `xs 4, sm 8, md 12, lg 16, xl 24, xxl 32`. Screen gutter is 16.
- **Radius:** `sm 8, md 12, lg 16, xl 20, pill 999`. Cards use `lg`. Buttons and inputs use `md`.
- **Elevation:** one level only (`shadowOpacity 0.06, radius 8, elevation 2`). Most cards use a border, not a shadow.
- **Icons:** `react-native-vector-icons/Ionicons` only (already linked). No emoji in the UI.
- **Touch targets:** at least 48dp. Every pressable element has an `accessibilityLabel`.

---

## Step 0: Fix bugs that block everything else

```
Read context.md. Before any UI work, fix these existing bugs. Keep each fix minimal:

1. supabase/functions/match-schemes/index.ts calls `normalize(...)` but never imports it
   (it only imports checkEligibility), so it throws ReferenceError whenever active schemes exist.
   Import `normalize` from ../_shared/eligibility.ts. Also delete the duplicated unused helpers
   (amountInRupees, bracketUpper, incomeWithinMaxBracket, incomeWithinNumericMax), which already live in _shared.
2. SECURITY: match-schemes accepts any user_id with no auth check, and it runs with the service role key.
   Use the same pattern as generate-awareness-digest: accept the service-role bearer token, OR a user JWT
   whose user.id === user_id; otherwise return 401/403.
3. There are two ProfileSetupScreen files. ProfileStack imports src/screens/onboarding/ProfileSetupScreen
   (the plain text-input version). src/screens/profile/ProfileSetupScreen.tsx (the chip version) is unused
   and has debug styles (color 'redsss', backgroundColor 'red', subtitle fontSize 25) plus a console.log.
   Keep ONE screen at src/screens/profile/ProfileSetupScreen.tsx, based on the chip version with the
   debug styles removed. Point ProfileStack to it and delete the onboarding copy.
4. The profile is never loaded from Supabase on app start. Redux `profile` is only set after saving, so
   after a restart Home always says "complete your profile". Add a `useProfile(userId)` hook
   (TanStack Query, key ['profile', userId], calls getProfile). It dispatches setProfile when data arrives
   and clearProfile on sign-out.
5. src/utils/eligibilityFormatter.ts expects {age_ok: true} flags, but the backend writes
   {age: {required, actual, pass, unverified}}. Rewrite it to match the real MatchedScheme['match_reason'] shape.
   It should return [{key, label, status: 'pass'|'fail'|'unverified', requiredText, actualText}].

Run `npx tsc --noEmit` and `npm run lint` and fix any errors you introduced. List every file you changed.
```

---

## Step 1: Theme tokens

```
Read context.md and the "Design system" section of docs/IMPLEMENTATION_PROMPTS.md.

Create src/theme/ with: colors.ts, typography.ts, spacing.ts (spacing + radius), shadows.ts, index.ts
(exports `theme` plus the individual tokens). Use the exact values from the design system table.
Keep src/constants/colors.ts as a thin re-export that maps the old keys (primary, primaryLight, accent,
background, surface, textPrimary, textSecondary, border, success, warning, error) to the new tokens,
so existing screens keep compiling until they are migrated. Mark it @deprecated.

Also create src/theme/navigation.ts with:
- `navigationTheme` (extends React Navigation DefaultTheme with our colors)
- `stackScreenOptions` (header: white surface bg, text colour title, 0 shadow, bottom border,
  headerTitleStyle using typography.title, headerBackButtonDisplayMode 'minimal')
Pass navigationTheme to NavigationContainer in RootNavigator.

No screen redesigns in this step. Run tsc and lint.
```

---

## Step 2: Reusable component library

```
Read context.md and the Design system section. Build a reusable component library in src/components/ui/
with an index.ts barrel. Every component uses src/theme tokens only (no hard-coded colours or sizes),
is typed, accepts `style`, and sets accessibility props. Use Ionicons for icons.

Components:
- AppText: variant prop (display|h1|h2|title|body|bodySm|caption|overline), color prop (token name), weight override.
- Screen: SafeAreaView + background colour. Props: scroll?, keyboardAware? (KeyboardAvoidingView),
  padded?, refreshControl?, footer? (sticky bottom area for CTAs), edges.
- Button: variants primary|secondary(soft green)|outline|ghost|danger; sizes md|lg; leftIcon/rightIcon;
  loading; fullWidth; minimum height 48.
- IconButton: round, 44/48 size, icon name, badge count (for notification bell).
- TextField: label, placeholder, helper text, error text, leftIcon, secure toggle (eye icon), focused
  border colour, multiline support, forwardRef.
- Card: variants default|outlined|soft|highlight(accentSoft); optional onPress (Pressable with pressed opacity).
- Chip + ChipGroup: single or multi select, optional icon, selected = primary bg + white text.
- Badge / StatusPill: tone success|warning|danger|info|neutral|accent, optional icon, small size.
- SectionHeader: title, optional subtitle, optional action ("See all" + chevron).
- StatCard: value, label, icon, tone, onPress.
- CategoryTile: icon in a soft circle + label, fixed width, for horizontal category rows.
- InfoRow: icon, label, value, optional chevron/onPress (profile details, scheme facts).
- Banner: tone info|warning|success|accent, icon, title, message, optional action button, dismissible.
- ProgressBar: value 0..1, tone, optional label ("Profile 80% complete").
- EmptyState: icon, title, subtitle, optional action button.
- ErrorState: message + "Try again" button (onRetry).
- Skeleton + SchemeCardSkeleton: shimmer placeholder using Reanimated (already installed).
- Divider, Avatar (initials in a primarySoft circle).
- CriteriaRow: shows one eligibility criterion with a pass/fail/unverified icon, label, and
  "Required: X · You: Y". Used by the detail screen in Step 7.

Then rebuild src/components/scheme/SchemeListCard.tsx on top of these (keep its props). Delete SchemeCard.tsx
and switch MatchedSchemesScreen to SchemeListCard. Move LoadingSpinner, EmptyState, Button and Card from
components/common into ui/ (update imports) and remove components/common.

Add a dev-only screen src/screens/dev/ComponentGallery.tsx that renders every component in every variant.
Register it only when __DEV__. Run tsc and lint.
```

---

## Step 3: Navigation restructure and onboarding gate

```
Read context.md. Right now SchemeDetail and SchemeQA exist only in HomeStack, so opening a scheme from the
Schemes or Bookmarks tab jumps to the Home tab, and Back then goes to the wrong place. Fix the structure:

- Create src/navigation/AppStack.tsx (native stack, uses stackScreenOptions) with screens:
  MainTabs (headerShown false), SchemeDetail, SchemeQA, Notifications, ProfileSetup, AllMatchedSchemes.
- The tabs become: Home, Schemes, Saved (bookmarks), Profile. Each tab is a single screen with its own
  in-screen header (no stack per tab). Delete HomeStack.tsx and ProfileStack.tsx.
- Update navigation/types.ts: RootStackParamList, MainTabParamList (SchemeTab gets
  { initialCategory?: string }), and CompositeScreenProps helpers. Remove every `useNavigation<any>()`
  and `as never` cast.
- Onboarding gate in RootNavigator: no session → AuthStack. Session but profile not loaded yet → splash.
  Session and no profile row (or age/state missing) → Onboarding (the ProfileSetup screen in onboarding
  mode, no back button). Otherwise → AppStack.
- Tab bar: white surface, top border, 64 high, Ionicons outline/filled pairs, label typography.caption,
  active = primary. Show an unread-count badge on Home from notifications (hook added in Step 9;
  leave a TODO now).
- Replace the multiple useAuth() listeners with one AuthProvider context (session, user, loading, signOut),
  so screens don't each subscribe to onAuthStateChange.

Run tsc and lint. Manually check: Schemes tab → detail → Back returns to Schemes.
```

---

## Step 4: Auth screens (Login, Signup, OTP)

```
Read context.md and the Design system section. Redesign src/screens/auth/* using only src/components/ui.

- Shared AuthLayout component: top brand area (app name "Scheme Sarthi" in display type, primary colour,
  tagline "Find the government schemes made for you", a simple Ionicons shield/leaf mark in a primarySoft
  circle), content card below, keyboard aware, scrollable on small phones.
- Login: email + password TextFields with validation (email format, required), inline errors instead of
  Alert, primary "Log in", ghost "Forgot password?" (supabase.auth.resetPasswordForEmail with a success
  banner), footer "New here? Create account".
- Signup: email, password, confirm password, password rule helper text, terms line, then navigate to OTP.
- OTP: 6 separate digit boxes (a hidden TextInput driving 6 boxes), auto-submit on the 6th digit,
  "Resend code" with a 30s countdown (supabase.auth.resend({type:'signup', email})), and "Change email" back link.
- Map Supabase error messages to friendly copy in src/utils/authErrors.ts.

Run tsc and lint.
```

---

## Step 5: Profile setup wizard (age-group aware)

```
Read context.md, the Design system section, and supabase/functions/_shared/eligibility.ts
(so saved values match what the matcher compares against).

1. Create src/constants/profileOptions.ts with:
   - AGE_GROUPS: [{key:'child',label:'Below 18',min:0,max:17}, {key:'youth',label:'18–25 Youth',min:18,max:25},
     {key:'adult',label:'26–40',min:26,max:40}, {key:'midlife',label:'41–59',min:41,max:59},
     {key:'senior',label:'60+ Senior citizen',min:60,max:120}] and getAgeGroup(age).
   - OCCUPATION, GENDER, SOCIAL_CATEGORY, STATE options, moved out of the screen.
   - INCOME_BRACKETS with display labels and stored values that bracketUpper() in _shared/eligibility.ts
     parses correctly, e.g. "0-1 lakh", "1-2.5 lakh", "2.5-5 lakh", "5-8 lakh", "8 lakh-1 crore".
     Check that the top bracket does NOT parse as ≤ 8 lakh.
2. Rebuild ProfileSetupScreen as a 3-step wizard. It serves both onboarding mode (from the gate, no back)
   and edit mode (from Profile, prefilled):
   - Step 1 "About you": age (numeric TextField). Below it, a live StatusPill with the age group
     ("You're in: 18–25 Youth"), then gender chips.
   - Step 2 "Work & income": occupation ChipGroup with icons, income bracket ChipGroup.
   - Step 3 "Where & category": state chips, social category chips, and a privacy note Banner (info).
   - ProgressBar plus a "Step 2 of 3" header. Back/Next in a sticky footer. Validate per step.
   - On finish: upsertProfile → invalidate ['profile'] → runSchemeMatch → show a success state
     ("We found N schemes for you") → go to Home (onboarding) or back (edit).
3. Save the age group in profiles.metadata.age_group too, so analytics and digests can use it.

Run tsc and lint.
```

---

## Step 6: Home: personal eligibility dashboard

```
Read context.md and the Design system section. Redesign src/screens/home/HomeScreen.tsx so that in 5 seconds
the user knows: how many schemes they qualify for, what's new, and what to do next.

Layout (Screen scroll, pull-to-refresh refetches matches + notifications):
1. Header row: "Namaste" + user's age-group pill on the left; notification IconButton with unread badge on the right.
2. Hero card (primary → primaryDark background, white text): "You may be eligible for N schemes",
   sub-line "Based on your age group, income and state", button "View all" → AllMatchedSchemes.
   If there are 0 matches, show a helpful message and "Update profile" instead.
3. Profile completeness Banner + ProgressBar when any profile field is missing (compute % from 6 fields).
4. "What's new for you": up to 3 unread notifications (new_match, deadline_soon, newly_launched,
   scheme_updated), each with a tone icon; "See all" → Notifications. Hide if empty.
5. Stat row: Matched · New (viewed=false) · Saved, using StatCards that navigate.
6. "For your age group (18–25)": horizontal list of matched schemes most relevant to the age group
   (the ones whose eligibility_rules have age bounds that include the user's age), or top matches as a fallback.
7. "Browse by category": CategoryTiles with Ionicons (school, leaf, woman, people, home, briefcase,
   medkit). Tap → Schemes tab with { initialCategory }.
8. "Top matches": 3 SchemeListCards with the match badge, then "See all".
Loading = skeletons, not a spinner. Error = ErrorState with retry.
Run tsc and lint.
```

---

## Step 7: Scheme catalogue with filters

```
Read context.md and the Design system section. Redesign src/screens/schemes/SchemesScreen.tsx.

- In-screen header "Explore schemes" + subtitle "N schemes available in Maharashtra and across India".
- Search TextField with a search icon and a clear button, debounced 350ms (a useDebouncedValue hook).
  In getAllSchemes, escape user input for PostgREST .or() filters (commas, parentheses, % and _ currently
  break the query) and trim it.
- Filter ChipGroup row (horizontal): All · Matched for me · Central · State · plus category chips.
  Read route.params.initialCategory to preselect. Category filtering: add a `category` (text[]) or reuse
  eligibility_rules.occupation; choose the least invasive option, and explain it.
- Each SchemeListCard shows "Matched for you" if the id is in the user's matches, and
  "Eligible from age X" when the user is younger than min_age (awareness).
- Sort toggle: A–Z / Recently added.
- Skeleton loading, EmptyState with a "Clear filters" action, ErrorState with retry, pull-to-refresh.
- Tap → root SchemeDetail (from Step 3).
Run tsc and lint.
```

---

## Step 8: Scheme detail: "Am I eligible?" and "How to apply"

```
Read context.md, the Design system section and supabase/functions/_shared/eligibility.ts.

1. Copy checkEligibility into src/utils/eligibility.ts (same logic, keep a comment that it must stay in sync
   with the edge function). Then the app can explain eligibility for ANY scheme, not only matched ones.
2. Redesign SchemeDetailScreen:
   - Header right: bookmark IconButton (filled when saved; wire useBookmarks add/remove with an optimistic
     update) and a share IconButton (Share API: title + official link).
   - Hero: level StatusPill (Central / State), status pill (Active / Verify details / Closed),
     title in h1, benefit_summary in bodySm, "Last verified <date>" caption.
   - "Your eligibility" Card: a big verdict at the top (success "You're eligible", danger "Not eligible yet",
     info "Partly verified"), then one CriteriaRow per criterion (age, income, state, gender, category,
     occupation) from the matched row's match_reason, or from the local checkEligibility if not matched.
     If only 1 criterion fails, show a warning Banner explaining what is missing ("You'll be eligible at 18").
   - "Benefits", "About this scheme", "Documents you'll need" (checklist with checkboxes the user ticks,
     stored locally per scheme), "How to apply" (numbered steps from eligibility_rules/metadata if present),
     and "Official website" InfoRow → Linking.openURL.
   - needs_verification → warning Banner at the top.
   - Sticky footer: primary "Ask Sarthi about this scheme" (→ SchemeQA) + outline "Apply on official site".
3. Mark viewed on open (already done). Then invalidate ['schemeMatches'] so the "new" dots update.
Run tsc and lint.
```

---

## Step 9: Q&A chat ("Ask Sarthi")

```
Read context.md, the Design system section, src/services/qaApi.ts and supabase/functions/scheme-qa/index.ts.
Redesign src/screens/qa/SchemeQAScreen.tsx as a chat:

- Load past Q&A with getQaHistory (useQuery ['qa', userId, schemeId]) and render it as a conversation.
- User bubbles on the right (primary bg, white text). Assistant bubbles on the left (surface, border).
  Each assistant bubble shows: the answer; a "Verified from official sources" success pill when
  was_grounded, or an info pill "Not confirmed — check official site" when not; helpful 👍/👎 as
  Ionicons thumbs icons (ghost IconButtons); a timestamp caption. Hide the model name from users.
- Empty state: a short intro plus suggested-question chips that match the backend intents:
  "Am I eligible for this?", "Is this scheme still open?", "What is the last date?",
  "Which documents do I need?", "How do I apply?", "Has anything changed recently?". Tapping one sends it.
- Keep 3 suggestion chips above the composer after each answer.
- Typing indicator (three animated dots) while waiting. Disable send when empty or loading.
- Errors are shown as an error bubble with a "Retry" action. Never put the raw HTTP body in the UI;
  log it with console.warn in __DEV__ only.
- Composer: multiline TextField (max 4 lines) and a round send IconButton, keyboard-safe on iOS and Android,
  auto-scroll to the newest message.
- Header title: "Ask Sarthi", with the scheme title as a subtitle.
Run tsc and lint.
```

---

## Step 10: Notifications and scheme updates

```
Read context.md, supabase/functions/generate-awareness-digest/index.ts and the notifications table in
supabase/migrations/20260923140000_*.sql.

1. src/services/notificationsApi.ts: getNotifications(userId), markRead(id), markAllRead(userId),
   refreshDigest(userId) (invokes generate-awareness-digest with {user_id}).
2. src/hooks/useNotifications.ts (TanStack Query) + unreadCount. Subscribe to Supabase Realtime INSERTs on
   notifications for this user and invalidate the query when one arrives.
3. NotificationsScreen: grouped by Today / This week / Earlier. Each row has a type icon + tone
   (new_match = success sparkles, deadline_soon = warning time, newly_launched = accent rocket,
   scheme_updated = info refresh), change_summary, relative time, unread dot. Tap → markRead → SchemeDetail.
   Header action "Mark all read". Empty state "You're all caught up".
4. Call refreshDigest after a profile save (Step 5) and on Home pull-to-refresh at most once per 6 hours
   (store the last-run time in AsyncStorage).
5. Wire the unread badge on the Home bell and the Home tab icon.
Run tsc and lint.
```

---

## Step 11: Saved schemes and Profile

```
Read context.md and the Design system section.

Saved (BookmarksScreen):
- Header "Saved schemes" + count. Show SchemeListCards with a remove IconButton (confirm with an undo
  Banner/snackbar). Show deadline_soon pills when a notification exists for that scheme.
- EmptyState with a bookmark icon and a "Explore schemes" action → Schemes tab.

Profile (ProfileScreen):
- Header card: Avatar (initials from email), email, age-group StatusPill, ProgressBar for completeness.
- "Your details" Card: InfoRows (age, gender, occupation, income, state, category), each with an icon.
  Tap any row → ProfileSetup edit mode at the matching wizard step.
- "Your matches" Card: last matched time + "Re-check my eligibility" (runSchemeMatch, then invalidate
  matches + show a success Banner with the new count).
- "About" section: how matching works (a short plain-language explainer), a disclaimer that official sites
  are the final source, app version.
- Sign out as a danger ghost Button with an Alert confirmation. It clears the redux profile and the query cache.
Run tsc and lint.
```

---

## Step 12: "Almost eligible" and "Coming up at your age" (awareness)

```
Read context.md, supabase/functions/match-schemes/index.ts and _shared/eligibility.ts.

Goal: tell people about schemes they are close to qualifying for, not only the ones they already match.

1. In match-schemes, also collect "near misses": schemes that pass state and fail exactly ONE criterion.
   Store them in user_matches with match_score null and match_reason including the failing key, OR in a
   new table user_near_matches (write a migration with RLS: users can read their own rows). Choose one
   and explain why. Keep at most 10.
2. "Coming up at your age": near misses whose only failing criterion is age, where the user reaches
   min_age within 2 years. Return the age at which they qualify.
3. App: a Home section "Almost eligible" (cards with a warning pill "Needs: income below ₹2.5 lakh") and
   "Coming up for you" ("Eligible when you turn 60"). The generate-awareness-digest function should
   create a new_match notification when a user crosses into eligibility on their birthday/age change.
Run tsc, lint, and `supabase functions serve` locally to smoke-test with a real profile.
```

---

## Step 13: Polish, accessibility, and tests

```
Read context.md. Final quality pass across all screens:

- Remove src/constants/colors.ts and any remaining hard-coded colours, font sizes, or emoji (grep for '#',
  fontSize: and emoji ranges in src/screens and src/components).
- Accessibility: accessibilityRole/Label on every Pressable. Check that layouts survive font scale 1.3.
  Contrast ≥ 4.5:1 for text. 48dp touch targets.
- Every data screen has loading (skeleton), empty, error (retry) and offline states. Add a small
  offline Banner using @react-native-community/netinfo (ask me before adding the dependency).
- Replace every remaining Alert.alert used for success with an inline Banner or toast component.
- Jest + @testing-library/react-native tests for: utils/eligibility (port the cases from the edge
  function), eligibilityFormatter, profileOptions.getAgeGroup, INCOME_BRACKETS parsing, Button,
  ChipGroup, CriteriaRow.
- Update context.md with the new structure (theme, ui components, navigation, flows).
Run tsc, lint and tests, and report the results.
```

---

## Optional later steps
- **Hindi / Marathi** (i18n with `i18next` + `react-i18next`). All copy moves to `src/i18n/{en,hi,mr}.json`, and the language picker goes on Profile.
- **Voice questions** in Q&A for users with low literacy.
- **Document vault**: the `documents` and `document_verification_logs` tables already exist. Users upload Aadhaar, income certificate and so on, and the Documents checklist on scheme detail auto-ticks.
- **Push notifications** (FCM) for `deadline_soon` and `scheme_updated`.
