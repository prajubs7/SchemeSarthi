import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import {
  AppText,
  EmptyState,
  ErrorState,
  ListRowSkeleton,
  Screen,
} from '../../components/ui';
import NotificationRow from '../../components/notifications/NotificationRow';
import { colors, opacity, radius, sizes, spacing } from '../../theme';
import { RootStackScreenProps } from '../../navigation/types';
import { AppNotification } from '../../types/notification';

type Props = RootStackScreenProps<'Notifications'>;

const DAY = 24 * 60 * 60 * 1000;
const SKELETON_COUNT = 6;

type Section = { title: string; data: AppNotification[] };

/** Today (since local midnight), This week (the 6 days before), then Earlier. */
function groupByRecency(list: AppNotification[], now = new Date()): Section[] {
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  const startOfWeek = startOfToday - 6 * DAY;
  const sections: Section[] = [
    { title: 'Today', data: [] },
    { title: 'This week', data: [] },
    { title: 'Earlier', data: [] },
  ];
  for (const n of list) {
    const time = new Date(n.created_at).getTime();
    const index = time >= startOfToday ? 0 : time >= startOfWeek ? 1 : 2;
    sections[index].data.push(n);
  }
  return sections.filter(s => s.data.length > 0);
}

interface MarkAllReadProps {
  disabled: boolean;
  onPress: () => void;
}

function MarkAllReadButton({ disabled, onPress }: MarkAllReadProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Mark all notifications as read"
      accessibilityState={{ disabled }}
      hitSlop={spacing.sm}
      style={({ pressed }) => [
        styles.headerAction,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <AppText variant="bodySm" weight="600" color="primary">
        Mark all read
      </AppText>
    </Pressable>
  );
}

// Built outside the screen so the header renderer isn't a component defined during render.
const renderMarkAllRead = (props: MarkAllReadProps) => () =>
  <MarkAllReadButton {...props} />;

export default function NotificationsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const {
    data,
    isLoading,
    isError,
    refetch,
    unreadCount,
    markRead,
    markAllRead,
  } = useNotifications(user?.id);
  const [refreshing, setRefreshing] = useState(false);

  const sections = useMemo(() => groupByRecency(data ?? []), [data]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: renderMarkAllRead({
        disabled: unreadCount === 0,
        onPress: () => markAllRead(),
      }),
    });
  }, [navigation, unreadCount, markAllRead]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const open = (n: AppNotification) => {
    if (!n.is_read) markRead(n.id);
    if (n.scheme_id)
      navigation.navigate('SchemeDetail', { schemeId: n.scheme_id });
  };

  if (isLoading) {
    return (
      <Screen>
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <ListRowSkeleton key={i} />
        ))}
      </Screen>
    );
  }
  if (isError) {
    return (
      <ErrorState
        message="We couldn't load your notifications."
        onRetry={() => refetch()}
      />
    );
  }

  if (sections.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="notifications-outline"
          tone="success"
          title="You're all caught up"
          subtitle="New matches, deadlines and scheme updates will show up here."
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <SectionList
        sections={sections}
        keyExtractor={n => n.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        renderSectionHeader={({ section }) => (
          <AppText
            variant="caption"
            weight="600"
            color="textSecondary"
            accessibilityRole="header"
            style={styles.sectionTitle}
          >
            {section.title.toUpperCase()}
          </AppText>
        )}
        renderItem={({ item, index, section }) => (
          <View
            style={[
              styles.item,
              index === 0 && styles.first,
              index === section.data.length - 1 && styles.last,
            ]}
          >
            <NotificationRow
              notification={item}
              divider={index > 0}
              onPress={() => open(item)}
            />
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.gutter, paddingBottom: spacing.xxl },
  sectionTitle: { marginTop: spacing.lg, marginBottom: spacing.sm },
  // Rows in a section read as one card: shared border, rounded only at the ends.
  item: {
    backgroundColor: colors.surface,
    borderLeftWidth: sizes.borderWidth,
    borderRightWidth: sizes.borderWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  first: {
    borderTopWidth: sizes.borderWidth,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  last: {
    borderBottomWidth: sizes.borderWidth,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  headerAction: {
    minHeight: sizes.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  pressed: { opacity: opacity.pressed },
  disabled: { opacity: opacity.disabled },
});
