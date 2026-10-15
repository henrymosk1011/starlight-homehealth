# Starlight Home Health Services website

Multi page website for Starlight Home Health Services, a home health agency in Burbank, CA.

**Live site:** https://www.starlighthh.com

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home |
| `about.html` | About |
| `services.html` | Services |
| `patients.html` | Patients and Families |
| `referrals.html` | Referrals |
| `careers.html` | Careers |
| `contact.html` | Contact |
| `accessibility.html` | Accessibility statement |

Shared files: `styles.css`, `main.js`, and `assets/` for the logos and icons. `worker/` holds the contact form endpoint (see Contact form).

The contact page also loads `map.js`, Leaflet (`assets/leaflet/`) and the county outlines (`assets/service-area.js`) for its office and service area map. Map tiles come from OpenStreetMap.

## Preview locally

Run the local server, which serves pages without `.html` the same way GitHub Pages does:

```bash
npm run serve
```

Then visit http://localhost:8080. Links between pages leave off `.html` (for example `about`, `services#wound`, and `./` for home), so opening the files straight from disk will not follow them.

## Accessibility test

Checks every page against WCAG 2.2 AA with axe-core, at desktop and phone widths.

```bash
npm install
npx playwright install chromium
npm test
```

## Hosting

GitHub Pages serves the `main` branch from the repo root. Every push to `main` updates the live site within a minute or two.

The custom domain is set by the `CNAME` file (`www.starlighthh.com`). DNS is managed in the client's Wix account: `www` is a CNAME to `henrymosk1011.github.io`, and the bare domain has A records for GitHub Pages (185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153). Leave the MX and TXT records alone; they run the Google Workspace email.

### Cloudflare (set up, waiting on the domain move)

A Cloudflare zone for `starlighthh.com` is ready in the agency Cloudflare account, on the Free plan. It has the same records as Wix (web records proxied, email records DNS only, including the Resend records for `forms.starlighthh.com`), Full SSL, Always Use HTTPS, TLS 1.2 or newer, 301 redirects from the old Wix pages (`/services-2` to `services`, `/contact-us` to `contact`), and security headers that GitHub Pages cannot send (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`).

It goes live when the domain's nameservers change to `kira.ns.cloudflare.com` and `viddy.ns.cloudflare.com`. Wix does not allow nameserver changes on domains it registers, so the domain first moves to Namecheap (where `cyberx.la` is), with Wix DNSSEC turned off before the move. After that, DNS changes are made in Cloudflare, not Wix.

## Contact form

The contact form posts to a Cloudflare Worker, `starlight-contact`, at `https://starlight-contact.henrymm.workers.dev/contact` (agency Cloudflare account). The Worker checks the fields again, then emails the message to info@starlighthh.com through Resend, from `Starlight Website <website@forms.starlighthh.com>`. When the visitor gives an email, replying to the message answers them. The code is `worker/contact.js`, and its settings are in `worker/wrangler.toml`.

- **Privacy.** Resend is not HIPAA compliant and does not sign a Business Associate Agreement. The form asks visitors not to send medical details. The Worker stores nothing and logs only status codes, never form content. Resend open and click tracking are off, and TLS is required for delivery.
- **Abuse protection.** Only `https://www.starlighthh.com` and `https://starlighthh.com` may post (CORS and an `Origin` check). Each IP address gets 5 messages a minute. A hidden honeypot field (`c-website`) quietly drops bot posts, and requests over 16 KB are refused.
- **Sending domain.** `forms.starlighthh.com` is verified in the agency Resend account. Its records are in Wix DNS and in the waiting Cloudflare zone: TXT `resend._domainkey.forms`, MX and TXT `send.forms`, and CNAME `rsend.forms`. They sit on the `forms` subdomain, so the Google Workspace MX, SPF and verification records are untouched. Using a subdomain also means a leaked key cannot send as `@starlighthh.com`.
- **API key.** "starlighthh contact form worker" in Resend is sending only and limited to `forms.starlighthh.com`. It lives only in the Worker's encrypted secret `RESEND_API_KEY`. To rotate it, create a new key in Resend, run `npx wrangler secret put RESEND_API_KEY --config worker/wrangler.toml`, then delete the old key.
- **Deploying changes.** `npx wrangler deploy --config worker/wrangler.toml`.
- **Without JavaScript.** The form still posts to the Worker, which answers with a short confirmation or error page.

## Still to do

- Connect the referral form (`referrals.html`) to a form backend that signs a BAA, since referrals often carry health information. Until then it tells visitors the form is not connected and to call or email; remove that notice once it is.

Designed by TENELEVENMEDIA.
