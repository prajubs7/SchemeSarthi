import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';

export default function EligibilityBadge({ eligible }: { eligible: boolean }) {
  return (
    <View
      style={[styles.badge, eligible ? styles.eligible : styles.notEligible]}
    >
      <Text style={styles.text}>
        {eligible ? 'You are eligible' : 'Not eligible'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  eligible: { 
    backgroundColor: colors.success 
  },
  notEligible: { 
    backgroundColor: colors.error 
  },
  text: { 
    color: '#fff', 
    fontWeight: '600', 
    fontSize: 13 
  },
});
