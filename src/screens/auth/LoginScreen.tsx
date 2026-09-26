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
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSentTo, setResetSentTo] = useState<string | null>(null);

  const onChangeEmail = (value: string) => {
    setEmail(value);
    setFormError(null);
    if (submitted) {
      setErrors(e => ({ ...e, email: validateEmail(value) }));
    }
  };

  const onChangePassword = (value: string) => {
    setPassword(value);
    setFormError(null);
    if (submitted) {
      setErrors(e => ({ ...e, password: validateRequiredPassword(value) }));
    }
  };

  const handleLogin = async () => {
    setSubmitted(true);
    const next = {
      email: validateEmail(email),
      password: validateRequiredPassword(password),
    };
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
    // On success the AuthProvider picks up the session and RootNavigator switches stacks.
    if (error) {
      setFormError(authErrorMessage(error));
    }
  };

  const handleForgotPassword = async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setErrors(e => ({
        ...e,
        email: email.trim()
          ? emailError
          : 'Enter your email above and we will send you a reset link.',
      }));
      return;
    }

    setResetLoading(true);
    setFormError(null);
    setResetSentTo(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setResetLoading(false);
    if (error) {
      setFormError(authErrorMessage(error));
      return;
    }
    setResetSentTo(email.trim());
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
