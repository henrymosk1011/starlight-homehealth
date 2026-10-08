# Starlight Home Health Services website

Multi page website for Starlight Home Health Services, a home health agency in Burbank, CA.

**Live preview:** https://henrymosk1011.github.io/starlight-homehealth/

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

Shared files: `styles.css`, `main.js`, and `assets/` for the logos and icons.

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

## Before launch

- Remove the `<meta name="robots" content="noindex, nofollow">` line from every page so search engines can index the site
- Connect both forms (`contact.html` and `referrals.html`) to a form backend
- Point the custom domain at GitHub Pages

Designed by TENELEVENMEDIA.
