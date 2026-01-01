/* ============================================================
   ARTICLES TEMPLATE LOGIC
   (Back Navigation + CMS Color Scheme)
============================================================ */

(function() {

    function initArticlesLogic() {
        console.log("🚀 Articles Template Script Loaded.");

        // --- 1. BACK NAVIGATION ---
        const backLinks = document.querySelectorAll('[data-back-link]');
        
        if (backLinks.length > 0) {
            backLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    if (history.length > 1) {
                        history.back();
                    } else {
                        window.location.href = "/skp"; // fallback URL
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
        // If script loads after DOM is ready (which happens with deferred loading), run immediately
        initArticlesLogic();
    }

})();