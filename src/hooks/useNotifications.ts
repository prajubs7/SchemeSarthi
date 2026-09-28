import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import {
  getNotifications,
  markAllRead,
  markRead,
} from '../services/notificationsApi';
import { AppNotification } from '../types/notification';

export function useNotifications(userId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['notifications', userId];

  const query = useQuery({
    queryKey,
    queryFn: () => getNotifications(userId as string),
    enabled: !!userId,
  });

  // Optimistic: flip is_read in the cache right away, roll back if the request fails,
  // and refetch either way so the cache ends up matching the server.
  const updateCache = async (
    update: (list: AppNotification[]) => AppNotification[],
  ) => {
    await queryClient.cancelQueries({ queryKey });
    const previous = queryClient.getQueryData<AppNotification[]>(queryKey);
    queryClient.setQueryData<AppNotification[]>(queryKey, update(previous ?? []));
    return { previous };
  };
  const rollback = (
    _error: unknown,
    _variables: unknown,
    context: { previous?: AppNotification[] } | undefined,
  ) => queryClient.setQueryData(queryKey, context?.previous);
  const refetch = () => queryClient.invalidateQueries({ queryKey });

  const readOne = useMutation({
    mutationFn: (id: string) => markRead(id),
    onMutate: (id: string) =>
      updateCache(list =>
        list.map(n => (n.id === id ? { ...n, is_read: true } : n)),
      ),
    onError: rollback,
    onSettled: refetch,
  });

  const readAll = useMutation({
    mutationFn: (_: void) => markAllRead(userId as string),
    onMutate: () =>
      updateCache(list => list.map(n => ({ ...n, is_read: true }))),
    onError: rollback,
    onSettled: refetch,
  });

  const unread = useMemo(
    () => (query.data ?? []).filter(n => !n.is_read),
    [query.data],
  );

  return {
    ...query,
    unread,
    unreadCount: unread.length,
    markRead: readOne.mutate,
    markAllRead: readAll.mutate,
  };
}

/**
 * Refetches notifications when the digest inserts a row for this user. Mount once
 * (MainTabNavigator does): each call opens its own Realtime channel.
 */
export function useNotificationsRealtime(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () =>
          queryClient.invalidateQueries({ queryKey: ['notifications', userId] }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
