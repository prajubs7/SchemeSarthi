import { Profile } from '../types/profile';

// The six fields the matcher uses; completeness is the share that are filled in.
export const PROFILE_FIELDS: { key: keyof Profile; label: string }[] = [
  { key: 'age', label: 'age' },
  { key: 'gender', label: 'gender' },
  { key: 'occupation_category', label: 'occupation' },
  { key: 'income_bracket', label: 'income' },
  { key: 'state', label: 'state' },
  { key: 'social_category', label: 'category' },
];

export function missingProfileFields(profile: Profile | null) {
  return PROFILE_FIELDS.filter(f => {
    const value = profile?.[f.key];
    return value === null || value === undefined || value === '';
  });
}

/** 0..1 share of PROFILE_FIELDS that are filled in. */
export function profileCompleteness(profile: Profile | null) {
  const missing = missingProfileFields(profile).length;
  return (PROFILE_FIELDS.length - missing) / PROFILE_FIELDS.length;
}
