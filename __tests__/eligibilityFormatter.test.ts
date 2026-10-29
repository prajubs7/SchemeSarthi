import { formatRupees, nearMatchNeeds } from '../src/utils/eligibilityFormatter';
import { NearMatchedScheme } from '../src/types/scheme';

const nearMatch = (
  failing_key: NearMatchedScheme['failing_key'],
  required: unknown,
  qualifies_at_age: number | null = null,
) =>
  ({
    failing_key,
    qualifies_at_age,
    match_reason: { [failing_key]: { required, actual: 'x', pass: false } },
  } as unknown as NearMatchedScheme);

describe('formatRupees', () => {
  it('uses lakh and crore units', () => {
    expect(formatRupees(250000)).toBe('₹2.5 lakh');
    expect(formatRupees(100000)).toBe('₹1 lakh');
    expect(formatRupees(10000000)).toBe('₹1 crore');
  });
});

describe('nearMatchNeeds', () => {
  it('describes a numeric or bracket income limit', () => {
    expect(nearMatchNeeds(nearMatch('income_bracket', 250000))).toBe(
      'Needs: income up to ₹2.5 lakh',
    );
    expect(nearMatchNeeds(nearMatch('income_bracket', '1-2.5 lakh'))).toBe(
      'Needs: income up to ₹2.5 lakh',
    );
  });

  it('uses occupation labels', () => {
    expect(
      nearMatchNeeds(nearMatch('occupation_category', ['farmer', 'Student'])),
    ).toBe('Needs: Farmer or Student');
  });

  it('describes an age threshold', () => {
    expect(nearMatchNeeds(nearMatch('age', '60+', 60))).toBe('Needs: age 60+');
  });
});
