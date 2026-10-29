import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { AppNotification } from '../types/notification';

const PAGE_SIZE = 50;
const DIGEST_INTERVAL_MS = 6 * 60 * 60 * 1000;
const digestKey = (userId: string) => `digest:lastRun:${userId}`;

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

export async function markRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  if (error) throw error;
}

export async function markAllRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
}

/**
 * Runs generate-awareness-digest for this user. The function re-runs match-schemes itself
 * and diffs user_matches before/after, so call this *instead of* runSchemeMatch when new
 * matches should produce new_match notifications.
 */
export async function refreshDigest(
  userId: string,
): Promise<{ notifications_created: number }> {
  await AsyncStorage.setItem(digestKey(userId), String(Date.now())).catch(
    () => {},
  );
  const { data, error } = await supabase.functions.invoke<{
    notifications_created?: number;
  }>('generate-awareness-digest', { body: { user_id: userId } });

  if (error) throw error;
  return { notifications_created: data?.notifications_created ?? 0 };
}

/** refreshDigest, at most once per 6 hours per user. Resolves false when skipped. */
export async function refreshDigestIfDue(userId: string): Promise<boolean> {
  const lastRun = Number(
    await AsyncStorage.getItem(digestKey(userId)).catch(() => null),
  );
  if (Number.isFinite(lastRun) && Date.now() - lastRun < DIGEST_INTERVAL_MS) {
    return false;
  }
  await refreshDigest(userId);
  return true;
}
