import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';

export default function MatchReasonChip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.text}>✓ {label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    marginRight: 6,
    marginBottom: 6,
  },
  text: { color: colors.primary, fontSize: 12, fontWeight: '600' },
});
