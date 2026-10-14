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

Shared files: `styles.css`, `main.js`, and `assets/` for the logos and icons.

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

## Still to do

- Connect both forms (`contact.html` and `referrals.html`) to a form backend. Until then, both forms tell visitors the form is not connected and to call or email; remove those notices once it is.

Designed by TENELEVENMEDIA.
