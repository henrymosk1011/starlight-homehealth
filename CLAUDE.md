# Starlight Home Health Services website

Static multi page site for Starlight Home Health Services (Burbank, CA), a client of cyberXLA. Plain HTML, CSS and JavaScript. No build step and no framework. Hosted on GitHub Pages from the `main` branch root.

## Top priority: accessibility

Full WCAG 2.2 Level AA compliance is the most important requirement. Every change must keep it.

- Run `npm test` after any change. All 16 checks (8 pages at desktop and mobile) must pass.
- Also confirm by hand: keyboard only use, visible focus, 320px width with no sideways scroll, 200 percent text size.
- Keep the patterns already in place:
  - Skip link, landmarks (`header`, `nav`, `main`, `footer`, the top bar `aside`), and one `h1` per page.
  - Animated headlines use a visually hidden plain sentence (`.sr-only`) plus an `aria-hidden` animated copy (`.split`). Keep both in sync.
  - Decorative SVG, stars, the hero art, the hero chips and the service ticker are `aria-hidden="true"`.
  - Scroll reveals (`data-reveal`) only hide content below the first screen, and only when motion is on. Content must be readable with JavaScript off.
  - Put `data-reveal` on a wrapper `div`, never on a text element like `p` or `h2`. WAVE reads text that is itself at opacity 0 as a contrast error.
  - The "Pause animations" switch (`.motion-toggle`, `aria-pressed`) and `prefers-reduced-motion` must stop all motion. New animations go under `html.motion-on` so `html.motion-off` stops them.
  - Animated stat counters are `aria-hidden` with a `.sr-only` final value next to them.
  - Forms: every field has a visible label, "(required)" or "(optional)" text, and hints tied with `aria-describedby`. Validation is in `main.js` (`data-validate`, `data-label`, `data-error`), with an error summary that takes focus and inline errors tied to each field.
  - Touch targets are at least 24 by 24 px. Most controls are 44 px or more.
- Colors come from the tokens at the top of `styles.css`. Body text must stay at 4.5:1 contrast or higher. `--gold` is never used for text on white; it fails contrast there.

## Writing rules

- Never use em dashes, en dashes, double hyphens, or hyphens as dashes in page copy, attributes or code comments. Use commas, colons, semicolons or rewrite the sentence.
- Copy is based on the client's current site, starlighthh.com.
- Canonical contact details (use these exact values everywhere):
  - Phone (818) 849-6044, link `tel:+18188496044`
  - Fax (844) 269-6817
  - Email info@starlighthh.com
  - 220 N Glenoaks Blvd, Suite C, Burbank, CA 91502
  - Monday to Friday, 9 am to 5 pm; Saturday and Sunday on call
  - Service area: Los Angeles, Orange, Ventura and San Bernardino counties
- Footer credit stays "Designed by TENELEVENMEDIA" linking to http://www.tenelevenmedia.com.

## Structure

- The top bar, header, footer and closing CTA band are repeated in all 8 HTML files. When you change one, change all 8 the same way.
- The current page link in the main nav gets `aria-current="page"`.
- Internal links leave off `.html` (`about`, `services#wound`); home links use `./`. GitHub Pages serves them as clean URLs, and `npm run serve` does the same locally.
- Each page has a unique `<title>` in the form "Page | Starlight Home Health Services" (the home page is just the business name).
- Design tokens (color, type scale, easing) live in `:root` at the top of `styles.css`.
- Fonts: Instrument Serif (display) and Figtree (body) from Google Fonts.

## Open items

- `noindex, nofollow` meta tag is on every page while this is a staging copy. Remove it at launch.
- Forms do not send anything yet. Connect a HIPAA appropriate form service. The forms ask visitors not to send health information; keep that.
- Client to confirm: office hours (their old contact page says 5:30 pm), Careers page copy and role list.
- Client site has 3 testimonials not yet used. Adding them needs a new section.
- Real screen reader pass (VoiceOver, NVDA) still to do.

## Workflow

- For bug reports: diagnose and explain first, then ask "Do you want me to make those changes?" and wait before editing, so changes can be batched.
- Keep replies short and skimmable.
