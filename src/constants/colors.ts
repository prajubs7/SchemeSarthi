import { colors as tokens } from '../theme/colors';

/**
 * @deprecated Use `colors` from `src/theme` instead. This maps the legacy keys to the new
 * design tokens so existing screens keep compiling until they are migrated.
 */
export const colors = {
  primary: tokens.primary,
  primaryLight: tokens.primarySoft,
  accent: tokens.accent,
  background: tokens.background,
  surface: tokens.surface,
  textPrimary: tokens.text,
  textSecondary: tokens.textSecondary,
  border: tokens.border,
  success: tokens.success,
  warning: tokens.warning,
  error: tokens.danger,
};
