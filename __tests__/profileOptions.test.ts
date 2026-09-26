import {
  checkEligibility,
  Profile,
  Scheme,
} from '../supabase/functions/_shared/eligibility';
import {
  getAgeGroup,
  INCOME_BRACKETS,
  toIncomeBracket,
} from '../src/constants/profileOptions';

const profileWith = (income_bracket: string): Profile => ({
  id: 'u1',
  age: 30,
  occupation_category: null,
  income_bracket,
  state: 'Maharashtra',
  gender: null,
  social_category: null,
});

const schemeWith = (eligibility_rules: Record<string, unknown>): Scheme => ({
  id: 's1',
  title: 'Test scheme',
  description: '',
  benefit_summary: null,
  eligibility_rules,
  states: ['ALL'],
});

const passes = (income: string, rules: Record<string, unknown>) =>
  checkEligibility(profileWith(income), schemeWith(rules)).passed;

describe('INCOME_BRACKETS', () => {
  it.each(INCOME_BRACKETS)(
    '$value parses to its declared upper bound',
    ({ value, max }) => {
      expect(passes(value, { income_max: max })).toBe(true);
      expect(passes(value, { income_max: max - 1 })).toBe(false);
    },
  );

  it('top bracket does not pass an "8 lakh" limit', () => {
    const top = INCOME_BRACKETS[INCOME_BRACKETS.length - 1].value;
    expect(passes(top, { income_max_bracket: '8 lakh' })).toBe(false);
    expect(passes(top, { income_max_bracket: '5-8 lakh' })).toBe(false);
    expect(passes('5-8 lakh', { income_max_bracket: '8 lakh' })).toBe(true);
  });
});

describe('toIncomeBracket', () => {
  it('keeps bracket values and maps legacy rupee amounts', () => {
    expect(toIncomeBracket('2.5-5 lakh')).toBe('2.5-5 lakh');
    expect(toIncomeBracket('250000')).toBe('1-2.5 lakh');
    expect(toIncomeBracket('900000')).toBe('8 lakh-1 crore');
    expect(toIncomeBracket('')).toBeNull();
    expect(toIncomeBracket('abc')).toBeNull();
  });
});

describe('getAgeGroup', () => {
  it('finds the group at each boundary', () => {
    expect(getAgeGroup(17)?.key).toBe('child');
    expect(getAgeGroup(18)?.key).toBe('youth');
    expect(getAgeGroup(25)?.key).toBe('youth');
    expect(getAgeGroup(40)?.key).toBe('adult');
    expect(getAgeGroup(59)?.key).toBe('midlife');
    expect(getAgeGroup(60)?.key).toBe('senior');
    expect(getAgeGroup(121)).toBeNull();
    expect(getAgeGroup(null)).toBeNull();
  });
});
