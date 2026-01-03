// ==UserScript==
// @name         Yahoo - Disable Auto Refresh
// @description  Prevent Yahoo from automatically refreshing the page
// @namespace    http://tampermonkey.net/
// @icon         https://cdn-icons-png.flaticon.com/128/2504/2504961.png
// @version      0.0.4
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
       1. LIE ABOUT VISIBILITY (CRITICAL)
    -------------------------------------------------- */

    Object.defineProperty(document, 'hidden', {
        get: () => false
    });

    Object.defineProperty(document, 'visibilityState', {
        get: () => 'visible'
    });

    Object.defineProperty(document, 'webkitVisibilityState', {
        get: () => 'visible'
    });

    /* --------------------------------------------------
       2. BLOCK REGISTRATION OF VISIBILITY EVENTS
    -------------------------------------------------- */

    const blockedEvents = new Set([
        'visibilitychange',
        'pageshow',
        'pagehide',
        'freeze',
        'resume',
        'focus',
        'blur'
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
       3. HARD-BLOCK ALL PROGRAMMATIC NAVIGATION
    -------------------------------------------------- */

    const block = (name) => () => {
        console.log('[TM] Blocked', name);
    };

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
       4. PREVENT BFCache REHYDRATION TRIGGERS
    -------------------------------------------------- */

    window.addEventListener('pageshow', e => {
        if (e.persisted) {
            e.stopImmediatePropagation();
        }
    }, true);

    /* --------------------------------------------------
       5. LOCK & RESTORE SCROLL POSITION (THE REAL FIX)
    -------------------------------------------------- */

    let lastScrollY = 0;

    // Track scroll position continuously
    win.addEventListener('scroll', () => {
        lastScrollY = win.scrollY;
    }, { passive: true });

    // Restore scroll position if Yahoo resets it
    const restoreScroll = () => {
        if (win.scrollY < lastScrollY) {
            win.scrollTo(0, lastScrollY);
            console.log('[TM] Restored scroll position:', lastScrollY);
        }
    };

    // Run on DOM changes (Yahoo re-renders on tab return)
    const scrollObserver = new MutationObserver(restoreScroll);
    scrollObserver.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    // Periodic safety check
    setInterval(restoreScroll, 300);

    console.log('[TM] Yahoo auto-refresh fully disabled');

})();