(function () {
  "use strict";

  /* ============================================================
     Language

     Each language is its own pre-rendered page (/ for Spanish, /en/ for
     English) — see build.mjs. The toggle in the navbar is a plain link to
     the counterpart URL, so no client-side text swapping is needed here.
     We only remember the visitor's choice (no auto-redirect — that would
     confuse crawlers and hurt the hreflang setup).
     ============================================================ */
  const LANG_KEY = "tringe-lang";
  const pageLang = document.documentElement.lang === "en" ? "en" : "es";

  try {
    const toggle = document.getElementById("langToggle");
    if (toggle) {
      toggle.addEventListener("click", () => {
        try { localStorage.setItem(LANG_KEY, pageLang === "en" ? "es" : "en"); } catch (e) {}
      });
    }
    localStorage.setItem(LANG_KEY, pageLang);
  } catch (e) {
    /* private mode / storage disabled — ignore */
  }

  /* ============================================================
     Preloader — hide on load, with a hard timeout fallback so a
     slow/broken resource can never leave it covering the page.
     ============================================================ */
  function hidePreloader() {
    const pre = document.getElementById("preloader");
    if (!pre || pre.classList.contains("hidden")) return;
    pre.classList.add("hidden");
    setTimeout(() => pre.remove(), 700);
  }
  window.addEventListener("load", hidePreloader);
  setTimeout(hidePreloader, 4000);

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

  // Safety net: if the observer never fires for some element (edge cases,
  // no support), make sure nothing stays permanently invisible.
  window.addEventListener("load", () => {
    setTimeout(() => {
      document.querySelectorAll(".reveal:not(.is-visible)").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight) el.classList.add("is-visible");
      });
    }, 600);
  });

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
