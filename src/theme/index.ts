import { colors } from './colors';
import { typography } from './typography';
import { spacing, radius } from './spacing';
import { shadows } from './shadows';
import { sizes, opacity } from './sizes';

export const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  sizes,
  opacity,
} as const;

export type Theme = typeof theme;

export { colors, typography, spacing, radius, shadows, sizes, opacity };
export type { ColorToken } from './colors';
export type { TypographyVariant } from './typography';
export type { SpacingToken, RadiusToken } from './spacing';
export type { IconSize } from './sizes';
export { navigationTheme, stackScreenOptions } from './navigation';
