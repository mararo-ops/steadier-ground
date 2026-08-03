// supabase/functions/send-invite/index.ts
// Deploy with: supabase functions deploy send-invite
// Requires secrets: BREVO_API_KEY, BREVO_SENDER_EMAIL (set via supabase secrets set)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
const BREVO_SENDER_EMAIL = Deno.env.get("BREVO_SENDER_EMAIL") ?? "";
const APP_URL = Deno.env.get("APP_URL") ?? "https://steadierground.app";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { ownerName, partnerName, partnerEmail, partnershipId } = await req.json();

    if (!partnerEmail || !ownerName || !partnershipId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const acceptUrl = `${APP_URL}/accept-invite/${partnershipId}`;

    const emailBody = {
      sender: { email: BREVO_SENDER_EMAIL, name: "Steadier Ground" },
      to: [{ email: partnerEmail, name: partnerName || "" }],
      subject: `${ownerName} has invited you to be their accountability partner`,
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1B2430;">
          <h2 style="color: #16283A;">${ownerName} wants you as their accountability partner</h2>
          <p>This means you may occasionally receive a flagged screenshot and search term if ${ownerName}'s browsing crosses a line they've asked you to help watch for.</p>
          <p>Nothing is stored permanently. Anything sent to you is deleted from our servers the moment you mark it reviewed.</p>
          <p style="margin: 24px 0;">
            <a href="${acceptUrl}" style="background: #16283A; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none;">Review and accept</a>
          </p>
          <p style="font-size: 13px; color: #5B6570;">If you weren't expecting this, you can safely ignore this email.</p>
        </div>
      `,
    };

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify(emailBody),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: "Brevo send failed", detail: errText }), { status: 502 });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
