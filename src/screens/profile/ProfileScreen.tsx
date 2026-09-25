import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { Button, Card } from '../../components/ui';
import { colors } from '../../constants/colors';
import { RootState } from '../../store';

export default function ProfileScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const profile = useSelector((state: RootState) => state.profile.profile);

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email}</Text>
      </Card>

      {profile ? (
        <Card style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Age</Text>
            <Text style={styles.value}>{profile.age}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Occupation</Text>
            <Text style={styles.value}>{profile.occupation_category}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>State</Text>
            <Text style={styles.value}>{profile.state}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Gender</Text>
            <Text style={styles.value}>{profile.gender}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Category</Text>
            <Text style={styles.value}>{profile.social_category}</Text>
          </View>
          <Button
            title="Edit Profile"
            variant="outline"
            onPress={() => navigation.navigate('ProfileSetup')}
            style={{ marginTop: 12 }}
          />
        </Card>
      ) : (
        <Card style={styles.nudgeCard}>
          <Text style={styles.nudgeText}>
            You haven't completed your profile yet — this is needed to match you
            to real schemes.
          </Text>
          <Button
            title="Complete Profile"
            onPress={() => navigation.navigate('ProfileSetup')}
            style={{ marginTop: 12 }}
          />
        </Card>
      )}

      <Button
        title="Log Out"
        variant="outline"
        onPress={signOut}
        style={{ marginTop: 12 }}
      />

      {__DEV__ && (
        <Button
          title="Component gallery (dev)"
          variant="ghost"
          leftIcon="color-palette-outline"
          onPress={() => navigation.navigate('ComponentGallery')}
          style={styles.card}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, padding: 16, 
    backgroundColor: colors.background 
  },
  label: { 
    fontSize: 12, 
    color: colors.textSecondary 
  },
  value: {
    fontSize: 16,
    color: colors.textPrimary,
    marginTop: 2,
    fontWeight: '600',
  },
  row: { marginBottom: 12 },
  card: { marginBottom: 12 },
  nudgeCard: { 
    backgroundColor: '#FFF3E0', 
    borderColor: colors.warning 
  },
  nudgeText: { 
    color: colors.warning, 
    fontSize: 13.5 
  },
});
