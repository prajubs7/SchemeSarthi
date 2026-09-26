import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useBookmarks } from '../../hooks/useBookmarks';
import {
  Card,
  EmptyState,
  LoadingSpinner,
  Screen,
  ScreenHeader,
} from '../../components/ui';
import { colors } from '../../constants/colors';
import { MainTabScreenProps } from '../../navigation/types';

type Props = MainTabScreenProps<'SavedTab'>;

export default function BookmarksScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { data: bookmarks, isLoading } = useBookmarks(user?.id);

  return (
    <Screen edges={['top', 'left', 'right']} padded={false}>
      <ScreenHeader title="Saved schemes" />
      {isLoading ? (
        <LoadingSpinner />
      ) : !bookmarks || bookmarks.length === 0 ? (
        <EmptyState
          icon="bookmark-outline"
          title="No saved schemes yet"
          subtitle="Save schemes you want to revisit later."
        />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={bookmarks}
          keyExtractor={(item: any) => item.schemes.id}
          renderItem={({ item }: any) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('SchemeDetail', {
                  schemeId: item.schemes.id,
                })
              }
            >
              <Card style={styles.card}>
                <Text style={styles.title}>{item.schemes.title}</Text>
                <Text style={styles.summary} numberOfLines={2}>
                  {item.schemes.benefit_summary ?? item.schemes.description}
                </Text>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  card: { marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  summary: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
});
