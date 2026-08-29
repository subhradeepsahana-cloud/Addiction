// POST { text: string } -> DrinkExtractionResponse (see src/lib/validation.ts)
// Structured-output extraction, always validated client-side before saving.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { callOpenAI } from '../_shared/openai.ts';
import { DRINK_EXTRACTION_SYSTEM_PROMPT } from '../_shared/prompts.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string' || text.length > 500) {
      return jsonResponse({ error: 'Invalid input' }, 400);
    }

    const raw = await callOpenAI(
      [
        { role: 'system', content: DRINK_EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      { jsonMode: true, temperature: 0.2, maxTokens: 400 }
    );

    const parsed = JSON.parse(raw);
    return jsonResponse(parsed);
  } catch (e) {
    console.error('extract-drink error', e);
    return jsonResponse({ error: 'extraction_failed' }, 500);
  }
});
