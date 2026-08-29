// POST {} (auth'd) -> { ok: true }
// Deletes the caller's auth.users row; every user-data table cascades via
// `on delete cascade` foreign keys (see migrations), so this alone removes
// all of the user's data.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient, getUserIdFromAuthHeader } from '../_shared/supabaseAdmin.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const userId = getUserIdFromAuthHeader(req);
    if (!userId) return jsonResponse({ error: 'unauthorized' }, 401);
    const db = getAdminClient();
    const { error } = await db.auth.admin.deleteUser(userId);
    if (error) throw error;
    return jsonResponse({ ok: true });
  } catch (e) {
    console.error('delete-account error', e);
    return jsonResponse({ error: 'delete_failed' }, 500);
  }
});
