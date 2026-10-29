import React, { useRef, useState } from 'react';
import { TextInput } from 'react-native';
import { supabase } from '../../services/supabase';
import { AppText, Banner, Button, TextField } from '../../components/ui';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { AuthStackScreenProps } from '../../navigation/types';
import { authErrorMessage } from '../../utils/authErrors';
import {
  PASSWORD_RULE_TEXT,
  validateEmail,
  validateNewPassword,
  validatePasswordMatch,
} from '../../utils/authValidation';

type Props = AuthStackScreenProps<'Signup'>;

interface FieldErrors {
  email?: string | null;
  password?: string | null;
  confirm?: string | null;
}

export default function SignupScreen({ navigation }: Props) {
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  // Validate as the user types only after the first submit attempt.
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (values: {
    email: string;
    password: string;
    confirm: string;
  }): FieldErrors => ({
    email: validateEmail(values.email),
    password: validateNewPassword(values.password),
    confirm: validatePasswordMatch(values.password, values.confirm),
  });

  const update = (field: 'email' | 'password' | 'confirm', value: string) => {
    const values = { email, password, confirm, [field]: value };
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    if (field === 'confirm') setConfirm(value);
    setFormError(null);
    if (submitted) {
      setErrors(validate(values));
    }
  };

  const handleSignup = async () => {
    setSubmitted(true);
    const next = validate({ email, password, confirm });
    setErrors(next);
    if (next.email || next.password || next.confirm) {
      return;
    }

    const trimmedEmail = email.trim();
    setLoading(true);
    setFormError(null);
    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
    });
    setLoading(false);
    if (error) {
      setFormError(authErrorMessage(error));
      return;
    }
    // Supabase hides existing, confirmed accounts by returning a user with no identities.
    if (data.user && data.user.identities?.length === 0) {
      setFormError(authErrorMessage({ code: 'user_already_exists' }));
      return;
    }
    navigation.navigate('OtpVerify', { email: trimmedEmail });
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="It takes a minute. We will email you a code to confirm."
      footer={
        <>
          <AppText variant="body" color="textSecondary">
            Already have an account?
          </AppText>
          <Button
            title="Log in"
            variant="ghost"
            fullWidth={false}
            onPress={() => navigation.goBack()}
          />
        </>
      }
    >
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
        onChangeText={v => update('email', v)}
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={errors.email}
      />
      <TextField
        ref={passwordRef}
        label="Password"
        placeholder="Create a password"
        leftIcon="lock-closed-outline"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        value={password}
        onChangeText={v => update('password', v)}
        onSubmitEditing={() => confirmRef.current?.focus()}
        helperText={PASSWORD_RULE_TEXT}
        error={errors.password}
      />
      <TextField
        ref={confirmRef}
        label="Confirm password"
        placeholder="Re-enter your password"
        leftIcon="lock-closed-outline"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        value={confirm}
        onChangeText={v => update('confirm', v)}
        onSubmitEditing={handleSignup}
        error={errors.confirm}
      />

      <AppText variant="caption" color="textMuted">
        By creating an account, you agree to our Terms of Service and Privacy
        Policy.
      </AppText>

      <Button
        title="Create account"
        size="lg"
        onPress={handleSignup}
        loading={loading}
      />
    </AuthLayout>
  );
}
