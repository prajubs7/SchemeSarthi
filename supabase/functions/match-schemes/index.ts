// Supabase Edge Function: compute hard eligibility first, then semantic rank.
import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkEligibility, findNearMiss, normalize } from '../_shared/eligibility.ts';
import type { Profile, Scheme, JsonObject, NearMiss } from '../_shared/eligibility.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const EMBEDDING_DIMENSIONS = 1536; // Matches scripts/generateEmbeddings.js and schemes.embedding.
const MATCH_LIMIT = 20;
const NEAR_MATCH_LIMIT = 10;

async function embedProfile(profileText: string): Promise<number[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-embedding-001',
        content: { parts: [{ text: profileText }] },
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }),
    },
  );
  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message ?? 'Embedding request failed');
  const values = body.embedding?.values;
  if (!Array.isArray(values) || values.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`Gemini returned an unexpected embedding dimension (expected ${EMBEDDING_DIMENSIONS})`);
  }
  return values;
}

// pgvector columns arrive from PostgREST as a "[0.1,0.2,...]" string.
function parseVector(value: unknown): number[] | null {
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(parsed) || parsed.length !== EMBEDDING_DIMENSIONS) return null;
  return parsed.every(item => typeof item === 'number') ? (parsed as number[]) : null;
}

function cosineSimilarity(a: number[], b: number[]): number | null {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA === 0 || normB === 0 ? null : dot / Math.sqrt(normA * normB);
}

serve(async req => {
  try {
    const { user_id } = await req.json();
    if (!user_id) return jsonResponse({ error: 'user_id is required' }, 400);

    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return jsonResponse({ error: 'Authentication required' }, 401);
    if (token !== SUPABASE_SERVICE_ROLE_KEY) {
      const { data, error } = await supabase.auth.getUser(token);
      if (error || data.user?.id !== user_id) {
        return jsonResponse({ error: 'Not authorized for this user' }, 403);
      }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, age, occupation_category, income_bracket, state, gender, social_category')
      .eq('id', user_id)
      .single();
    if (profileError || !profile) return jsonResponse({ error: 'Profile not found' }, 404);

    // Stage 1: fetch eligibility metadata only and apply every known hard rule.
    // Embeddings are fetched and generated only after this candidate set is known.
    const { data: candidates, error: schemesError } = await supabase
      .from('schemes')
      .select('id, title, description, benefit_summary, eligibility_rules, states')
      .eq('status', 'active');
    if (schemesError) return jsonResponse({ error: schemesError.message }, 500);

    const eligible: Array<{ scheme: Scheme; reason: JsonObject }> = [];
    const nearMisses: Array<{ scheme: Scheme; reason: JsonObject; nearMiss: NearMiss }> = [];
    for (const scheme of (candidates ?? []) as Scheme[]) {
      const schemeStates = scheme.states ?? [];
      if (!schemeStates.some(state => normalize(state) === 'all' || (profile.state && normalize(state) === normalize(profile.state)))) {
        continue;
      }
      const result = checkEligibility(profile as Profile, scheme);
      if (result.passed) {
        eligible.push({ scheme, reason: result.reason });
        continue;
      }
      const nearMiss = findNearMiss(profile as Profile, scheme, result.reason);
      if (nearMiss) nearMisses.push({ scheme, reason: result.reason, nearMiss });
    }

    // Stage 2: one profile embedding ranks both eligible schemes and near misses.
    // Schemes without a usable embedding are left out of both lists.
    const similarities = new Map<string, number>();
    const rankedIds = [...eligible, ...nearMisses].map(item => item.scheme.id);
    if (rankedIds.length > 0) {
      const profileText = `Age ${profile.age ?? 'unspecified'}, occupation ${profile.occupation_category ?? 'unspecified'}, income bracket ${profile.income_bracket ?? 'unspecified'}, state ${profile.state ?? 'unspecified'}, social category ${profile.social_category ?? 'unspecified'}, gender ${profile.gender ?? 'unspecified'}`;
      const queryEmbedding = await embedProfile(profileText);
      const { data: embeddedSchemes, error: embeddingError } = await supabase
        .from('schemes')
        .select('id, embedding')
        .in('id', rankedIds);
      if (embeddingError) return jsonResponse({ error: embeddingError.message }, 500);
      for (const scheme of (embeddedSchemes ?? []) as Array<{ id: string; embedding: unknown }>) {
        const vector = parseVector(scheme.embedding);
        const similarity = vector ? cosineSimilarity(queryEmbedding, vector) : null;
        if (similarity !== null) similarities.set(scheme.id, similarity);
      }
    }
    const byScore = <T extends { scheme: Scheme }>(items: T[], limit: number) =>
      items
        .filter(item => similarities.has(item.scheme.id))
        .sort((a, b) => similarities.get(b.scheme.id)! - similarities.get(a.scheme.id)!)
        .slice(0, limit);

    const now = new Date().toISOString();
    const rows = byScore(eligible, MATCH_LIMIT).map(({ scheme, reason }) => ({
      user_id,
      scheme_id: scheme.id,
      match_score: similarities.get(scheme.id)!,
      match_reason: reason,
      matched_at: now,
    }));
    const nearRows = byScore(nearMisses, NEAR_MATCH_LIMIT).map(({ scheme, reason, nearMiss }) => ({
      user_id,
      scheme_id: scheme.id,
      failing_key: nearMiss.failing_key,
      qualifies_at_age: nearMiss.qualifies_at_age,
      match_score: similarities.get(scheme.id)!,
      match_reason: reason,
      computed_at: now,
    }));

    // Keep cached results in sync, removing schemes which no longer qualify.
    const syncError = await syncUserRows('user_matches', user_id, rows)
      ?? await syncUserRows('user_near_matches', user_id, nearRows);
    if (syncError) return jsonResponse({ error: syncError }, 500);

    return jsonResponse({
      matched_count: rows.length,
      near_match_count: nearRows.length,
      coming_up: nearRows
        .filter(row => row.qualifies_at_age !== null)
        .map(row => ({ scheme_id: row.scheme_id, qualifies_at_age: row.qualifies_at_age })),
    }, 200);
  } catch (error) {
    return jsonResponse({ error: String(error) }, 500);
  }
});

/** Replaces a user's cached rows in `table` with `rows`. Returns an error message on failure. */
async function syncUserRows(
  table: 'user_matches' | 'user_near_matches',
  userId: string,
  rows: Array<{ scheme_id: string }>,
): Promise<string | null> {
  const { data: existing, error: existingError } = await supabase
    .from(table)
    .select('scheme_id')
    .eq('user_id', userId);
  if (existingError) return existingError.message;

  const retainedIds = new Set(rows.map(row => row.scheme_id));
  const staleIds = (existing ?? []).map((row: { scheme_id: string }) => row.scheme_id)
    .filter((id: string) => !retainedIds.has(id));
  if (staleIds.length > 0) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId).in('scheme_id', staleIds);
    if (error) return error.message;
  }
  if (rows.length > 0) {
    const { error } = await supabase.from(table).upsert(rows, { onConflict: 'user_id,scheme_id' });
    if (error) return error.message;
  }
  return null;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
