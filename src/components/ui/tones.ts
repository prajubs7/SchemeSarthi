import { ColorToken } from '../../theme';

export type Tone =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'accent'
  | 'primary';

interface ToneColors {
  /** Text and icon colour on the soft background. */
  fg: ColorToken;
  /** Soft background. */
  bg: ColorToken;
  /** Solid colour for fills (progress bars, dots). */
  solid: ColorToken;
}

// `accent` text uses `warning` because saffron on accentSoft is below 4.5:1 contrast.
export const toneColors: Record<Tone, ToneColors> = {
  success: { fg: 'success', bg: 'successSoft', solid: 'success' },
  warning: { fg: 'warning', bg: 'warningSoft', solid: 'warning' },
  danger: { fg: 'danger', bg: 'dangerSoft', solid: 'danger' },
  info: { fg: 'info', bg: 'infoSoft', solid: 'info' },
  neutral: { fg: 'textSecondary', bg: 'surfaceMuted', solid: 'textMuted' },
  accent: { fg: 'warning', bg: 'accentSoft', solid: 'accent' },
  primary: { fg: 'primary', bg: 'primarySoft', solid: 'primary' },
};
