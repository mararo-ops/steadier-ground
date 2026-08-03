// supabase/functions/mark-reviewed/index.ts
// Deploy with: supabase functions deploy mark-reviewed
// Requires secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Called by the partner's "mark reviewed" button in PartnerView.jsx

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { eventId } = await req.json();
    if (!eventId) {
      return new Response(JSON.stringify({ error: "Missing eventId" }), { status: 400 });
    }

    const { data: event, error: fetchError } = await supabase
      .from("flagged_events")
      .select("storage_path")
      .eq("id", eventId)
      .single();

    if (fetchError || !event) {
      return new Response(JSON.stringify({ error: "Event not found" }), { status: 404 });
    }

    // Hard delete the image from storage
    const { error: removeError } = await supabase.storage
      .from("flagged-images")
      .remove([event.storage_path]);

    if (removeError) {
      return new Response(JSON.stringify({ error: "Storage delete failed", detail: removeError.message }), { status: 500 });
    }

    // Hard delete the row itself rather than a soft-delete flag,
    // so nothing recoverable remains once reviewed
    const { error: deleteError } = await supabase
      .from("flagged_events")
      .delete()
      .eq("id", eventId);

    if (deleteError) {
      return new Response(JSON.stringify({ error: "Row delete failed", detail: deleteError.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
