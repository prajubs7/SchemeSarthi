import React from 'react';
import {
  StatusBar,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../../constants/colors';

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  /** Shows a back button that calls onBackPress. */
  showBack?: boolean;
  onBackPress?: () => void;
  /** Optional icon (Ionicons name) on the right, e.g. "search-outline". */
  rightIcon?: string;
  onRightPress?: () => void;
  /** Fully custom right-side content; overrides rightIcon. */
  rightElement?: React.ReactNode;
  /** Centre the title (used for brand headers on auth screens). */
  centered?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function AppHeader({
  title,
  subtitle,
  showBack,
  onBackPress,
  rightIcon,
  onRightPress,
  rightElement,
  centered,
  style,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }, style]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primary}
        translucent={false}
      />

      {/* Decorative circles */}
      <View style={styles.circleLarge} pointerEvents="none" />
      <View style={styles.circleSmall} pointerEvents="none" />

      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onBackPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
        ) : centered ? (
          <View style={styles.iconSpacer} />
        ) : null}

        <View style={[styles.titleWrap, centered && styles.titleWrapCentered]}>
          <Text
            style={[styles.title, centered && styles.textCentered]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[styles.subtitle, centered && styles.textCentered]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightElement ? (
          rightElement
        ) : rightIcon ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onRightPress}
            activeOpacity={0.7}
          >
            <Ionicons name={rightIcon} size={20} color="#fff" />
          </TouchableOpacity>
        ) : centered ? (
          <View style={styles.iconSpacer} />
        ) : null}
      </View>

      <View style={styles.accentBar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  circleLarge: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: colors.primaryLight,
    opacity: 0.35,
  },
  circleSmall: {
    position: 'absolute',
    bottom: -40,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.accent,
    opacity: 0.18,
  },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSpacer: { width: 38, height: 38 },
  titleWrap: { flex: 1, marginHorizontal: 4 },
  titleWrapCentered: { alignItems: 'center' },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
    paddingHorizontal: 6,
  },
  subtitle: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    paddingHorizontal: 6,
  },
  textCentered: { textAlign: 'center' },
  accentBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginTop: 12,
    marginLeft: 6,
  },
});
