# CLAUDE.md — working notes for this project

Context, rules and decisions for Wenzhe Li's academic website. Read this
before making changes. `README.md` is the user-facing guide (how to add a
paper, how to publish); this file is the *why*, plus the mistakes not to
repeat.

---

## What this is

A static personal academic site for **Wenzhe Li (李文喆)**, Senior Economist
at AMRO in Singapore, Visiting Scholar at the BIS. Migrated from
<https://sites.google.com/view/liwenzhe> (still live — the fallback).

Plain HTML/CSS/JS. No framework, no build step, no dependencies. Content
lives in two JSON files; `assets/site.js` renders it.

```
index.html          Home: profile, all 19 publications, bookmarks
articles.html       Index of the three articles
articles/*.html     Full text of each article (4 pages, incl. 中文)
running.html        Running: text + 9 photos
data/site.json      Bio, affiliations, links, articles list, bookmarks
data/publications.json   All publications — the single source of truth
assets/style.css    All styling
assets/site.js      Renders pages from the JSON
scripts/*.ps1       Image preparation (photos, logos)
```

Target: GitHub Pages at `freedomcs.github.io` (repo must be named
`FreedomCS.github.io` for the root URL). **Not yet published** — no remote
is configured. The user pushes when ready.

---

## Rules

### 1. Never change the user's words
His text is his. Fix nothing — not typos, not grammar, not phrasing.
`running.html` deliberately contains "chellenging" and lowercase
"central park" because the original does. Do not "improve" prose,
re-order sentences, or compress paragraphs. If something reads oddly,
mention it; don't edit it.

This was violated repeatedly early on and the user had to catch it. See
"Mistakes" below.

### 2. Verify content, not just rendering
"The page loads with no console errors" is **not** verification that
content is correct. For anything migrated from the Google Site, diff
against the live original:

- Scrape every visible text node from the Google page
- Sort by on-screen y-position to get true reading order (Google's DOM
  order is not visual order, and `[role="main"]`/`innerText` return
  almost nothing)
- Compare against the local copy, normalising whitespace/punctuation

Scripts that did this are in the session scratchpad; re-create them if
needed. Last run: **no missing segments on any page.**

### 3. Replicate first, improve second
The user's instruction was: reproduce the Google Site faithfully, *then*
discuss improvements together. Don't fold in redesigns, extra sections,
or "better" structure unprompted.

### 4. The user edits files too
He frequently edits HTML/CSS directly between turns — captions, layout,
the centered profile header, `.running-page` styles. **Re-read files
before editing**; don't assume your last version is current, and don't
revert his changes.

### 5. Images: never publish camera originals
Phone photos carry **GPS coordinates**. All 9 running photos did. Always
generate scrubbed, resized web copies; keep originals local and
gitignored. `scripts/prepare-running-photos.ps1` does this (1600px, q85,
re-encode drops EXIF). Verify GPS is gone afterwards.

### 6. Don't alter institutional logos
The three Tsinghua marks are official artwork. Cropping surrounding
background is fine; recolouring or reconstructing them is not.

---

## Decisions made (and why)

| Decision | Reason |
|---|---|
| **Static site, hand-written** | User owns content outright; Google Sites locks photos behind expiring signed URLs. No build step to rot. |
| **Three pages** mirroring the original | User: "this website has become so complicated for so little content". Earlier 5-page version (research/publications/CV) was cut. |
| **All publications on the home page** | Matches the original site. Section labels kept verbatim: "Peer-Reviewed Journal Publications" / "Working Paper" / "Other Publications". |
| **No dark mode** | Removed at user's request (~113 lines). Site is light-only and ignores OS preference. Don't reintroduce. |
| **No CV page** | User declined. Print styling on the home page remains (Ctrl+P) — harmless, no nav link. |
| **Articles hosted locally** | Full text migrated; no longer links out to Google. |
| **Busuanzi counter removed** | Showed a *global* shared tally (10.4M), and counts over `http://` which breaks on HTTPS. Replaced by GoatCounter, currently off. See README §7. |
| **Repo `FreedomCS.github.io`** | `liwenzhe`, `wenzheli`, `wenzhe-li` are all taken by other GitHub users; `liwenzhe.com` is registered. A custom domain (`wenzheli.com` looked free) is the only route to a clean URL. User chose to keep `freedomcs` for now and revisit. |

Still open: research-theme filters exist on publications but the themes
*section* was removed from the home page — tags still work as filters.
The `articles.html` intro paragraph is Claude's wording, not the user's,
and he may want it gone.

---

## Mistakes to learn from

Three rounds of the user catching content loss. Root cause each time: I
built with an extractor, eyeballed the result, and declared it verified.

1. **Photos omitted entirely.** Left a commented-out gallery placeholder
   instead of migrating them, because Google's image URLs 403 on direct
   download. Fix: load the live page in a real browser and capture the
   image responses.
2. **Running page text lost.** Compressed a five-sentence paragraph to
   one line, dropping that it was his *fifth* half marathon, the humid
   Sunday morning, training with Tirupam since the previous year, the
   half-hour waits, finishing 5 minutes faster, and exploring over half
   the island's coastline.
3. **Layout flattened.** The original interleaves text and photos
   (text → 6 photos → text → 3 photos); I lumped all 9 together.

He asked directly, "can I trust you?" — a fair question. The lesson is
that verification must test the actual claim being made.

---

## Practical notes

- **Preview:** Python's `http.server` drops connections under parallel
  image loads; use `node` (a small static server) or accept the noise.
  `file://` will not work — `fetch()` is blocked, so the JSON never loads.
- **Windows/PowerShell:** `System.Drawing` handles the image work. Watch
  for EXIF orientation (Singapore.JPG is orientation 6 and needs
  rotating into the pixels).
- **`data-theme`** on filter buttons refers to *research areas*, not
  colour themes. Unrelated to the removed dark mode — don't strip it.
- **Commits:** four so far, all local. Nothing pushed.
