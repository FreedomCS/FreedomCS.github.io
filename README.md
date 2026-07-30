# Wenzhe Li — academic website

Static site. No build step, no dependencies, no framework. Plain HTML, one
stylesheet, one script, and two JSON data files.

Three pages, mirroring the original site's structure:

```
index.html            Home — bio, research areas, ALL publications
                      (filterable, BibTeX), news, about.
                      Ctrl+P prints it as a clean CV.
articles.html         Essays and interviews
running.html          Running

data/site.json        ← YOU EDIT: bio, affiliations, links, news, essays
data/publications.json ← YOU EDIT: every paper

assets/style.css      All styling (light + dark + print)
assets/site.js        Renders the pages from the JSON
assets/portrait.jpg   Your photo (auto-resized web copy)
assets/running/       ← optional: running photos, see running.html comment
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
  "citations": { "scholar": 5, "cnki": 12 },
  "is_new": true                        // shows a "New" badge
}
```

**Remember to remove `"is_new": true`** from older entries once they aren't new
anymore — that badge is the one thing that won't age itself.

## 3. Editing the bio, news, links

All in `data/site.json`. The `bio` field is an array of paragraphs and accepts
inline HTML (so you can put links in). Same for `news[].html`.

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

## Still to do

- [ ] Add running photos to `assets/running/` and uncomment the gallery
      block in `running.html`
- [ ] Migrate the three essays from Google Sites into local pages
      (currently `articles.html` links out to the old site)
- [ ] Verify the *Economic Research Journal* working-paper link — the old site
      used the same URL for both the published and working-paper versions
- [ ] Refresh citation counts periodically in `data/publications.json`
