export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  OtpVerify: { email: string };
};

export type HomeStackParamList = {
  MatchedSchemes: undefined;
  SchemeDetail: { schemeId: string };
  SchemeQA: { schemeId: string; schemeTitle: string };
};

export type MainTabParamList = {
  HomeTab: undefined;
  BookmarksTab: undefined;
  ProfileTab: undefined;
};
