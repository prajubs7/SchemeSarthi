import React, { useRef, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { supabase } from '../../services/supabase';
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
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Validate as the user types only after the first submit attempt.
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [resetSentTo, setResetSentTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const validate = (values: { email: string; password: string }): FieldErrors => ({
    email: validateEmail(values.email),
    password: validateRequiredPassword(values.password),
  });

  const onChangeEmail = (value: string) => {
    setEmail(value);
    setFormError(null);
    setResetSentTo(null);
    if (submitted) {
      setErrors(validate({ email: value, password }));
    }
  };

  const onChangePassword = (value: string) => {
    setPassword(value);
    setFormError(null);
    if (submitted) {
      setErrors(validate({ email, password: value }));
    }
  };

  const handleLogin = async () => {
    setSubmitted(true);
    const next = validate({ email, password });
    setErrors(next);
    if (next.email || next.password) {
      return;
    }

    setLoading(true);
    setFormError(null);
    setResetSentTo(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      setFormError(authErrorMessage(error));
    }
    // On success, RootNavigator switches to the main tabs automatically.
  };

  const handleForgotPassword = async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setSubmitted(true);
      setErrors((prev) => ({ ...prev, email: emailError }));
      return;
    }

    const trimmedEmail = email.trim();
    setResetLoading(true);
    setFormError(null);
    setResetSentTo(null);
    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail);
    setResetLoading(false);
    if (error) {
      setFormError(authErrorMessage(error));
      return;
    }
    setResetSentTo(trimmedEmail);
  };

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
