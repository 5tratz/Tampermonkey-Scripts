// ==UserScript==
// @name         YouTube - Hide Recommended Popups
// @description  Removes experimental and featured recommendation sections from YouTube
// @namespace    http://tampermonkey.net/
// @icon         https://cdn-icons-png.flaticon.com/64/2504/2504965.png
// @supportURL   https://github.com/5tratz/Tampermonkey-Scripts/issues
// @version      0.0.7
// @author       5tratz
// @match        https://www.youtube.com/*
// @license      MIT
// @grant        none
// @downloadURL  https://update.greasyfork.org/scripts/545717/YouTube%20-%20Hide%20Recommended%20Popups.user.js
// @updateURL    https://update.greasyfork.org/scripts/545717/YouTube%20-%20Hide%20Recommended%20Popups.meta.js
// ==/UserScript==

(() => {
    'use strict';

    const REMOVED_FLAG = 'data-yt-cleaned';

    /* ---------------------------------------------------
       CSS FIX (prevents vertical stacking + flicker)
    --------------------------------------------------- */
    const style = document.createElement('style');
    style.textContent = `
        ytd-rich-shelf-renderer #items,
        ytd-reel-shelf-renderer #items {
            display: flex !important;
            flex-direction: row !important;
            overflow-x: auto !important;
        }
    `;
    document.head.appendChild(style);

    /* ---------------------------------------------------
       TEXT MATCHING
    --------------------------------------------------- */
    const BLOCKED_TEXT = [
        'explore more topics',
        'shorts',
        'people also watched',
        'for you'
    ];

    function hasBlockedText(el) {
        return BLOCKED_TEXT.some(t =>
            el.textContent?.toLowerCase().includes(t)
        );
    }

    /* ---------------------------------------------------
       DETECT UNWANTED RENDERERS
    --------------------------------------------------- */
    function isShorts(el) {
        return (
            el.tagName === 'YTD-RICH-SHELF-RENDERER' &&
            (
                el.hasAttribute('is-shorts') ||
                el.querySelector('ytd-reel-shelf-renderer') ||
                el.querySelector('a[href^="/shorts"]')
            )
        );
    }

    function isExploreOrNudge(el) {
        return (
            el.tagName === 'YTD-RICH-SHELF-RENDERER' ||
            el.tagName === 'YTD-RICH-SECTION-RENDERER' ||
            el.tagName === 'YTD-FEED-NUDGE-RENDERER'
        ) && hasBlockedText(el);
    }

    function isUnwanted(el) {
        if (el.hasAttribute(REMOVED_FLAG)) return false;

        return (
            isShorts(el) ||
            isExploreOrNudge(el) ||
            el.querySelector?.('ytd-talk-to-recs-flow-renderer') ||
            el.querySelector?.('#big-yoodle') ||
            el.tagName === 'YTD-STATEMENT-BANNER-RENDERER'
        );
    }

    /* ---------------------------------------------------
       REMOVE
    --------------------------------------------------- */
    function remove(el) {
        el.setAttribute(REMOVED_FLAG, 'true');
        el.remove();
        console.debug('[YT Cleaner] Removed:', el.tagName);
    }

    /* ---------------------------------------------------
       SCAN
    --------------------------------------------------- */
    function scan(node) {
        if (node.nodeType !== 1) return;

        const targets = [
            'ytd-rich-shelf-renderer',
            'ytd-rich-section-renderer',
            'ytd-feed-nudge-renderer',
            'ytd-statement-banner-renderer'
        ].join(',');

        if (node.matches?.(targets) && isUnwanted(node)) {
            remove(node);
        }

        node.querySelectorAll?.(targets).forEach(el => {
            if (isUnwanted(el)) remove(el);
        });
    }

    /* ---------------------------------------------------
       INIT
    --------------------------------------------------- */
    scan(document.body);

    const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                scan(node);
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();