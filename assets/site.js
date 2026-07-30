/* ==========================================================================
   Wenzhe Li — site logic
   Renders everything from data/site.json + data/publications.json.
   No build step, no dependencies.
   ========================================================================== */

/* --- Theme toggle (runs immediately; also inlined in <head> to avoid flash) */
(function theme() {
  const KEY = "wl-theme";
  const root = document.documentElement;

  const saved = (() => { try { return localStorage.getItem(KEY); } catch { return null; } })();
  if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);

  function current() {
    return root.getAttribute("data-theme")
      || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".theme-toggle");
    if (!btn) return;
    const next = current() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem(KEY, next); } catch {}
    sync();
  });

  function sync() {
    const dark = current() === "dark";
    document.querySelectorAll(".theme-toggle").forEach((b) => {
      b.textContent = dark ? "Light" : "Dark";
      b.setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} theme`);
    });
  }
  document.addEventListener("DOMContentLoaded", sync);
  sync();
})();

/* --- Helpers ------------------------------------------------------------- */
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-cache" });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

const TYPE_LABEL = {
  journal: "Peer-reviewed journal articles",
  working: "Working papers",
  other:   "Policy work, institutional reports and essays",
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
  return `<p class="pub__authors">${joined}</p>`;
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
  return `<p class="pub__venue">${lead}${bits.join(", ")}</p>`;
}

function zhHTML(pub) {
  const parts = [pub.title_zh, pub.venue_zh].filter(Boolean).map(esc);
  const nums = [pub.volume, pub.pages].filter(Boolean).map(esc).join(", ");
  if (!parts.length) return "";
  const line = pub.venue_zh
    ? `${esc(pub.title_zh)}，《${esc(pub.venue_zh)}》${nums ? "，" + nums : ""}`
    : esc(pub.title_zh);
  return `<p class="pub__zh" lang="zh">${line}</p>`;
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
    ? `<p class="pub__presented">Presented at ${
        pub.presented.url
          ? `<a href="${esc(pub.presented.url)}" rel="noopener">${esc(pub.presented.label)}</a>`
          : esc(pub.presented.label)
      }.</p>`
    : "";

  const note = pub.note ? `<p class="pub__note">${pub.note}</p>` : "";
  const noteZh = pub.note_zh
    ? `<p class="pub__zh" lang="zh">${esc(pub.note_zh)}</p>` : "";

  const themeTags = (pub.themes || [])
    .filter((t) => themes[t])
    .map((t) => `<a class="tag tag--theme" href="publications.html?theme=${esc(t)}">${esc(themes[t].short)}</a>`)
    .join("");

  const newTag = pub.is_new ? `<span class="tag tag--new">New</span>` : "";

  const meta = [linksHTML(pub), citesHTML(pub), themeTags, newTag]
    .filter(Boolean).join("");

  return `
    <li class="pub" data-themes="${esc((pub.themes || []).join(" "))}" data-type="${esc(pub.type)}" data-year="${esc(pub.year)}" id="${esc(pub.id)}">
      <div class="pub__year">${esc(pub.year)}</div>
      <div class="pub__body">
        <h3 class="pub__title">${title}</h3>
        ${authorsHTML(pub)}
        ${venueHTML(pub)}
        ${zhHTML(pub)}
        ${presented}
        ${note}
        ${noteZh}
        ${meta ? `<div class="pub__meta">${meta}</div>` : ""}
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
    knowsAbout: [
      "Monetary policy", "Financial stability", "Shadow banking",
      "Inflation dynamics", "Central banking", "Macroeconomics",
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
          <a href="publications.html?theme=${esc(id)}">${n} ${n === 1 ? "paper" : "papers"} →</a>
        </div>
      </div>`;
  }).join("");
}

function renderFeatured(pubData) {
  const el = $("#featured");
  if (!el) return;
  const featured = pubData.publications
    .filter((p) => p.featured)
    .sort(sortPubs);
  el.innerHTML = featured.map((p) => pubHTML(p, pubData.themes)).join("");
}

function renderArticles(site) {
  const el = $("#articles");
  if (!el) return;
  el.innerHTML = (site.articles || []).map((a) => `
    <li id="${esc(a.id)}">
      <h3>${esc(a.title)}</h3>
      ${a.title_zh ? `<p class="pub__zh" lang="zh">${esc(a.title_zh)}</p>` : ""}
      <p>${a.blurb}${a.year ? ` <span class="cites">(${esc(a.year)})</span>` : ""}</p>
      <div class="pub__meta">${
        (a.links || []).map((l) => `<span class="pub__links"><a href="${esc(l.url)}" rel="noopener">${esc(l.label)}</a></span>`).join("")
      }</div>
    </li>`).join("");
}

function renderPublications(pubData) {
  const host = $("#publications");
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

  const tag = $("#hero-tagline");
  if (tag) tag.textContent = site.tagline;

  const bio = $("#bio");
  if (bio) bio.innerHTML = (site.bio || []).map((p) => `<p>${p}</p>`).join("");

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

  const edu = $("#education");
  if (edu) {
    edu.innerHTML = (site.education || []).map((e) => `
      <li>
        <span class="role">${esc(e.degree)}</span>,
        <span class="org">${e.url ? `<a href="${esc(e.url)}" rel="noopener">${esc(e.org)}</a>` : esc(e.org)}</span>
      </li>`).join("");
  }

  $$(".js-profiles").forEach((el) => {
    el.innerHTML = (site.profiles || []).map((p) =>
      `<li><a href="${esc(p.url)}" rel="noopener">${esc(p.label)}</a></li>`).join("") +
      `<li><a href="mailto:${esc(site.email)}">Email</a></li>`;
  });

  $$(".js-disclaimer").forEach((el) => { el.textContent = site.disclaimer; });

  $$(".js-bookmarks").forEach((el) => {
    el.innerHTML = (site.bookmarks || []).map((b) =>
      `<a href="${esc(b.url)}" rel="noopener">${esc(b.label)}</a>`).join("");
  });

  $$(".js-year").forEach((el) => { el.textContent = new Date().getFullYear(); });
}

function renderCV(site, pubData) {
  const host = $("#cv-body");
  if (!host) return;
  const { publications, themes } = pubData;

  const block = (title, rows) => `
    <section class="cv-block">
      <h2>${esc(title)}</h2>
      ${rows}
    </section>`;

  const posRows = [...(site.positions || [])].map((p) => `
    <div class="cv-row">
      <div class="cv-row__when">${esc(p.period || (p.current ? "Present" : ""))}</div>
      <div><strong>${esc(p.role)}</strong><br><span style="color:var(--ink-muted)">${esc(p.org)}</span></div>
    </div>`).join("");

  // No dates in the source data, so the left column stays empty rather than
  // repeating the institution that is already named on the right.
  const eduRows = (site.education || []).map((e) => `
    <div class="cv-row">
      <div class="cv-row__when">${esc(e.period || "")}</div>
      <div><strong>${esc(e.degree)}</strong><br><span style="color:var(--ink-muted)">${esc(e.org)}</span></div>
    </div>`).join("");

  const pubBlocks = TYPE_ORDER.map((type) => {
    const list = publications.filter((p) => p.type === type).sort(sortPubs);
    if (!list.length) return "";
    return `
      <div class="pubgroup">
        <h3 class="pubgroup__title">${esc(TYPE_LABEL[type])}</h3>
        <ul class="pubs">${list.map((p) => pubHTML(p, themes)).join("")}</ul>
      </div>`;
  }).join("");

  host.innerHTML =
    block("Appointments", posRows) +
    block("Education", eduRows) +
    `<section class="cv-block"><h2>Publications</h2>${pubBlocks}</section>`;
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
    renderFeatured(pubData);
    renderArticles(site);
    renderPublications(pubData);
    renderCV(site, pubData);
    injectSchema(site, pubData.publications);

    document.body.dataset.ready = "true";
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
