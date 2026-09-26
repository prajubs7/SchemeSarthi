import { MatchedScheme } from '../types/scheme';

type MatchReason = NonNullable<MatchedScheme['match_reason']>;
type Check = MatchReason[string];

export type EligibilityStatus = 'pass' | 'fail' | 'unverified';

export interface EligibilityCheck {
  key: string;
  label: string;
  status: EligibilityStatus;
  requiredText: string;
  actualText: string;
}

// Keys written by checkEligibility in supabase/functions/_shared/eligibility.ts,
// in display order.
const LABELS: Record<string, string> = {
  age: 'Age',
  income_bracket: 'Income',
  states: 'State',
  occupation_category: 'Occupation',
  social_category: 'Category',
  gender: 'Gender',
};
const ORDER = Object.keys(LABELS);

function toText(value: unknown, fallback: string): string {
  if (value === null || value === undefined || value === '') return fallback;
  if (Array.isArray(value)) return value.length ? value.map(String).join(', ') : fallback;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function statusOf(check: Check): EligibilityStatus {
  if (!check.pass) return 'fail';
  return check.unverified ? 'unverified' : 'pass';
}

export function formatMatchReasons(matchReason: MatchedScheme['match_reason']): EligibilityCheck[] {
  if (!matchReason) return [];

  return Object.entries(matchReason)
    .filter(([, check]) => check && typeof check === 'object' && 'pass' in check)
    .sort(([a], [b]) => {
      const ia = ORDER.indexOf(a);
      const ib = ORDER.indexOf(b);
      return (ia === -1 ? ORDER.length : ia) - (ib === -1 ? ORDER.length : ib);
    })
    .map(([key, check]) => ({
      key,
      label: LABELS[key] ?? key.replace(/_/g, ' '),
      status: statusOf(check),
      requiredText: toText(check.required, 'Not specified'),
      actualText: toText(check.actual, 'Not provided'),
    }));
}

export type EligibilityVerdict = 'eligible' | 'not_eligible' | 'partly_verified';

/** Any failed criterion means not eligible; otherwise any unverified one means partly verified. */
export function eligibilityVerdict(checks: EligibilityCheck[]): EligibilityVerdict {
  if (checks.some(c => c.status === 'fail')) return 'not_eligible';
  if (checks.some(c => c.status === 'unverified')) return 'partly_verified';
  return 'eligible';
}

function numberOrUndefined(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Plain-language explanation of what is missing for one failed criterion,
 * e.g. "You'll be eligible at 18." `rules` is the scheme's eligibility_rules.
 */
export function explainFailedCheck(
  check: EligibilityCheck,
  rules: Record<string, any> | null | undefined,
): string {
  if (check.actualText === 'Not provided') {
    return `Add your ${check.label.toLowerCase()} to your profile so we can check this.`;
  }
  switch (check.key) {
    case 'age': {
      const min = numberOrUndefined(rules?.age_min ?? rules?.min_age);
      const max = numberOrUndefined(rules?.age_max ?? rules?.max_age);
      const age = Number(check.actualText);
      if (min !== undefined && age < min) return `You'll be eligible at ${min}.`;
      if (max !== undefined && age > max) return `This scheme is for people aged up to ${max}.`;
      return `This scheme is for people aged ${check.requiredText}.`;
    }
    case 'income_bracket':
      return `This scheme is for households earning up to ${check.requiredText}. Your income is ${check.actualText}.`;
    case 'states':
      return `This scheme is only for residents of ${check.requiredText}.`;
    case 'gender':
      return `This scheme is only for: ${check.requiredText}.`;
    case 'social_category':
      return `This scheme is for these categories: ${check.requiredText}.`;
    case 'occupation_category':
      return `This scheme is for: ${check.requiredText}. Your occupation is ${check.actualText}.`;
    default:
      return `${check.label} must be ${check.requiredText}. Yours is ${check.actualText}.`;
  }
}
