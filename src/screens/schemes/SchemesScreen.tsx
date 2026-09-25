import React, { useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SchemeListCard from '../../components/scheme/SchemeListCard';
import { EmptyState, LoadingSpinner } from '../../components/ui';
import { colors } from '../../constants/colors';
import { Scheme } from '../../types/scheme';
import { useAllSchemes } from '../../hooks/useSchemeMatches';

export default function SchemesScreen() {
  const [search, setSearch] = useState('');
  const { data: schemes, isLoading, refetch, isRefetching } = useAllSchemes(search);
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
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
          subtitle={search ? 'Try a different search term.' : 'Check back soon — more schemes are being added.'}
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
                navigation.navigate('HomeTab', {
                  screen: 'SchemeDetail',
                  params: { schemeId: item.id },
                })
              }
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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