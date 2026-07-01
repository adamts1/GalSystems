import "dotenv/config";

// Fire a webhook to n8n announcing that a new campaign was created. We send only
// the campaign id — n8n fetches whatever else it needs from our API/Supabase.
//
// Fire-and-forget: callers do NOT await this in a way that blocks their response.
// A slow or down n8n must never fail a user's upload, so failures are logged only.
const WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

export function triggerCampaignWebhook(campaignId) {
  if (!WEBHOOK_URL) {
    console.warn("⚠  N8N_WEBHOOK_URL is not set — skipping n8n trigger.");
    return;
  }

  // Abort if n8n doesn't answer reasonably quickly so we don't leak sockets.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ campaignId }),
    signal: controller.signal,
  })
    .then((res) => {
      if (!res.ok) console.error(`✗ n8n webhook responded ${res.status} for campaign ${campaignId}`);
      else console.log(`✓ n8n webhook triggered for campaign ${campaignId}`);
    })
    .catch((err) => console.error(`✗ n8n webhook failed for campaign ${campaignId}:`, err.message))
    .finally(() => clearTimeout(timeout));
}
