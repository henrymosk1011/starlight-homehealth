// Accessibility check for every page, at desktop and phone widths.
// Runs axe-core against WCAG 2.0, 2.1 and 2.2 A and AA rules, and flags any page that scrolls sideways.
// Usage: npm install, npx playwright install chromium, then npm test
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const PAGES = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html")).sort();
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".png": "image/png" };

const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch();
let failures = 0;

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  // Start with animations paused so every section is visible when axe runs
  await context.addInitScript(() => {
    try { localStorage.setItem("sl-motion", "off"); } catch (e) { /* storage unavailable */ }
  });
  for (const name of PAGES) {
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + name, { waitUntil: "load" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    await page.addScriptTag({ content: AXE });
    const violations = await page.evaluate(async () => {
      const result = await window.axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] },
      });
      return result.violations.map((v) => ({ id: v.id, help: v.help, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) }));
    });
    const ok = violations.length === 0 && overflow <= 0 && errors.length === 0;
    if (!ok) failures++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${vp.name.padEnd(7)} ${name}`);
    for (const v of violations) console.log(`      ${v.id}: ${v.help}\n        ${v.targets.join("\n        ")}`);
    if (overflow > 0) console.log(`      page scrolls sideways by ${overflow}px`);
    for (const e of errors) console.log(`      script error: ${e}`);
    await page.close();
  }
  await context.close();
}

await browser.close();
server.close();
console.log(failures ? `\n${failures} check(s) failed` : "\nAll pages pass");
process.exit(failures ? 1 : 0);
