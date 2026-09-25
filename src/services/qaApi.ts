import { supabase } from './supabase';

export interface QaResult {
  id: string;
  answer: string;
  was_grounded: boolean;
  model_used: string;
  helpful: boolean | null;
}

export async function askSchemeQuestion(
  userId: string,
  schemeId: string,
  question: string
): Promise<QaResult> {
  const { data, error } = await supabase.functions.invoke('scheme-qa', {
    body: { user_id: userId, scheme_id: schemeId, question },
  });

  if (error) {
    const context = (error as Error & { context?: Response }).context;
    if (context) {
      try {
        const responseText = await context.clone().text();
        let payload: { error?: string } | null = null;
        try { payload = JSON.parse(responseText); } catch { /* The platform can return plain text for startup/deployment errors. */ }
        if (typeof payload?.error === 'string') {
          throw Object.assign(new Error(payload.error), { fromResponse: true });
        }
        if (responseText.trim()) {
          throw Object.assign(new Error(`Q&A service returned HTTP ${context.status}: ${responseText.slice(0, 400)}`), { fromResponse: true });
        }
      } catch (readError) {
        if (readError instanceof Error && (readError as Error & { fromResponse?: boolean }).fromResponse) throw readError;
      }
    }
    throw new Error(`${error.message || 'The Q&A service could not answer this question.'}${error instanceof Error && error.cause ? ` (${String(error.cause)})` : ''}`);
  }
  return data as QaResult;
}

export async function setQaHelpful(logId: string, helpful: boolean): Promise<void> {
  const { error } = await supabase
    .from('scheme_qa_log')
    .update({ helpful })
    .eq('id', logId);
  if (error) throw error;
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
