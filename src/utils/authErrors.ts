import { isAuthError, isAuthRetryableFetchError } from '@supabase/supabase-js';

const GENERIC = 'Something went wrong. Please try again.';
const NETWORK =
  "We couldn't reach the server. Check your internet connection and try again.";

// Keyed by Supabase's stable `error.code`.
const messagesByCode: Record<string, string> = {
  invalid_credentials:
    'That email and password do not match. Please try again.',
  email_not_confirmed:
    'Please verify your email first. Check your inbox for the 6-digit code.',
  user_already_exists:
    'An account with this email already exists. Try logging in instead.',
  email_exists:
    'An account with this email already exists. Try logging in instead.',
  email_address_invalid: 'Please enter a valid email address.',
  email_address_not_authorized:
    "We can't send email to this address. Please use a different one.",
  weak_password:
    'That password is too easy to guess. Use at least 8 characters with letters and numbers.',
  same_password: 'Your new password must be different from the old one.',
  otp_expired:
    'That code is wrong or has expired. Check your latest email or request a new code.',
  over_email_send_rate_limit:
    'We have sent too many emails to this address. Please wait a few minutes and try again.',
  over_request_rate_limit:
    'Too many attempts. Please wait a minute and try again.',
  signup_disabled: 'New sign-ups are paused right now. Please try again later.',
  email_provider_disabled:
    'Email sign-in is not available right now. Please try again later.',
  user_banned: 'This account has been suspended. Please contact support.',
  user_not_found: 'We could not find an account with this email.',
  request_timeout: 'The request took too long. Please try again.',
};

// Older Supabase servers omit `code`; fall back to matching the message.
const messagePatterns: [RegExp, string][] = [
  [/invalid login credentials/i, messagesByCode.invalid_credentials],
  [/email not confirmed/i, messagesByCode.email_not_confirmed],
  [/already registered|already exists/i, messagesByCode.user_already_exists],
  [/token has expired|invalid.*(otp|token)/i, messagesByCode.otp_expired],
  [/rate limit|too many/i, messagesByCode.over_request_rate_limit],
  [/password should be|weak password/i, messagesByCode.weak_password],
  [/network request failed|failed to fetch/i, NETWORK],
];

/** Turns a Supabase auth error (or anything thrown) into copy that is safe to show users. */
export function authErrorMessage(error: unknown): string {
  if (!error) {
    return GENERIC;
  }
  if (isAuthRetryableFetchError(error)) {
    return NETWORK;
  }
  const code = isAuthError(error)
    ? error.code
    : (error as { code?: unknown }).code;
  if (typeof code === 'string' && messagesByCode[code]) {
    return messagesByCode[code];
  }
  const message =
    error instanceof Error
      ? error.message
      : String((error as { message?: unknown }).message ?? error);
  const match = messagePatterns.find(([pattern]) => pattern.test(message));
  return match ? match[1] : GENERIC;
}
