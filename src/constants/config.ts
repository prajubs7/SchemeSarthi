export const APP_CONFIG = {
  // Email OTP verification after signup. Disabled for now; the screen and route are kept.
  // Set to true (and turn on "Confirm email" in Supabase) to re-enable.
  otpVerificationEnabled: false,
  // Extend this as you curate more state-level schemes (per your build plan,
  // Maharashtra is the launch state — add others once you've curated their schemes).
  supportedStates: ['Maharashtra', 'ALL'],
};
