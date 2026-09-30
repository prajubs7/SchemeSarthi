const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_RULE_TEXT = `At least ${PASSWORD_MIN_LENGTH} characters, with a letter and a number.`;

/** Returns an error message, or null when valid. */
export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) {
    return 'Enter your email address.';
  }
  if (!EMAIL_PATTERN.test(value)) {
    return 'Enter a valid email, like name@example.com.';
  }
  return null;
}

export function validateRequiredPassword(password: string): string | null {
  return password ? null : 'Enter your password.';
}

export function validateNewPassword(password: string): string | null {
  if (!password) {
    return 'Create a password.';
  }
  if (
    password.length < PASSWORD_MIN_LENGTH ||
    !/[A-Za-z]/.test(password) ||
    !/\d/.test(password)
  ) {
    return PASSWORD_RULE_TEXT;
  }
  return null;
}

export function validatePasswordMatch(
  password: string,
  confirm: string,
): string | null {
  if (!confirm) {
    return 'Re-enter your password.';
  }
  return password === confirm ? null : 'Passwords do not match.';
}
