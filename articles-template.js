/* ============================================================
   ARTICLES TEMPLATE LOGIC
   (Smart Back Navigation + CMS Color Scheme)
============================================================ */

(function() {

    function initArticlesLogic() {
        console.log("🚀 Articles Template Script Loaded.");

        // --- 1. BACK NAVIGATION ---
        const backLinks = document.querySelectorAll('[data-back-link]');
        
        // ▼▼▼ CONFIGURATION: SET YOUR MAP PAGE URL HERE ▼▼▼
        // If your map is the homepage, keep it "/". 
        // If it is at gterm.webflow.io/map, change it to "/map".
        const fallbackUrl = "/polski-potencjal"; 
        
        if (backLinks.length > 0) {
            backLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();

                    // LOGIC CHECK:
                    // 1. Is there history in this tab? (length > 1)
                    // 2. Did the user come from an internal page? (referrer check)
                    
                    const hasHistory = history.length > 1;
                    const cameFromMySite = document.referrer && document.referrer.indexOf(window.location.hostname) !== -1;

                    // If both are true, it's safe to use the browser 'Back' button behavior
                    if (hasHistory && cameFromMySite) {
                        console.log("Returning via History");
                        history.back();
                    } 
                    // Otherwise (New Tab, Direct Link, or External Link), force redirect to Map
                    else {
                        console.log("Fallback: Redirecting to Map");
                        window.location.href = fallbackUrl;
                    }
                });
            });
        }

        // --- 2. CMS COLOR SCHEME ---
        // Get the hidden div that carries the CMS-bound data attribute
        const root = document.querySelector('[data-scheme]');
        
        if (!root) {
            console.warn("⚠️ [Articles] Element with 'data-scheme' attribute NOT found. Colors will not apply.");
            return;
        }

        // Read CMS value (e.g. "color-scheme-2")
        const scheme = root.dataset.scheme?.trim();
        console.log(`ℹ️ [Articles] CMS Scheme detected: "${scheme}"`);

        // Fallback to default color scheme if CMS field is empty or undefined
        const finalScheme = scheme || 'color-scheme-0';

        // Remove any existing color-scheme-* classes from <body>
        document.body.classList.forEach(cls => {
            if (cls.startsWith('color-scheme-')) {
                document.body.classList.remove(cls);
            }
        });

        // Apply the new scheme
        document.body.classList.add(finalScheme);
        console.log(`✅ [Articles] Applied class to Body: "${finalScheme}"`);
    }

    // --- SAFETY CHECK: Ensure DOM is Ready ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initArticlesLogic);
    } else {
        // If script loads after DOM is ready (deferred loading), run immediately
        initArticlesLogic();
    }

})();