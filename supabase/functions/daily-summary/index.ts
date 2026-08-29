// POST {} (auth'd) -> { text: string }
// Generates one short daily narrative from today's structured data only.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { callOpenAI } from '../_shared/openai.ts';
import { DAILY_SUMMARY_SYSTEM_PROMPT } from '../_shared/prompts.ts';
import { getAdminClient, getUserIdFromAuthHeader } from '../_shared/supabaseAdmin.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const userId = getUserIdFromAuthHeader(req);
    if (!userId) return jsonResponse({ error: 'unauthorized' }, 401);

    const db = getAdminClient();
    const today = new Date().toISOString().slice(0, 10);
    const [{ data: checkin }, { data: cravings }, { data: drinks }] = await Promise.all([
      db.from('daily_checkins').select('mood, stress, craving, drank_alcohol').eq('user_id', userId).eq('date', today).maybeSingle(),
      db.from('cravings').select('outcome').eq('user_id', userId).gte('started_at', `${today}T00:00:00`),
      db.from('drinking_events').select('standard_drinks').eq('user_id', userId).gte('occurred_at', `${today}T00:00:00`),
    ]);

    const facts = {
      checkin: checkin ?? null,
      cravings_today: (cravings ?? []).length,
      cravings_resisted: (cravings ?? []).filter((c: { outcome: string | null }) => c.outcome === 'resisted').length,
      drinks_today: (drinks ?? []).length,
    };

    const raw = await callOpenAI(
      [
        { role: 'system', content: DAILY_SUMMARY_SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(facts) },
      ],
      { jsonMode: true, temperature: 0.5, maxTokens: 150 }
    );
    return jsonResponse(JSON.parse(raw));
  } catch (e) {
    console.error('daily-summary error', e);
    return jsonResponse({ error: 'summary_failed' }, 500);
  }
});
