import { ViewStyle } from 'react-native';
import { colors } from './colors';

// One elevation level only. Most cards use a border instead.
export const shadows = {
  none: {
    shadowOpacity: 0,
    elevation: 0,
  },
  card: {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
} satisfies Record<string, ViewStyle>;
