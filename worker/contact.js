/* Starlight Home Health Services: contact form endpoint (Cloudflare Worker).
   Receives the contact form from www.starlighthh.com and emails it to the office through Resend.

   Settings (Worker variables): ALLOWED_ORIGINS, CONTACT_FROM, CONTACT_TO, SITE_URL.
   Secret: RESEND_API_KEY, a sending access key limited to forms.starlighthh.com.
   Binding: CONTACT_LIMITER, a rate limit per visitor IP address.

   Nothing from the form is logged or stored here. Logs only hold status codes. */

const ROLES = ["Patient", "Family member or caregiver", "Physician or facility", "Job seeker"];
const MAX_BODY = 16384;
const MAX = { name: 120, phone: 40, email: 254, message: 4000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_LINK = '<a href="tel:+18188496044">(818) 849-6044</a>';
const EMAIL_LINK = '<a href="mailto:info@starlighthh.com">info@starlighthh.com</a>';

const BASE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    const originOk = allowed.includes(origin);
    const cors = originOk ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : { Vary: "Origin" };

    if (url.pathname !== "/contact") return json({ ok: false, error: "not_found" }, 404, cors);

    if (request.method === "OPTIONS") {
      if (!originOk) return new Response(null, { status: 403, headers: { ...BASE_HEADERS, ...cors } });
      return new Response(null, {
        status: 204,
        headers: {
          ...BASE_HEADERS,
          ...cors,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }
    if (request.method !== "POST") {
      return json({ ok: false, error: "method_not_allowed" }, 405, { ...cors, Allow: "POST, OPTIONS" });
    }

    const type = (request.headers.get("Content-Type") || "").toLowerCase();
    const isJson = type.startsWith("application/json");
    const isForm = type.startsWith("application/x-www-form-urlencoded");
    /* Fetch requests from main.js send JSON. A plain form post (scripts off) gets a short HTML page back. */
    const reply = (status, body) => (isJson ? json(body, status, cors) : page(status, body, env));

    if (!originOk) {
      console.error("contact: blocked origin");
      return reply(403, { ok: false, error: "forbidden" });
    }
    if (!isJson && !isForm) return reply(415, { ok: false, error: "unsupported_type" });

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    if (env.CONTACT_LIMITER) {
      const { success } = await env.CONTACT_LIMITER.limit({ key: ip });
      if (!success) {
        console.error("contact: rate limited");
        return reply(429, { ok: false, error: "rate_limited" });
      }
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY) return reply(413, { ok: false, error: "too_large" });

    let data;
    try {
      data = isJson ? JSON.parse(raw) : Object.fromEntries(new URLSearchParams(raw));
    } catch (e) {
      return reply(400, { ok: false, error: "bad_request" });
    }
    if (!data || typeof data !== "object") return reply(400, { ok: false, error: "bad_request" });

    /* Hidden honeypot field. People never see it; bots that fill every field do. Pretend it worked. */
    if (clean(data["c-website"], 200)) return reply(200, { ok: true });

    const fields = {
      name: clean(data["c-name"], MAX.name),
      phone: clean(data["c-phone"], MAX.phone),
      email: clean(data["c-email"], MAX.email),
      role: clean(data["c-role"], 60),
      message: clean(data["c-message"], MAX.message, true),
    };
    const problems = [];
    if (!fields.name) problems.push("Enter your full name.");
    if (fields.phone.replace(/\D/g, "").length < 10) problems.push("Enter a 10 digit phone number with area code.");
    if (fields.email && !EMAIL_RE.test(fields.email)) problems.push("Enter an email address in the format name@example.com.");
    if (!ROLES.includes(fields.role)) problems.push("Choose the option that describes you.");
    if (problems.length) return reply(422, { ok: false, error: "invalid", problems });

    const sent = await sendEmail(fields, env);
    if (!sent) return reply(502, { ok: false, error: "send_failed" });
    return reply(200, { ok: true });
  },
};

/* Text only, trimmed and capped. Control characters go; line breaks stay only in the message. */
function clean(value, max, multiline) {
  if (typeof value !== "string") return "";
  const pattern = multiline ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g : /[\u0000-\u001F\u007F]+/g;
  return value.replace(pattern, multiline ? "" : " ").trim().slice(0, max);
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

async function sendEmail(f, env) {
  if (!env.RESEND_API_KEY || !env.CONTACT_FROM || !env.CONTACT_TO) {
    console.error("contact: missing settings");
    return false;
  }
  const rows = [
    ["Name", f.name],
    ["Phone", f.phone],
    ["Email", f.email || "Not given"],
    ["I am a", f.role],
  ];
  const message = f.message || "No message.";
  const followUp = f.email
    ? "Reply to this email to answer by email, or call the phone number above."
    : "No email was given, so please call the phone number above.";
  const text = [
    "New message from the contact form on starlighthh.com.",
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    "How can we help?",
    message,
    "",
    followUp,
  ].join("\n");
  const html = `<div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #1a1a2e">
<p>New message from the contact form on starlighthh.com.</p>
<table cellpadding="6" cellspacing="0" style="border-collapse: collapse">
${rows.map(([k, v]) => `<tr><th align="left" style="padding-right: 16px">${k}</th><td>${escapeHtml(v)}</td></tr>`).join("\n")}
</table>
<p><strong>How can we help?</strong><br>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
<p style="color: #555">${followUp}</p>
</div>`;

  const body = {
    from: env.CONTACT_FROM,
    to: [env.CONTACT_TO],
    subject: `New website message from a ${f.role.toLowerCase()}`,
    text,
    html,
  };
  if (f.email) body.reply_to = f.email;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error("contact: Resend returned", res.status);
      return false;
    }
    return true;
  } catch (e) {
    console.error("contact: Resend request failed", e.name);
    return false;
  }
}

function json(body, status, extra) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...BASE_HEADERS, ...extra, "Content-Type": "application/json; charset=utf-8" },
  });
}

/* Short confirmation or error page for form posts sent with scripts off */
function page(status, body, env) {
  const site = env.SITE_URL || "https://www.starlighthh.com";
  let title, heading, content;
  if (body.ok) {
    title = "Message sent";
    heading = "Thank you, your message was sent.";
    content = `<p>Our team will reach out during business hours, Monday to Friday, 9 am to 5 pm. If you need help sooner, call ${PHONE_LINK}.</p>`;
  } else if (body.problems) {
    title = "Message not sent";
    heading = "Your message was not sent yet.";
    content = `<p>Please use your browser's Back button to return to the form and fix the following:</p>
<ul>${body.problems.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>`;
  } else {
    title = "Message not sent";
    heading = "Sorry, your message was not sent.";
    content = `<p>Please call us at ${PHONE_LINK} or email ${EMAIL_LINK}. We answer Monday to Friday, 9 am to 5 pm.</p>`;
  }
  const htmlPage = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title} | Starlight Home Health Services</title>
<style>
body { margin: 0; font: 1.125rem/1.6 system-ui, sans-serif; color: #14163a; background: #fff; }
main { max-width: 40rem; margin: 0 auto; padding: 3rem 1rem; }
h1 { font-size: 1.75rem; line-height: 1.25; }
a { color: #3b2f8f; text-underline-offset: 0.15em; }
a:focus-visible { outline: 3px solid #14163a; outline-offset: 3px; }
</style>
</head>
<body>
<main>
<h1>${heading}</h1>
${content}
<p><a href="${site}/contact">Back to Starlight Home Health Services</a></p>
</main>
</body>
</html>`;
  return new Response(htmlPage, {
    status,
    headers: {
      ...BASE_HEADERS,
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    },
  });
}
