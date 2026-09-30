import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { colors, ColorToken, typography, TypographyVariant } from '../../theme';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: ColorToken;
  weight?: TextStyle['fontWeight'];
  align?: TextStyle['textAlign'];
}

export function AppText({
  variant = 'body',
  color = 'text',
  weight,
  align,
  style,
  accessibilityRole,
  ...rest
}: AppTextProps) {
  const isHeading =
    variant === 'display' || variant === 'h1' || variant === 'h2';
  return (
    <Text
      accessibilityRole={
        accessibilityRole ?? (isHeading ? 'header' : undefined)
      }
      style={[
        typography[variant],
        { color: colors[color] },
        weight !== undefined && { fontWeight: weight },
        align !== undefined && { textAlign: align },
        style,
      ]}
      {...rest}
    />
  );
}
