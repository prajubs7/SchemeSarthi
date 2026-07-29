import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { useSchemeMatches } from '../../hooks/useSchemeMatches';
import SchemeCard from '../../components/scheme/SchemeCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'AllMatchedSchemes'>;

export default function MatchedSchemesScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { data: schemes, isLoading, refetch, isRefetching } = useSchemeMatches(user?.id);

  if (isLoading) return <LoadingSpinner />;

  if (!schemes || schemes.length === 0) {
    return (
      <EmptyState
        title="No matched schemes yet"
        subtitle="Complete or update your profile to see schemes you're eligible for."
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={schemes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={isRefetching}
        onRefresh={refetch}
        renderItem={({ item }) => (
          <SchemeCard scheme={item} onPress={() => navigation.navigate('SchemeDetail', { schemeId: item.id })} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16 },
});
