import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { useBookmarks } from '../../hooks/useBookmarks';
import { useNotifications } from '../../hooks/useNotifications';
import { useSchemeMatches } from '../../hooks/useSchemeMatches';
import {
  Banner,
  EmptyState,
  ErrorState,
  SchemeCardSkeleton,
  Screen,
  ScreenHeader,
} from '../../components/ui';
import SchemeListCard from '../../components/scheme/SchemeListCard';
import { colors, shadows, spacing } from '../../theme';
import { RootState } from '../../store';
import { MainTabScreenProps } from '../../navigation/types';
import { BookmarkWithScheme } from '../../types/scheme';

type Props = MainTabScreenProps<'SavedTab'>;

const UNDO_TIMEOUT_MS = 5000;
const SKELETON_COUNT = 3;

export default function BookmarksScreen({ navigation }: Props) {
  const { user } = useAuth();
  const profile = useSelector((state: RootState) => state.profile.profile);
  const bookmarks = useBookmarks(user?.id);
  const notifications = useNotifications(user?.id);
  const matches = useSchemeMatches(user?.id);
  const { addBookmark, removeBookmark } = bookmarks;

  const [refreshing, setRefreshing] = useState(false);
  // The last removed bookmark, kept so the snackbar can put it back.
  const [removed, setRemoved] = useState<BookmarkWithScheme | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearUndoTimer = () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = null;
  };
  useEffect(() => clearUndoTimer, []);

  const list = bookmarks.data ?? [];
  const count = list.length;

  const deadlineSoonIds = useMemo(
    () =>
      new Set(
        (notifications.data ?? [])
          .filter(n => n.notification_type === 'deadline_soon' && n.scheme_id)
          .map(n => n.scheme_id as string),
      ),
    [notifications.data],
  );
  const matchedIds = useMemo(
    () => new Set((matches.data ?? []).map(m => m.id)),
    [matches.data],
  );

  const remove = (item: BookmarkWithScheme) => {
    removeBookmark(item.schemes.id);
    setRemoved(item);
    clearUndoTimer();
    undoTimer.current = setTimeout(() => setRemoved(null), UNDO_TIMEOUT_MS);
  };

  const undo = () => {
    if (!removed) return;
    addBookmark(removed.schemes);
    clearUndoTimer();
    setRemoved(null);
  };

  const dismissUndo = () => {
    clearUndoTimer();
    setRemoved(null);
  };

  const { refetch: refetchBookmarks } = bookmarks;
  const { refetch: refetchNotifications } = notifications;
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchBookmarks(), refetchNotifications()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchBookmarks, refetchNotifications]);

  const openScheme = (schemeId: string) =>
    navigation.navigate('SchemeDetail', { schemeId });

  let body: React.ReactNode;
  if (bookmarks.isLoading) {
    body = (
      <View style={styles.list}>
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <SchemeCardSkeleton key={i} />
        ))}
      </View>
    );
  } else if (bookmarks.isError) {
    body = (
      <ErrorState
        title="Couldn't load saved schemes"
        onRetry={() => refetchBookmarks()}
      />
    );
  } else if (count === 0) {
    body = (
      <EmptyState
        icon="bookmark-outline"
        title="No saved schemes yet"
        subtitle="Tap the bookmark on any scheme to keep it here for later."
        actionLabel="Explore schemes"
        onAction={() => navigation.navigate('SchemeTab')}
      />
    );
  } else {
    body = (
      <FlatList
        contentContainerStyle={[styles.list, removed && styles.listWithSnackbar]}
        data={list}
        keyExtractor={item => item.schemes.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <SchemeListCard
            scheme={item.schemes}
            onPress={() => openScheme(item.schemes.id)}
            matched={matchedIds.has(item.schemes.id)}
            userAge={profile?.age}
            deadlineSoon={deadlineSoonIds.has(item.schemes.id)}
            action={{
              icon: 'bookmark',
              label: `Remove ${item.schemes.title} from saved`,
              onPress: () => remove(item),
            }}
          />
        )}
      />
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']} padded={false}>
      <ScreenHeader
        title="Saved schemes"
        subtitle={
          count > 0
            ? `${count} ${count === 1 ? 'scheme' : 'schemes'} saved`
            : undefined
        }
      />
      {body}
      {removed ? (
        <View style={styles.snackbar} pointerEvents="box-none">
          <Banner
            tone="info"
            icon="bookmark-outline"
            message={`Removed "${removed.schemes.title}" from saved.`}
            actionLabel="Undo"
            onAction={undo}
            onDismiss={dismissUndo}
            style={styles.snackbarBanner}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.gutter },
  // Room for the snackbar so it never covers the last card.
  listWithSnackbar: { paddingBottom: spacing.xxl * 4 },
  snackbar: {
    position: 'absolute',
    left: spacing.gutter,
    right: spacing.gutter,
    bottom: spacing.lg,
  },
  snackbarBanner: {
    ...shadows.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
