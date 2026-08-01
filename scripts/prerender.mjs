/* Pre-renders the JavaScript-generated parts of the site into the HTML.
 *
 *   node scripts/prerender.mjs
 *
 * Why: index.html ships as a shell — the publication list, bio, profile links
 * and bookmarks are all injected at runtime by assets/site.js reading the
 * JSON. A crawler that does not execute JavaScript therefore sees a page with
 * none of the 19 publications on it. Google runs JS; Google Scholar largely
 * does not, and Scholar is the index that matters most here.
 *
 * How: rather than reimplementing the rendering in a second language (which
 * would drift from site.js), this loads each page in a real browser, lets
 * site.js do its work, then writes the resulting DOM back to disk. The pages
 * stay hand-editable — placeholders are refilled, not duplicated — and
 * site.js still runs client-side, harmlessly rewriting what is already there.
 *
 * Run before publishing; publish.ps1 does this automatically.
 */

import { createServer } from "http";
import { readFile, writeFile } from "fs/promises";
import { join, normalize, extname, dirname } from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

const ROOT = normalize(join(dirname(fileURLToPath(import.meta.url)), ".."));
const PORT = 8899;

const MIME = { ".html":"text/html; charset=utf-8", ".css":"text/css", ".js":"text/javascript",
  ".json":"application/json", ".jpg":"image/jpeg", ".png":"image/png", ".svg":"image/svg+xml",
  ".xml":"application/xml", ".txt":"text/plain" };

const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.endsWith("/")) p += "index.html";
    const file = normalize(join(ROOT, p));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    const buf = await readFile(file);
    res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
    res.end(buf);
  } catch { res.writeHead(404).end("not found"); }
});
await new Promise(r => server.listen(PORT, "127.0.0.1", r));

// Only pages whose content site.js builds. The articles/ pages are already
// static prose and need no pre-rendering.
const PAGES = ["index.html", "articles.html"];

const browser = await puppeteer.launch({ headless: true });
let failed = false;

for (const page of PAGES) {
  const tab = await browser.newPage();
  const errors = [];
  tab.on("pageerror", e => errors.push(String(e.message)));

  await tab.goto(`http://127.0.0.1:${PORT}/${page}`, { waitUntil: "networkidle0", timeout: 30000 });
  await tab.waitForSelector('body[data-ready="true"]', { timeout: 15000 })
    .catch(() => errors.push("site.js did not finish (body[data-ready] never set)"));

  if (errors.length) {
    console.error(`  ${page}: FAILED — ${errors.join("; ")}`);
    failed = true;
    await tab.close();
    continue;
  }

  const html = await tab.evaluate(() => {
    // The ready flag is set at runtime; leaving it in the file would make the
    // page look booted before site.js has actually run.
    delete document.body.dataset.ready;
    // Schema.org metadata is injected by site.js on every load, so a copy
    // saved into <head> would be duplicated on the next run.
    document.querySelectorAll('script[type="application/ld+json"]').forEach(n => n.remove());
    return "<!DOCTYPE html>\n" + document.documentElement.outerHTML + "\n";
  });

  const counts = await tab.evaluate(() => ({
    pubs: document.querySelectorAll(".pub").length,
    links: document.querySelectorAll("a[href]").length,
  }));

  await writeFile(join(ROOT, page), html, "utf8");
  console.log(`  ${page}: ${counts.pubs} publications, ${counts.links} links baked in`);
  await tab.close();
}

await browser.close();
server.close();

if (failed) { console.error("\nPre-render failed; HTML left unchanged for the failing page(s)."); process.exit(1); }
console.log("Pre-render complete.");
