/* =======================================================
   UNIVERSAL NAVBAR SCRIPT
   Author: Bartek Podkowa / NEXT Design Studio
   ======================================================= */

document.addEventListener("DOMContentLoaded", function () {
  const html = document.documentElement;
  const body = document.body;
  const navMenu = document.querySelector('[data-navmenu="mobile"]');
  const hamburger = document.querySelector('[data-hamburger="mobile"]');

  /* ---------- CORE: Scroll-lock toggle ---------- */
  function toggleScrollLock(isLocked) {
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

  /* ---------- DESKTOP HOVER LOGIC (GSAP) ---------- */
  // Note: Ensure GSAP is loaded before this script runs!
  if (window.matchMedia("(min-width: 992px)").matches && window.gsap) {
    const dropdowns = document.querySelectorAll("[data-dropdown]");

    dropdowns.forEach((dropdown) => {
      const menuId = dropdown.getAttribute("data-dropdown");
      const megaMenu = document.querySelector(`[data-megamenu="${menuId}"]`);
      if (!megaMenu) return; 

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

      dropdownTl.eventCallback("onReverseComplete", () => {
        toggleScrollLock(false);
      });

      dropdown.addEventListener("mouseenter", () => dropdownTl.play());
      dropdown.addEventListener("mouseleave", () => dropdownTl.reverse());
    });
  }

  /* ---------- MOBILE HAMBURGER MENU LOGIC ---------- */
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

  /* ---------- RESIZE CLEANUP ---------- */
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const isDesktop = window.matchMedia("(min-width: 992px)").matches;

      if (isDesktop && body.classList.contains("scroll-lock")) {
        toggleScrollLock(false);
      }

      if (isDesktop && navMenu) {
        navMenu.style.removeProperty("display");
        navMenu.style.removeProperty("opacity");
        navMenu.style.removeProperty("transform");
      }
    }, 150);
  });

  /* ---------- INITIAL NORMALIZATION ---------- */
  const isDesktopStart = window.matchMedia("(min-width: 992px)").matches;
  if (isDesktopStart && navMenu) {
    navMenu.style.removeProperty("display");
    navMenu.style.removeProperty("opacity");
    navMenu.style.removeProperty("transform");
  }
});