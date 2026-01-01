/* =======================================================
   UNIVERSAL NAVBAR SCRIPT
   (Desktop + Mobile Scroll-Lock + Resize Normalizer)
   GSAP-synchronized scroll-lock for perfect timing
   =======================================================
   Author: Bartek Podkowa / NEXT Design Studio
   Version: 1.3 (sticky-navbar optimized)
   -------------------------------------------------------
   SUMMARY
   • Locks body scroll when dropdown or mobile menu is open
   • Prevents layout shift by compensating scrollbar width
   • Syncs scroll unlock with GSAP reverse-complete timing
   • Auto-resets all states on viewport resize / breakpoint change
   ------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", function () {
  const html = document.documentElement;
  const body = document.body;
  const navMenu = document.querySelector('[data-navmenu="mobile"]');
  const hamburger = document.querySelector('[data-hamburger="mobile"]');

  /* ---------- CORE: Scroll-lock toggle ---------- */
  function toggleScrollLock(isLocked) {
    // Measure scrollbar width for compensation (sticky layout safe)
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    if (isLocked) {
      body.classList.add("scroll-lock");
      if (scrollbarWidth > 0) {
        body.style.paddingRight = scrollbarWidth + "px";
      }
    } else {
      body.classList.remove("scroll-lock");
      body.style.removeProperty("padding-right");
    }
  }

  /* =======================================================
     DESKTOP HOVER LOGIC — GSAP synchronized
     =======================================================
     • Runs only on ≥992px (desktop breakpoint)
     • Each dropdown builds its own GSAP timeline
     • Scroll lock starts at animation open
     • Scroll unlock triggers on reverse-complete (after fade-out)
     ------------------------------------------------------- */
  if (window.matchMedia("(min-width: 992px)").matches && window.gsap) {
    const dropdowns = document.querySelectorAll("[data-dropdown]");

    dropdowns.forEach((dropdown) => {
      const menuId = dropdown.getAttribute("data-dropdown");
      const megaMenu = document.querySelector(`[data-megamenu="${menuId}"]`);
      if (!megaMenu) return; // skip if menu not found

      // Define GSAP open/close timeline
      const dropdownTl = gsap.timeline({ paused: true })
        .fromTo(
          megaMenu,
          { opacity: 0, y: "1.5rem", pointerEvents: "none" },
          {
            opacity: 1,
            y: "0rem",
            duration: 0.3,
            ease: "power2.out",
            pointerEvents: "auto",
            onStart: () => toggleScrollLock(true)
          }
        );

      // Unlock scroll only after fade-out completes
      dropdownTl.eventCallback("onReverseComplete", () => {
        toggleScrollLock(false);
      });

      // Hover triggers (desktop only)
      dropdown.addEventListener("mouseenter", () => dropdownTl.play());
      dropdown.addEventListener("mouseleave", () => dropdownTl.reverse());
    });
  }

  /* =======================================================
     MOBILE HAMBURGER MENU LOGIC
     =======================================================
     • Runs only on ≤991px
     • Toggles scroll lock when menu opens/closes
     ------------------------------------------------------- */
  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      const isMobile = window.matchMedia("(max-width: 991px)").matches;
      if (!isMobile) return;

      const menuVisible =
        getComputedStyle(navMenu).display !== "none" &&
        parseFloat(getComputedStyle(navMenu).opacity) > 0.1;

      toggleScrollLock(!menuVisible);
    });
  }

  /* =======================================================
     RESIZE CLEANUP (debounced)
     =======================================================
     • Unlocks scroll if resizing to desktop
     • Resets GSAP-controlled inline styles
     ------------------------------------------------------- */
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const isDesktop = window.matchMedia("(min-width: 992px)").matches;

      // 1️⃣ Unlock scroll if moving to desktop
      if (isDesktop && body.classList.contains("scroll-lock")) {
        toggleScrollLock(false);
      }

      // 2️⃣ Normalize nav-menu inline styles for desktop layout
      if (isDesktop && navMenu) {
        navMenu.style.removeProperty("display");
        navMenu.style.removeProperty("opacity");
        navMenu.style.removeProperty("transform");
      }
    }, 150); // debounce delay
  });

  /* =======================================================
     INITIAL NORMALIZATION
     =======================================================
     • Runs once on page load
     • Ensures menu starts in desktop-ready state
     ------------------------------------------------------- */
  const isDesktopStart = window.matchMedia("(min-width: 992px)").matches;
  if (isDesktopStart && navMenu) {
    navMenu.style.removeProperty("display");
    navMenu.style.removeProperty("opacity");
    navMenu.style.removeProperty("transform");
  }
});