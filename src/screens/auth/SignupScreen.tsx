import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useAlert } from '../../components/common/AlertProvider';
import PasswordInput from '../../components/common/PasswordInput';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../../services/supabase';
import Button from '../../components/common/Button';
import { colors } from '../../constants/colors';
import { AuthStackParamList } from '../../navigation/types';
import { useForm } from '../../hooks/useForm';
import { ValidationRules, validators } from '../../utils/validationUtils';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

interface SignupFormValues {
  email: string;
  password: string;
  confirmPassword: string;
  [key: string]: string;
}

export default function SignupScreen({ navigation }: Props) {
  const { showAlert } = useAlert();
  const validationRules: ValidationRules = {
    email: {
      required: 'Email is required',
      custom: validators.email,
    },
    password: {
      required: 'Password is required',
      minLength: {
        value: 6,
        message: 'Password must be at least 6 characters',
      },
    },
    confirmPassword: {
      required: 'Please confirm your password',
      custom: value => {
        if (value !== form.values.password) {
          return 'Passwords do not match';
        }
        return undefined;
      },
    },
  };

  const form = useForm<SignupFormValues>({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationRules,
    onSubmit: handleSubmit,
  });

  // Keep the confirm-password error in sync when the password itself changes
  const handlePasswordChange = (text: string) => {
    form.handleChange('password')(text);
    if (form.getFieldTouched('confirmPassword')) {
      form.setFieldError(
        'confirmPassword',
        form.values.confirmPassword && form.values.confirmPassword !== text
          ? 'Passwords do not match'
          : undefined,
      );
    }
  };

  async function handleSubmit(values: SignupFormValues) {
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    });

    if (error) {
      showAlert({ type: 'error', title: 'Signup failed', message: error.message });
      return;
    }

    // Reset form on success
    form.resetForm();
    navigation.navigate('OtpVerify', { email: values.email });
  }

  return (
    <View style={styles.container}>
      {/* Email Input */}
      <View>
        <TextInput
          style={[
            styles.input,
            form.getFieldError('email') && form.getFieldTouched('email')
              ? styles.inputError
              : null,
          ]}
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!form.isSubmitting}
          value={form.values.email}
          onChangeText={form.handleChange('email')}
          onBlur={form.handleBlur('email')}
        />
        {form.getFieldTouched('email') && form.getFieldError('email') && (
          <Text style={styles.errorText}>{form.getFieldError('email')}</Text>
        )}
      </View>

      {/* Password Input */}
      <View>
        <PasswordInput
          style={[
            styles.input,
            form.getFieldError('password') && form.getFieldTouched('password')
              ? styles.inputError
              : null,
          ]}
          placeholder="Password (min 6 characters)"
          placeholderTextColor={colors.textSecondary}
          editable={!form.isSubmitting}
          value={form.values.password}
          onChangeText={handlePasswordChange}
          onBlur={form.handleBlur('password')}
        />
        {form.getFieldTouched('password') && form.getFieldError('password') && (
          <Text style={styles.errorText}>{form.getFieldError('password')}</Text>
        )}
      </View>

      {/* Confirm Password Input */}
      <View>
        <PasswordInput
          style={[
            styles.input,
            form.getFieldError('confirmPassword') &&
            form.getFieldTouched('confirmPassword')
              ? styles.inputError
              : null,
          ]}
          placeholder="Confirm Password"
          placeholderTextColor={colors.textSecondary}
          editable={!form.isSubmitting}
          value={form.values.confirmPassword}
          onChangeText={form.handleChange('confirmPassword')}
          onBlur={form.handleBlur('confirmPassword')}
        />
        {form.getFieldTouched('confirmPassword') &&
          form.getFieldError('confirmPassword') && (
            <Text style={styles.errorText}>
              {form.getFieldError('confirmPassword')}
            </Text>
          )}
      </View>

      {/* Sign Up Button */}
      <Button
        title="Sign Up"
        onPress={form.handleSubmit}
        loading={form.isSubmitting}
        disabled={form.isSubmitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 4,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginBottom: 12,
    fontWeight: '500',
  },
});
