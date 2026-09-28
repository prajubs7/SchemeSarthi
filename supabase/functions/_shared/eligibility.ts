// src/utils/eligibility.ts has a client copy of checkEligibility; keep the two in sync.
export type JsonObject = Record<string, any>;
export type Profile = {
  id: string;
  age: number | null;
  occupation_category: string | null;
  income_bracket: string | null;
  state: string | null;
  gender: string | null;
  social_category: string | null;
};
export type Scheme = {
  id: string;
  title: string;
  description: string;
  benefit_summary: string | null;
  eligibility_rules: JsonObject | null;
  states: string[] | null;
  created_at?: string;
};
export type CheckResult = {
  required: unknown;
  actual: unknown;
  pass: boolean;
  unverified?: boolean;
};

const has = (obj: JsonObject, key: string) =>
  Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== null && obj[key] !== undefined;

export function normalize(value: unknown): string {
  return String(value ?? '').trim().toLocaleLowerCase();
}

function asList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : value === null || value === undefined ? [] : [value];
}

// Rule data and profile values spell the same thing differently ("business_owner" vs
// "business owner", "female" vs "woman"), so categorical values are compared in this form.
const SYNONYMS: Record<string, string> = { female: 'woman', male: 'man' };
function canonical(value: unknown): string {
  const text = normalize(value).replace(/[s_-]+/g, ' ');
  return SYNONYMS[text] ?? text;
}

/** An explicit "ALL" in a rule list means the criterion does not restrict anyone. */
function isWildcard(allowed: unknown): boolean {
  return asList(allowed).some(value => canonical(value) === 'all');
}

function matchesAllowed(actual: unknown, allowed: unknown): boolean {
  if (actual === null || actual === undefined || String(actual).trim() === '') return false;
  return asList(allowed).some(value => canonical(value) === canonical(actual));
}

function rangeLabel(min: unknown, max: unknown): string {
  if (min !== undefined && max !== undefined) return `${min}-${max}`;
  if (min !== undefined) return `${min}+`;
  if (max !== undefined) return `up to ${max}`;
  return 'not specified';
}

function amountInRupees(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const text = String(value ?? '').replace(/₹|,/g, '').trim().toLowerCase();
  const match = text.match(/(\d+(?:\.\d+)?)\s*(lakh|lakhs|l|crore|crores|cr)?/);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = match[2] ?? '';
  return amount * (unit.startsWith('cr') ? 10_000_000 : unit.startsWith('l') ? 100_000 : 1);
}

function bracketUpper(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const text = String(value).replace(/₹|,/g, '').trim();
  const bounds = text.split(/\s*(?:-|–|to)\s*/i);
  return amountInRupees(bounds[bounds.length - 1]);
}

function incomeWithinMaxBracket(actual: unknown, required: unknown): boolean {
  const actualUpper = bracketUpper(actual);
  const requiredUpper = bracketUpper(required);
  return actualUpper !== null && requiredUpper !== null && actualUpper <= requiredUpper;
}

function incomeWithinNumericMax(actual: unknown, required: unknown): boolean {
  const actualUpper = bracketUpper(actual);
  const requiredMax = amountInRupees(required);
  return actualUpper !== null && requiredMax !== null && actualUpper <= requiredMax;
}

export function checkEligibility(profile: Profile, scheme: Scheme): { passed: boolean; reason: JsonObject } {
  const rules = scheme.eligibility_rules && typeof scheme.eligibility_rules === 'object'
    ? scheme.eligibility_rules
    : {};
  const reason: JsonObject = {};
  let passed = true;

  const minAgeKey = has(rules, 'age_min') ? 'age_min' : has(rules, 'min_age') ? 'min_age' : undefined;
  const maxAgeKey = has(rules, 'age_max') ? 'age_max' : has(rules, 'max_age') ? 'max_age' : undefined;
  if (!minAgeKey && !maxAgeKey) {
    reason.age = { required: null, actual: profile.age, pass: true, unverified: true } satisfies CheckResult;
  } else {
    const min = minAgeKey ? Number(rules[minAgeKey]) : undefined;
    const max = maxAgeKey ? Number(rules[maxAgeKey]) : undefined;
    const age = profile.age === null ? NaN : Number(profile.age);
    const ok = Number.isFinite(age) && (min === undefined || age >= min) && (max === undefined || age <= max);
    reason.age = {
      required: rangeLabel(min, max), actual: profile.age, pass: ok,
      ...(!minAgeKey || !maxAgeKey ? { unverified: true } : {}),
    } satisfies CheckResult;
    passed &&= ok;
  }

  const incomeKey = ['income_max_bracket', 'income_max'].find(key => has(rules, key));
  if (!incomeKey) {
    reason.income_bracket = { required: null, actual: profile.income_bracket, pass: true, unverified: true } satisfies CheckResult;
  } else {
    const required = rules[incomeKey];
    const actual = profile.income_bracket;
    const ok = incomeKey === 'income_max_bracket'
      ? incomeWithinMaxBracket(actual, required)
      : incomeWithinNumericMax(actual, required);
    reason.income_bracket = { required, actual, pass: ok } satisfies CheckResult;
    passed &&= ok;
  }

  const categorical: Array<{ output: string; ruleKeys: string[]; actual: unknown }> = [
    { output: 'gender', ruleKeys: ['gender'], actual: profile.gender },
    { output: 'social_category', ruleKeys: ['social_category', 'category'], actual: profile.social_category },
    { output: 'states', ruleKeys: ['states'], actual: profile.state },
    { output: 'occupation_category', ruleKeys: ['occupation_category', 'occupation'], actual: profile.occupation_category },
  ];
  for (const field of categorical) {
    const key = field.ruleKeys.find(candidate => has(rules, candidate));
    if (!key) {
      reason[field.output] = { required: null, actual: field.actual, pass: true, unverified: true } satisfies CheckResult;
      continue;
    }
    const allowed = rules[key];
    const ok = isWildcard(allowed) || matchesAllowed(field.actual, allowed);
    reason[field.output] = { required: allowed, actual: field.actual, pass: ok } satisfies CheckResult;
    passed &&= ok;
  }

  // Conditions the profile cannot confirm are failures, not passes: a scheme is only
  // matched when every stated condition is known to hold for this person.
  const special = asList(rules.special_eligibility).filter(value => String(value ?? '').trim() !== '');
  if (special.length > 0) {
    const autoAge = Number(rules.auto_eligible_min_age);
    const age = profile.age === null ? NaN : Number(profile.age);
    const byAge = has(rules, 'auto_eligible_min_age') && Number.isFinite(autoAge) && Number.isFinite(age) && age >= autoAge;
    const byCategory = ['sc', 'st'].includes(canonical(profile.social_category))
      && special.some(value => /sc[s_]*st/i.test(String(value)));
    const ok = byAge || byCategory;
    reason.special_eligibility = {
      required: special, actual: null, pass: ok, ...(ok ? {} : { unverified: true }),
    } satisfies CheckResult;
    passed &&= ok;
  }
  if (has(rules, 'beneficiary_type')) {
    // The benefit goes to someone else (e.g. a girl child), whom the profile does not describe.
    reason.beneficiary = {
      required: rules.beneficiary_type, actual: null, pass: false, unverified: true,
    } satisfies CheckResult;
    passed = false;
  }
  return { passed, reason };
}

// Near misses are limited to criteria a person can grow into or change. Gender, social
// category and state are left out: "almost eligible" would not be meaningful for them.
const NEAR_MISS_KEYS = new Set(['age', 'income_bracket', 'occupation_category']);
export const AGE_WINDOW_YEARS = 2;

export type NearMiss = {
  failing_key: string;
  /** Set for age near misses: the minimum age at which the user qualifies. */
  qualifies_at_age: number | null;
};

export function ruleMinAge(rules: JsonObject | null): number | null {
  const value = rules?.age_min ?? rules?.min_age;
  if (value === null || value === undefined) return null;
  const min = Number(value);
  return Number.isFinite(min) ? min : null;
}

/**
 * A scheme that fails exactly one checkEligibility criterion. A failure caused by a
 * missing profile value is not a near miss, and neither is an age near miss unless
 * the user is below the minimum age and reaches it within AGE_WINDOW_YEARS.
 */
export function findNearMiss(profile: Profile, scheme: Scheme, reason: JsonObject): NearMiss | null {
  const failing = Object.entries(reason).filter(([, check]) => !(check as CheckResult).pass);
  if (failing.length !== 1) return null;
  const [key, check] = failing[0] as [string, CheckResult];
  if (!NEAR_MISS_KEYS.has(key)) return null;
  if (check.actual === null || check.actual === undefined || String(check.actual).trim() === '') return null;
  if (key !== 'age') return { failing_key: key, qualifies_at_age: null };

  const min = ruleMinAge(scheme.eligibility_rules);
  const age = Number(profile.age);
  if (min === null || !Number.isFinite(age) || age >= min || min - age > AGE_WINDOW_YEARS) return null;
  return { failing_key: 'age', qualifies_at_age: Math.ceil(min) };
}
