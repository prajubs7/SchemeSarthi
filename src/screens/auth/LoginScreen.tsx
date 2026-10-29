import React, { useRef, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
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
import { AppText, Banner, Button, TextField } from '../../components/ui';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { spacing } from '../../theme';
import { AuthStackScreenProps } from '../../navigation/types';
import { authErrorMessage } from '../../utils/authErrors';
import {
  validateEmail,
  validateRequiredPassword,
} from '../../utils/authValidation';

type Props = AuthStackScreenProps<'Login'>;

interface FieldErrors {
  email?: string | null;
  password?: string | null;
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
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to see schemes that match your profile."
      footer={
        <>
          <AppText variant="body" color="textSecondary">
            New here?
          </AppText>
          <Button
            title="Create account"
            variant="ghost"
            fullWidth={false}
            onPress={() => navigation.navigate('Signup')}
          />
        </>
      }
    >
      {resetSentTo ? (
        <Banner
          tone="success"
          title="Check your inbox"
          message={`We sent a password reset link to ${resetSentTo}.`}
          onDismiss={() => setResetSentTo(null)}
        />
      ) : null}
      {formError ? <Banner tone="danger" message={formError} /> : null}

      <TextField
        label="Email"
        placeholder="name@example.com"
        leftIcon="mail-outline"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
        value={email}
        onChangeText={onChangeEmail}
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={errors.email}
      />
      <TextField
        ref={passwordRef}
        label="Password"
        placeholder="Your password"
        leftIcon="lock-closed-outline"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        value={password}
        onChangeText={onChangePassword}
        onSubmitEditing={handleLogin}
        error={errors.password}
      />

      <Button
        title="Log in"
        size="lg"
        onPress={handleLogin}
        loading={loading}
        disabled={resetLoading}
      />
      <Button
        title="Forgot password?"
        variant="ghost"
        onPress={handleForgotPassword}
        loading={resetLoading}
        disabled={loading}
        accessibilityHint="Sends a password reset link to the email above"
        style={styles.forgot}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  forgot: { marginTop: -spacing.sm },
});
