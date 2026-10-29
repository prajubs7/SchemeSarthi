import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;
const EMBEDDING_MODEL = 'gemini-embedding-001';
const ANSWER_MODEL = 'gemini-3.8-flash';
const FALLBACK_ANSWER_MODEL = 'gemini-3.7-flash';
const NO_INFO = "I don't have current information on this.";
const RELEVANCE_THRESHOLD = 0.55;

type Chunk = { content: string; similarity: number };

async function gemini(path: string, body: unknown) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${path}?key=${GEMINI_API_KEY}`;
  const maxRetries = 3;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const response = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (response.ok) return payload;

    const retryable = [408, 500, 502, 503, 504].includes(response.status);
    if (!retryable || attempt === maxRetries) {
      throw new Error(payload.error?.message ?? `Gemini request failed with HTTP ${response.status}`);
    }

    const retryAfter = Number(response.headers.get('retry-after'));
    const delayMs = Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.min(retryAfter * 1000, 10000)
      : 1000 * (2 ** attempt) + Math.floor(Math.random() * 300);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  throw new Error('Gemini request failed after retries');
}

async function embedQuestion(question: string): Promise<number[]> {
  const result = await gemini(`${EMBEDDING_MODEL}:embedContent`, {
    model: `models/${EMBEDDING_MODEL}`,
    content: { parts: [{ text: question }] },
    outputDimensionality: 768,
  });
  const values = result.embedding?.values;
  if (!Array.isArray(values) || values.length !== 768) throw new Error('Unexpected question embedding dimensions');
  return values;
}

function intentFor(question: string): 'STATUS' | 'ELIGIBILITY' | 'GENERAL' {
  if (/\b(open|still open|deadline|closing date|last date|extended|extension|status|launched|closed)\b/i.test(question)) return 'STATUS';
  if (/\b(eligible|eligibility|qualify|qualified|match|don't match|do not match|why.*match)\b/i.test(question)) return 'ELIGIBILITY';
  return 'GENERAL';
}

function isTemporaryOverload(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /high demand|overload|\b503\b|UNAVAILABLE|service_unavailable/i.test(message);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

serve(async req => {
  try {
    const bearer = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!bearer) return json({ error: 'Authentication required' }, 401);
    const { data: authData, error: authError } = await supabase.auth.getUser(bearer);
    if (authError || !authData.user) return json({ error: 'Invalid authentication token' }, 401);
    const { user_id, scheme_id, question } = await req.json();
    if (!user_id || !scheme_id || typeof question !== 'string' || !question.trim()) return json({ error: 'user_id, scheme_id and question are required' }, 400);
    if (authData.user.id !== user_id) return json({ error: 'user_id does not match authenticated user' }, 403);

    const embedding = await embedQuestion(question.trim());
    const { data: chunks, error: retrievalError } = await supabase.rpc('search_scheme_chunks', {
      query_embedding: embedding,
      requested_scheme_id: scheme_id,
      result_limit: 5,
    });
    if (retrievalError) throw retrievalError;
    const retrieved = (chunks ?? []) as Chunk[];
    const grounded = retrieved.some(chunk => chunk.similarity >= RELEVANCE_THRESHOLD);
    const intent = intentFor(question);

    const [{ data: scheme, error: schemeError }, { data: match, error: matchError }] = await Promise.all([
      supabase.from('schemes').select('last_verified_at').eq('id', scheme_id).maybeSingle(),
      intent === 'ELIGIBILITY'
        ? supabase.from('user_matches').select('match_reason').eq('user_id', user_id).eq('scheme_id', scheme_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);
    if (schemeError) throw schemeError;
    if (matchError) throw matchError;

    let changes: unknown[] = [];
    if (intent === 'STATUS') {
      const { data, error } = await supabase.from('scheme_change_log').select('field_changed, old_value, new_value, detected_at')
        .eq('scheme_id', scheme_id).order('detected_at', { ascending: false }).limit(5);
      if (error) throw error;
      changes = data ?? [];
    }

    let answer = NO_INFO;
    let modelUsed = ANSWER_MODEL;
    if (grounded) {
      const evidence = retrieved.map(item => item.content).join('\n\n---\n\n');
      const task = intent === 'ELIGIBILITY'
        ? `Explain how this user's existing eligibility match reason relates to the scheme. Be specific, and do not recompute eligibility. Match reason: ${JSON.stringify(match?.match_reason ?? null)}`
        : 'Answer the user question';
      const statusDetails = intent === 'STATUS'
        ? `Latest change log rows: ${JSON.stringify(changes)}. Last verified at: ${scheme?.last_verified_at ?? 'unknown'}. Lead with one concise status line based on this date and change log.`
        : '';
      const generationRequest = {
        systemInstruction: { parts: [{ text: `You answer questions about government schemes. Use ONLY the supplied retrieved source chunks as factual context. Do not use outside knowledge and decline speculation. If the context is insufficient to answer, respond exactly: "${NO_INFO}". ${task}. ${statusDetails}` }] },
        contents: [{ role: 'user', parts: [{ text: `Question: ${question}\n\nRetrieved source chunks:\n${evidence}` }] }],
      };
      let generated;
      try {
        generated = await gemini(`${ANSWER_MODEL}:generateContent`, generationRequest);
      } catch (error) {
        if (!isTemporaryOverload(error)) throw error;
        generated = await gemini(`${FALLBACK_ANSWER_MODEL}:generateContent`, generationRequest);
        modelUsed = FALLBACK_ANSWER_MODEL;
      }
      answer = generated.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? '').join('').trim() || NO_INFO;
    }

    let stale = false;
    if (scheme?.last_verified_at) {
      const { data: sourceRows, error } = await supabase.from('scheme_sources').select('fetch_frequency_hours')
        .eq('scheme_id', scheme_id).eq('is_active', true);
      if (error) throw error;
      const maxHours = Math.max(0, ...(sourceRows ?? []).map((row: { fetch_frequency_hours: number }) => row.fetch_frequency_hours * 2));
      stale = maxHours > 0 && Date.now() - new Date(scheme.last_verified_at).getTime() > maxHours * 3600000;
    }
    if (stale) answer = `Status information may be out of date (last verified ${scheme.last_verified_at}). ${answer}`;

    const { data: log, error: logError } = await supabase.from('scheme_qa_log').insert({
      question: question.trim(), answer, scheme_id, user_id,
      was_grounded: grounded && !answer.includes(NO_INFO), model_used: modelUsed,
    }).select('id, helpful').single();
    if (logError) throw logError;
    return json({ id: log.id, answer, was_grounded: grounded && !answer.includes(NO_INFO), model_used: modelUsed, helpful: log.helpful ?? null });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
