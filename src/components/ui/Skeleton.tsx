import React, { useEffect } from 'react';
import {
  DimensionValue,
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {
  colors,
  opacity,
  radius,
  RadiusToken,
  sizes,
  spacing,
} from '../../theme';
import { Card } from './Card';

const SHIMMER_MS = 1200;

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: RadiusToken;
  style?: StyleProp<ViewStyle>;
}

/** Placeholder block with a light band sweeping across it. Static when Reduce Motion is on. */
export function Skeleton({
  width = '100%',
  height = spacing.lg,
  radius: r = 'sm',
  style,
}: SkeletonProps) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const blockWidth = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    progress.value = withRepeat(
      withTiming(1, {
        duration: SHIMMER_MS,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
    );
    return () => cancelAnimation(progress);
  }, [progress, reduceMotion]);

  const bandStyle = useAnimatedStyle(() => {
    const w = blockWidth.value;
    return {
      width: w / 2,
      transform: [
        { translateX: interpolate(progress.value, [0, 1], [-w / 2, w]) },
      ],
    };
  });

  const onLayout = (e: LayoutChangeEvent) => {
    blockWidth.value = e.nativeEvent.layout.width;
  };

  return (
    <View
      onLayout={onLayout}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.block, { width, height, borderRadius: radius[r] }, style]}
    >
      {reduceMotion ? null : <Animated.View style={[styles.band, bandStyle]} />}
    </View>
  );
}

/** Loading placeholder matching SchemeListCard's layout. */
export function SchemeCardSkeleton({
  style,
}: {
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Card
      padding="none"
      accessibilityLabel="Loading scheme"
      style={[styles.card, style]}
    >
      <View style={styles.accentBar} />
      <View style={styles.cardBody}>
        <Skeleton width="75%" height={spacing.lg + spacing.xs} />
        <Skeleton width="100%" height={spacing.md} />
        <Skeleton width="60%" height={spacing.md} />
        <View style={styles.pills}>
          <Skeleton width={spacing.xxl * 2} height={spacing.xl} radius="pill" />
          <Skeleton width={spacing.xxl * 3} height={spacing.xl} radius="pill" />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  band: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.surface,
    opacity: opacity.shimmer,
  },
  card: { flexDirection: 'row', overflow: 'hidden' },
  accentBar: { width: sizes.accentBar, backgroundColor: colors.surfaceMuted },
  cardBody: { flex: 1, padding: spacing.lg, gap: spacing.sm },
  pills: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
});
