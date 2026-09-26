import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Card, IconCircle, Screen } from '../ui';
import { spacing } from '../../theme';

export interface AuthLayoutProps {
  /** Heading inside the card, e.g. "Welcome back". */
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Rendered below the card, e.g. "New here? Create account". */
  footer?: ReactNode;
}

/** Brand header + content card shared by Login, Signup and OTP. Scrolls and avoids the keyboard. */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <Screen
      scroll
      keyboardAware
      edges={['top', 'bottom', 'left', 'right']}
      contentContainerStyle={styles.content}
    >
      <View style={styles.brand}>
        <IconCircle icon="shield-checkmark" tone="primary" size="xl" />
        <AppText variant="display" color="primary" align="center">
          Scheme Sarthi
        </AppText>
        <AppText variant="body" color="textSecondary" align="center">
          Find the government schemes made for you
        </AppText>
      </View>

      <Card padding="xl" style={styles.card}>
        <View style={styles.cardHeader}>
          <AppText variant="h1">{title}</AppText>
          {subtitle ? (
            <AppText variant="body" color="textSecondary">
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {children}
      </Card>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.xl,
  },
  brand: { alignItems: 'center', gap: spacing.sm },
  card: { gap: spacing.lg },
  cardHeader: { gap: spacing.xs },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
});
