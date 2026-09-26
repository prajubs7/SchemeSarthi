import React from 'react';
import {
  AccessibilityRole,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { colors, opacity, radius, sizes, spacing } from '../../theme';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  disabled?: boolean;
  /** 'radio' inside a single-select group, 'checkbox' inside a multi-select group. */
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// Chips are drawn 36 high; hitSlop brings the touch target to 48.
const CHIP_SLOP = (sizes.touchTarget - sizes.chip) / 2;

export function Chip({
  label,
  selected = false,
  onPress,
  icon,
  disabled,
  accessibilityRole = 'button',
  accessibilityLabel,
  style,
  testID,
}: ChipProps) {
  const fg = selected ? 'white' : 'text';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      hitSlop={{ top: CHIP_SLOP, bottom: CHIP_SLOP }}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={
        accessibilityRole === 'button'
          ? { selected, disabled: !!disabled }
          : { checked: selected, disabled: !!disabled }
      }
      testID={testID}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.selected : styles.unselected,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon ? (
        <Icon name={icon} size="sm" color={selected ? 'white' : 'primary'} />
      ) : null}
      <AppText variant="bodySm" weight="600" color={fg} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

export interface ChipOption<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
}

interface ChipGroupBaseProps<T extends string> {
  options: ChipOption<T>[];
  /** Single horizontal scrolling row instead of wrapping. */
  horizontal?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

interface SingleChipGroupProps<T extends string> extends ChipGroupBaseProps<T> {
  multiple?: false;
  value: T | null | undefined;
  onChange: (value: T) => void;
}

interface MultiChipGroupProps<T extends string> extends ChipGroupBaseProps<T> {
  multiple: true;
  value: T[];
  onChange: (value: T[]) => void;
}

export type ChipGroupProps<T extends string> =
  | SingleChipGroupProps<T>
  | MultiChipGroupProps<T>;

export function ChipGroup<T extends string>(props: ChipGroupProps<T>) {
  const { options, horizontal, disabled, accessibilityLabel, style } = props;

  const isSelected = (v: T) =>
    props.multiple ? props.value.includes(v) : props.value === v;

  const toggle = (v: T) => {
    if (props.multiple) {
      const next = props.value.includes(v)
        ? props.value.filter(x => x !== v)
        : [...props.value, v];
      props.onChange(next);
    } else {
      props.onChange(v);
    }
  };

  const chips = options.map(opt => (
    <Chip
      key={opt.value}
      label={opt.label}
      icon={opt.icon}
      selected={isSelected(opt.value)}
      disabled={disabled}
      onPress={() => toggle(opt.value)}
      accessibilityRole={props.multiple ? 'checkbox' : 'radio'}
    />
  ));

  const groupA11y = {
    accessibilityRole: props.multiple ? undefined : ('radiogroup' as const),
    accessibilityLabel,
  };

  if (horizontal) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        style={style}
        {...groupA11y}
      >
        {chips}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.row, styles.wrap, style]} {...groupA11y}>
      {chips}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: sizes.chip,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: sizes.borderWidth,
  },
  unselected: { backgroundColor: colors.surface, borderColor: colors.border },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressed: { opacity: opacity.pressed },
  disabled: { opacity: opacity.disabled },
  row: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm },
  wrap: { flexWrap: 'wrap' },
});
