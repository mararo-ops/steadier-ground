// supabase/functions/create-flag/index.ts
// Deploy with: supabase functions deploy create-flag
// Requires secrets: SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL, BREVO_API_KEY, BREVO_SENDER_EMAIL, APP_URL
// Called by the browser extension when detection fires (not by the frontend site directly)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
const BREVO_SENDER_EMAIL = Deno.env.get("BREVO_SENDER_EMAIL") ?? "";
const APP_URL = Deno.env.get("APP_URL") ?? "https://steadierground.app";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // imageBase64: the flagged screenshot, base64-encoded, sent from the extension
    const { ownerId, partnershipId, imageBase64, searchTerm, domain } = await req.json();

    if (!ownerId || !partnershipId || !imageBase64) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const storagePath = `${ownerId}/${crypto.randomUUID()}.jpg`;
    const bytes = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));

    const { error: uploadError } = await supabase.storage
      .from("flagged-images")
      .upload(storagePath, bytes, { contentType: "image/jpeg" });

    if (uploadError) {
      return new Response(JSON.stringify({ error: "Upload failed", detail: uploadError.message }), { status: 500 });
    }

    const { data: eventRow, error: insertError } = await supabase
      .from("flagged_events")
      .insert({ partnership_id: partnershipId, owner_id: ownerId, storage_path: storagePath, search_term: searchTerm, domain })
      .select()
      .single();

    if (insertError) {
      return new Response(JSON.stringify({ error: "Insert failed", detail: insertError.message }), { status: 500 });
    }

    // Look up partner email + owner name to notify
    const { data: partnership } = await supabase
      .from("partnerships")
      .select("partner_email, partner_name, owner_id, profiles!partnerships_owner_id_fkey(first_name)")
      .eq("id", partnershipId)
      .single();

    if (partnership?.partner_email) {
      const reviewUrl = `${APP_URL}/partner-view/${eventRow.id}`;
      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": BREVO_API_KEY },
        body: JSON.stringify({
          sender: { email: BREVO_SENDER_EMAIL, name: "Steadier Ground" },
          to: [{ email: partnership.partner_email, name: partnership.partner_name }],
          subject: "A moment was flagged",
          htmlContent: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1B2430;">
              <p>A moment was flagged for review.</p>
              <p style="margin: 24px 0;">
                <a href="${reviewUrl}" style="background: #16283A; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none;">Review now</a>
              </p>
              <p style="font-size: 13px; color: #5B6570;">This link expires once you mark it reviewed, and the content is deleted permanently at that point.</p>
            </div>
          `,
        }),
      });
    }

    return new Response(JSON.stringify({ success: true, eventId: eventRow.id }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
