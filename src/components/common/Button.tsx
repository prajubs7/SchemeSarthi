import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline';
  style?: ViewStyle;
}

export default function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  style,
}: ButtonProps) {
  const isOutline = variant === 'outline';

  return (
    <TouchableOpacity
      style={[styles.base, isOutline ? styles.outline : styles.primary, (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : '#fff'} />
      ) : (
        <Text style={isOutline ? styles.outlineText : styles.primaryText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  outline: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: 'transparent' },
  disabled: { opacity: 0.5 },
  primaryText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  outlineText: { color: colors.primary, fontWeight: '600', fontSize: 16 },
});
