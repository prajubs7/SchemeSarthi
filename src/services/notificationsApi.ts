import { supabase } from './supabase';
import { AppNotification } from '../types/notification';

const PAGE_SIZE = 50;

// Read-only for now; Step 10 adds markRead, markAllRead and refreshDigest.
export async function getNotifications(
  userId: string,
): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  if (error) throw error;
  return data ?? [];
}
