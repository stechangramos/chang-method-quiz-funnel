// Cloudflare Pages Function — server-side proxy for lead capture.
// Keeps the shared crm_capture_key off the client. The quiz's browser JS
// only ever talks to this same-origin route; this function is the only
// place that holds and sends the real header, from a Pages secret
// (env.CRM_CAPTURE_KEY), never committed to the repo.

const CAPTURE_ENDPOINT = "https://backend.schangramos.com/api/crm/capture";

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
  }

  const upstream = await fetch(CAPTURE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-capture-key": env.CRM_CAPTURE_KEY,
    },
    body: JSON.stringify(body),
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
