import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkEligibility, normalize } from '../_shared/eligibility.ts';
import type { Profile, Scheme } from '../_shared/eligibility.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const DEDUPE_DAYS = 14;
const DEADLINE_WINDOW_DAYS = 30;
const LAUNCH_WINDOW_DAYS = 7;
const PAGE_SIZE = 200;

type Finding = {
  user_id: string;
  scheme_id: string;
  notification_type: 'new_match' | 'deadline_soon' | 'newly_launched';
  change_summary: string;
};
type DigestScheme = Scheme & {
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

Deno.serve(async req => {
  if (req.method !== 'POST') return jsonResponse({ error: 'POST required' }, 405);
  try {
    const payload = await req.json().catch(() => ({}));
    const requestedUserId = payload.user_id as string | undefined;
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    const isServiceRole = Boolean(token && token === SUPABASE_SERVICE_ROLE_KEY);

    if (requestedUserId) {
      if (!token) return jsonResponse({ error: 'Authentication required' }, 401);
      if (!isServiceRole) {
        const { data, error } = await supabase.auth.getUser(token);
        if (error || data.user?.id !== requestedUserId) {
          return jsonResponse({ error: 'Not authorized for this user' }, 403);
        }
      }
      const result = await generateForUser(requestedUserId);
      return jsonResponse({ user_id: requestedUserId, ...result }, 200);
    }

    if (!isServiceRole) return jsonResponse({ error: 'Service role required for weekly run' }, 403);
    const { data: profiles, error } = await supabase.from('profiles').select('id').order('id');
    if (error) return jsonResponse({ error: error.message }, 500);

    let processed = 0;
    let failed = 0;
    let notificationsCreated = 0;
    for (const profile of profiles ?? []) {
      try {
        const result = await generateForUser(profile.id);
        processed++;
        notificationsCreated += result.notifications_created;
      } catch (error) {
        failed++;
        console.error(`Digest failed for user ${profile.id}:`, String(error));
      }
    }
    return jsonResponse({ processed, failed, notifications_created: notificationsCreated }, 200);
  } catch (error) {
    console.error('Awareness digest failed:', String(error));
    return jsonResponse({ error: String(error) }, 500);
  }
});

async function generateForUser(userId: string): Promise<{ notifications_created: number }> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, age, occupation_category, income_bracket, state, gender, social_category')
    .eq('id', userId)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) return { notifications_created: 0 };

  const { data: priorMatches, error: priorError } = await supabase
    .from('user_matches')
    .select('scheme_id')
    .eq('user_id', userId);
  if (priorError) throw priorError;
  const priorIds = new Set((priorMatches ?? []).map(row => row.scheme_id));

  // Reuse the production two-stage matcher. Snapshotting before and after gives
  // the set of schemes that have newly entered this user's eligible matches.
  const matchResponse = await fetch(`${SUPABASE_URL}/functions/v1/match-schemes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ user_id: userId }),
  });
  const matchBody = await matchResponse.json().catch(() => ({}));
  if (!matchResponse.ok) throw new Error(matchBody.error ?? `match-schemes returned ${matchResponse.status}`);

  const { data: currentMatches, error: currentError } = await supabase
    .from('user_matches')
    .select('scheme_id')
    .eq('user_id', userId);
  if (currentError) throw currentError;
  const currentIds = (currentMatches ?? []).map(row => row.scheme_id as string);
  const newlyMatchedIds = currentIds.filter(id => !priorIds.has(id));

  const findings: Finding[] = [];
  if (newlyMatchedIds.length > 0) {
    const { data: schemes, error } = await supabase
      .from('schemes')
      .select('id, title')
      .in('id', newlyMatchedIds);
    if (error) throw error;
    for (const scheme of schemes ?? []) {
      findings.push({
        user_id: userId,
        scheme_id: scheme.id,
        notification_type: 'new_match',
        change_summary: `You may now be eligible for ${scheme.title}.`,
      });
    }
  }

  // Active cached matches are the source for deadline alerts. In this codebase
  // no ingestion code declares a different canonical deadline key; prefer
  // metadata.application_deadline and accept the documented fallbacks below.
  if (currentIds.length > 0) {
    const { data: matchedSchemes, error } = await supabase
      .from('schemes')
      .select('id, title, status, metadata, eligibility_rules')
      .eq('status', 'active')
      .in('id', currentIds);
    if (error) throw error;
    const now = Date.now();
    const maxDeadline = now + DEADLINE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    for (const scheme of matchedSchemes ?? []) {
      const deadline = getApplicationDeadline(scheme.metadata, scheme.eligibility_rules);
      if (!deadline) continue;
      const time = Date.parse(deadline);
      if (Number.isNaN(time) || time < now || time > maxDeadline) continue;
      const formatted = new Date(time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
      findings.push({
        user_id: userId,
        scheme_id: scheme.id,
        notification_type: 'deadline_soon',
        change_summary: `Applications for ${scheme.title} close on ${formatted}.`,
      });
    }
  }

  // Newly launched schemes need not have an embedding or a user_matches row:
  // only stage-1 state and eligibility checks are applied here.
  const launchedAfter = new Date(Date.now() - LAUNCH_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: launchedSchemes, error: launchError } = await supabase
    .from('schemes')
    .select('id, title, description, benefit_summary, eligibility_rules, states, created_at, status')
    .eq('status', 'active')
    .gte('created_at', launchedAfter);
  if (launchError) throw launchError;
  for (const scheme of (launchedSchemes ?? []) as DigestScheme[]) {
    if (!stateIsSupported(profile as Profile, scheme.states)) continue;
    if (!checkEligibility(profile as Profile, scheme).passed) continue;
    findings.push({
      user_id: userId,
      scheme_id: scheme.id,
      notification_type: 'newly_launched',
      change_summary: `${scheme.title} was recently added and matches your profile.`,
    });
  }

  return { notifications_created: await insertUnduplicated(findings) };
}

function stateIsSupported(profile: Profile, states: string[] | null): boolean {
  return (states ?? []).some(state => normalize(state) === 'all' || Boolean(profile.state && normalize(state) === normalize(profile.state)));
}

function getApplicationDeadline(metadata: any, eligibilityRules: any): string | null {
  const value = metadata?.application_deadline
    ?? eligibilityRules?.application_deadline
    ?? eligibilityRules?.deadline
    ?? metadata?.deadline;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value && typeof value === 'object') {
    const nested = value.date ?? value.value ?? value.deadline;
    if (typeof nested === 'string' || typeof nested === 'number') return String(nested);
  }
  return null;
}

async function insertUnduplicated(findings: Finding[]): Promise<number> {
  if (findings.length === 0) return 0;
  const cutoff = new Date(Date.now() - DEDUPE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const schemeIds = [...new Set(findings.map(finding => finding.scheme_id))];
  const { data: recent, error } = await supabase
    .from('notifications')
    .select('scheme_id, notification_type')
    .eq('user_id', findings[0].user_id)
    .gte('created_at', cutoff)
    .in('scheme_id', schemeIds);
  if (error) throw error;
  const existing = new Set((recent ?? []).map(row => `${row.scheme_id}:${row.notification_type}`));
  const unique = new Map<string, Finding>();
  for (const finding of findings) {
    const key = `${finding.scheme_id}:${finding.notification_type}`;
    if (!existing.has(key)) unique.set(key, finding);
  }
  const rows = [...unique.values()];
  if (rows.length === 0) return 0;
  const { error: insertError } = await supabase.from('notifications').insert(rows);
  if (insertError) throw insertError;
  return rows.length;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}