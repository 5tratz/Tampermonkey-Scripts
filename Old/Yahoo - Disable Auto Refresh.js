// ==UserScript==
// @name         Yahoo - Disable Auto Refresh
// @description  Prevent Yahoo from automatically refreshing the page
// @namespace    http://tampermonkey.net/
// @icon         https://cdn-icons-png.flaticon.com/128/2504/2504961.png
// @version      0.0.5
// @author       rxm
// @match        https://uk.yahoo.com/*
// @match        https://www.yahoo.com/*
// @license      MIT
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const win = unsafeWindow;

    /* --------------------------------------------------
       1. LIE ABOUT VISIBILITY (AUTO-REFRESH FIX)
    -------------------------------------------------- */

    Object.defineProperty(document, 'hidden', { get: () => false });
    Object.defineProperty(document, 'visibilityState', { get: () => 'visible' });
    Object.defineProperty(document, 'webkitVisibilityState', { get: () => 'visible' });

    /* --------------------------------------------------
       2. BLOCK VISIBILITY / FOCUS LISTENERS
    -------------------------------------------------- */

    const blockedEvents = new Set([
        'visibilitychange',
        'pageshow',
        'pagehide',
        'freeze',
        'resume'
    ]);

    const originalAddEventListener = EventTarget.prototype.addEventListener;

    EventTarget.prototype.addEventListener = function (type, listener, options) {
        if (blockedEvents.has(type)) {
            console.log('[TM] Blocked event listener:', type);
            return;
        }
        return originalAddEventListener.call(this, type, listener, options);
    };

    /* --------------------------------------------------
       3. HARD-BLOCK PROGRAMMATIC PAGE RELOADS
    -------------------------------------------------- */

    const block = name => () => console.log('[TM] Blocked', name);

    win.location.reload = block('location.reload');

    const origAssign = Location.prototype.assign;
    Location.prototype.assign = function (url) {
        if (url === win.location.href) return;
        return origAssign.call(this, url);
    };

    const origReplace = Location.prototype.replace;
    Location.prototype.replace = function (url) {
        if (url === win.location.href) return;
        return origReplace.call(this, url);
    };

    /* --------------------------------------------------
       4. PREVENT BFCache REHYDRATION
    -------------------------------------------------- */

    window.addEventListener('pageshow', e => {
        if (e.persisted) {
            e.stopImmediatePropagation();
        }
    }, true);

    /* --------------------------------------------------
       5. FORCE YAHOO HOMEPAGE CAROUSEL INTO PAUSED STATE
       (THIS IS THE KEY FIX)
    -------------------------------------------------- */

    function forcePauseYahooCarousel() {
        document.querySelectorAll('button').forEach(btn => {
            const label =
                (btn.getAttribute('aria-label') || btn.innerText || '')
                    .toLowerCase();

            // Yahoo exposes Pause/Play via accessible buttons
            if (label.includes('pause')) {
                btn.click();
                console.log('[TM] Forced Yahoo carousel pause');
            }
        });
    }

    // Pause once DOM exists
    window.addEventListener('DOMContentLoaded', forcePauseYahooCarousel);

    // Pause again when tab regains focus (Yahoo resumes here)
    window.addEventListener('focus', forcePauseYahooCarousel, true);

    // Pause again if Yahoo rebuilds modules
    const pauseObserver = new MutationObserver(forcePauseYahooCarousel);
    pauseObserver.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    console.log('[TM] Yahoo auto-refresh disabled + carousel forced paused');

})();
