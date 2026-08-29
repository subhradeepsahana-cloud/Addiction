// POST { trigger, patternSummary, hasPattern, whatHappened?, whereWasIt?, wasPlanned? }
// -> { summary: string, suggestion: string }
// Numbers/pattern facts are computed deterministically client-side
// (src/lib/patterns.ts findSlipPattern) and passed in — the model only
// narrates, it never invents the pattern itself.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { callOpenAI } from '../_shared/openai.ts';
import { SLIP_ANALYSIS_SYSTEM_PROMPT } from '../_shared/prompts.ts';
import { getUserIdFromAuthHeader } from '../_shared/supabaseAdmin.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const userId = getUserIdFromAuthHeader(req);
    if (!userId) return jsonResponse({ error: 'unauthorized' }, 401);

    const body = await req.json();
    const facts = JSON.stringify(body).slice(0, 1000);

    const raw = await callOpenAI(
      [
        { role: 'system', content: SLIP_ANALYSIS_SYSTEM_PROMPT },
        { role: 'user', content: `Facts (JSON, use only these — do not invent anything else): ${facts}` },
      ],
      { jsonMode: true, temperature: 0.4, maxTokens: 300 }
    );
    return jsonResponse(JSON.parse(raw));
  } catch (e) {
    console.error('slip-analysis error', e);
    return jsonResponse({ error: 'analysis_failed' }, 500);
  }
});
