import { supabase } from './supabase';
import { MatchedScheme, Scheme } from '../types/scheme';

/**
 * Fetches cached match results for a user (populated by the `match-schemes`
 * Edge Function — see README_SETUP.md, this function is NOT built yet).
 */
export async function getMatchedSchemes(userId: string): Promise<MatchedScheme[]> {
  const { data, error } = await supabase
    .from('user_matches')
    .select(
      `
      match_score,
      match_reason,
      viewed,
      schemes (*)
    `
    )
    .eq('user_id', userId)
    .order('match_score', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    ...row.schemes,
    match_score: row.match_score,
    match_reason: row.match_reason,
    viewed: row.viewed,
  }));
}

export async function getSchemeById(schemeId: string): Promise<Scheme> {
  const { data, error } = await supabase
    .from('schemes')
    .select('*')
    .eq('id', schemeId)
    .single();

  if (error) throw error;
  return data;
}

export async function markSchemeViewed(userId: string, schemeId: string): Promise<void> {
  const { error } = await supabase
    .from('user_matches')
    .update({ viewed: true })
    .eq('user_id', userId)
    .eq('scheme_id', schemeId);

  if (error) throw error;
}

/**
 * Triggers the matching Edge Function to (re)compute matches for this user
 * against the schemes table (hard-filter + pgvector similarity, per your plan).
 * STUB: build the `match-schemes` Edge Function before this will succeed —
 * see README_SETUP.md.
 */
export async function runSchemeMatch(userId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('match-schemes', {
    body: { user_id: userId },
  });

  if (error) throw error;
}


// Add this to schemesApi.ts

export async function getAllSchemes(searchQuery?: string): Promise<Scheme[]> {
  let query = supabase
    .from('schemes')
    .select('*')
    .eq('status', 'active')
    .order('title', { ascending: true });

  // simple text search across title/description — fine for MVP;
  // your pgvector similarity search is a separate, smarter feature for later
  if (searchQuery && searchQuery.trim().length > 0) {
    query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}