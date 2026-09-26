// Fixed component dimensions. Anything pressable is at least `touchTarget`.
export const sizes = {
  touchTarget: 48,
  buttonLg: 56,
  iconButtonSm: 44,
  chip: 36,
  input: 48,
  inputMultiline: 112,
  icon: { xs: 14, sm: 16, md: 20, lg: 24, xl: 32, xxl: 48 },
  iconCircle: { sm: 36, md: 44, lg: 52, xl: 72 },
  avatar: { sm: 32, md: 40, lg: 56 },
  categoryTile: 88,
  tabBar: 64,
  dot: 8,
  countBadge: 18,
  progressBar: 8,
  accentBar: 4,
  borderWidth: 1,
  borderWidthFocused: 1.5,
} as const;

export const opacity = {
  pressed: 0.7,
  disabled: 0.5,
  shimmer: 0.6,
} as const;

export type IconSize = keyof typeof sizes.icon;
