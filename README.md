# Wenzhe Li — academic website

Static site. No build step, no dependencies, no framework. Plain HTML, one
stylesheet, one script, and two JSON data files.

Mirrors the original Google Site's structure:

```
index.html            Home — bio, research areas, ALL publications
                      (filterable, BibTeX), news, about, bookmarks.
                      Ctrl+P prints it as a clean CV.
articles.html         Index of the three articles
articles/
  tsinghua-12-years.html      我在清华大学求学十二年 (full text)
  wudaokou-interview.html     Wudaokou alumni interview (full text)
  money-perspectives.html     Money essay, English (full text)
  money-perspectives-cn.html  货币的形态演变和三个层次 (full text)
running.html          Running — original text + all 9 photos

data/site.json        ← YOU EDIT: bio, affiliations, links, news, articles
data/publications.json ← YOU EDIT: every paper

assets/style.css      All styling (light + dark + print)
assets/site.js        Renders the pages from the JSON
assets/portrait.jpg   Your photo (auto-resized web copy)
assets/running/       The 9 running photos, migrated from Google Sites
scripts/prepare-running-photos.ps1
                      Creates web-safe running photos from local originals
```

---

## 1. Preview it locally

`fetch()` does not work over `file://`, so **do not** just double-click
`index.html` — you need a tiny local server. Pick whichever you have:

```powershell
# Python (most likely already installed)
cd c:\WenzheFiles\Academy\Website
python -m http.server 8000
```

```powershell
# Node
npx serve .
```

Then open <http://localhost:8000>.

If you have VS Code, the **Live Server** extension does the same thing with a
right-click → "Open with Live Server".

---

## 2. Adding a publication

Open `data/publications.json`, copy an existing entry, and edit it. That's the
only file you touch — the homepage, publications page and CV all update.

```json
{
  "id": "unique-slug-2027",
  "type": "journal",                    // journal | working | other
  "themes": ["inflation-dynamics"],     // ids from the "themes" block at the top
  "year": 2027,
  "featured": true,                     // true = also appears on the homepage
  "title": "Title Of The Paper",
  "title_zh": "中文标题",                // optional
  "authors": [                          // omit entirely if you are sole author
    { "name": "Wenzhe Li", "self": true },
    { "name": "Co Author", "url": "https://..." }
  ],
  "venue": "Journal Name",
  "venue_zh": "期刊名",                  // optional
  "volume": "12 (3)",
  "pages": "1–20",
  "language": "in Chinese",             // optional
  "url": "https://publisher-page",
  "links": [{ "label": "pdf", "url": "https://..." }],
  "citations": { "scholar": 5, "cnki": 12 }
}
```

**The "New" badge is automatic.** Anything from the last three calendar years,
including the current one, is badged — in 2026 that means 2024 onwards. It is
derived from `year` against the clock, so badges appear and expire on their own
with nothing to maintain. To widen or narrow the window, change `RECENT_YEARS`
at the top of `assets/site.js`.

## 3. Editing the bio, news, links

All in `data/site.json`. The `bio` field is an array of paragraphs and accepts
inline HTML (so you can put links in). Same for `news[].html`.

### Replacing running photos safely

Place the nine full-resolution `.JPG` source files in `assets/running/` using
the names listed in `scripts/prepare-running-photos.ps1`, then run:

```powershell
.\scripts\prepare-running-photos.ps1
```

The script applies camera orientation, center-crops and resizes each image to
1280 × 1280, and writes the lowercase `running-*.jpg` files used by the site.
It redraws every image into a new bitmap, removing EXIF/GPS, capture-time,
device, and embedded-thumbnail metadata. The full-resolution `.JPG` sources
are ignored by Git and must not be published.

---

## 4. Publishing to GitHub Pages

### First time

```powershell
cd c:\WenzheFiles\Academy\Website
git init -b main
git add .
git commit -m "Initial site"
```

Then create the repository on GitHub. **Name matters:**

| Repo name             | Resulting URL                     |
|-----------------------|-----------------------------------|
| `FreedomCS.github.io` | `https://freedomcs.github.io`  ← recommended |
| `website`             | `https://freedomcs.github.io/website/` |

Use `FreedomCS.github.io` — it gives the clean root URL, which matters for
Google Scholar indexing.

```powershell
git remote add origin https://github.com/FreedomCS/FreedomCS.github.io.git
git push -u origin main
```

Then in the repo on GitHub: **Settings → Pages → Build and deployment →
Source → GitHub Actions**. The included `.github/workflows/deploy.yml` does the
rest. Give it about a minute, then load the URL.

### Every time after

```powershell
git add .
git commit -m "Add BIS working paper"
git push
```

Live in under a minute.

---

## 5. Custom domain (optional, recommended eventually)

A domain you own survives job changes and is the strongest signal for Scholar.

1. Buy e.g. `wenzheli.com` (Cloudflare Registrar and Namecheap are both fine,
   roughly USD 10–15/year).
2. Create a file called `CNAME` in this folder containing exactly one line:
   ```
   wenzheli.com
   ```
3. At your DNS provider add:
   - Four `A` records for `@` → `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153`, `185.199.111.153`
   - One `CNAME` for `www` → `freedomcs.github.io`
4. In **Settings → Pages** enter the domain and tick **Enforce HTTPS**.
5. Search-and-replace `https://freedomcs.github.io` with your domain in the
   `<link rel="canonical">` tags, `robots.txt` and `sitemap.xml`.

---

## 6. Getting it indexed

Once live:

- **Google Scholar** — in your Scholar profile, add the site under your
  homepage URL. Scholar crawls `ScholarlyArticle` structured data, which
  `assets/site.js` injects automatically from your publication list.
- **Google Search Console** — add the property, submit `sitemap.xml`.
- Update the homepage link on your Google Scholar, SSRN and LinkedIn profiles.
- Keep the Google Site alive for a few months pointing at the new URL, then
  retire it.

---

## 7. Visitor counts

### GoatCounter — to switch on

No cookies, no personal data, free for personal sites. Currently **off**:
nothing loads and no data leaves the page.

1. Register at <https://www.goatcounter.com/signup> and choose a site code.
2. In **Settings → Site settings**, tick **"Allow adding visitor counts on
   your website"**. Without this the count endpoint returns nothing.
3. In `index.html`, find the commented GoatCounter block near the bottom,
   uncomment the two `<script>` lines, and replace `YOURCODE` with your site
   code **in both places**.

The total then appears in the footer once there is traffic. If GoatCounter is
ever unreachable the count simply stays hidden.

### MapMyVisitors — currently broken at their end

The world map below Bookmarks. It carried over from the Google Site, reaching
285 pageviews before it stopped working around 1 August 2026.

Their map service returns **HTTP 500 for every real account key** while
returning a valid image for a made-up one — so it is a fault in their
generator, not this site or the account. Registering a fresh widget
(dashboard `/web/1c738`, now in use) failed identically.

The section hides itself when the image fails, so the outage leaves no blank
gap, and it will reappear on its own if they fix it. If it is still broken
after a week or so, delete the `<section class="visitors">` block.

### Don't reinstate Busuanzi

Used briefly and removed. It displayed 10,455,116 visits / 7,634,371 visitors
— a *global* tally shared by every site using that free service, not this
site's traffic — and it counts over plain `http://`, which browsers block as
mixed content on an HTTPS page.

---

## Still to do

- [ ] Verify the *Economic Research Journal* working-paper link — the old site
      used the same URL for both the published and working-paper versions
- [ ] Refresh citation counts periodically in `data/publications.json`
