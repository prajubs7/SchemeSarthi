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

function matchesAllowed(actual: unknown, allowed: unknown): boolean {
  if (actual === null || actual === undefined || String(actual).trim() === '') return false;
  return asList(allowed).some(value => normalize(value) === normalize(actual));
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
    const ok = matchesAllowed(field.actual, allowed);
    reason[field.output] = { required: allowed, actual: field.actual, pass: ok } satisfies CheckResult;
    passed &&= ok;
  }
  return { passed, reason };
}