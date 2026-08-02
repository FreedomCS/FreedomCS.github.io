/* ==========================================================================
   Wenzhe Li — site logic
   Renders everything from data/site.json + data/publications.json.
   No build step, no dependencies.
   ========================================================================== */

/* --- Helpers ------------------------------------------------------------- */
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// Site root relative to the current page, derived from this script's own src
// ("assets/site.js" on root pages, "../assets/site.js" on subpages) — so
// data files resolve correctly from articles/*.html too.
const ROOT = (() => {
  const s = document.querySelector('script[src$="site.js"]');
  return s ? s.getAttribute("src").replace(/assets\/site\.js$/, "") : "";
})();

async function loadJSON(path) {
  const res = await fetch(ROOT + path, { cache: "no-cache" });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

/* How many years count as recent, including the current one: 2026 marks
   2024–2026. Derived from the clock rather than a flag in the data, so badges
   expire on their own instead of needing to be cleared by hand. */
const RECENT_YEARS = 3;

function isRecent(year) {
  const y = Number(year);
  if (!y) return false;
  return y >= new Date().getFullYear() - (RECENT_YEARS - 1);
}

const TYPE_LABEL = {
  journal: "Peer-Reviewed Journal Publications",
  working: "Working Paper",
  other:   "Other Publications",
};
const TYPE_ORDER = ["journal", "working", "other"];

/* --- Publication rendering ---------------------------------------------- */
function authorsHTML(pub) {
  if (!pub.authors || pub.authors.length === 0) return "";
  const names = pub.authors.map((a) => {
    const label = a.self
      ? `<span class="self">${esc(a.name)}</span>`
      : esc(a.name);
    return a.url ? `<a href="${esc(a.url)}">${label}</a>` : label;
  });
  const joined = names.length === 1
    ? names[0]
    : names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
  return `<span class="pub__authors">${joined}.</span>`;
}

function venueHTML(pub) {
  const bits = [];
  if (pub.venue) bits.push(`<em>${esc(pub.venue)}</em>`);
  const nums = [pub.volume, pub.pages].filter(Boolean).map(esc).join(", ");
  if (nums) bits.push(nums);
  if (pub.publisher) bits.push(esc(pub.publisher));
  if (pub.date) bits.push(esc(pub.date));
  if (pub.role) bits.push(esc(pub.role));
  if (pub.language) bits.push(`(${esc(pub.language)})`);
  if (!bits.length && !pub.institution) return "";

  // Institutional authorship (e.g. BIS committee reports) reads as its own
  // sentence before the series details, not as another comma-separated field.
  const lead = pub.institution ? `${esc(pub.institution)}. ` : "";

  // A republication is a second venue for the same article, so it belongs on
  // the citation line beside the first — not among the secondary detail.
  const again = pub.republished
    ? ` <span class="pub__republished">${pub.republished}</span>` : "";

  return `<span class="pub__venue">${lead}${bits.join(", ")}.</span>${again}`;
}

function zhHTML(pub) {
  const parts = [pub.title_zh, pub.venue_zh].filter(Boolean).map(esc);
  const nums = [pub.volume, pub.pages].filter(Boolean).map(esc).join(", ");
  if (!parts.length) return "";
  const line = pub.venue_zh
    ? `${esc(pub.title_zh)}，《${esc(pub.venue_zh)}》${nums ? "，" + nums : ""}`
    : esc(pub.title_zh);
  // The Chinese republication follows its own venue, mirroring the English.
  const again = pub.republished_zh ? `。${esc(pub.republished_zh)}` : "";
  return `<span class="pub__zh" lang="zh">${line}${again}</span>`;
}

function citesHTML(pub) {
  const c = pub.citations;
  if (!c) return "";
  const parts = [];
  if (c.scholar) parts.push(`${c.scholar} (Scholar)`);
  if (c.cnki) parts.push(`${c.cnki} (CNKI)`);
  if (!parts.length) return "";
  return `<span class="cites">Cited by ${parts.join(", ")}</span>`;
}

function linksHTML(pub) {
  if (!pub.links || !pub.links.length) return "";
  const items = pub.links
    .map((l) => `<a href="${esc(l.url)}" rel="noopener">${esc(l.label)}</a>`)
    .join("");
  return `<span class="pub__links">${items}</span>`;
}

function pubHTML(pub, themes) {
  const titleInner = esc(pub.title);
  const title = pub.url
    ? `<a href="${esc(pub.url)}" rel="noopener">${titleInner}</a>`
    : titleInner;

  const presented = pub.presented
    ? `Presented at ${
        pub.presented.url
          ? `<a href="${esc(pub.presented.url)}" rel="noopener">${esc(pub.presented.label)}</a>`
          : esc(pub.presented.label)
      }.`
    : "";

  // Research-area tags are omitted: the filter UI they linked to was removed
  // with the multi-page layout, so they were 20 dead links competing with the
  // paper titles. `themes` in publications.json still groups the work and can
  // drive a filter again if one is reintroduced.
  const newTag = isRecent(pub.year)
    ? `<span class="tag tag--new">New</span>` : "";

  const meta = [linksHTML(pub), citesHTML(pub), newTag]
    .filter(Boolean).join("");

  // Two lines per entry: title, then one citation line that also carries the
  // pdf links, citation counts and any New badge. Those previously sat in a
  // row of their own, costing ~31px per entry — nearly 500px across the list —
  // for content that fits on the end of a line already there.
  const cite = [authorsHTML(pub), venueHTML(pub)].filter(Boolean).join(" ");
  // Grouped by script — all the English, then all the Chinese — rather than
  // interleaved. The two use different faces, so alternating between them
  // made the line look inconsistent and forced the reader to switch twice.
  // Middot-separated: these fragments end without punctuation, so a space
  // alone would run them together.
  const asideEn = [pub.note, presented].filter(Boolean);
  const asideZh = [
    zhHTML(pub),
    pub.note_zh ? `<span lang="zh">${esc(pub.note_zh)}</span>` : "",
  ].filter(Boolean);
  const aside = [...asideEn, ...asideZh]
    .join(' <span class="pub__sep">·</span> ');

  return `
    <li class="pub" data-themes="${esc((pub.themes || []).join(" "))}" data-type="${esc(pub.type)}" data-year="${esc(pub.year)}" id="${esc(pub.id)}">
      <div class="pub__year">${esc(pub.year)}</div>
      <div class="pub__body">
        <h3 class="pub__title">${title}</h3>
        ${cite || meta ? `<p class="pub__cite"><span class="pub__citation-text">${cite}</span>${meta ? `<span class="pub__meta">${meta}</span>` : ""}</p>` : ""}
        ${aside ? `<p class="pub__aside">${aside}</p>` : ""}
      </div>
    </li>`;
}

function sortPubs(a, b) {
  if (b.year !== a.year) return b.year - a.year;
  return TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type);
}

/* --- Structured data (Schema.org) for Scholar / search engines ----------- */
function injectSchema(site, pubs) {
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    alternateName: site.name_zh,
    email: `mailto:${site.email}`,
    jobTitle: site.positions?.[0]?.role,
    worksFor: {
      "@type": "Organization",
      name: site.positions?.[0]?.org,
      url: site.positions?.[0]?.url,
    },
    alumniOf: (site.education || []).map((e) => ({
      "@type": "CollegeOrUniversity", name: e.org, url: e.url,
    })),
    sameAs: (site.profiles || []).map((p) => p.url),
    // ORCID is the canonical identifier for a researcher, so it is declared
    // as such and not only as another profile link.
    identifier: (() => {
      const orcid = (site.profiles || []).find((p) => /orcid\.org/.test(p.url));
      return orcid
        ? { "@type": "PropertyValue", propertyID: "ORCID", value: orcid.url }
        : undefined;
    })(),
    // The author's own wording, matching his AMRO profile.
    knowsAbout: [
      "Macroeconomics and inflation", "Financial stability",
      "Monetary policy", "International economics",
      "China's shadow banking system",
    ],
  };

  const works = pubs.map((p) => ({
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: p.title,
    datePublished: String(p.year),
    author: (p.authors || [{ name: "Wenzhe Li" }]).map((a) => ({
      "@type": "Person", name: a.name,
    })),
    isPartOf: p.venue ? { "@type": "Periodical", name: p.venue } : undefined,
    url: p.url,
  }));

  const el = document.createElement("script");
  el.type = "application/ld+json";
  el.textContent = JSON.stringify([person, ...works]);
  document.head.appendChild(el);
}

/* --- BibTeX generation --------------------------------------------------- */
function toBibtex(pub) {
  const entry = pub.type === "journal" ? "article" : "techreport";
  const authors = (pub.authors || [{ name: "Wenzhe Li" }])
    .map((a) => a.name).join(" and ");
  const f = [
    ["author", authors],
    ["title", pub.title],
    [pub.type === "journal" ? "journal" : "institution", pub.venue],
    ["volume", pub.volume],
    ["pages", pub.pages],
    ["year", pub.year],
    ["url", pub.url],
  ].filter(([, v]) => v);
  return `@${entry}{${pub.id},\n` +
    f.map(([k, v]) => `  ${k} = {${v}}`).join(",\n") + "\n}";
}

function wireBibtex(pubs) {
  const btn = $("#bibtex-all");
  if (!btn) return;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const text = pubs.map(toBibtex).join("\n\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "wenzhe-li-publications.bib";
    a.click();
    URL.revokeObjectURL(a.href);
  });
}

/* --- Page renderers ------------------------------------------------------ */
function renderNews(site) {
  const el = $("#news");
  if (!el) return;
  el.innerHTML = (site.news || []).map((n) => {
    const [y, m] = String(n.date).split("-");
    const label = m
      ? new Date(Date.UTC(+y, +m - 1, 1)).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" })
      : y;
    return `<li><time datetime="${esc(n.date)}">${esc(label)}</time><div>${n.html}</div></li>`;
  }).join("");
}

function renderThemes(pubData) {
  const el = $("#themes");
  if (!el) return;
  const { themes, publications } = pubData;
  el.innerHTML = Object.entries(themes).map(([id, t]) => {
    const n = publications.filter((p) => (p.themes || []).includes(id)).length;
    return `
      <div class="theme">
        <h3>${esc(t.label)}</h3>
        <p>${esc(t.blurb)}</p>
        <div class="theme__count">
          <a href="?theme=${esc(id)}#publications">${n} ${n === 1 ? "paper" : "papers"} →</a>
        </div>
      </div>`;
  }).join("");
}

function renderArticles(site) {
  const el = $("#articles");
  if (!el) return;
  el.innerHTML = (site.articles || []).map((a) => `
    <li id="${esc(a.id)}">
      <h3>${esc(a.title)}${a.year ? ` <span class="cites">(${esc(a.year)})</span>` : ""}</h3>
      ${a.title_zh ? `<p class="pub__zh" lang="zh">${esc(a.title_zh)}</p>` : ""}
      ${a.blurb ? `<p>${a.blurb}</p>` : ""}
      <div class="pub__meta">${
        (a.links || []).map((l) => `<span class="pub__links"><a href="${esc(l.url)}" rel="noopener">${esc(l.label)}</a></span>`).join("")
      }</div>
    </li>`).join("");
}

function renderPublications(pubData) {
  const host = $("#publications-list");
  if (!host) return;
  const { themes, publications } = pubData;

  const grouped = TYPE_ORDER.map((type) => {
    const list = publications.filter((p) => p.type === type).sort(sortPubs);
    if (!list.length) return "";
    return `
      <div class="pubgroup" data-group="${esc(type)}">
        <h3 class="pubgroup__title">${esc(TYPE_LABEL[type])}</h3>
        <ul class="pubs">${list.map((p) => pubHTML(p, themes)).join("")}</ul>
      </div>`;
  }).join("");
  host.innerHTML = grouped;

  // Filter buttons
  const bar = $("#filters");
  if (bar) {
    const counts = Object.fromEntries(
      Object.keys(themes).map((id) => [id, publications.filter((p) => (p.themes || []).includes(id)).length])
    );
    bar.innerHTML =
      `<li><button class="filter" data-theme="all" aria-pressed="true">All (${publications.length})</button></li>` +
      Object.entries(themes).map(([id, t]) =>
        `<li><button class="filter" data-theme="${esc(id)}" aria-pressed="false">${esc(t.short)} (${counts[id]})</button></li>`
      ).join("");

    bar.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter");
      if (btn) applyFilter(btn.dataset.theme);
    });
  }

  const initial = new URLSearchParams(location.search).get("theme");
  applyFilter(initial && themes[initial] ? initial : "all");
  wireBibtex(publications);
}

function applyFilter(theme) {
  $$(".filter").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.theme === theme)));

  $$(".pub").forEach((li) => {
    const match = theme === "all" || (li.dataset.themes || "").split(" ").includes(theme);
    li.hidden = !match;
  });

  // Hide any group left with nothing visible
  $$(".pubgroup").forEach((g) => {
    g.hidden = $$(".pub", g).every((li) => li.hidden);
  });

  const note = $("#filter-note");
  if (note) {
    const n = $$(".pub").filter((li) => !li.hidden).length;
    note.textContent = theme === "all"
      ? ""
      : `Showing ${n} ${n === 1 ? "publication" : "publications"} in this area.`;
  }

  const url = new URL(location.href);
  if (theme === "all") url.searchParams.delete("theme");
  else url.searchParams.set("theme", theme);
  history.replaceState(null, "", url);
}

function renderProfileBits(site) {
  const nameEl = $("#hero-name");
  if (nameEl) {
    nameEl.innerHTML = `${esc(site.name)}<span class="zh" lang="zh">${esc(site.name_zh)}</span>`;
  }

  const profileLines = $("#profile-lines");
  if (profileLines) {
    const positions = site.positions || [];
    const primary = positions[0];
    const education = site.education || [];
    const educationOrg = education[0];
    const degreeSummary = education.map((e) => {
      if (e.degree.startsWith("M.")) return "Master";
      if (e.degree.startsWith("B.")) return "BSc";
      return e.degree;
    }).join("/");

    const lines = [];
    if (primary) {
      const primaryOrg = primary.org.replace(/\s*\(AMRO\)\s*$/, "");
      lines.push(
        `<p>${primary.url ? `<a href="${esc(primary.url)}" rel="noopener">${esc(primaryOrg)}</a>` : esc(primaryOrg)} - ${esc(primary.role)}</p>`
      );
    }
    if (educationOrg) {
      lines.push(
        `<p><a href="${esc(educationOrg.url)}" rel="noopener">Tsinghua University</a> - ${esc(degreeSummary)}</p>`
      );
    }
    positions.slice(1).forEach((position) => {
      lines.push(
        `<p>${position.url ? `<a href="${esc(position.url)}" rel="noopener">${esc(position.org)}</a>` : esc(position.org)}${position.period ? ` (visiting ${esc(position.period)})` : ""}</p>`
      );
    });
    lines.push(`<p>Email: <a href="mailto:${esc(site.email)}">${esc(site.email)}</a></p>`);
    profileLines.innerHTML = lines.join("");
  }

  const tag = $("#hero-tagline");
  if (tag) tag.textContent = site.tagline;

  const bio = $("#bio");
  if (bio) {
    const paragraphs = site.bio || [];
    bio.innerHTML = bio.classList.contains("profile__bio")
      ? `<p>${paragraphs.join(" ")}</p>`
      : paragraphs.map((p) => `<p>${p}</p>`).join("");
  }

  const lede = $("#bio-short");
  if (lede) lede.innerHTML = site.bio_short;

  const affil = $("#affiliations");
  if (affil) {
    affil.innerHTML = (site.positions || []).map((p) => `
      <li>
        <span class="role">${esc(p.role)}</span>,
        <span class="org">${p.url ? `<a href="${esc(p.url)}" rel="noopener">${esc(p.org)}</a>` : esc(p.org)}</span>
        ${p.period ? `<span class="period">${esc(p.period)}</span>` : ""}
      </li>`).join("");
  }

  // Compact one-line education summary, in the spirit of the old site's
  // "Tsinghua University - Ph.D. in Economics/Master/BSc".
  const eduLine = $("#education-line");
  if (eduLine && (site.education || []).length) {
    const degrees = site.education.map((e) => esc(e.degree)).join(" · ");
    const org = site.education[0];
    eduLine.innerHTML =
      `<a href="${esc(org.url)}" rel="noopener">Tsinghua University</a> — ${degrees}`;
  }

  $$(".js-profiles").forEach((el) => {
    el.innerHTML = (site.profiles || []).map((p) =>
      `<li><a href="${esc(p.url)}" rel="noopener">${esc(p.label)}</a></li>`).join("") +
      (el.closest(".profile__links")
        ? ""
        : `<li><a href="mailto:${esc(site.email)}">Email</a></li>`);
  });

  $$(".js-disclaimer").forEach((el) => { el.textContent = site.disclaimer; });

  $$(".js-bookmarks").forEach((el) => {
    el.innerHTML = (site.bookmarks || []).map((b) =>
      `<a href="${esc(b.url)}" rel="noopener">${esc(b.label)}</a>`).join("");
  });

  $$(".js-year").forEach((el) => { el.textContent = new Date().getFullYear(); });
}

/* --- Visitor count ------------------------------------------------------
   Reads the total from GoatCounter. Stays hidden unless a real site code has
   been set, so an unconfigured or unreachable counter shows nothing rather
   than a zero or a broken element. "Allow adding visitor counts on your
   website" must be enabled in the GoatCounter settings.                   */
async function renderVisits() {
  const el = $("#visit-count");
  const code = window.WL_GOATCOUNTER;
  if (!el || !code || code === "YOURCODE") return;

  try {
    // A unique query defeats any cached response: enabling public counts in
    // the GoatCounter settings does not invalidate an earlier cached 403.
    const res = await fetch(
      `https://${code}.goatcounter.com/counter/TOTAL.json?v=${Date.now()}`,
      { cache: "no-store" });
    if (!res.ok) return;
    const { count } = await res.json();
    // count arrives as a string with thin spaces, e.g. "1 086 918"; show it
    // as given, but treat a genuinely empty response as nothing to display.
    if (count == null || count === "") return;
    el.textContent = `${count} visits`;
    el.hidden = false;
  } catch {
    /* A counter is a nicety; never let it disturb the page. */
  }
}

/* --- Boot --------------------------------------------------------------- */
(async function boot() {
  try {
    const [site, pubData] = await Promise.all([
      loadJSON("data/site.json"),
      loadJSON("data/publications.json"),
    ]);

    renderProfileBits(site);
    renderNews(site);
    renderThemes(pubData);
    renderArticles(site);
    renderPublications(pubData);
    injectSchema(site, pubData.publications);

    document.body.dataset.ready = "true";
    renderVisits();
  } catch (err) {
    console.error(err);
    const banner = document.createElement("div");
    banner.className = "note";
    banner.style.margin = "2rem auto";
    banner.style.maxWidth = "38rem";
    banner.innerHTML =
      `<strong>Content could not be loaded.</strong><br>` +
      `If you opened this file directly from disk, browsers block <code>fetch()</code> on <code>file://</code> URLs. ` +
      `Run a local server instead — see <code>README.md</code>. <br>` +
      `<span style="opacity:.7">${esc(err.message)}</span>`;
    (document.querySelector("main") || document.body).prepend(banner);
  }
})();
