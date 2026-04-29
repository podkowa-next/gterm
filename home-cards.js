(function() {
    // New Class Name
    const TARGET_CLASS = '.articles_item-homepage'; 
    
    // Check if elements exist
    const cards = document.querySelectorAll(TARGET_CLASS);
    
    if (cards.length === 0) return; // Exit if nothing found

    // Animate
    gsap.set(cards, { autoAlpha: 0, y: "10rem", scale: 0.85 });
    
    gsap.to(cards, {
        autoAlpha: 1,
        y: "0rem",
        scale: 1,
        duration: 1,
        ease: "expo.out",
        delay: 1.25, // Reduced delay (3.5s might be too long for static content)
        stagger: 0.35
    });
})();