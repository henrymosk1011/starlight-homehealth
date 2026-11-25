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

Shared files: `styles.css`, `main.js`, and `assets/` for the logos and icons. `worker/` holds the old contact form Worker, the backup route while the form switches to FormSubmit (see Contact form).

The contact page shows the office on an embedded Google map.

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

The contact form sends through [FormSubmit](https://formsubmit.co), which emails each message to info@starlighthh.com as a table. `main.js` checks the fields, then posts the message from the visitor's browser to `https://formsubmit.co/ajax/info@starlighthh.com` (the form's `data-relay` address). FormSubmit refuses posts from servers, so this has to happen in the browser. When the visitor gives an email, replying to the message answers them (FormSubmit uses the field named `email` as Reply To).

- **Activation.** The first message makes FormSubmit send an "Activate Form" email to info@starlighthh.com. Nothing is delivered through FormSubmit until someone clicks the link in it (check spam). A new address in `data-relay` needs activating again.
- **Backup route.** While `data-fallback` is set on the form, a message FormSubmit does not take goes to the old Worker below instead. It is there for the switch over only: once FormSubmit is activated and `forms.starlighthh.com` leaves Resend, the Worker can no longer send, so remove `data-fallback`. Without either, the form says the message was not sent and gives the phone number and email.
- **Privacy.** FormSubmit is not HIPAA compliant and does not sign a Business Associate Agreement; the owner chose it on 25 November 2026 with that known. The form asks visitors not to send medical details. Keep that hint.
- **Abuse protection.** A hidden honeypot field (`_honey`, which FormSubmit also honors) quietly drops bot posts. FormSubmit's own captcha page is off (`_captcha` is `false`).
- **Without JavaScript.** The form posts straight to FormSubmit (the form's `action`), which shows its own thank you page.

### The old Worker

Until 25 November 2026 the form posted to a Cloudflare Worker, `starlight-contact`, at `https://starlight-contact.henrymm.workers.dev/contact` (agency Cloudflare account), which emailed the message through Resend from `Starlight Website <website@forms.starlighthh.com>`. It stays in `worker/` (code `worker/contact.js`, settings `worker/wrangler.toml`) as the backup route during the switch. Once `forms.starlighthh.com` is removed from Resend it can no longer send; to take it off Cloudflare then: `npx wrangler delete --config worker/wrangler.toml`.

- The Resend records for `forms.starlighthh.com` (TXT `resend._domainkey.forms`, MX and TXT `send.forms`, CNAME `rsend.forms`) are in Wix DNS and the waiting Cloudflare zone. They can be deleted once the domain leaves Resend; the Google Workspace records stay.

## Still to do

- Connect the referral form (`referrals.html`) to a form backend that signs a BAA, since referrals often carry health information. Until then it tells visitors the form is not connected and to call or email; remove that notice once it is.

Designed by TENELEVENMEDIA.
