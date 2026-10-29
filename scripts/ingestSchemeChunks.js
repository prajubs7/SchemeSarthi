/**
 * Build retrieval chunks from the structured scheme records already in Supabase.
 * Run from the repository root: node scripts/ingestSchemeChunks.js
 * Set SCHEME_ID to index one scheme. Bulk indexing requires ALL_SCHEMES=true.
 * Requires scripts/.env with SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY.
 */
require('dotenv').config({ path: `${__dirname}/.env` });
const { createClient } = require('@supabase/supabase-js');

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY, SCHEME_ID } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GEMINI_API_KEY) {
  throw new Error('Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and GEMINI_API_KEY in scripts/.env');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const MODEL = 'gemini-embedding-001';
const DIMENSIONS = 768;
const MAX_CHARS = 1800;

function chunkText(text) {
  const words = text.split(/\s+/);
  const chunks = [];
  let current = '';
  for (const word of words) {
    if (current && `${current} ${word}`.length > MAX_CHARS) {
      chunks.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function schemeSections(scheme) {
  const sections = [
    ['Scheme', scheme.title],
    ['Description', scheme.description],
    ['Benefits', scheme.benefit_summary],
    ['Eligibility rules', scheme.eligibility_rules && JSON.stringify(scheme.eligibility_rules)],
    ['Required documents', scheme.required_documents?.join(', ')],
    ['Applicable states', scheme.states?.join(', ')],
    ['Scheme status', scheme.status],
  ].filter(([, value]) => typeof value === 'string' && value.trim());

  return sections.flatMap(([label, value]) => chunkText(`${label}: ${value}`));
}

async function embed(text) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:embedContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: `models/${MODEL}`,
      content: { parts: [{ text }] },
      outputDimensionality: DIMENSIONS,
    }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message ?? 'Gemini embedding request failed');
  const values = result.embedding?.values;
  if (!Array.isArray(values) || values.length !== DIMENSIONS) throw new Error('Gemini returned an unexpected embedding size');
  return values;
}

async function getOrCreateSource(scheme) {
  const sourceUrl = scheme.official_link || scheme.source_document_ref || `database://schemes/${scheme.id}`;
  const { data: existing, error: findError } = await supabase
    .from('scheme_sources')
    .select('id')
    .eq('scheme_id', scheme.id)
    .eq('source_url', sourceUrl)
    .limit(1)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return existing.id;

  const { data, error } = await supabase.from('scheme_sources').insert({
    scheme_id: scheme.id,
    name: `${scheme.title} database record`,
    source_url: sourceUrl,
    source_type: 'manual',
    last_fetched_at: new Date().toISOString(),
  }).select('id').single();
  if (error) throw error;
  return data.id;
}

async function ingest(scheme) {
  const sourceId = await getOrCreateSource(scheme);
  const contents = schemeSections(scheme);
  if (contents.length === 0) {
    console.warn(`Skipping ${scheme.title}: no scheme text fields are populated.`);
    return;
  }

  const rows = [];
  for (let index = 0; index < contents.length; index += 1) {
    rows.push({
      scheme_id: scheme.id,
      source_id: sourceId,
      content: contents[index],
      embedding: await embed(contents[index]),
      chunk_index: index,
    });
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  const { error: deleteError } = await supabase.from('scheme_chunks').delete().eq('source_id', sourceId);
  if (deleteError) throw deleteError;
  const { error: insertError } = await supabase.from('scheme_chunks').insert(rows);
  if (insertError) throw insertError;
  console.log(`Indexed ${rows.length} chunks for ${scheme.title}.`);
}

async function main() {
  if (!SCHEME_ID && process.env.ALL_SCHEMES !== 'true') {
    throw new Error('Set SCHEME_ID to one scheme UUID, or set ALL_SCHEMES=true to index every scheme.');
  }
  let query = supabase.from('schemes').select(
    'id, title, description, benefit_summary, eligibility_rules, required_documents, states, status, official_link, source_document_ref',
  );
  if (SCHEME_ID) query = query.eq('id', SCHEME_ID);
  const { data: schemes, error } = await query;
  if (error) throw error;
  if (!schemes?.length) throw new Error(SCHEME_ID ? `No scheme found with id ${SCHEME_ID}` : 'No schemes found');

  for (const scheme of schemes) await ingest(scheme);
}

main().catch(error => {
  console.error('Chunk ingestion failed:', error.message ?? error);
  process.exitCode = 1;
});
