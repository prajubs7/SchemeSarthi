# SchemeSarthi — Project Context

## Overview

SchemeSarthi is a React Native app that helps users in India find government schemes relevant to their profile. The current launch configuration supports Maharashtra and schemes marked `ALL`.

## Stack

- React Native 0.86 with TypeScript
- React Navigation 7 (native stack and bottom tabs)
- Redux Toolkit / React Redux for app state
- TanStack Query for server data fetching and caching
- Supabase for authentication and backend data
- AsyncStorage for persisted Supabase auth sessions

## App structure

- `App.tsx`: wraps the app in Gesture Handler, Redux, and TanStack Query providers.
- `src/navigation/`: auth stack, root auth gate, home stack, and main tab navigation.
- `src/screens/auth/`: login, signup, and OTP verification.
- `src/screens/onboarding/` and `src/screens/profile/`: profile setup and profile management.
- `src/screens/home/`: personalized home, matched schemes, and scheme details.
- `src/screens/schemes/`: searchable scheme catalog.
- `src/screens/bookmarks/`: saved schemes.
- `src/screens/qa/`: scheme question and answer experience.
- `src/services/`: Supabase-backed profile, scheme, bookmark, and Q&A data access.
- `src/hooks/`: auth, scheme matching, and bookmark queries.
- `src/store/`: Redux store and auth/profile slices.
- `src/types/`, `src/constants/`, and `src/components/`: shared models, app configuration/theme, and reusable UI.

## Main flows

1. `RootNavigator` checks the Supabase session through `useAuth` and shows the auth stack or the signed-in tab navigator.
2. Users create or complete a profile. Profile data drives scheme matching; the home screen prompts users to complete key fields when age or state is missing.
3. The home screen presents match and bookmark counts, category shortcuts, and up to three top scheme matches.
4. The Schemes tab searches the full catalog and opens a scheme detail screen.
5. Users can bookmark schemes and ask questions about schemes.

## Data and query behavior

- Supabase client configuration is in `src/services/supabase.ts`; sessions persist using AsyncStorage.
- `App.tsx` configures TanStack Query with one retry and a five-minute default stale time.
- Supported states are configured in `src/constants/config.ts` (`Maharashtra`, `ALL`).
- Scheme and profile domain types live under `src/types/`.

## Development commands

- `npm start` — start Metro
- `npm run android` — build and run Android
- `npm run ios` — build and run iOS (requires CocoaPods setup)
- `npm run lint` — run ESLint
- `npm test` — run Jest

Node.js 22.11 or newer is specified in `package.json`.

## Current focus

The IDE context at the time this file was created centers on the scheme catalog, profile setup/profile display, and scheme detail screens. There are two profile setup screen files (`src/screens/profile/ProfileSetupScreen.tsx` and `src/screens/onboarding/ProfileSetupScreen.tsx`); check navigation imports before changing one, since they may serve different flows.
