(function () {
  "use strict";

  /* ============================================================
     i18n
     ============================================================ */
  const LANG_KEY = "tringe-lang";

  function resolvePath(obj, path) {
    return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);
  }

  function getInitialLang() {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "en" || saved === "es") return saved;
    const browserLang = (navigator.language || "en").slice(0, 2);
    return browserLang === "es" ? "es" : "en";
  }

  let currentLang = getInitialLang();

  function applyTranslations(lang) {
    const dict = TRANSLATIONS[lang];
    if (!dict) return;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const value = resolvePath(dict, el.getAttribute("data-i18n"));
      if (value !== null) el.textContent = value;
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const value = resolvePath(dict, el.getAttribute("data-i18n-placeholder"));
      if (value !== null) el.setAttribute("placeholder", value);
    });

    document.documentElement.lang = lang;
    document.querySelectorAll("[data-lang-option]").forEach((el) => {
      el.classList.toggle("active", el.getAttribute("data-lang-option") === lang);
    });

    localStorage.setItem(LANG_KEY, lang);
    currentLang = lang;
  }

  const langToggle = document.getElementById("langToggle");
  if (langToggle) {
    langToggle.addEventListener("click", () => {
      applyTranslations(currentLang === "en" ? "es" : "en");
    });
  }

  applyTranslations(currentLang);

  /* ============================================================
     Preloader
     ============================================================ */
  window.addEventListener("load", () => {
    const pre = document.getElementById("preloader");
    if (pre) {
      pre.classList.add("hidden");
      setTimeout(() => pre.remove(), 700);
    }
  });

  /* ============================================================
     Navbar scroll state
     ============================================================ */
  const navbar = document.getElementById("navbar");
  const backToTop = document.getElementById("backToTop");

  function onScroll() {
    const scrolled = window.scrollY > 40;
    navbar.classList.toggle("scrolled", scrolled);
    backToTop.classList.toggle("visible", window.scrollY > 500);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ============================================================
     Mobile menu
     ============================================================ */
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  function closeMenu() {
    menuToggle.classList.remove("open");
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }

  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuToggle.classList.toggle("open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  /* ============================================================
     Reveal on scroll
     ============================================================ */
  const revealEls = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );
  revealEls.forEach((el) => observer.observe(el));

  /* ============================================================
     Contact form (client-side only — no backend wired up yet)
     ============================================================ */
  const form = document.getElementById("contactForm");
  const successMsg = document.getElementById("formSuccess");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      // Honeypot: real visitors never see or fill this field. If it has a
      // value, silently drop the submission instead of flagging it as spam —
      // a real backend should repeat this check server-side.
      const honeypot = form.querySelector("#company");
      if (honeypot && honeypot.value.trim() !== "") {
        form.reset();
        return;
      }

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      successMsg.classList.add("visible");
      form.reset();
      setTimeout(() => successMsg.classList.remove("visible"), 6000);
    });
  }

  /* ============================================================
     Footer year
     ============================================================ */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
