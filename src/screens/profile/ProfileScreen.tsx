import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { colors } from '../../constants/colors';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Card>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email}</Text>
      </Card>

      <Button title="Log Out" variant="outline" onPress={signOut} style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  label: { fontSize: 12, color: colors.textSecondary },
  value: { fontSize: 16, color: colors.textPrimary, marginTop: 4, fontWeight: '600' },
});
