import React from 'react';
import AppHeader from './AppHeader';

/** Optional per-route subtitles, so every navigator shares one header setup. */
const SUBTITLES: Record<string, string> = {
  MatchedSchemes: 'Your gateway to government schemes',
  AllMatchedSchemes: 'Schemes matched to your profile',
  SchemeDetail: 'Eligibility, benefits & how to apply',
  SchemeQA: 'Ask anything about this scheme',
  SchemeTab: 'Browse and search all schemes',
  BookmarksTab: 'Schemes you saved for later',
  ProfileView: 'Your details power your matches',
  ProfileSetup: 'Keep your details up to date',
  Login: "Find government schemes you're eligible for",
  Signup: 'Join to discover schemes for you',
  OtpVerify: 'Enter the code we emailed you',
};

/** Shape shared by native-stack and bottom-tab header props. */
interface NavHeaderProps {
  navigation: { goBack: () => void };
  route: { name: string; params?: object };
  options: { title?: string };
  back?: unknown;
}

/**
 * Use as `header: navHeader` in any navigator's screenOptions so every
 * screen renders the same AppHeader.
 */
export function navHeader({ navigation, route, options, back }: NavHeaderProps) {
  return (
    <AppHeader
      title={options.title ?? route.name}
      subtitle={SUBTITLES[route.name]}
      showBack={!!back}
      onBackPress={navigation.goBack}
    />
  );
}
