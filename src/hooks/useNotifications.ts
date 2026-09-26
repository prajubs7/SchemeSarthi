import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getNotifications } from '../services/notificationsApi';

export function useNotifications(userId: string | undefined) {
  const query = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => getNotifications(userId as string),
    enabled: !!userId,
  });

  const unread = useMemo(
    () => (query.data ?? []).filter(n => !n.is_read),
    [query.data],
  );

  return { ...query, unread, unreadCount: unread.length };
}
