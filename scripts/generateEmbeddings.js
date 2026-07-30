/**
 * scripts/generateEmbeddings.js
 *
 * Uses Google's Gemini Embedding API (free tier — no billing required).
 * Truncates output to 1536 dimensions to match your existing schema.
 *
 * Run with: node generateEmbeddings.js (from inside the scripts/ folder)
 * Requires: npm install @supabase/supabase-js dotenv
 * (no separate SDK needed for Gemini — we call the REST endpoint directly)
 */

require('dotenv').config({ path: __dirname + '/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`;

async function embedText(text) {
  const response = await fetch(EMBED_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/gemini-embedding-001',
      content: { parts: [{ text }] },
      outputDimensionality: 1536, // matches your existing vector(1536) column
    }),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error?.message || 'Gemini embedding request failed');
  }

  return json.embedding.values;
}

async function generateEmbeddings() {
  const { data: schemes, error } = await supabase
    .from('schemes')
    .select('id, title, description, benefit_summary')
    .is('embedding', null);

  if (error) throw error;

  console.log(`Found ${schemes.length} schemes needing embeddings.`);

  for (const scheme of schemes) {
    const textToEmbed = `${scheme.title}. ${scheme.description} ${scheme.benefit_summary ?? ''}`;

    try {
      const embedding = await embedText(textToEmbed);

      const { error: updateError } = await supabase
        .from('schemes')
        .update({ embedding })
        .eq('id', scheme.id);

      if (updateError) {
        console.error(`Failed to update ${scheme.title}:`, updateError.message);
      } else {
        console.log(`✓ Embedded: ${scheme.title}`);
      }
    } catch (err) {
      console.error(`Failed to embed ${scheme.title}:`, err.message);
    }

    // free tier is rate-limited — small delay keeps you comfortably under it
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log('Done.');
}

generateEmbeddings().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
