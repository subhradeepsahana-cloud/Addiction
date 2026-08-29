// POST { conversationId: string|null, message: string, context: 'coach'|'craving' }
// -> { message: string, conversationId: string, safety: {level, category} }
//
// Assembles a MINIMAL user-context block (Section 15) — never the raw
// database — calls the model, persists the conversation, and returns the
// reply. Every safety-sensitive decision is backstopped by the
// deterministic classifier in _shared/safety.ts, which runs before the
// model is ever called.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { callOpenAI, type ChatMessage } from '../_shared/openai.ts';
import { COACH_SYSTEM_PROMPT } from '../_shared/prompts.ts';
import { classifySafety } from '../_shared/safety.ts';
import { getAdminClient, getUserIdFromAuthHeader } from '../_shared/supabaseAdmin.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const userId = getUserIdFromAuthHeader(req);
    if (!userId) return jsonResponse({ error: 'unauthorized' }, 401);

    const { conversationId, message, context } = await req.json();
    if (!message || typeof message !== 'string' || message.length > 2000) {
      return jsonResponse({ error: 'Invalid input' }, 400);
    }

    const safety = classifySafety(message);
    const db = getAdminClient();

    if (safety.level !== 'none') {
      await db.from('safety_events').insert({
        user_id: userId,
        level: safety.level,
        category: safety.category,
        matched_signals: safety.matchedSignals,
        source_context: 'ai_chat',
        action_shown: 'edge_function_intercept',
      });
      return jsonResponse({ message: '', conversationId: conversationId ?? '', safety: { level: safety.level, category: safety.category } });
    }

    // Minimal user-context block — a handful of aggregates, never raw rows.
    const [{ data: goalRows }, { data: checkins }, { data: recentCravings }, { data: triggers }] = await Promise.all([
      db.from('goals').select('goal_type').eq('user_id', userId).eq('is_active', true).limit(1),
      db.from('daily_checkins').select('mood, stress, craving').eq('user_id', userId).order('date', { ascending: false }).limit(5),
      db.from('cravings').select('outcome').eq('user_id', userId).order('started_at', { ascending: false }).limit(30),
      db.from('user_triggers').select('tag').eq('user_id', userId).limit(5),
    ]);

    const avg = (nums: number[]) => (nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null);
    const resistedCount = (recentCravings ?? []).filter((c: { outcome: string | null }) => c.outcome === 'resisted').length;

    const contextBlock = [
      `Goal: ${goalRows?.[0]?.goal_type ?? 'not set'}`,
      `Recent avg mood/stress/craving (last 5 check-ins): ${avg((checkins ?? []).map((c: { mood: number | null }) => c.mood).filter((n: number | null): n is number => n != null))}/${avg((checkins ?? []).map((c: { stress: number | null }) => c.stress).filter((n: number | null): n is number => n != null))}/${avg((checkins ?? []).map((c: { craving: number | null }) => c.craving).filter((n: number | null): n is number => n != null))}`,
      `Cravings resisted recently: ${resistedCount}`,
      `Known triggers: ${(triggers ?? []).map((t: { tag: string }) => t.tag).join(', ') || 'none recorded'}`,
      `Session context: ${context === 'craving' ? 'user is actively in Craving Mode right now' : 'general coaching chat'}`,
    ].join('\n');

    let convoId = conversationId as string | null;
    if (!convoId) {
      const { data: convo } = await db
        .from('ai_conversations')
        .insert({ user_id: userId, context: context === 'craving' ? 'craving' : 'coach' })
        .select('id')
        .single();
      convoId = convo?.id ?? null;
    }

    let history: ChatMessage[] = [];
    if (convoId) {
      const { data: past } = await db
        .from('ai_messages')
        .select('role, content')
        .eq('conversation_id', convoId)
        .order('created_at', { ascending: false })
        .limit(6);
      history = (past ?? []).reverse().map((m: { role: string; content: string }) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: COACH_SYSTEM_PROMPT },
      { role: 'system', content: `USER CONTEXT\n${contextBlock}` },
      ...history,
      { role: 'user', content: message },
    ];

    const reply = await callOpenAI(messages, { temperature: 0.6, maxTokens: 300 });

    if (convoId) {
      await db.from('ai_messages').insert([
        { conversation_id: convoId, user_id: userId, role: 'user', content: message },
        { conversation_id: convoId, user_id: userId, role: 'assistant', content: reply },
      ]);
      await db.from('ai_conversations').update({ last_message_at: new Date().toISOString() }).eq('id', convoId);
    }

    return jsonResponse({ message: reply, conversationId: convoId ?? '', safety: { level: 'none', category: 'none' } });
  } catch (e) {
    console.error('ai-coach error', e);
    return jsonResponse({ error: 'coach_failed' }, 500);
  }
});
