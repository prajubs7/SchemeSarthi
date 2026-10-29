import React, { ReactElement, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControlProps,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { colors, ColorToken, sizes, spacing } from '../../theme';

export interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  /** Wrap in a KeyboardAvoidingView so inputs and the footer stay above the keyboard. */
  keyboardAware?: boolean;
  /** Apply the 16pt screen gutter. Defaults to true. */
  padded?: boolean;
  /** Only used when `scroll` is set. */
  refreshControl?: ReactElement<RefreshControlProps>;
  /** Sticky area pinned to the bottom, for primary CTAs. */
  footer?: ReactNode;
  /** Safe-area edges. Defaults to left/right; add 'top' for screens without a native header. */
  edges?: Edge[];
  background?: ColorToken;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Screen({
  children,
  scroll,
  keyboardAware,
  padded = true,
  refreshControl,
  footer,
  edges = ['left', 'right'],
  background = 'background',
  style,
  contentContainerStyle,
  testID,
}: ScreenProps) {
  // With a footer, the bottom inset belongs to the footer so it sits above the home indicator.
  const bottomInFooter = !!footer && edges.includes('bottom');
  const bodyEdges = bottomInFooter ? edges.filter(e => e !== 'bottom') : edges;
  const contentStyle = [padded && styles.padded, contentContainerStyle];

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scrollContent, contentStyle]}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentStyle]}>{children}</View>
  );

  const content = (
    <>
      {body}
      {footer ? (
        <SafeAreaView
          edges={bottomInFooter ? ['bottom'] : []}
          style={styles.footer}
        >
          {footer}
        </SafeAreaView>
      ) : null}
    </>
  );

  return (
    <SafeAreaView
      edges={bodyEdges}
      style={[styles.flex, { backgroundColor: colors[background] }, style]}
      testID={testID}
    >
      {keyboardAware ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  padded: { padding: spacing.gutter },
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: sizes.borderWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.gutter,
    paddingVertical: spacing.md,
  },
});
