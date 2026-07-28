type MatchReason = Record<string, boolean | string>;

// Maps the boolean flags your matching Edge Function writes into match_reason
// (e.g. {"age_ok": true, "state_ok": true}) to user-facing copy.
const LABELS: Record<string, string> = {
  age_ok: "Your age matches this scheme",
  state_ok: 'Available in your state',
  income_ok: 'Your income is within the limit',
  occupation_ok: 'Matches your occupation',
  category_ok: 'Matches your category',
  gender_ok: 'Matches the gender requirement',
};

export function formatMatchReasons(matchReason: MatchReason | null): string[] {
  if (!matchReason) return [];

  return Object.entries(matchReason)
    .filter(([, value]) => value === true)
    .map(([key]) => LABELS[key] ?? key.replace(/_/g, ' '));
}
