(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     Ano no rodapé
     --------------------------------------------------------------------- */
  var anoEl = document.getElementById("ano");
  if (anoEl) anoEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------------------
     Menu mobile
     --------------------------------------------------------------------- */
  var header = document.getElementById("siteHeader");
  var navToggle = document.getElementById("navToggle");
  var mobilePanel = document.getElementById("mobilePanel");

  function closeNav() {
    document.body.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  if (navToggle && header) {
    navToggle.addEventListener("click", function () {
      var isOpen = document.body.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      document.body.style.overflow = isOpen ? "hidden" : "";
    });

    mobilePanel.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });
  }

  /* ---------------------------------------------------------------------
     Scroll suave para links internos (#servicos, #galeria, etc.), com
     compensação da altura do header fixo. Feito via JS (em vez de
     scroll-behavior:smooth no CSS) para não brigar com o reflow do
     carregamento das fontes, que pode fazer o scroll nativo passar do alvo.
     --------------------------------------------------------------------- */
  var headerOffset = 88;
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    var hash = link.getAttribute("href");
    if (!hash || hash === "#") return;
    var target = document.querySelector(hash);
    if (!target) return;
    link.addEventListener("click", function (e) {
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top: top, behavior: "smooth" });
      if (history.pushState) history.pushState(null, "", hash);
    });
  });

  /* ---------------------------------------------------------------------
     Header sólido ao rolar
     --------------------------------------------------------------------- */
  function updateHeaderState() {
    if (window.scrollY > 40) {
      header.classList.add("is-solid");
    } else {
      header.classList.remove("is-solid");
    }
  }
  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });

  /* ---------------------------------------------------------------------
     Banner de cookies (LGPD) — escolha salva em localStorage
     --------------------------------------------------------------------- */
  var cookieBanner = document.getElementById("cookieBanner");
  var CONSENT_KEY = "nildasantos_cookie_consent";

  function getConsent() {
    try {
      return localStorage.getItem(CONSENT_KEY);
    } catch (err) {
      return null;
    }
  }
  function setConsent(value) {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch (err) {
      /* localStorage indisponível (modo privado etc.) — segue sem persistir */
    }
  }

  if (cookieBanner && !getConsent()) {
    window.setTimeout(function () {
      cookieBanner.classList.add("is-visible");
    }, 900);
  }

  var acceptBtn = document.getElementById("cookieAccept");
  var declineBtn = document.getElementById("cookieDecline");
  if (acceptBtn) {
    acceptBtn.addEventListener("click", function () {
      setConsent("all");
      cookieBanner.classList.remove("is-visible");
    });
  }
  if (declineBtn) {
    declineBtn.addEventListener("click", function () {
      setConsent("essential");
      cookieBanner.classList.remove("is-visible");
    });
  }
  var cookiePolicyLink = document.getElementById("cookiePolicyLink");
  if (cookiePolicyLink) {
    cookiePolicyLink.addEventListener("click", function (e) {
      e.preventDefault();
    });
  }

  /* ---------------------------------------------------------------------
     Animações (GSAP + ScrollTrigger) — com checagem de disponibilidade
     para o site continuar funcional caso o CDN falhe.
     --------------------------------------------------------------------- */
  if (typeof gsap === "undefined") return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
  }

  if (reduceMotion) {
    gsap.set(".reveal, .hero-title .line-inner, .hero-kicker, .hero-sub, .hero-actions, .hero-note", { clearProps: "all" });
    return;
  }

  /* ---- Momento de destaque: entrada do hero ---- */
  gsap.set(".hero-title .line-inner", { yPercent: 115 });
  gsap.set(".hero-kicker, .hero-sub, .hero-actions, .hero-note", { autoAlpha: 0, y: 22 });

  var heroTl = gsap.timeline({ defaults: { ease: "power4.out" } });
  heroTl
    .to(".hero-kicker", { autoAlpha: 1, y: 0, duration: 0.8 }, 0.1)
    .to(".hero-title .line-inner", { yPercent: 0, duration: 1.15, stagger: 0.14 }, 0.25)
    .to(".hero-sub", { autoAlpha: 1, y: 0, duration: 0.9 }, "-=0.55")
    .to(".hero-actions", { autoAlpha: 1, y: 0, duration: 0.9 }, "-=0.6")
    .to(".hero-note", { autoAlpha: 1, y: 0, duration: 0.8 }, "-=0.55");

  /* ---- Zoom lento e contínuo da imagem do hero (Ken Burns) ---- */
  gsap.to(".hero-media img, .hero-media video", {
    scale: 1.16,
    duration: 16,
    ease: "none",
  });

  /* ---- Parallax leve entre seções (imagem do hero sobe mais devagar que o scroll) ---- */
  if (typeof ScrollTrigger !== "undefined") {
    gsap.to(".hero-media img, .hero-media video", {
      yPercent: 14,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });

    /* ---- Revelações ao rolar: presas ao próprio scroll (scrub), não a um
       "play" disparado uma vez só. Isso faz o fade-in-up acontecer aos poucos,
       conforme a seção realmente entra na tela — e, como o progresso é
       calculado direto da posição do scroll, rolar de volta pra cima desfaz a
       revelação sozinho (sem precisar de lógica extra pra "resetar"). Só a
       entrada do hero (heroTl, acima) fica de fora disso de propósito: ela é
       o único momento que deve tocar uma vez só, ao carregar a página, e
       nunca se repetir ao voltar pro topo. ---- */
    var scrubReveal = { autoAlpha: 0, y: 30, ease: "power1.out", scrub: 0.6 };

    var groups = [
      document.querySelectorAll(".services-grid .reveal"),
      document.querySelectorAll(".gallery .reveal"),
      document.querySelectorAll(".steps-grid .reveal"),
      document.querySelectorAll(".location-details .reveal"),
    ];

    groups.forEach(function (nodes) {
      if (!nodes.length) return;
      gsap.from(nodes, {
        autoAlpha: 0,
        y: 34,
        ease: scrubReveal.ease,
        stagger: 0.12,
        scrollTrigger: {
          trigger: nodes[0].closest("section"),
          start: "top 95%",
          end: "top 15%",
          scrub: scrubReveal.scrub,
        },
      });
    });

    document.querySelectorAll(".reveal").forEach(function (el) {
      var inGroup = groups.some(function (nodes) {
        return Array.prototype.indexOf.call(nodes, el) !== -1;
      });
      if (inGroup) return;
      gsap.from(el, {
        autoAlpha: 0,
        y: 28,
        ease: scrubReveal.ease,
        scrollTrigger: {
          trigger: el,
          start: "top 95%",
          end: "top 25%",
          scrub: scrubReveal.scrub,
        },
      });
    });
  } else {
    gsap.set(".reveal", { clearProps: "all" });
  }
})();
