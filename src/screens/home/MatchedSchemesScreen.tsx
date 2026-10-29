import React from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useSchemeMatches } from '../../hooks/useSchemeMatches';
import SchemeListCard from '../../components/scheme/SchemeListCard';
import {
  EmptyState,
  ErrorState,
  SchemeCardSkeleton,
} from '../../components/ui';
import { colors, spacing } from '../../theme';
import { RootStackScreenProps } from '../../navigation/types';

type Props = RootStackScreenProps<'AllMatchedSchemes'>;

const SKELETON_COUNT = 4;

export default function MatchedSchemesScreen({ navigation }: Props) {
  const { user } = useAuth();
  const {
    data: schemes,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useSchemeMatches(user?.id);

  if (isLoading) {
    return (
      <View style={styles.list}>
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <SchemeCardSkeleton key={i} />
        ))}
      </View>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Couldn't load your matches"
        onRetry={() => refetch()}
      />
    );
  }

  if (!schemes || schemes.length === 0) {
    return (
      <EmptyState
        icon="search-outline"
        title="No matched schemes yet"
        subtitle="Complete or update your profile to see schemes you're eligible for."
      />
    );
  }

  return (
    <FlatList
      data={schemes}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      renderItem={({ item }) => (
        <SchemeListCard
          scheme={item}
          showMatchInfo
          onPress={() =>
            navigation.navigate('SchemeDetail', { schemeId: item.id })
          }
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.gutter },
});
