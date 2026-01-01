/* ============================================================
   CHARTS PRODUCTION ENVIRONMENT
   Integrated with Main-Loader Safety Check
============================================================ */

(function() {

    // Define the main logic
    function startChartSystem() {
        console.log("✅ Chart.js library detected. Initializing system...");

        /* ------------------------------------------------------------
           YOUR ORIGINAL LOGIC STARTS HERE
        ------------------------------------------------------------ */

        /* ============================================================
           Global INIT
           Wait 300 ms so Webflow can apply combo classes + CMS content
        ============================================================ */
        setTimeout(() => {
            initCharts();
            initWebflowTabs();
        }, 300);

        /* ============================================================
           Utility: wait until canvas has a real size
           (tabs/hidden content → offsetWidth=0 → Chart.js miscalculates)
        ============================================================ */
        function waitForRealSize(canvas, callback) {
            const check = () => {
                const w = canvas.offsetWidth;
                const h = canvas.offsetHeight;
                const style = getComputedStyle(canvas);
                const visible = style.display !== 'none' && style.visibility !== 'hidden';

                if (w > 50 && h > 50 && visible) {
                    callback();
                } else {
                    requestAnimationFrame(check);
                }
            };
            check();
        }

        /* ============================================================
           MAIN CHART INITIALIZATION
           (Runs at page load and after each tab switch)
        ============================================================ */
        function initCharts() {

            /* -------------------- Helpers -------------------- */
            const getBool = v => String(v).toLowerCase() === 'true';

            const getVar = (name, el = document.body) => {
                if (!name) return '';
                const clean = name.replace('var(', '').replace(')', '').trim();
                const out = getComputedStyle(el).getPropertyValue(clean).trim();
                return out || name;
            };

            const normalizeColor = v => {
                if (!v) return v;
                v = v.trim();
                if (v.startsWith('var(')) v = getVar(v);
                if (v.toLowerCase().startsWith('oklch(')) return v;
                const c = document.createElement('canvas').getContext('2d');
                c.fillStyle = v;
                return c.fillStyle || v;
            };

            // Semantic → CSS variable mapping
            const semanticToVar = {
                text: 'var(--charts---text)',
                alttext: 'var(--charts---alttext)',
                background: 'var(--charts---background)',
                altbackground: 'var(--charts---altbackground)',
                foreground: 'var(--charts---foreground)',
                altforeground: 'var(--charts---altforeground)',
                border: 'var(--charts---border)',
                altborder: 'var(--charts---altborder)',
                accent: 'var(--charts---accent)',
                altaccent: 'var(--charts---altaccent)',
                mixhover: 'var(--charts---mixhover)',
                mixoverlay: 'var(--charts---mixoverlay)',
                mixborder: 'var(--charts---mixborder)'
            };

            const resolveSemanticColor = (tokenRaw, wrapper, fallback) => {
                let token = (tokenRaw || '').trim();
                if (!token && fallback) token = fallback;
                if (!token) return '';

                const lower = token.toLowerCase();

                // literal colors (#, rgb, hsl, oklch)
                if (token.startsWith('#') ||
                    lower.startsWith('rgb(') ||
                    lower.startsWith('rgba(') ||
                    lower.startsWith('hsl(') ||
                    lower.startsWith('hsla(') ||
                    lower.startsWith('oklch(')) {
                    return token;
                }

                // semantic → var(...)
                if (semanticToVar[lower]) return getVar(semanticToVar[lower], wrapper);

                // raw var(...)
                if (token.startsWith('var(')) return getVar(token, wrapper);

                return token;
            };

            // Convert clamp(), rem, px, vw… → px
            const measureFont = (wrapper, fs) => {
                if (!fs) return 14;
                if (fs.startsWith('var(')) fs = getVar(fs, wrapper);

                // px → direct
                if (/^[0-9.]+px$/.test(fs)) return parseFloat(fs) || 14;

                // ALL COMPLEX VALUES measured visually
                const probe = document.createElement('div');
                probe.style.position = 'absolute';
                probe.style.visibility = 'hidden';
                probe.style.fontSize = fs;
                probe.textContent = 'M';
                wrapper.appendChild(probe);
                const px = parseFloat(getComputedStyle(probe).fontSize);
                probe.remove();
                return px || 14;
            };

            // Color dimming for hover (bars only)
            const withOpacity = (color, alpha) => {
                if (!color) return color;
                const c = color.trim().toLowerCase();

                if (c.startsWith('oklch(')) {
                    return color.includes('/') ?
                        color.replace(/\/[^)]+/, `/ ${alpha}`) :
                        color.replace(')', ` / ${alpha})`);
                }

                if (c.startsWith('rgba(')) {
                    return color.replace(/rgba\(([^,]+,[^,]+,[^,]+),[^)]+\)/, `rgba($1,${alpha})`);
                }

                if (c.startsWith('rgb(')) {
                    return color.replace(/rgb\(([^,]+,[^,]+,[^,]+)\)/, `rgba($1,${alpha})`);
                }

                if (color.startsWith('#')) {
                    let r, g, b;
                    if (color.length === 4) {
                        r = parseInt(color[1] + color[1], 16);
                        g = parseInt(color[2] + color[2], 16);
                        b = parseInt(color[3] + color[3], 16);
                    } else {
                        r = parseInt(color.slice(1, 3), 16);
                        g = parseInt(color.slice(3, 5), 16);
                        b = parseInt(color.slice(5, 7), 16);
                    }
                    return `rgba(${r},${g},${b},${alpha})`;
                }

                return color;
            };

            // Detect Safari (macOS + iOS)
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

            /* -------------------- Build all charts -------------------- */

            const wrappers = document.querySelectorAll('.chart-wrapper');
            if (!wrappers.length) return;

            wrappers.forEach(wrapper => {
                const canvas = wrapper.querySelector('canvas');
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                /* -------- Read user config from data-attributes -------- */
                const animatedRaw = wrapper.dataset.chAnimated === undefined ? true : getBool(wrapper.dataset.chAnimated);

                const cfg = {
                    type: (wrapper.dataset.chType || 'bar').toLowerCase(),
                    indexAxis: getBool(wrapper.dataset.chHorizontal) ? 'y' : 'x',
                    stacked: getBool(wrapper.dataset.chStacked),
                    fill: getBool(wrapper.dataset.chFill),
                    smooth: getBool(wrapper.dataset.chSmooth),
                    animated: isSafari ? false : animatedRaw,
                    ymax: parseFloat(wrapper.dataset.chYmax) || undefined,
                    yunit: wrapper.dataset.chYunit || '',
                    xlabels: wrapper.dataset.chXlabels ? JSON.parse(wrapper.dataset.chXlabels) : [],
                    datasets: wrapper.dataset.chDatasets ? JSON.parse(wrapper.dataset.chDatasets) : [],
                    pointRadius: parseFloat(wrapper.dataset.chPd) || 3,
                    lineBorderWidth: parseFloat(wrapper.dataset.chLinestroke) || 2
                };

                const fsToken = (wrapper.dataset.chFontsize || '').trim();
                cfg.fontSize = measureFont(wrapper, fsToken);

                let ff = (wrapper.dataset.chFont || '').trim();
                if (ff.startsWith('var(')) ff = getVar(ff, wrapper);
                if (!ff) ff = getComputedStyle(document.body).fontFamily;
                cfg.fontFamily = ff;

                cfg.textColor = resolveSemanticColor(wrapper.dataset.chTc, wrapper, 'Text');
                cfg.legendColor = resolveSemanticColor(wrapper.dataset.chLc, wrapper, 'AltText');
                cfg.gridColor = resolveSemanticColor(wrapper.dataset.chGc, wrapper, 'MixBorder');
                cfg.axisColor = resolveSemanticColor(wrapper.dataset.chAc, wrapper, 'Border');
                cfg.barFill1 = resolveSemanticColor(wrapper.dataset.chBf1, wrapper, 'Accent');
                cfg.barFill2 = resolveSemanticColor(wrapper.dataset.chBf2, wrapper, 'AltAccent');
                cfg.barStroke = resolveSemanticColor(wrapper.dataset.chBs, wrapper, 'Border');
                cfg.lineStroke1 = resolveSemanticColor(wrapper.dataset.chLs1, wrapper, 'Accent');
                cfg.lineStroke2 = resolveSemanticColor(wrapper.dataset.chLs2, wrapper, 'AltAccent');
                cfg.lineFill1 = resolveSemanticColor(wrapper.dataset.chLf1, wrapper, 'MixOverlay');
                cfg.lineFill2 = resolveSemanticColor(wrapper.dataset.chLf2, wrapper, 'MixOverlay');
                cfg.linePoint1 = resolveSemanticColor(wrapper.dataset.chLp1, wrapper, 'Accent');
                cfg.linePoint2 = resolveSemanticColor(wrapper.dataset.chLp2, wrapper, 'AltAccent');

                /* -------- Build dataset structure -------- */
                const HOVER_OPACITY = 0.7;
                let datasets;

                if (cfg.type === 'line') {
                    datasets = cfg.datasets.map((d, i) => ({
                        label: d.label,
                        data: d.values,
                        borderColor: normalizeColor(i === 0 ? cfg.lineStroke1 : cfg.lineStroke2),
                        backgroundColor: normalizeColor(i === 0 ? cfg.lineFill1 : cfg.lineFill2),
                        pointBackgroundColor: normalizeColor(i === 0 ? cfg.linePoint1 : cfg.linePoint2),
                        pointRadius: cfg.pointRadius,
                        borderWidth: cfg.lineBorderWidth,
                        fill: cfg.fill,
                        tension: cfg.smooth ? 0.4 : 0
                    }));
                } else {
                    datasets = cfg.datasets.map((d, i) => {
                        const base = normalizeColor(i === 0 ? cfg.barFill1 : cfg.barFill2);
                        return {
                            label: d.label,
                            data: d.values,
                            backgroundColor: base,
                            borderColor: normalizeColor(cfg.barStroke),
                            borderWidth: parseInt(wrapper.dataset.chBarBorderWidth) || 0,
                            hoverBackgroundColor: () => withOpacity(base, HOVER_OPACITY)
                        };
                    });
                }

                const labels = cfg.xlabels.length ? cfg.xlabels : Array.from({ length: datasets[0]?.data?.length || 0 }, (_, i) => i + 1);

                /* -------- WAIT FOR REAL SIZE, THEN BUILD THE CHART -------- */
                waitForRealSize(canvas, () => {
                    const chart = new Chart(ctx, {
                        type: cfg.type,
                        data: { labels, datasets },
                        options: {
                            animation: cfg.animated,
                            indexAxis: cfg.indexAxis,
                            maintainAspectRatio: false,
                            scales: cfg.type.match(/pie|doughnut|polararea/) ? {} : {
                                x: {
                                    stacked: cfg.stacked,
                                    ticks: { color: normalizeColor(cfg.textColor), font: { family: cfg.fontFamily, size: cfg.fontSize * 0.9 } },
                                    grid: { display: false },
                                    border: { color: normalizeColor(cfg.axisColor || cfg.gridColor) }
                                },
                                y: {
                                    stacked: cfg.stacked,
                                    max: cfg.ymax,
                                    title: {
                                        display: !!cfg.yunit,
                                        text: cfg.yunit,
                                        color: normalizeColor(cfg.textColor),
                                        font: { family: cfg.fontFamily, size: cfg.fontSize * 1.1, weight: '500' }
                                    },
                                    ticks: {
                                        color: normalizeColor(cfg.textColor),
                                        font: { family: cfg.fontFamily, size: cfg.fontSize * 0.9 },
                                        callback: v => v.toLocaleString()
                                    },
                                    grid: { color: normalizeColor(cfg.gridColor) },
                                    border: { color: normalizeColor(cfg.axisColor || cfg.gridColor) }
                                }
                            },
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: { color: normalizeColor(cfg.legendColor), font: { family: cfg.fontFamily, size: cfg.fontSize } }
                                },
                                tooltip: { enabled: true }
                            }
                        }
                    });

                    const ro = new ResizeObserver(() => {
                        chart.resize();
                        chart.update('none');
                    });
                    ro.observe(canvas);
                });
            });
        }


        /* ============================================================
           TAB HANDLER (scoped by data-ch-tabgroup)
        ============================================================ */
        function initWebflowTabs() {
            if (window._chartsTabsBound) return;
            window._chartsTabsBound = true;

            const tabGroups = document.querySelectorAll('[data-ch-tabgroup]');
            if (!tabGroups.length) return;

            tabGroups.forEach(group => {
                const menu = group.querySelector('[role="tablist"]') || group.querySelector('.w-tab-menu');
                if (!menu) return;

                const tabs = menu.querySelectorAll('[role="tab"], .w-tab-link');
                if (!tabs.length) return;

                tabs.forEach(tab => {
                    tab.addEventListener('click', () => {
                        setTimeout(() => {
                            const activePane = group.querySelector('.w-tab-pane.w--tab-active') || group.querySelector('[role="tabpanel"].w--tab-active');
                            if (!activePane) return;

                            const style = getComputedStyle(activePane);
                            const durations = style.transitionDuration.split(',');
                            const properties = style.transitionProperty.split(',');
                            let durationMs = 0;

                            durations.forEach((d, i) => {
                                const prop = (properties[i] || '').trim();
                                if (prop === 'opacity' || prop === 'all') {
                                    const ms = parseFloat(d) * 1000;
                                    if (ms > durationMs) durationMs = ms;
                                }
                            });

                            if (!durationMs) durationMs = 150;

                            const canvases = group.querySelectorAll('canvas');
                            canvases.forEach(c => { c.style.opacity = '0'; });

                            setTimeout(() => {
                                if (window.Chart && Chart.instances) {
                                    Object.values(Chart.instances).forEach(ch => ch.destroy());
                                }
                                initCharts();
                                setTimeout(() => {
                                    canvases.forEach(c => { c.style.opacity = '1'; });
                                }, 60);
                            }, durationMs + 60);
                        }, 40);
                    });
                });
            });
        }
    }


    // ============================================================
    // THE SAFETY WAITER
    // Checks every 50ms if the 'Chart' library is ready
    // ============================================================
    const chartLibCheck = setInterval(() => {
        if (typeof Chart !== 'undefined') {
            clearInterval(chartLibCheck);
            startChartSystem();
        }
    }, 50);

    // Stop checking after 5 seconds to prevent memory leaks if library fails
    setTimeout(() => {
        if (typeof Chart === 'undefined') console.error("❌ Chart.js library failed to load.");
        clearInterval(chartLibCheck);
    }, 5000);

})();