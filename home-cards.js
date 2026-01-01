(function() {
    // CONFIGURATION
    const TARGET_CLASS = '.articles_item-home';
    const ANIMATION_DELAY = 3.5; 
    let hasAnimated = false; // Safety flag to prevent double-firing

    // Function to run the animation
    function runAnimation(cards) {
        if (hasAnimated) return; 
        
        // Safety Check: Ensure GSAP is actually ready
        if (typeof gsap === 'undefined') {
            console.warn("GSAP not loaded yet.");
            return;
        }

        hasAnimated = true;

        // 1. Force hidden immediately
        gsap.set(cards, { 
            autoAlpha: 0, 
            y: "10rem", 
            scale: 0.85 
        });

        // 2. Animate
        gsap.to(cards, {
            autoAlpha: 1,
            y: "0rem",
            scale: 1,
            duration: 1,
            ease: "expo.out",
            delay: ANIMATION_DELAY,
            stagger: 0.25
        });
    }

    // CHECK 1: Are the cards already there?
    const existingCards = document.querySelectorAll(TARGET_CLASS);
    if (existingCards.length > 0) {
        runAnimation(existingCards);
        return; 
    }

    // CHECK 2: Watch for Finsweet to inject them
    const observer = new MutationObserver((mutations, obs) => {
        const cards = document.querySelectorAll(TARGET_CLASS);
        if (cards.length > 0) {
            runAnimation(cards);
            obs.disconnect(); // Stop watching to save performance
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();