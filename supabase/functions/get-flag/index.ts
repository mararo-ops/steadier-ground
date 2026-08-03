// supabase/functions/get-flag/index.ts
// Deploy with: supabase functions deploy get-flag
// Requires secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Returns a signed URL valid for 60 seconds so the partner can view the image without
// the storage bucket ever being publicly readable.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { eventId } = await req.json();

  if (!eventId) {
    return new Response(JSON.stringify({ error: "Missing eventId" }), { status: 400 });
  }

  const { data: event, error } = await supabase
    .from("flagged_events")
    .select("storage_path, search_term, domain, created_at")
    .eq("id", eventId)
    .single();

  if (error || !event) {
    return new Response(JSON.stringify({ error: "Event not found or already reviewed" }), { status: 404 });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("flagged-images")
    .createSignedUrl(event.storage_path, 60);

  if (signError) {
    return new Response(JSON.stringify({ error: "Could not sign URL" }), { status: 500 });
  }

  return new Response(JSON.stringify({
    imageUrl: signed.signedUrl,
    searchTerm: event.search_term,
    domain: event.domain,
    createdAt: event.created_at,
  }), { headers: { "Content-Type": "application/json" } });
});
