import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  OtpVerify: { email: string };
};

export type ProfileSetupParams = { mode?: 'onboarding' | 'edit' } | undefined;

// Shown by the onboarding gate when the signed-in user has no usable profile yet.
export type OnboardingStackParamList = {
  ProfileSetup: ProfileSetupParams;
};

export type MainTabParamList = {
  HomeTab: undefined;
  SchemeTab: { initialCategory?: string } | undefined;
  SavedTab: undefined;
  ProfileTab: undefined;
};

// The signed-in app: tabs plus every pushed screen, so Back always returns to the tab you came from.
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  SchemeDetail: { schemeId: string };
  SchemeQA: { schemeId: string; schemeTitle: string };
  Notifications: undefined;
  ProfileSetup: ProfileSetupParams;
  AllMatchedSchemes: undefined;
  ComponentGallery: undefined;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

// Types useNavigation() and <Link> without a generic.
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
