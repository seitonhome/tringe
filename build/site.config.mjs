// Site-wide build configuration.

export const SITE = {
  baseUrl: "https://tringe.vercel.app",
  defaultLang: "es",          // served at the domain root
  langs: ["es", "en"],        // "en" is served under /en/
};

// URL prefix for a language: "" for the default (root), "/en" otherwise.
export function langBase(lang) {
  return lang === SITE.defaultLang ? "" : `/${lang}`;
}

// Project detail pages. `key` maps into TRANSLATIONS.<lang>.projects.items.<key>.
// `facts` lists which rows the fact strip shows (some projects have no area figure).
export const PROJECTS = [
  { slug: "torre-32-pisos",      key: "tower32",      facts: ["category", "area", "role", "location"] },
  { slug: "murano-trade-center", key: "murano",       facts: ["category", "role", "location"] },
  { slug: "edificio-nautica",    key: "nautica",      facts: ["category", "role", "location"] },
  { slug: "gobernacion-bolivar", key: "governorate",  facts: ["category", "role", "location"] },
  { slug: "refineria-cartagena", key: "refinery",     facts: ["category", "role", "location"] },
  { slug: "puerto-velero",       key: "puertovelero", facts: ["category", "area", "role", "location"] },
];

// Social links shown in the footer + contact block.
// Put the real URL to turn an icon into a working link; leave it "" and the
// icon still renders (as a non-clickable placeholder) so the row stays visible.
export const SOCIAL = [
  { name: "WhatsApp",  url: "https://wa.me/573008157674" },
  { name: "Facebook",  url: "" },
  { name: "Instagram", url: "" },
];

// fact name -> [ label i18n key, value i18n key suffix ]
export const FACT_KEYS = {
  category: ["projectPage.factLabels.category", "cat"],
  area:     ["projectPage.factLabels.area", "area"],
  role:     ["projectPage.factLabels.role", "role"],
  location: ["projectPage.factLabels.location", "location"],
};
