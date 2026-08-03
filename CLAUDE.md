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
`FreedomCS.github.io` for the root URL). **Published and live** since
1 August 2026 — the remote is `origin`
(`github.com/FreedomCS/FreedomCS.github.io.git`). The site is public, so
changes pushed to `main` are visible within a minute or two. `publish.ps1`
does the commit-and-push in one step.

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
| **Busuanzi counter removed** | Showed a *global* shared tally (10.4M), and counts over `http://` which breaks on HTTPS. Replaced by GoatCounter, live since 2 Aug 2026. See README §7. |
| **Repo `FreedomCS.github.io`** | `liwenzhe`, `wenzheli`, `wenzhe-li` are all taken by other GitHub users; `liwenzhe.com` is registered. A custom domain (`wenzheli.com` looked free) is the only route to a clean URL. User chose to keep `freedomcs` for now and revisit. |

| **"New" badge is derived, not stored** | Was a manual `is_new` flag on 6 entries that would silently rot. Now computed from `year` against the clock: last 3 calendar years including the current one (`RECENT_YEARS` in `site.js`). Nothing to maintain. |
| **Prose held to `--measure-prose` (40rem)** | Body text ran the full 1160px — 136–178 characters per line. Now ~75. Applies to article bodies, the home bio and the Running page. |
| **One body size (17px/1.75)** | Was 13px, 14px or 17px depending on the page. |
| **Name is the serif masthead** | Was 1.75rem uppercase sans — smaller than every page title. Now clamp(2.1–2.9rem) in the serif with letter-spacing, 李文喆 alongside in the CJK serif. |

Resolved since: the `articles.html` intro (Claude's wording) is removed,
and the 20 dead research-area tags are gone from the publication list.
The `themes` data stays in `publications.json` if filtering ever returns.

---

## Decision log

Newest first. The table above holds *standing* decisions; this records
**when** things happened and what was tried and rejected — the part
`git log` can't reconstruct. Append a dated entry whenever a choice is
made that a future session would otherwise have to re-litigate. Keep it
to a few lines; the reasoning matters more than the changed files.

### 2026-08-03 — CNKI citation counts refreshed by hand

Five Chinese-language papers updated in `publications.json`: 发展驱动因素
27→34, 对货币政策调控的影响 8→11, 对金融稳定的影响 42→50,
定义、构成和规模测算 249→291, PPI与CPI走势 8→10.

**CNKI cannot be scraped from an agent sandbox — don't try again.** Every
`cnki.net` hostname (`kns`, `www`, `oversea`, `chn.oversea`, `kns8`,
`navi`) CNAMEs to Tencent EdgeOne at `43.159.104.130`, which serves a
certificate for unrelated domains (`*.4399.com`, `*.dianping.com`) and
returns **HTTP 418 with a zero-byte body**. Tried and failed: disabling
cert validation, browser User-Agent, `Accept-Language: zh-CN`, a CNKI
referer, the `kcms2/article/abstract` URL form. It is a bot filter, not a
paywall — a control request to `jryj.org.cn` (also China-hosted) returns
200 from the same sandbox. The count is also painted by JavaScript, so
even valid HTML wouldn't contain it. ScholarMate mirrors CNKI metadata
but not the counts; web search doesn't republish them.

The user reads the numbers from his own browser and pastes them. Ask;
never estimate. An invented citation count on his own publication list is
the kind of error only he would be blamed for.

Still uncounted: 我在清华大学求学十二年 (金融博览), 货币的形态演变和三个层次
(中国金融), and the 2019 经济研究 working paper. `citesHTML` in `site.js`
treats 0 as falsy, so a genuine zero renders as nothing — kept that way
deliberately.

### 2026-08-02 — Analytics and visitor counts settled

Google Analytics 4 added to every page (`2491cfc`). GoatCounter switched
on after registration (`16256ef`), having been staged switched-off the
same day. MapMyVisitors re-keyed and made to hide itself on failure
(`a76e544`) rather than showing a broken widget. Home page descriptions
reverted to the author's own wording (`e00d926`).

### 2026-08-01 — Published; publication list restructured

Site went live at `freedomcs.github.io`. Publication entries condensed to
two or three lines, with pdf links and New badges right-aligned into a
scannable column; English and Chinese detail grouped rather than
interleaved. A static publication list was added for crawlers that don't
run JavaScript, and the Puppeteer pre-render script was dropped as
redundant. ORCID added to the profile and structured data.

### 2026-07-30 — Migration completed and verified

Google Sites content fully migrated: photos, four article pages, the full
Running page text. Dark mode removed (~113 lines). Site simplified from
five pages to three. Typographic pass: one body size, prose held to
`--measure-prose`, the name promoted to a serif masthead. Running photos
re-exported with GPS stripped. `CLAUDE.md` created.

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
- **Commits:** 48 as of 3 August 2026, all pushed to `origin/main`. Don't
  quote a count here as if it were current — check `git log` instead.
