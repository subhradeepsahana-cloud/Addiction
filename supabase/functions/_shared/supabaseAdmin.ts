import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Service-role client for Edge Functions. Bypasses RLS — only ever used
// server-side, scoped to exactly the rows the authenticated caller (identified
// via the request's JWT, verified by the Supabase platform before invocation)
// is allowed to touch, using explicit user_id filters in every query.
export function getAdminClient() {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(url, key);
}

export function getUserIdFromAuthHeader(req: Request): string | null {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
