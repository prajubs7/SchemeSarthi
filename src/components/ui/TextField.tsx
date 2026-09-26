import React, { forwardRef, useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import {
  colors,
  opacity,
  radius,
  sizes,
  spacing,
  typography,
} from '../../theme';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  helperText?: string;
  /** Replaces the helper text and turns the border red. */
  error?: string | null;
  leftIcon?: IconName;
  /** Shows a clear button while the field has a value. */
  onClear?: () => void;
  /** Container style. */
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(
  function TextFieldInner(
    {
      label,
      helperText,
      error,
      leftIcon,
      onClear,
      secureTextEntry,
      multiline,
      editable = true,
      style,
      inputStyle,
      onFocus,
      onBlur,
      accessibilityLabel,
      accessibilityHint,
      ...rest
    },
    ref,
  ) {
    const [focused, setFocused] = useState(false);
    const [hidden, setHidden] = useState(true);
    const hasError = !!error;
    const message = hasError ? error : helperText;

    const handleFocus: TextInputProps['onFocus'] = e => {
      setFocused(true);
      onFocus?.(e);
    };
    const handleBlur: TextInputProps['onBlur'] = e => {
      setFocused(false);
      onBlur?.(e);
    };

    return (
      <View style={style}>
        {label ? (
          <AppText
            variant="bodySm"
            weight="600"
            color="textSecondary"
            style={styles.label}
          >
            {label}
          </AppText>
        ) : null}
        <View
          style={[
            styles.field,
            multiline && styles.fieldMultiline,
            focused && styles.fieldFocused,
            hasError && styles.fieldError,
            !editable && styles.fieldDisabled,
          ]}
        >
          {leftIcon ? (
            <Icon
              name={leftIcon}
              color={focused ? 'primary' : 'textMuted'}
              style={multiline ? styles.iconTop : undefined}
            />
          ) : null}
          <TextInput
            ref={ref}
            style={[
              styles.input,
              multiline && styles.inputMultiline,
              inputStyle,
            ]}
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.primary}
            secureTextEntry={secureTextEntry && hidden}
            multiline={multiline}
            textAlignVertical={multiline ? 'top' : 'center'}
            editable={editable}
            onFocus={handleFocus}
            onBlur={handleBlur}
            accessibilityLabel={accessibilityLabel ?? label}
            accessibilityHint={
              hasError ? error ?? undefined : accessibilityHint ?? helperText
            }
            accessibilityState={{ disabled: !editable }}
            {...rest}
          />
          {onClear && rest.value ? (
            <Pressable
              onPress={onClear}
              hitSlop={spacing.md}
              accessibilityRole="button"
              accessibilityLabel={`Clear ${label ?? accessibilityLabel ?? 'text'}`}
            >
              <Icon name="close-circle" color="textMuted" />
            </Pressable>
          ) : null}
          {secureTextEntry ? (
            <Pressable
              onPress={() => setHidden(h => !h)}
              hitSlop={spacing.md}
              accessibilityRole="button"
              accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            >
              <Icon
                name={hidden ? 'eye-outline' : 'eye-off-outline'}
                color="textMuted"
              />
            </Pressable>
          ) : null}
        </View>
        {message ? (
          <View style={styles.messageRow}>
            {hasError ? (
              <Icon name="alert-circle" size="sm" color="danger" />
            ) : null}
            <AppText
              variant="caption"
              color={hasError ? 'danger' : 'textMuted'}
              style={styles.message}
              accessibilityLiveRegion={hasError ? 'polite' : undefined}
            >
              {message}
            </AppText>
          </View>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  label: { marginBottom: spacing.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: sizes.input,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: sizes.borderWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  fieldMultiline: {
    alignItems: 'flex-start',
    minHeight: sizes.inputMultiline,
    paddingVertical: spacing.md,
  },
  fieldFocused: {
    borderColor: colors.primary,
    borderWidth: sizes.borderWidthFocused,
    backgroundColor: colors.surface,
  },
  fieldError: {
    borderColor: colors.danger,
    borderWidth: sizes.borderWidthFocused,
  },
  fieldDisabled: { opacity: opacity.disabled },
  iconTop: { marginTop: spacing.xs / 2 },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  inputMultiline: { paddingVertical: 0 },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  message: { flex: 1 },
});
