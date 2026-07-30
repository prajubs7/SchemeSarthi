import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { useDispatch } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { upsertProfile } from '../../services/profileApi';
import { runSchemeMatch } from '../../services/schemesApi';
import { setProfile } from '../../store/slices/profileSlice';
import Button from '../../components/common/Button';
import { colors } from '../../constants/colors';

export default function ProfileSetupScreen() {
  const { user } = useAuth();
  const dispatch = useDispatch();

  const [age, setAge] = useState('');
  const [occupation, setOccupation] = useState('');
  const [income, setIncome] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [gender, setGender] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    if (!age || !occupation || !state) {
      Alert.alert('Missing info', 'Please fill in age, occupation, and state.');
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
      await runSchemeMatch(user.id); // triggers matching; results land in user_matches
    } catch (err: any) {
      Alert.alert('Something went wrong', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tell us about yourself</Text>
      <Text style={styles.subtitle}>
        This helps us find schemes you're actually eligible for. Your details
        stay private.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Age"
        placeholderTextColor={colors.textSecondary}
        keyboardType="number-pad"
        value={age}
        onChangeText={setAge}
      />
      <TextInput
        style={styles.input}
        placeholder="Occupation (e.g. student, farmer, self-employed)"
        placeholderTextColor={colors.textSecondary}
        value={occupation}
        onChangeText={setOccupation}
      />
      <TextInput
        style={styles.input}
        placeholder="Annual family income (₹)"
        placeholderTextColor={colors.textSecondary}
        keyboardType="number-pad"
        value={income}
        onChangeText={setIncome}
      />
      <TextInput
        style={styles.input}
        placeholder="State"
        value={state}
        onChangeText={setState}
      />
      <TextInput
        style={styles.input}
        placeholder="Gender"
        placeholderTextColor={colors.textSecondary}
        value={gender}
        onChangeText={setGender}
      />
      <TextInput
        style={styles.input}
        placeholder="Category (General/OBC/SC/ST/EWS)"
        placeholderTextColor={colors.textSecondary}
        value={category}
        onChangeText={setCategory}
      />

      <Button
        title="Find My Schemes"
        onPress={handleSubmit}
        loading={loading}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    padding: 24, 
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
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    backgroundColor: colors.surface,
  },
});
