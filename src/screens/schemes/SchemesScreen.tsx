import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TextInput } from 'react-native';
import SchemeListCard from '../../components/scheme/SchemeListCard';
import {
  EmptyState,
  LoadingSpinner,
  Screen,
  ScreenHeader,
} from '../../components/ui';
import { colors } from '../../constants/colors';
import { Scheme } from '../../types/scheme';
import { useAllSchemes } from '../../hooks/useSchemeMatches';
import { MainTabScreenProps } from '../../navigation/types';

type Props = MainTabScreenProps<'SchemeTab'>;

export default function SchemesScreen({ navigation, route }: Props) {
  const initialCategory = route.params?.initialCategory;
  const [search, setSearch] = useState(initialCategory ?? '');
  const {
    data: schemes,
    isLoading,
    refetch,
    isRefetching,
  } = useAllSchemes(search);

  // Home's category tiles land here with a category. Until Step 7 adds filter chips, search by it.
  useEffect(() => {
    if (initialCategory) setSearch(initialCategory);
  }, [initialCategory]);

  return (
    <Screen edges={['top', 'left', 'right']} padded={false}>
      <ScreenHeader title="Explore schemes" />
      <TextInput
        style={styles.searchInput}
        placeholder="Search schemes (e.g. farmer, student, housing)"
        placeholderTextColor={colors.textSecondary}
        value={search}
        onChangeText={setSearch}
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : !schemes || schemes.length === 0 ? (
        <EmptyState
          title="No schemes found"
          subtitle={
            search
              ? 'Try a different search term.'
              : 'Check back soon — more schemes are being added.'
          }
        />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={schemes}
          keyExtractor={(item: Scheme) => item.id}
          refreshing={isRefetching}
          onRefresh={refetch}
          renderItem={({ item }: { item: Scheme }) => (
            <SchemeListCard
              scheme={item}
              showMatchInfo={false}
              onPress={() =>
                navigation.navigate('SchemeDetail', { schemeId: item.id })
              }
            />
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    margin: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: colors.surface,
  },
  list: { padding: 16, paddingTop: 8 },
});
