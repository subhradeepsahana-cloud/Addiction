// POST { question: string } -> HealthAnswer (see src/lib/validation.ts)
// Retrieval-augmented: does a simple keyword search over health_articles,
// hands ONLY the matched excerpts to the model, and requires citations.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { callOpenAI } from '../_shared/openai.ts';
import { HEALTH_ASSISTANT_SYSTEM_PROMPT } from '../_shared/prompts.ts';
import { classifySafety } from '../_shared/safety.ts';
import { getAdminClient, getUserIdFromAuthHeader } from '../_shared/supabaseAdmin.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const userId = getUserIdFromAuthHeader(req);
    if (!userId) return jsonResponse({ error: 'unauthorized' }, 401);

    const { question } = await req.json();
    if (!question || typeof question !== 'string' || question.length > 500) {
      return jsonResponse({ error: 'Invalid input' }, 400);
    }

    const safety = classifySafety(question);
    const db = getAdminClient();
    if (safety.level !== 'none') {
      await db.from('safety_events').insert({
        user_id: userId,
        level: safety.level,
        category: safety.category,
        matched_signals: safety.matchedSignals,
        source_context: 'ai_chat',
        action_shown: 'health_assistant_intercept',
      });
      return jsonResponse({ error: 'safety_intercept' }, 200);
    }

    // Simple retrieval: full-text-ish match on topic/title/content via ilike.
    const keywords = question.toLowerCase().split(/\W+/).filter((w: string) => w.length > 3).slice(0, 5);
    let query = db.from('health_articles').select('id, title, topic, content, source_url, evidence_level, health_sources(name)').limit(4);
    if (keywords.length) {
      query = query.or(keywords.map((k: string) => `content.ilike.%${k}%,title.ilike.%${k}%,topic.ilike.%${k}%`).join(','));
    }
    const { data: articles } = await query;

    if (!articles || articles.length === 0) {
      return jsonResponse({
        answer:
          "I don't have a verified source covering that specific question yet. For general alcohol and health information, browse the Health & Science section, or speak with a doctor for anything about your individual situation.",
        citations: [],
        is_individual_medical_advice: false,
      });
    }

    const excerpts = articles
      .map((a: { id: string; title: string; content: string; source_url: string; health_sources: { name: string } | { name: string }[] | null }, i: number) => {
        const sourceName = Array.isArray(a.health_sources) ? a.health_sources[0]?.name : a.health_sources?.name;
        return `[${i + 1}] id=${a.id} title="${a.title}" source="${sourceName ?? 'Unknown'}" url=${a.source_url}\n${a.content}`;
      })
      .join('\n\n');

    const raw = await callOpenAI(
      [
        { role: 'system', content: HEALTH_ASSISTANT_SYSTEM_PROMPT },
        { role: 'user', content: `Retrieved excerpts:\n${excerpts}\n\nQuestion: ${question}` },
      ],
      { jsonMode: true, temperature: 0.3, maxTokens: 500 }
    );
    return jsonResponse(JSON.parse(raw));
  } catch (e) {
    console.error('health-assistant error', e);
    return jsonResponse({ error: 'answer_failed' }, 500);
  }
});
