// Supabase Edge Function: public report loader.
// Calls the get_report RPC (validates token, records last_viewed_at) and adds a
// 1-hour signed URL for the client's logo from the private "logos" bucket.
// Deploy: supabase functions deploy report --no-verify-jwt
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { token } = (await req.json()) as { token?: string };
    if (!token || !/^[A-Za-z0-9_-]{24,128}$/.test(token)) {
      return Response.json(null, { headers: cors });
    }
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false },
    });
    const { data, error } = await admin.rpc('get_report', { p_token: token });
    if (error) throw error;
    if (!data) return Response.json(null, { headers: cors });
    const report = data as { client: { logo_path: string | null; logo_url: string | null } };
    if (report.client.logo_path) {
      const { data: signed } = await admin.storage.from('logos').createSignedUrl(report.client.logo_path, 3600);
      report.client.logo_url = signed?.signedUrl ?? null;
    }
    return Response.json(report, { headers: { ...cors, 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'internal' }, { status: 500, headers: cors });
  }
});
