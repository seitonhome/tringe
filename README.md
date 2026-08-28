# Tringe website

Bilingual (Spanish default, English under `/en/`) static marketing site for
Tringe — civil engineering & construction, Cartagena, Colombia.
Hosted on Vercel: <https://tringe.vercel.app>

## How it works

Every page is **generated** for both languages from a template + a single
translation file. You never edit the built HTML directly.

```
build/i18n.mjs         All translatable copy (ES + EN). Single source of truth.
build/site.config.mjs  Base URL, language list, project list.
templates/home.html    Home page template (data-i18n + {{tokens}}).
templates/project.html  Project detail template.
build.mjs              The generator.
```

Running the generator writes, into the repo:

```
/index.html                     ES home        →  tringe.vercel.app/
/en/index.html                  EN home        →  tringe.vercel.app/en/
/projects/<slug>.html           ES projects
/en/projects/<slug>.html        EN projects
/sitemap.xml                    all URLs + hreflang alternates
/404.html                       not-found page
```

Static assets (`css/`, `js/`, `img/`, `logo.png`, `Brochure.pdf`,
`site.webmanifest`, `robots.txt`) are served as-is from the repo root.

## Editing

1. Change copy in `build/i18n.mjs`, or structure in `templates/*.html`.
2. Add/rename a project in `build/site.config.mjs` (+ its strings in `i18n.mjs`).
3. Regenerate and commit:

   ```
   node build.mjs
   git add -A && git commit
   ```

4. Push — Vercel just serves the committed files (`vercel.json` sets
   `outputDirectory: "."`; there is no build step on Vercel, and no
   `package.json` on purpose so Vercel keeps static auto-detection).

## SEO notes

- ES is canonical at the domain root; EN lives at `/en/`. Pages cross-link
  with `hreflang` (`es`, `en`, `x-default` → ES).
- After deploying, submit `https://tringe.vercel.app/sitemap.xml` in Google
  Search Console (URL-prefix property, verify with a meta tag).
- No automatic language redirect — the navbar toggle is a plain link, so
  crawlers see every version.
