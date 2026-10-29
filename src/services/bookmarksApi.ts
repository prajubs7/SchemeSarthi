import { supabase } from './supabase';
import { BookmarkWithScheme } from '../types/scheme';

export async function getBookmarks(userId: string): Promise<BookmarkWithScheme[]> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select(`created_at, notes, schemes (*)`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as BookmarkWithScheme[];
}

export async function addBookmark(userId: string, schemeId: string) {
  const { error } = await supabase
    .from('bookmarks')
    .insert({ user_id: userId, scheme_id: schemeId });

  if (error) throw error;
}

export async function removeBookmark(userId: string, schemeId: string) {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', userId)
    .eq('scheme_id', schemeId);

  if (error) throw error;
}
