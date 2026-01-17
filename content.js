// Meta Ads Library Downloader - V4.0 (First Principles Refactor)
// Architecture: Store-Driven Event Delegation (The "Triad" Pattern)
(function () {
    'use strict';

    const VERSION = '4.0';
    console.log(`🚀 Meta Ads Downloader V${VERSION}: Initializing...`);

    // --- 0. SAFETY CHECKS ---
    if (!window.location.href.includes('facebook.com/ads/library')) return;
    if (window.metaAdsV4Active) return;
    window.metaAdsV4Active = true;

    // --- 1. THE STORE (Central Brain) ---
    // Single source of truth. DOM updates react to this state.
    const Store = {
        state: {
            selectedAds: new Map(), // Map<id, adData>
            isMinimized: true,      // Default to minimized
            version: VERSION,
            downloadState: {        // Progress tracking for V4.2
                active: false,
                currentAd: 0,
                totalAds: 0,
                currentSet: 0,
                totalSets: 0,
                statusMessage: '',
                percent: 0
            }
        },
        listeners: new Set(),

        subscribe(fn) {
            this.listeners.add(fn);
        },

        notify() {
            this.listeners.forEach(fn => fn(this.state));
        },

        // Actions
        toggleSelection(id, data) {
            if (this.state.selectedAds.has(id)) {
                this.state.selectedAds.delete(id);
            } else {
                this.state.selectedAds.set(id, data);
            }
            this.notify();
        },

        bulkSelect(entries) {
            entries.forEach(([id, data]) => {
                this.state.selectedAds.set(id, data);
            });
            this.notify();
        },

        clearSelection() {
            this.state.selectedAds.clear();
            this.notify();
        },

        setMinimized(isMin) {
            this.state.isMinimized = isMin;
            this.notify();
        },

        updateDownload(patch) {
            this.state.downloadState = { ...this.state.downloadState, ...patch };
            this.notify();
        }
    };

    // --- 1.5 STEALTH ENGINE (Anti-Detection) ---
    const Stealth = {
        async delay(ms) { return new Promise(r => setTimeout(r, ms)); },
        async jitter(min = 500, max = 2500) {
            const ms = Math.floor(Math.random() * (max - min + 1) + min);
            return this.delay(ms);
        },
        async rest() {
            // "Human" break between sets
            const ms = Math.floor(Math.random() * (12000 - 5000 + 1) + 5000);
            return this.delay(ms);
        }
    };

    // --- 2. GLOBAL STYLES (The Look) ---
    function injectStyles() {
        const css = `
            /* Premium B&W UI Tokens */
            :root {
                --ma-black: #050505;
                --ma-white: #ffffff;
                --ma-gray: #f0f0f0;
                --ma-border: #e0e0e0;
                --ma-font: 'Inter', system-ui, -apple-system, sans-serif;
            }

            /* Toolbar Injection */
            .ma-toolbar {
                margin: 12px;
                padding: 16px;
                background: var(--ma-white);
                border: 1px solid var(--ma-black);
                font-family: var(--ma-font);
                font-size: 11px;
                letter-spacing: 0.02em;
                color: var(--ma-black);
                display: flex;
                flex-direction: column;
                gap: 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            }
            
            .ma-row { display: flex; justify-content: space-between; align-items: center; }
            .ma-grid { display: grid; grid-template-columns: 1fr; gap: 8px; }
            .ma-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
            .ma-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }

            /* Buttons */
            .ma-btn {
                border: 1px solid var(--ma-black);
                background: var(--ma-white);
                color: var(--ma-black);
                padding: 10px;
                text-align: center;
                text-transform: uppercase;
                font-weight: 700;
                cursor: pointer;
                font-size: 10px;
                transition: all 0.1s ease;
            }
            .ma-btn:hover { background: var(--ma-gray); }
            .ma-btn.primary { background: var(--ma-black); color: var(--ma-white); }
            .ma-btn.primary:hover { opacity: 0.9; }
            .ma-btn.dimmed { opacity: 0.3; }
            .ma-btn.dimmed:hover { opacity: 1; }

            /* Checkbox */
            .ma-checkbox {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                font-weight: 800;
                font-size: 11px;
                user-select: none;
            }
            .ma-chk-input {
                width: 16px; 
                height: 16px; 
                accent-color: var(--ma-black); 
                cursor: pointer;
            }

            /* Global Widget (Bottom Right) */
            #ma-global-widget {
                position: fixed;
                bottom: 30px;
                right: 30px;
                z-index: 999999;
                font-family: var(--ma-font);
                display: flex;
                flex-direction: column;
                align-items: flex-end;
            }

            /* Minimized Icon */
            #ma-icon {
                width: 56px;
                height: 56px;
                background: var(--ma-black);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--ma-white);
                cursor: pointer;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                border: 2px solid var(--ma-white);
                transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            #ma-icon:hover { transform: scale(1.05); }
            #ma-icon svg { width: 24px; height: 24px; stroke-width: 2.5; }

            /* Expanded Panel */
            #ma-panel {
                background: var(--ma-black);
                color: var(--ma-white);
                padding: 20px;
                border-radius: 8px;
                min-width: 260px;
                box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-bottom: 20px; /* Space above icon if we want stacked? Or generic positioning */
                /* Actually let's replicate the previous design: Panel replaces Icon or sits nearby? 
                   Previous design: Panel was separate. 
                   New V4: Panel IS the widget when expanded. Icon IS the widget when minimized. */
                transform-origin: bottom right;
                animation: ma-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }

            @keyframes ma-slide-up {
                from { opacity: 0; transform: translateY(20px) scale(0.95); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }

            .ma-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #333;
                padding-bottom: 12px;
                margin-bottom: 4px;
            }
            .ma-panel-title { font-weight: 800; font-size: 11px; letter-spacing: 0.1em; color: #888; }
            .ma-close { background: none; border: none; color: #fff; cursor: pointer; font-size: 16px; padding: 4px; }
            
            .ma-panel-btn {
                background: #1a1a1a;
                border: 1px solid #333;
                color: #fff;
                padding: 12px;
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
                text-align: left;
                cursor: pointer;
                border-radius: 4px;
                transition: background 0.2s;
            }
            .ma-panel-btn:hover { background: #333; }
            .ma-panel-btn.primary { background: #fff; color: #000; border-color: #fff; }
            .ma-panel-btn.primary:hover { background: #e0e0e0; }
            
            .hidden { display: none !important; }

            /* Progress Bar */
            .ma-progress-container {
                width: 100%;
                height: 6px;
                background: #333;
                border-radius: 3px;
                overflow: hidden;
                margin: 10px 0;
            }
            .ma-progress-fill {
                height: 100%;
                background: var(--ma-white);
                transition: width 0.3s ease;
            }
            .ma-status-msg {
                font-size: 9px;
                font-weight: 800;
                color: #888;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                margin-bottom: 4px;
            }

            /* Animations */
            @keyframes ma-pulse {
                0% { opacity: 1; }
                50% { opacity: 0.6; }
                100% { opacity: 1; }
            }
            .ma-pulsing { animation: ma-pulse 1.5s infinite ease-in-out; }

            /* Status & Scroll Widgets */
            #ma-status {
                font-family: var(--ma-font);
                font-size: 9px;
                font-weight: 600;
                letter-spacing: 0.05em;
            }
            #ma-scroll button {
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                transition: transform 0.1s;
            }
            #ma-scroll button:active { transform: scale(0.95); }
        `;

        const tryInject = () => {
            const head = document.head || document.documentElement;
            if (head) {
                const s = document.createElement('style');
                s.textContent = css;
                head.appendChild(s);
            } else {
                requestAnimationFrame(tryInject);
            }
        };
        tryInject();
    }

    // --- 3. DOM INJECTOR (The Eyes) ---
    // Pure functions to stamp HTML. No event listeners attached here.
    const Injector = {
        scan() {
            // Find "Library ID" text nodes efficiently
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
            let node;
            while (node = walker.nextNode()) {
                if (node.nodeValue && node.nodeValue.includes('Library ID:')) {
                    this.processAd(node);
                }
            }
        },

        processAd(textNode) {
            // 1. Find the Card Container
            const card = this.findCardRoot(textNode);
            if (!card || card.hasAttribute('data-ma-id')) return;

            // 2. Extract ID
            const match = textNode.nodeValue.match(/ID: (\d+)/);
            if (!match) return;
            const id = match[1];

            // 3. Mark as processed
            card.setAttribute('data-ma-id', id);
            card.style.position = 'relative'; // Ensure containment

            // 4. Inject Toolbar
            // Note: We pre-calculate 'hasVideo' for initial render class, 
            // but the Controller checks live data on click.
            const hasVideo = !!card.querySelector('video');
            const hasImage = !!card.querySelector('img');

            const html = `
                <div class="ma-toolbar" data-id="${id}">
                    <div class="ma-row">
                        <label class="ma-checkbox">
                            <input type="checkbox" class="ma-chk-input" data-action="toggle-select" data-id="${id}">
                            SELECT AD
                        </label>
                        <span style="color:#888; font-size:9px;">ID: ${id}</span>
                    </div>
                    
                    <div class="ma-grid">
                        <button class="ma-btn primary" data-action="dl-zip" data-id="${id}">Download ZIP</button>
                        <div class="ma-grid-2">
                            <button class="ma-btn" data-action="dl-zip-nologo" data-id="${id}">Zip (No Logo)</button>
                            <button class="ma-btn" data-action="dl-raw" data-id="${id}">All (Raw)</button>
                        </div>
                    </div>

                    <div class="ma-grid-3">
                        <button class="ma-btn" data-action="dl-adcopy" data-id="${id}">Ad-Copy</button>
                        <button class="ma-btn ${hasVideo ? '' : 'dimmed'}" data-action="dl-video" data-id="${id}">Video</button>
                        <button class="ma-btn ${hasImage ? '' : 'dimmed'}" data-action="dl-image" data-id="${id}">Image</button>
                    </div>
                </div>
            `;

            // Insert at bottom of card
            card.insertAdjacentHTML('beforeend', html);
        },

        findCardRoot(node) {
            let el = node.parentElement;
            // Climb up to 15 levels to find a likely container
            for (let i = 0; i < 15; i++) {
                if (!el) return null;
                // Heuristics: significant text content + media presence often implies the card root
                // But generally, the Library ID is at the bottom of the card.
                // We look for a block that contains the image/video and the footer.
                if (el.tagName === 'DIV' && el.clientWidth > 250) {
                    // A generic div with some width is a candidate. 
                    // Ideally we'd look for a specific class, but Meta obfuscates.
                    // Let's rely on the fact that the ID is inside the footer.
                    // The Card Root is usually 3-5 parents up from the ID.
                }
                // Stop if we hit a grid item wrapper style or body
                if (el === document.body) return null;

                // Safety: check if this element CONTAINS media
                if (el.querySelector('video, img[src*="scontent"]')) {
                    return el; // This is a good enough guess for the boundary
                }
                el = el.parentElement;
            }
            return null;
        }
    };

    // --- 4. CONTROLLER (The Hands) ---
    // Single event listener for the entire page.
    const Controller = {
        init() {
            // Wait for body before observing
            const startObserver = () => {
                if (!document.body) {
                    requestAnimationFrame(startObserver);
                    return;
                }
                document.addEventListener('click', (e) => this.handleClick(e));
                
                // Debounced Observer for Performance
                // We only scan when the DOM settles to prevent scroll blocking
                let scanTimeout;
                const observer = new MutationObserver(() => {
                    if (scanTimeout) clearTimeout(scanTimeout);
                    scanTimeout = setTimeout(() => {
                        (window.requestIdleCallback || window.setTimeout)(() => Injector.scan());
                    }, 150); // 150ms debounce
                });
                
                observer.observe(document.body, { childList: true, subtree: true });
                
                // Initial scan
                (window.requestIdleCallback || window.setTimeout)(() => Injector.scan());
            };
            startObserver();
        },

        async handleClick(e) {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;
            const id = target.dataset.id;

            // Ad Actions
            if (id) {
                // Find the card element to extract FRESH data
                const card = document.querySelector(`[data-ma-id="${id}"]`);
                if (!card) return console.warn('Card not found for ID', id);

                const data = DataExtractor.extract(card, id);

                if (action === 'toggle-select') {
                    // Checkbox value needs to be read from the input itself
                    // Note: 'closest' found the target, e.target is likely the input.
                    // If e.target isn't the input (e.g. label click), we toggle state manually.
                    Store.toggleSelection(id, data);

                } else if (action === 'dl-zip') {
                    await this.animateBtn(target, () => DownloadManager.downloadZip(data, id, false));
                } else if (action === 'dl-zip-nologo') {
                    await this.animateBtn(target, () => DownloadManager.downloadZip(data, id, true));
                } else if (action === 'dl-raw') {
                    await this.animateBtn(target, () => DownloadManager.downloadRaw(data, id, false));
                } else if (action === 'dl-adcopy') {
                    await this.animateBtn(target, () => DownloadManager.downloadAdCopy(data, id));
                } else if (action === 'dl-video') {
                    if (data.videoUrl) await this.animateBtn(target, () => DownloadManager.downloadFile(data.videoUrl, `${id}_video.mp4`));
                    else alert('No video found');
                } else if (action === 'dl-image') {
                    if (data.imageUrl) await this.animateBtn(target, () => DownloadManager.downloadFile(data.imageUrl, `${id}_image.jpg`));
                }
            }
            // Global Actions
            else {
                if (action === 'toggle-minimize') {
                    Store.setMinimized(!Store.state.isMinimized);
                }
                else if (action === 'bulk-dl-all') {
                    DownloadManager.downloadBulk(Store.state.selectedAds, 'all');
                }
                else if (action === 'bulk-dl-video') {
                    DownloadManager.downloadBulk(Store.state.selectedAds, 'video');
                }
                else if (action === 'bulk-dl-adcopy') {
                    DownloadManager.downloadBulk(Store.state.selectedAds, 'adcopy');
                }
                else if (action === 'bulk-select-all') {
                    const allCards = document.querySelectorAll('[data-ma-id]');
                    const entries = [];
                    allCards.forEach(card => {
                        const cid = card.dataset.maId;
                        const data = DataExtractor.extract(card, cid);
                        entries.push([cid, data]);
                    });
                    Store.bulkSelect(entries);
                }
                else if (action === 'bulk-clear') {
                    Store.clearSelection();
                }
            }
        },

        async animateBtn(btn, task) {
            const original = btn.innerText;
            btn.innerText = '⏳';
            try { await task(); } catch (e) { console.error(e); }
            btn.innerText = '✅';
            setTimeout(() => btn.innerText = original, 2000);
        }
    };

    // --- 5. DATA EXTRACTOR ---
    const DataExtractor = {
        extract(card, id) {
            const d = {
                id,
                pageName: 'Unknown',
                primaryText: '',
                headline: '',
                body: '',
                cta: '',
                videoUrl: '',
                imageUrl: '',
                logoUrl: ''
            };

            // 1. Page Name
            const h = Array.from(card.querySelectorAll('h4, span, a, div')).find(el => {
                const s = window.getComputedStyle(el);
                return s.fontWeight >= 600 && el.innerText.length > 2 && !el.innerText.toLowerCase().includes('sponsored');
            });
            if (h) d.pageName = h.innerText.split('\n')[0].trim();

            // 2. Media
            const v = card.querySelector('video');
            if (v) d.videoUrl = v.src || v.querySelector('source')?.src || '';

            const imgs = Array.from(card.querySelectorAll('img[src*="scontent"]'));
            const logo = imgs.find(i => i.width < 100 && i.height < 100 && i.alt);
            if (logo) d.logoUrl = logo.src;

            const mainImg = imgs.find(i => i !== logo && i.width > 150);
            if (mainImg) d.imageUrl = mainImg.src;
            else if (v && v.poster) d.imageUrl = v.poster;

            // 3. Text (Simplified visual search)
            const textNodes = Array.from(card.querySelectorAll('div, span'))
                .filter(el => el.innerText.trim().length > 0 && el.children.length === 0)
                .map(el => ({ text: el.innerText.trim(), rect: el.getBoundingClientRect() }));

            // CTA Heuristic
            const ctaKeywords = ['Shop Now', 'Learn More', 'Sign Up', 'Apply Now', 'Book Now', 'Contact Us', 'Download', 'Get Offer'];
            const ctaNode = textNodes.find(n => ctaKeywords.some(k => n.text.toLowerCase() === k.toLowerCase()));
            if (ctaNode) d.cta = ctaNode.text;

            // Headline (Often near CTA)
            if (ctaNode) {
                const headline = textNodes
                    .filter(n => n.rect.bottom <= ctaNode.rect.top && n.rect.bottom > (ctaNode.rect.top - 150)) // Just above CTA
                    .sort((a, b) => b.text.length - a.text.length)[0]; // Longest in range
                if (headline) d.headline = headline.text;
            }

            // Primary Text (Top of card)
            const primary = textNodes.find(n => n.text.length > 30 && (!d.headline || n.text !== d.headline));
            if (primary) d.primaryText = primary.text;

            // Make safe filename parts
            d.pageSafe = (d.pageName || 'Advertiser').replace(/[^a-z0-9]/gi, '_');
            d.headSafe = (d.headline || 'Ad').substring(0, 30).replace(/[^a-z0-9]/gi, '_');

            return d;
        },

        generateAdCopy(d) {
            return `
══════════════════════════════════════════════
          META AD-COPY DATA - ${d.id}
══════════════════════════════════════════════
ADVERTISER: ${d.pageName}
ID: ${d.id}

PRIMARY TEXT:
${d.primaryText || 'N/A'}

HEADLINE:
${d.headline || 'N/A'}

CTA:
${d.cta || 'N/A'}

MEDIA LINKS:
Video: ${d.videoUrl || 'None'}
Image: ${d.imageUrl || 'None'}
Logo: ${d.logoUrl || 'None'}
══════════════════════════════════════════════`.trim();
        }
    };

    // --- 6. DOWNLOAD MANAGER ---
    const DownloadManager = {
        async fetchBlob(url) {
            try {
                const r = await fetch(url);
                return r.ok ? await r.blob() : null;
            } catch { return null; }
        },

        async downloadZip(data, id) {
            const prefix = `${data.pageSafe}_${data.headSafe}_${id}`;
            const jobItems = [];
            
            if (data.imageUrl) jobItems.push({ type: 'url', url: data.imageUrl, filename: `${prefix}_image.jpg` });
            if (data.videoUrl) jobItems.push({ type: 'url', url: data.videoUrl, filename: `${prefix}_video.mp4` });
            jobItems.push({ type: 'text', data: DataExtractor.generateAdCopy(data), filename: `${prefix}_adcopy.txt` });

            return new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({
                    action: 'processBulkJob',
                    job: {
                        items: jobItems,
                        filename: `${prefix}_bundle.zip`
                    }
                }, r => chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve(r));
            });
        },

        downloadFile(url, filename) {
            chrome.runtime.sendMessage({ action: 'downloadFile', url, filename: `MetaAds/${filename}` });
        },

        downloadAdCopy(d, id) {
            chrome.runtime.sendMessage({
                action: 'downloadData',
                data: DataExtractor.generateAdCopy(d),
                filename: `MetaAds/${d.pageSafe}_${d.headSafe}_${id}_adcopy.txt`
            });
        },

        downloadRaw(d, id) {
            this.downloadAdCopy(d, id);
            if (d.videoUrl) this.downloadFile(d.videoUrl, `${d.pageSafe}_${id}_video.mp4`);
            if (d.imageUrl) this.downloadFile(d.imageUrl, `${d.pageSafe}_${id}_image.jpg`);
        },

        async downloadBulk(selectedMap, mode) {
            if (selectedMap.size === 0) return alert('No ads selected');
            
            const ads = Array.from(selectedMap.entries());
            const totalAds = ads.length;
            const BATCH_SIZE = 5; 
            const totalSets = Math.ceil(totalAds / BATCH_SIZE);

            Store.updateDownload({ 
                active: true, 
                totalAds, 
                currentAd: 0, 
                totalSets, 
                currentSet: 1, 
                percent: 0,
                statusMessage: 'INITIATING BACKGROUND ENGINE...' 
            });

            for (let setIdx = 0; setIdx < totalSets; setIdx++) {
                const start = setIdx * BATCH_SIZE;
                const end = Math.min(start + BATCH_SIZE, totalAds);
                const batchAds = ads.slice(start, end);
                const currentSet = setIdx + 1;

                Store.updateDownload({ 
                    currentSet, 
                    statusMessage: `🚚 COURIERING SET ${currentSet} TO BACKGROUND...` 
                });

                const jobItems = [];
                for (const [id, data] of batchAds) {
                    const prefix = `${data.pageSafe}_${data.headSafe}_${id}`;
                    
                    if (mode === 'all') {
                        if (data.imageUrl) jobItems.push({ type: 'url', url: data.imageUrl, filename: `${prefix}_image.jpg` });
                        if (data.videoUrl) jobItems.push({ type: 'url', url: data.videoUrl, filename: `${prefix}_video.mp4` });
                        jobItems.push({ type: 'text', data: DataExtractor.generateAdCopy(data), filename: `${prefix}_adcopy.txt` });
                    } else if (mode === 'video') {
                        if (data.videoUrl) jobItems.push({ type: 'url', url: data.videoUrl, filename: `${prefix}_video.mp4` });
                    } else if (mode === 'adcopy') {
                        jobItems.push({ type: 'text', data: DataExtractor.generateAdCopy(data), filename: `${prefix}_adcopy.txt` });
                    }
                }

                try {
                    // Send to background and WAIT for completion
                    // We only send TEXT so serialization will NEVER fail
                    await new Promise((resolve, reject) => {
                        chrome.runtime.sendMessage({
                            action: 'processBulkJob',
                            job: {
                                items: jobItems,
                                filename: `MetaAds_Set_${currentSet}_of_${totalSets}_${new Date().toISOString().slice(0,10)}.zip`
                            }
                        }, response => {
                            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
                            else resolve(response);
                        });
                    });

                    // Update UI Progress after background set finishes
                    const finished = end;
                    Store.updateDownload({ 
                        currentAd: finished,
                        percent: Math.round((finished / totalAds) * 100),
                        statusMessage: `✅ SET ${currentSet} DELIVERED!`
                    });

                } catch (err) {
                    console.error('Coureir Error:', err);
                    Store.updateDownload({ statusMessage: `⚠️ SET ${currentSet} FAILED` });
                }

                if (currentSet < totalSets) {
                    Store.updateDownload({ statusMessage: `🍵 STEALTH DELAY...` });
                    await Stealth.rest();
                }
            }

            Store.updateDownload({ 
                active: false, 
                statusMessage: '📦 ALL JOBS COMPLETE!' 
            });

            setTimeout(() => {
                Store.clearSelection();
                Store.updateDownload({ statusMessage: '' });
            }, 3000);
        }
    };

    // --- 7. UI RENDERER (The View) ---
    const UIRenderer = {
        init() {
            // Wait for body before rendering persistent UI
            const startUI = () => {
                if (!document.body) {
                    requestAnimationFrame(startUI);
                    return;
                }
                this.renderStatus();
                this.renderScrollWidget();
                
                // Subscribe to store
                Store.subscribe(state => {
                    this.renderGlobalWidget(state);
                    this.syncCheckboxes(state);
                });
                this.renderGlobalWidget(Store.state); // Initial render
            };
            startUI();
        },

        syncCheckboxes(state) {
            // Update individual card checkboxes to match state
            document.querySelectorAll('.ma-chk-input').forEach(chk => {
                const id = chk.dataset.id;
                chk.checked = state.selectedAds.has(id);
            });
        },

        renderStatus() {
            if (document.getElementById('ma-status')) return;
            const div = document.createElement('div');
            div.id = 'ma-status';
            div.style.cssText = 'position:fixed; bottom:10px; left:10px; background:#f1f1f1; color:#37352f; border:1px solid #e1e1e1; padding:4px 10px; border-radius:4px; font-size:9px; font-weight:600; z-index:2147483647; opacity:0.8; pointer-events:none;';
            div.textContent = `V${Store.state.version} ACTIVE`;
            document.body.appendChild(div);
        },

        renderScrollWidget() {
            if (document.getElementById('ma-scroll')) return;
            const w = document.createElement('div');
            w.id = 'ma-scroll';
            w.style.cssText = 'position:fixed; right:20px; top:50%; transform:translateY(-50%); display:flex; flex-direction:column; gap:8px; z-index:2147483647;';
            w.innerHTML = `
                <button id="ma-up" style="width:44px;height:44px;background:#fff;border:1px solid #e1e1e1;border-radius:8px;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;">⬆</button>
                <button id="ma-down" style="width:44px;height:44px;background:#fff;border:1px solid #e1e1e1;border-radius:8px;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;">⬇</button>
            `;
            document.body.appendChild(w);

            document.getElementById('ma-up').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
            document.getElementById('ma-down').onclick = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        },

        renderGlobalWidget(state) {
            let container = document.getElementById('ma-global-widget');
            if (!container) {
                container = document.createElement('div');
                container.id = 'ma-global-widget';
                document.body.appendChild(container);
            }

            const count = state.selectedAds.size;
            container.style.display = 'flex';

            if (state.isMinimized) {
                // RENDER ICON
                const badge = count > 0 ? `<span style="position:absolute; top:-5px; right:-5px; background:red; color:white; border-radius:50%; width:20px; height:20px; font-size:10px; display:flex; align-items:center; justify-content:center; border:2px solid #000; pointer-events:none;">${count}</span>` : '';
                
                container.innerHTML = `
                    <div id="ma-icon" data-action="toggle-minimize" title="${count > 0 ? 'Expand' : 'Normaris'}" style="position:relative; cursor:pointer;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="pointer-events:none; width:24px; height:24px; stroke-width:2.5;">
                           <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        ${badge}
                    </div>
                `;
            } else {
                // RENDER PANEL
                const dl = state.downloadState;
                
                let content = '';
                if (dl.active || dl.statusMessage) {
                    // PROGRESS VIEW
                    content = `
                        <div class="ma-status-msg ${dl.active ? 'ma-pulsing' : ''}">${dl.statusMessage}</div>
                        <div class="ma-panel-title" style="margin-bottom:4px;">SET ${dl.currentSet} OF ${dl.totalSets}</div>
                        <div class="ma-progress-container">
                            <div class="ma-progress-fill" style="width: ${dl.percent}%"></div>
                        </div>
                        <div style="font-size:10px; color:#666; font-weight:700;">PROCESSED: ${dl.currentAd} / ${dl.totalAds}</div>
                    `;
                } else {
                    // MENU VIEW
                    content = `
                        <div class="ma-grid-2" style="margin-bottom:8px;">
                            <button class="ma-btn" data-action="bulk-select-all" style="font-size:9px; padding:8px;">SELECT ALL</button>
                            <button class="ma-btn" data-action="bulk-clear" style="font-size:9px; padding:8px;">CLEAR ALL</button>
                        </div>
                        <button class="ma-panel-btn primary" data-action="bulk-dl-all">Download All ZIP</button>
                        <button class="ma-panel-btn" data-action="bulk-dl-video">Video ZIP Only</button>
                        <button class="ma-panel-btn" data-action="bulk-dl-adcopy">Ad-Copy ZIP Only</button>
                    `;
                }

                container.innerHTML = `
                    <div id="ma-panel">
                        <div class="ma-panel-header">
                            <span class="ma-panel-title">${count > 0 ? count : 'NO'} ADS SELECTED</span>
                            <button class="ma-close" data-action="toggle-minimize" ${dl.active ? 'disabled' : ''}>✕</button>
                        </div>
                        ${content}
                    </div>
                `;
            }
        }
    };

    // --- 8. INITIALIZATION ---
    injectStyles();
    Controller.init();
    UIRenderer.init();

})();
