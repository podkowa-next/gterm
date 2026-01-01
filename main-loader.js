/**
 * MAIN LOADER - The Central Nervous System of the Website
 * This script is the ONLY script that needs to be added to Webflow.
 * It manages dependencies, versions, and page-specific loading.
 */

(function() {
    // ============================================================
    // 1. CONFIGURATION
    // ============================================================
    
    // The Version: Change this ONE string to update every script on the site.
    const version = 'v0.0.7'; 
    
    // The Base URL: Where your repo files live on jsDelivr.
    const ghBaseUrl = `https://cdn.jsdelivr.net/gh/podkowa-next/gterm@${version}/`;

    // External Libraries: Kept here to keep the code clean below.
    const libs = {
        rive:     'https://unpkg.com/@rive-app/webgl2@latest',
        chartJs:  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
        finsweet: 'https://cdn.jsdelivr.net/npm/@finsweet/attributes@2/attributes.js',
        // Note: Assuming GSAP is loaded via Webflow interactions or another source?
        // If not, we should add GSAP here too for the Navbar to work.
    };


    // ============================================================
    // 2. THE LOADER ENGINE
    // ============================================================

    /**
     * loadScript()
     * A helper function to inject <script> tags into the document head.
     * 
     * @param {string} src       - The file name (repo) or full URL (external).
     * @param {object} options   - { isExternal: bool, attributes: object }
     */
    function loadScript(src, options = {}) {
        const script = document.createElement('script');
        script.src = options.isExternal ? src : ghBaseUrl + src;

        // --- CRITICAL FIX ---
        // Force the browser to execute these in the order we added them.
        // Without this, the small 'controller' file runs before the big 'library' file finishes.
        script.async = false; 

        // Handle Finsweet (Async + Module)
        // Finsweet is unique because it manages its own loading, so we respect its settings.
        if (options.attributes) {
            for (const [key, value] of Object.entries(options.attributes)) {
                if (value === true) {
                    script[key] = true; 
                } else {
                    script.setAttribute(key, value);
                }
            }
        }

        document.head.appendChild(script);
    }


    // ============================================================
    // 3. ROUTING LOGIC (The Traffic Controller)
    // ============================================================
    
    const path = window.location.pathname;

    // --- A. GLOBAL SCRIPTS (Load on EVERY page) ---
    
    // 1. Navbar Script (Now loaded from GitHub!)
    loadScript('navbar.js');

    // 2. Finsweet Attributes (Async + Module)
    loadScript(libs.finsweet, { 
        isExternal: true, 
        attributes: { async: true, type: 'module', 'fs-list': '' } 
    });


    // --- B. PAGE SPECIFIC SCRIPTS ---

    // 1. HOME PAGE (/)
    if (path === '/') {
        loadScript('home-cards.js');
    }

    // 2. RIVE PAGE (/jak-dziala-geotermia-stargard)
    if (path.includes('/jak-dziala-geotermia-stargard')) {
        // Load Library FIRST
        loadScript(libs.rive, { isExternal: true });
        // Load Controller SECOND
        loadScript('rive-controller.js');
    }

    // 3. CHART PAGES (Production & Environment)
    // Since both use the same logic, we use an OR operator (||)
    if (path.includes('/produkcja-ciepla-i-skala-oszczednosci') || 
        path.includes('/wplyw-na-srodowisko')) {
        
        // Load Chart.js Library FIRST
        loadScript(libs.chartJs, { isExternal: true });
        // Load Your Charts Code SECOND
        loadScript('charts-prod-env.js');
    }

    // 4. MAP PAGE (/polski-potencjal)
    if (path.includes('/polski-potencjal')) {
        loadScript('resources-map.js');
    }

    // 5. ARTICLES TEMPLATE (/artykuly/...)
    // This checks if the URL *starts with* or *contains* /artykuly/
    if (path.includes('/artykuly/')) {
        loadScript('articles-template.js');
    }

    // ============================================================
    // 4. FUTURE LOCALIZATION LOGIC (Example)
    // ============================================================
    /*
    if (path.startsWith('/en/')) {
        // You could load an English-specific config file here
        // loadScript('config-en.js');
    }
    */

})();