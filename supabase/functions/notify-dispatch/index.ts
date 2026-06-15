// Supabase Edge Function: notify-dispatch
// ----------------------------------------------------------------------------
// Delivers queued notifications through external channels (email/SMS/etc.).
//
// In-app notifications are written directly by the database (app.notify) and
// marked 'sent' immediately. External channels are decoupled: rows inserted
// with channel <> 'in_app' and status 'queued' are picked up here and
// delivered, then marked 'sent' or 'failed'.
//
// Trigger this function on a schedule with pg_cron + pg_net, e.g.:
//   select cron.schedule('notify-dispatch','* * * * *',
//     $$ select net.http_post(
//          url := 'https://<ref>.functions.supabase.co/notify-dispatch',
//          headers := jsonb_build_object('Authorization','Bearer '||current_setting('app.cron_secret'))
//        ); $$);
//
// Deploy:  supabase functions deploy notify-dispatch
// Secrets: supabase secrets set RESEND_API_KEY=... (or your provider)
// ----------------------------------------------------------------------------

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// Service role is required so the dispatcher can read/update any user's queue.
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EMAIL_API_KEY = Deno.env.get("RESEND_API_KEY");

interface QueuedNotification {
  id: string;
  user_id: string;
  type: string;
  channel: string;
  message: string | null;
}

async function sendEmail(to: string, subject: string, body: string) {
  if (!EMAIL_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping real send (dry run).");
    return true;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${EMAIL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "SPMS <notifications@your-domain.com>",
      to,
      subject,
      text: body,
    }),
  });
  return res.ok;
}

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Pull a batch of queued external notifications.
  const { data: queued, error } = await supabase
    .from("notifications")
    .select("id, user_id, type, channel, message")
    .neq("channel", "in_app")
    .eq("status", "queued")
    .limit(50);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  let sent = 0;
  let failed = 0;

  for (const n of (queued ?? []) as QueuedNotification[]) {
    const { data: profile } = await supabase
      .from("users")
      .select("email")
      .eq("id", n.user_id)
      .single();

    let ok = false;
    try {
      if (n.channel === "email" && profile?.email) {
        ok = await sendEmail(profile.email, `SPMS: ${n.type}`, n.message ?? "");
      } else {
        // SMS / WhatsApp / Slack providers would plug in here.
        console.log(`No handler for channel '${n.channel}' yet.`);
        ok = true;
      }
    } catch (e) {
      console.error("dispatch error", e);
      ok = false;
    }

    await supabase
      .from("notifications")
      .update({
        status: ok ? "sent" : "failed",
        sent_at: ok ? new Date().toISOString() : null,
      })
      .eq("id", n.id);

    ok ? sent++ : failed++;
  }

  return new Response(JSON.stringify({ processed: (queued ?? []).length, sent, failed }), {
    headers: { "Content-Type": "application/json" },
  });
});
