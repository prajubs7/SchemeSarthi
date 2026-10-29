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
import { ValidationRules } from '../../utils/validationUtils';
import { validators } from '../../utils/validationUtils';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export interface LoginFormValues extends Record<string, string> {
  email: string;
  password: string;
}

export default function LoginScreen({ navigation }: Props) {
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
  };

  const form = useForm<LoginFormValues>({
    initialValues: {
      email: '',
      password: '',
    },
    validationRules,
    onSubmit: handleSubmit,
  });

  async function handleSubmit(values: LoginFormValues) {
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      showAlert({ type: 'error', title: 'Login failed', message: error.message });
      return;
    }
    // On success, RootNavigator switches to the main tabs automatically.
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
          placeholder="Password"
          placeholderTextColor={colors.textSecondary}
          editable={!form.isSubmitting}
          value={form.values.password}
          onChangeText={form.handleChange('password')}
          onBlur={form.handleBlur('password')}
        />
        {form.getFieldTouched('password') && form.getFieldError('password') && (
          <Text style={styles.errorText}>{form.getFieldError('password')}</Text>
        )}
      </View>

      {/* Login Button */}
      <Button
        title="Log In"
        onPress={form.handleSubmit}
        loading={form.isSubmitting}
        disabled={form.isSubmitting}
      />

      {/* Sign Up Button */}
      <Button
        title="Create an account"
        variant="outline"
        onPress={() => navigation.navigate('Signup')}
        style={{ marginTop: 12 }}
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
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
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
