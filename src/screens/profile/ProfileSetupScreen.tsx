import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { upsertProfile } from '../../services/profileApi';
import { runSchemeMatch } from '../../services/schemesApi';
import { setProfile } from '../../store/slices/profileSlice';
import { Button } from '../../components/ui';
import { colors } from '../../constants/colors';
import { RootState } from '../../store';

// Fixed option sets — MUST match the exact strings your eligibility_rules JSON
// and matching SQL function compare against. Extend these as you curate more
// state schemes / occupation categories.
const GENDER_OPTIONS = ['woman', 'man', 'other'];
const CATEGORY_OPTIONS = ['general', 'obc', 'sc', 'st', 'ews'];
const STATE_OPTIONS = ['Maharashtra', 'UP', 'MP']; // add more once you've curated their schemes
const OCCUPATION_OPTIONS = [
  'student',
  'farmer',
  'self-employed',
  'business owner',
  'salaried employee',
  'unemployed',
  'homemaker',
  'senior citizen / retired',
];

interface ChipSelectorProps {
  label: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}

function ChipSelector({
  label,
  options,
  selected,
  onSelect,
}: ChipSelectorProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map(option => (
          <TouchableOpacity
            key={option}
            style={[styles.chip, selected === option && styles.chipSelected]}
            onPress={() => onSelect(option)}
          >
            <Text
              style={[
                styles.chipText,
                selected === option && styles.chipTextSelected,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function ProfileSetupScreen({ navigation }: any) {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const existingProfile = useSelector(
    (state: RootState) => state.profile.profile,
  );

  const [age, setAge] = useState('');
  const [occupation, setOccupation] = useState('');
  const [income, setIncome] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [gender, setGender] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-fill the form if editing an existing profile, instead of starting blank
  useEffect(() => {
    if (existingProfile) {
      setAge(existingProfile.age ? String(existingProfile.age) : '');
      setOccupation(existingProfile.occupation_category ?? '');
      setIncome(existingProfile.income_bracket ?? '');
      setState(existingProfile.state ?? 'Maharashtra');
      setGender(existingProfile.gender ?? '');
      setCategory(existingProfile.social_category ?? '');
    }
  }, [existingProfile]);

  const handleSubmit = async () => {
    if (!user) return;
    if (!age || !occupation || !state || !gender || !category) {
      Alert.alert(
        'Missing info',
        'Please fill in all fields to get accurate scheme matches.',
      );
      return;
    }

    setLoading(true);
    try {
      const profile = await upsertProfile(user.id, {
        age: parseInt(age, 10),
        occupation_category: occupation,
        income_bracket: income,
        state,
        gender,
        social_category: category,
        metadata: {},
      });
      dispatch(setProfile(profile));
      await runSchemeMatch(user.id);
      Alert.alert(
        'Success',
        'Your profile is saved and schemes have been matched.',
      );
      navigation?.goBack?.();
    } catch (err: any) {
      Alert.alert('Something went wrong', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        {existingProfile ? 'Edit Your Profile' : 'Tell us about yourself'}
      </Text>
      <Text style={styles.subtitle}>
        This helps us find schemes you're actually eligible for. Your details
        stay private.
      </Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Age</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 26"
          placeholderTextColor={colors.textSecondary}
          keyboardType="number-pad"
          value={age}
          onChangeText={setAge}
        />
      </View>

      <ChipSelector
        label="Occupation"
        options={OCCUPATION_OPTIONS}
        selected={occupation}
        onSelect={setOccupation}
      />

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Annual family income (₹)</Text>
          <TextInput
          style={styles.input}
          placeholder="e.g. 250000"
          placeholderTextColor={colors.textSecondary}
          keyboardType="number-pad"
          value={income}
          onChangeText={setIncome}
        />
      </View>

      <ChipSelector
        label="State"
        options={STATE_OPTIONS}
        selected={state}
        onSelect={setState}
      />
      <ChipSelector
        label="Gender"
        options={GENDER_OPTIONS}
        selected={gender}
        onSelect={setGender}
      />
      <ChipSelector
        label="Category"
        options={CATEGORY_OPTIONS}
        selected={category}
        onSelect={setCategory}
      />

      <Button
        title={existingProfile ? 'Save Changes' : 'Find My Schemes'}
        onPress={handleSubmit}
        loading={loading}
        style={{ marginTop: 8 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    padding: 20, 
    backgroundColor: colors.background 
  },
  title: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: colors.textPrimary
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 20,
  },
  fieldGroup: { 
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    backgroundColor: colors.surface,
  },
  chipRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8 
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { 
    fontSize: 13, 
    color: colors.textPrimary, 
    fontWeight: '500' 
  },
  chipTextSelected: { 
    color: '#fff', 
    fontWeight: '700' 
  },
});
