import { supabase } from './supabase';

export interface QaResult {
  answer: string;
  was_grounded: boolean;
}

/**
 * STUB: build the `scheme-qa` Edge Function before this will succeed — see
 * README_SETUP.md. It should retrieve relevant chunks of the scheme's real
 * source text and answer strictly from that, falling back to
 * was_grounded: false when it can't find a confident answer.
 */
export async function askSchemeQuestion(
  userId: string,
  schemeId: string,
  question: string
): Promise<QaResult> {
  const { data, error } = await supabase.functions.invoke('scheme-qa', {
    body: { user_id: userId, scheme_id: schemeId, question },
  });

  if (error) throw error;
  return data as QaResult;
}

export async function getQaHistory(userId: string, schemeId: string) {
  const { data, error } = await supabase
    .from('scheme_qa_log')
    .select('*')
    .eq('user_id', userId)
    .eq('scheme_id', schemeId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}
