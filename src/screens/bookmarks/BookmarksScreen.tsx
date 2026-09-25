import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useBookmarks } from '../../hooks/useBookmarks';
import { Card, EmptyState, LoadingSpinner } from '../../components/ui';
import { colors } from '../../constants/colors';

export default function BookmarksScreen() {
  const { user } = useAuth();
  const { data: bookmarks, isLoading } = useBookmarks(user?.id);
  const navigation = useNavigation<any>();

  if (isLoading) return <LoadingSpinner />;

  if (!bookmarks || bookmarks.length === 0) {
    return <EmptyState title="No bookmarks yet" subtitle="Save schemes you want to revisit later." />;
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
      data={bookmarks}
      keyExtractor={(item: any) => item.schemes.id}
      renderItem={({ item }: any) => (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('HomeTab', {
              screen: 'SchemeDetail',
              params: { schemeId: item.schemes.id },
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: { marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  summary: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
});
