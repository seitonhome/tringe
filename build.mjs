// Static bilingual site generator for Tringe.
//
//   node build.mjs
//
// Reads templates/ + build/i18n.mjs + build/site.config.mjs and writes the
// finished HTML for both languages into the repo:
//
//   /index.html                     ES home  (served at tringe.vercel.app/)
//   /en/index.html                  EN home  (/en/)
//   /projects/<slug>.html           ES project pages
//   /en/projects/<slug>.html        EN project pages
//   /sitemap.xml                    every URL, with hreflang alternates
//   /404.html                       ES not-found page
//
// Single source of truth for copy is build/i18n.mjs. Edit templates or that
// file, re-run this script, commit the result.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TRANSLATIONS } from "./build/i18n.mjs";
import { SITE, PROJECTS, FACT_KEYS, langBase } from "./build/site.config.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const TPL = (name) => fs.readFileSync(path.join(ROOT, "templates", name), "utf8");

/* ---------- helpers ---------- */

const escHtml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s) => escHtml(s).replace(/"/g, "&quot;");
const escJson = (s) => JSON.stringify(String(s)).slice(1, -1);

const get = (obj, dotted) =>
  dotted.split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), obj);

const abs = (p) => SITE.baseUrl.replace(/\/$/, "") + p;

// Home URL for a language: "/" for the default, "/en/" otherwise.
const homeUrl = (lang) => (langBase(lang) || "") + "/";
// Project page URL for a language.
const projectUrl = (lang, slug) => `${langBase(lang)}/projects/${slug}.html`;

const otherLang = (lang) => SITE.langs.find((l) => l !== lang);

/* ---------- i18n text substitution ----------

   Every translatable node in the templates carries data-i18n="dot.path".
   Replace the element's text content (everything from ">" up to the next "<")
   with the translated string. data-i18n is always the last attribute on the
   element in our templates, so the match is unambiguous. */
function applyI18n(html, lang) {
  const dict = TRANSLATIONS[lang];
  return html.replace(
    /data-i18n="([^"]+)"([^>]*)>[^<]*/g,
    (match, key, rest) => {
      const value = get(dict, key);
      if (value == null) {
        console.warn(`  ! missing i18n key for ${lang}: ${key}`);
        return match;
      }
      return `data-i18n="${key}"${rest}>${escHtml(value)}`;
    }
  );
}

function markActiveLang(html, lang) {
  return html.replace(
    `<span class="lang-option" data-lang-option="${lang}">`,
    `<span class="lang-option active" data-lang-option="${lang}">`
  );
}

/* ---------- <head> SEO block ---------- */
function seoBlock({ lang, selfPath, altPath, title, description, ogType }) {
  const L = TRANSLATIONS[lang].seo;
  const alt = { [lang]: selfPath, [otherLang(lang)]: altPath };
  const lines = [
    `<link rel="canonical" href="${abs(selfPath)}">`,
    `<link rel="alternate" hreflang="es" href="${abs(alt.es)}">`,
    `<link rel="alternate" hreflang="en" href="${abs(alt.en)}">`,
    `<link rel="alternate" hreflang="x-default" href="${abs(alt[SITE.defaultLang])}">`,
    ``,
    `<meta property="og:type" content="${ogType}">`,
    `<meta property="og:site_name" content="Tringe">`,
    `<meta property="og:locale" content="${L.ogLocale}">`,
    `<meta property="og:locale:alternate" content="${TRANSLATIONS[otherLang(lang)].seo.ogLocale}">`,
    `<meta property="og:title" content="${escAttr(title)}">`,
    `<meta property="og:description" content="${escAttr(description)}">`,
    `<meta property="og:url" content="${abs(selfPath)}">`,
    `<meta property="og:image" content="${abs("/img/og-image.png")}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escAttr(title)}">`,
    `<meta name="twitter:description" content="${escAttr(description)}">`,
    `<meta name="twitter:image" content="${abs("/img/og-image.png")}">`,
  ];
  return lines.join("\n");
}

/* ---------- project page fragments ---------- */
function factsHtml(project, lang) {
  const dict = TRANSLATIONS[lang];
  return project.facts
    .map((fact) => {
      const [labelKey, valueSuffix] = FACT_KEYS[fact];
      const label = get(dict, labelKey);
      const value = get(dict, `projects.items.${project.key}.${valueSuffix}`);
      return [
        `    <div class="pd-fact">`,
        `      <span class="pd-fact-label">${escHtml(label)}</span>`,
        `      <span class="pd-fact-value">${escHtml(value)}</span>`,
        `    </div>`,
      ].join("\n");
    })
    .join("\n");
}

function moreProjectsHtml(current, lang) {
  const dict = TRANSLATIONS[lang];
  return PROJECTS.filter((p) => p.slug !== current.slug)
    .map((p) => {
      const title = get(dict, `projects.items.${p.key}.title`);
      return `      <a href="${projectUrl(lang, p.slug)}">${escHtml(title)}</a>`;
    })
    .join("\n");
}

function breadcrumbJsonLd(project, lang) {
  const dict = TRANSLATIONS[lang];
  const items = [
    { name: dict.nav.home, item: abs(homeUrl(lang)) },
    { name: dict.nav.projects, item: abs(homeUrl(lang)) + "#projects" },
    { name: get(dict, `projects.items.${project.key}.title`), item: abs(projectUrl(lang, project.slug)) },
  ];
  const list = items
    .map(
      (it, i) =>
        `    { "@type": "ListItem", "position": ${i + 1}, "name": "${escJson(it.name)}", "item": "${it.item}" }`
    )
    .join(",\n");
  return `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
${list}
  ]
}
</script>`;
}

function statsHtml(lang) {
  return TRANSLATIONS[lang].stats.items
    .map((s) =>
      [
        `    <div class="stat reveal">`,
        `      <span class="stat-value">${escHtml(s.value)}</span>`,
        `      <span class="stat-label">${escHtml(s.label)}</span>`,
        `    </div>`,
      ].join("\n")
    )
    .join("\n");
}

/* ---------- writers ---------- */
function writeFile(relPath, contents) {
  const full = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, contents, "utf8");
  console.log("  ->", relPath);
}

function buildHome(lang) {
  const dict = TRANSLATIONS[lang];
  const selfPath = homeUrl(lang);
  const altPath = homeUrl(otherLang(lang));
  let html = TPL("home.html");

  html = html
    .replaceAll("{{LANG}}", lang)
    .replaceAll("{{PROJECTS_BASE}}", `${langBase(lang)}/projects`)
    .replaceAll("{{ALT_URL}}", altPath)
    .replaceAll("{{ALT_LANG}}", otherLang(lang))
    .replaceAll("{{LANG_LABEL}}", escAttr(dict.seo.langLabel))
    .replaceAll("{{TITLE}}", escHtml(dict.seo.homeTitle))
    .replaceAll("{{DESCRIPTION}}", escAttr(dict.seo.homeDescription))
    .replace(
      "{{SEO}}",
      seoBlock({
        lang,
        selfPath,
        altPath,
        title: dict.seo.homeTitle,
        description: dict.seo.homeDescription,
        ogType: "website",
      })
    )
    .replace("{{STATS_ITEMS}}", statsHtml(lang));

  html = applyI18n(html, lang);
  html = markActiveLang(html, lang);
  writeFile(lang === SITE.defaultLang ? "index.html" : `${lang}/index.html`, html);
}

function buildProject(project, lang) {
  const dict = TRANSLATIONS[lang];
  const item = get(dict, `projects.items.${project.key}`);
  const selfPath = projectUrl(lang, project.slug);
  const altPath = projectUrl(otherLang(lang), project.slug);
  const title = `${item.title} | ${dict.seo.projectTitleSuffix}`;
  const description = item.stat;

  let html = TPL("project.html");

  html = html
    .replaceAll("{{IKEY}}", `projects.items.${project.key}`)
    .replaceAll("{{LANG}}", lang)
    .replaceAll("{{HOME}}", homeUrl(lang))
    .replaceAll("{{ALT_URL}}", altPath)
    .replaceAll("{{ALT_LANG}}", otherLang(lang))
    .replaceAll("{{LANG_LABEL}}", escAttr(dict.seo.langLabel))
    .replaceAll("{{TITLE}}", escHtml(title))
    .replaceAll("{{DESCRIPTION}}", escAttr(description))
    .replace(
      "{{SEO}}",
      seoBlock({ lang, selfPath, altPath, title, description, ogType: "article" })
    )
    .replace("{{BREADCRUMB}}", breadcrumbJsonLd(project, lang))
    .replace("{{FACTS}}", factsHtml(project, lang))
    .replace("{{MORE_PROJECTS}}", moreProjectsHtml(project, lang));

  html = applyI18n(html, lang);
  html = markActiveLang(html, lang);

  const dir = lang === SITE.defaultLang ? "projects" : `${lang}/projects`;
  writeFile(`${dir}/${project.slug}.html`, html);
}

function buildSitemap() {
  const urls = [];
  const push = (loc, alts) => {
    urls.push(
      [
        "  <url>",
        `    <loc>${abs(loc)}</loc>`,
        ...alts.map(
          ([hl, href]) =>
            `    <xhtml:link rel="alternate" hreflang="${hl}" href="${abs(href)}"/>`
        ),
        "    <lastmod>" + new Date().toISOString().slice(0, 10) + "</lastmod>",
        "  </url>",
      ].join("\n")
    );
  };

  const homeAlts = [
    ["es", homeUrl("es")],
    ["en", homeUrl("en")],
    ["x-default", homeUrl(SITE.defaultLang)],
  ];
  for (const lang of SITE.langs) push(homeUrl(lang), homeAlts);

  for (const p of PROJECTS) {
    const alts = [
      ["es", projectUrl("es", p.slug)],
      ["en", projectUrl("en", p.slug)],
      ["x-default", projectUrl(SITE.defaultLang, p.slug)],
    ];
    for (const lang of SITE.langs) push(projectUrl(lang, p.slug), alts);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>
`;
  writeFile("sitemap.xml", xml);
}

function build404() {
  // Static, minimal, Spanish-primary (Vercel serves /404.html for any miss).
  const es = TRANSLATIONS.es.notFound;
  const en = TRANSLATIONS.en.notFound;
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>404 | Tringe</title>
<meta name="robots" content="noindex">
<meta name="theme-color" content="#0a0a0d">
<link rel="icon" type="image/png" sizes="32x32" href="/img/favicon-32.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..600&family=Inter:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/styles.css">
<style>
  .nf{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:120px 24px;gap:14px}
  .nf-code{font-family:var(--font-head);font-size:clamp(4rem,14vw,8rem);font-weight:600;line-height:1;background:linear-gradient(100deg,var(--blue-light),var(--blue));-webkit-background-clip:text;background-clip:text;color:transparent}
  .nf h1{font-size:clamp(1.3rem,3vw,1.8rem)}
  .nf p{color:var(--text-muted);max-width:420px}
  .nf .btn{margin-top:18px}
  .nf-logo{height:60px;width:auto;margin-bottom:32px}
</style>
</head>
<body>
<div class="nf">
  <a href="/"><img src="/logo.png" alt="Tringe" class="nf-logo" width="440" height="365"></a>
  <div class="nf-code">404</div>
  <h1>${escHtml(es.title)}</h1>
  <p>${escHtml(es.text)}<br><span style="opacity:.6">${escHtml(en.text)}</span></p>
  <a href="/" class="btn btn-primary">${escHtml(es.cta)}</a>
</div>
<script src="/js/script.js"></script>
</body>
</html>
`;
  writeFile("404.html", html);
}

/* ---------- run ---------- */
console.log("Building Tringe (" + SITE.langs.join(", ") + ")");
for (const lang of SITE.langs) {
  buildHome(lang);
  for (const p of PROJECTS) buildProject(p, lang);
}
buildSitemap();
build404();
console.log("Done.");
