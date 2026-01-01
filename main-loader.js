(function() {
    // --- 1. CONFIGURATION ---
    // Update this ONE number to upgrade your whole site
    const version = 'v0.0.6'; 
    
    const ghUrl = `https://cdn.jsdelivr.net/gh/podkowa-next/gterm@${version}/`;
    
    // External Libraries (The "Tools")
    const libs = {
        rive: 'https://unpkg.com/@rive-app/webgl2@latest',
        echarts: 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js'
    };

    /**
     * Loads a script into the document head
     * @param {string} src - The URL or filename
     * @param {boolean} isExternal - If true, uses src as-is. If false, prepends your GitHub URL.
     */
    function loadScript(src, isExternal = false) {
        let script = document.createElement('script');
        script.src = isExternal ? src : ghUrl + src;
        script.defer = true; // Crucial: Ensures scripts execute in the order we add them
        document.head.appendChild(script);
    }

    // --- 2. ROUTING LOGIC ---
    const path = window.location.pathname;

    // A. RIVE ANIMATIONS
    // We check for the element ID so we don't depend on URL paths (safer for CMS)
    if (document.getElementById('rive')) {
        // Order matters! Library first, then your controller.
        loadScript(libs.rive, true);
        loadScript('rive-controller.js');
    }

    // B. MAPS
    // Only on Contact page
    if (path.includes('/contact')) {
        loadScript('resources-map.js');
    }

    // C. CARDS / HOME
    // Only on Home or Blog
    if (path === '/' || path.includes('/blog')) {
        loadScript('head-cards.js');
    }
    
    // D. CHARTS (Example for future)
    if (document.querySelector('[data-chart]')) {
        loadScript(libs.echarts, true);
        loadScript('my-charts.js');
    }

})();