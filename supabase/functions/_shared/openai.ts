// Minimal OpenAI Chat Completions client for Deno Edge Functions. Uses raw
// fetch (no SDK dependency) so functions stay small and cold-start fast.
// The API key is read server-side only — it is never sent to the client.

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface CallOptions {
  model?: string;
  jsonMode?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export async function callOpenAI(messages: ChatMessage[], options: CallOptions = {}): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');

  const model = options.model ?? Deno.env.get('OPENAI_CHAT_MODEL') ?? 'gpt-4o-mini';

  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.5,
      max_tokens: options.maxTokens ?? 500,
      ...(options.jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('OpenAI response missing content');
  return content;
}
