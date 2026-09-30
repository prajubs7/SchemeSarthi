import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { supabase } from '../../services/supabase';
import { AppText, Banner, Button } from '../../components/ui';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { colors, radius, sizes, spacing } from '../../theme';
import { AuthStackScreenProps } from '../../navigation/types';
import { authErrorMessage } from '../../utils/authErrors';

type Props = AuthStackScreenProps<'OtpVerify'>;

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;
const DIGIT_INDEXES = Array.from({ length: CODE_LENGTH }, (_, i) => i);

export default function OtpVerifyScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resentNotice, setResentNotice] = useState(false);
  // The signup email was just sent, so the countdown starts immediately.
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }
    const timer = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const focusInput = () => {
    // If the keyboard was dismissed while the input kept focus, focus() alone won't reopen it.
    if (inputRef.current?.isFocused()) {
      inputRef.current.blur();
    }
    inputRef.current?.focus();
  };

  const verify = async (token: string) => {
    if (token.length !== CODE_LENGTH || verifying) {
      return;
    }
    setVerifying(true);
    setError(null);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });
    // On success the AuthProvider picks up the session and RootNavigator switches stacks.
    if (verifyError) {
      setVerifying(false);
      setError(authErrorMessage(verifyError));
      setCode('');
      focusInput();
    }
  };

  const onChangeCode = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    setError(null);
    if (digits.length === CODE_LENGTH) {
      verify(digits);
    }
  };

  const resend = async () => {
    setResending(true);
    setError(null);
    setResentNotice(false);
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    setResending(false);
    if (resendError) {
      setError(authErrorMessage(resendError));
      return;
    }
    setResentNotice(true);
    setSecondsLeft(RESEND_SECONDS);
    setCode('');
    focusInput();
  };

  const activeIndex = Math.min(code.length, CODE_LENGTH - 1);

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={`Enter the 6-digit code we sent to ${email}.`}
      footer={
        <Button
          title="Change email"
          variant="ghost"
          leftIcon="arrow-back"
          fullWidth={false}
          onPress={() => navigation.goBack()}
          accessibilityHint="Go back to edit your email address"
        />
      }
    >
      {resentNotice ? (
        <Banner
          tone="success"
          message={`We sent a new code to ${email}.`}
          onDismiss={() => setResentNotice(false)}
        />
      ) : null}

      <View>
        <Pressable
          onPress={focusInput}
          accessibilityRole="button"
          accessibilityLabel={`Verification code, ${code.length} of ${CODE_LENGTH} digits entered`}
          accessibilityHint="Opens the keyboard to type the code"
          style={styles.boxes}
        >
          {DIGIT_INDEXES.map(i => {
            const digit = code[i];
            const isActive = focused && i === activeIndex && !verifying;
            return (
              <View
                key={i}
                style={[
                  styles.box,
                  !!digit && styles.boxFilled,
                  isActive && styles.boxActive,
                  !!error && styles.boxError,
                ]}
              >
                <AppText variant="h1" align="center">
                  {digit ?? ''}
                </AppText>
              </View>
            );
          })}
        </Pressable>
        {/* The real input is invisible; the boxes above only render its value. */}
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={onChangeCode}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={CODE_LENGTH}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          autoFocus
          editable={!verifying}
          caretHidden
          style={styles.hiddenInput}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
        {error ? (
          <AppText
            variant="bodySm"
            color="danger"
            style={styles.error}
            accessibilityLiveRegion="polite"
          >
            {error}
          </AppText>
        ) : null}
      </View>

      <Button
        title="Verify"
        size="lg"
        onPress={() => verify(code)}
        loading={verifying}
        disabled={code.length !== CODE_LENGTH}
      />
      <Button
        title={
          secondsLeft > 0
            ? `Resend code in 0:${String(secondsLeft).padStart(2, '0')}`
            : 'Resend code'
        }
        variant="ghost"
        onPress={resend}
        loading={resending}
        disabled={secondsLeft > 0 || verifying}
        accessibilityLabel={
          secondsLeft > 0
            ? `Resend code available in ${secondsLeft} seconds`
            : 'Resend code'
        }
        style={styles.resend}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  boxes: { flexDirection: 'row', gap: spacing.sm },
  box: {
    flex: 1,
    minHeight: sizes.buttonLg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: sizes.borderWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  boxFilled: { backgroundColor: colors.surface },
  boxActive: {
    borderColor: colors.primary,
    borderWidth: sizes.borderWidthFocused,
    backgroundColor: colors.surface,
  },
  boxError: {
    borderColor: colors.danger,
    borderWidth: sizes.borderWidthFocused,
  },
  // Invisible but still laid out, so Android keeps opening the keyboard for it. Kept tiny so taps
  // go to the boxes (which always type at the end) rather than moving a cursor inside the code.
  hiddenInput: {
    position: 'absolute',
    width: sizes.borderWidth,
    height: sizes.borderWidth,
    opacity: 0,
  },
  error: { marginTop: spacing.sm },
  resend: { marginTop: -spacing.sm },
});
