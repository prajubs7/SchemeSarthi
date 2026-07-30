// supabase/functions/match-schemes/index.ts
//
// Deno runtime (Supabase Edge Functions). Triggered by runSchemeMatch() in
// your app's schemesApi.ts. Given a user_id:
//   1. Fetch their profile
//   2. Build a text description and embed it via Gemini
//   3. Call the match_eligible_schemes SQL function (hard filter + similarity)
//   4. Upsert results into user_matches

import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), { status: 400 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404 });
    }

    const profileText = `Age ${profile.age ?? 'unspecified'}, occupation ${
      profile.occupation_category ?? 'unspecified'
    }, income bracket ${profile.income_bracket ?? 'unspecified'}, state ${
      profile.state ?? 'unspecified'
    }, category ${profile.social_category ?? 'unspecified'}, gender ${profile.gender ?? 'unspecified'}`;

    const embeddingRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/gemini-embedding-001',
          content: { parts: [{ text: profileText }] },
          outputDimensionality: 1536,
        }),
      }
    );

    const embeddingJson = await embeddingRes.json();

    if (!embeddingRes.ok) {
      return new Response(
        JSON.stringify({ error: embeddingJson.error?.message ?? 'Embedding request failed' }),
        { status: 500 }
      );
    }

    const queryEmbedding = embeddingJson.embedding.values;

    const { data: matches, error: matchError } = await supabase.rpc('match_eligible_schemes', {
      p_user_id: user_id,
      p_query_embedding: queryEmbedding,
      p_limit: 20,
    });

    if (matchError) {
      return new Response(JSON.stringify({ error: matchError.message }), { status: 500 });
    }

    const rows = matches.map((m: any) => ({
      user_id,
      scheme_id: m.scheme_id,
      match_score: m.similarity,
      match_reason: m.match_reason,
      matched_at: new Date().toISOString(),
    }));

    if (rows.length > 0) {
      const { error: upsertError } = await supabase
        .from('user_matches')
        .upsert(rows, { onConflict: 'user_id,scheme_id' });

      if (upsertError) {
        return new Response(JSON.stringify({ error: upsertError.message }), { status: 500 });
      }
    }

    return new Response(JSON.stringify({ matched_count: rows.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});