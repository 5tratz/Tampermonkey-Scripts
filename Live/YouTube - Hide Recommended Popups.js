// ==UserScript==
// @name         YouTube - Hide Recommended Popups
// @description  Removes experimental and featured recommendation sections from YouTube
// @namespace    http://tampermonkey.net/
// @icon         https://cdn-icons-png.flaticon.com/64/2504/2504965.png
// @supportURL   https://github.com/5tratz/Tampermonkey-Scripts/issues
// @version      0.0.9
// @author       5tratz
// @match        https://www.youtube.com/*
// @license      MIT
// @grant        none
// @downloadURL https://update.greasyfork.org/scripts/545717/YouTube%20-%20Hide%20Recommended%20Popups.user.js
// @updateURL https://update.greasyfork.org/scripts/545717/YouTube%20-%20Hide%20Recommended%20Popups.meta.js
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
       TEXT MATCHING - COMPREHENSIVE BLOCK LIST
    --------------------------------------------------- */
    const BLOCKED_TEXT = [
        // Original blocks
        'explore more topics',
        'shorts',
        'people also watched',
        'for you',
        'latest from',
        'playables',
        'games',

        // New recommendations
        'recommended for you',
        'recommended',
        'popular now',
        'trending',
        'you might also like',
        'because you watched',
        'related channels',
        'recommended channels',
        'recommended videos',
        'videos for you',
        'just uploaded',
        'new to you',
        'suggested',
        'you may like',
        'top picks for you',

        // Content categories
        'podcast',
        'podcasts',
        'community post',
        'community posts',
        'shop',
        'products',
        'merch',
        'news',
        'live now',
        'live streams',
        'music',
        'gaming',
        'sports',
        'fashion',
        'beauty',
        'style',

        // Promoted content
        'promoted',
        'ad'
    ];

    function hasBlockedText(el) {
        return BLOCKED_TEXT.some(t =>
            el.textContent?.toLowerCase().includes(t)
        );
    }

    /* ---------------------------------------------------
       DETECTION FUNCTIONS FOR ALL CONTENT TYPES
    --------------------------------------------------- */

    // Original detection
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

    function isPlayables(el) {
        return (
            (el.tagName === 'YTD-RICH-SHELF-RENDERER' ||
             el.tagName === 'YTD-RICH-SECTION-RENDERER') &&
            (
                el.querySelector('a[href^="/playables"]') ||
                el.querySelector('[href*="/playables"]') ||
                (el.textContent?.toLowerCase().includes('playables')) ||
                (el.textContent?.toLowerCase().includes('games')) ||
                el.querySelector('ytd-playable-tile-renderer')
            )
        );
    }

    // New detection functions
    function isPodcasts(el) {
        return (
            (el.tagName === 'YTD-RICH-SHELF-RENDERER' ||
             el.tagName === 'YTD-RICH-SECTION-RENDERER') &&
            (
                el.querySelector('a[href^="/podcasts"]') ||
                el.querySelector('[href*="/podcasts"]') ||
                el.textContent?.toLowerCase().includes('podcast') ||
                el.querySelector('ytd-podcast-tile-renderer')
            )
        );
    }

    function isCommunitySpam(el) {
        return (
            el.tagName === 'YTD-RICH-SECTION-RENDERER' &&
            (
                el.querySelector('ytd-post-renderer') ||
                el.textContent?.toLowerCase().includes('community post') ||
                el.querySelector('[aria-label*="community post"]')
            )
        );
    }

    function isShopping(el) {
        return (
            (el.tagName === 'YTD-RICH-SHELF-RENDERER' ||
             el.tagName === 'YTD-RICH-SECTION-RENDERER') &&
            (
                el.textContent?.toLowerCase().includes('shop') ||
                el.textContent?.toLowerCase().includes('products') ||
                el.textContent?.toLowerCase().includes('merch') ||
                el.querySelector('ytd-merch-shelf-renderer') ||
                el.querySelector('[href*="/shopping"]')
            )
        );
    }

    function isNews(el) {
        return (
            (el.tagName === 'YTD-RICH-SHELF-RENDERER' ||
             el.tagName === 'YTD-RICH-SECTION-RENDERER') &&
            (
                el.textContent?.toLowerCase().includes('news') ||
                el.querySelector('ytd-news-renderer') ||
                el.querySelector('[href*="/news"]')
            )
        );
    }

    function isLiveStreams(el) {
        return (
            (el.tagName === 'YTD-RICH-SHELF-RENDERER' ||
             el.tagName === 'YTD-RICH-SECTION-RENDERER') &&
            (
                el.textContent?.toLowerCase().includes('live now') ||
                el.textContent?.toLowerCase().includes('live streams') ||
                el.querySelectorAll('.badge-style-type-live-now').length > 0
            )
        );
    }

    function isMusic(el) {
        return (
            (el.tagName === 'YTD-RICH-SHELF-RENDERER' ||
             el.tagName === 'YTD-RICH-SECTION-RENDERER') &&
            (
                el.textContent?.toLowerCase().includes('music') ||
                el.querySelector('[href*="/music"]') ||
                el.querySelector('ytd-music-tile-renderer')
            )
        );
    }

    function isGaming(el) {
        return (
            (el.tagName === 'YTD-RICH-SHELF-RENDERER' ||
             el.tagName === 'YTD-RICH-SECTION-RENDERER') &&
            (
                el.textContent?.toLowerCase().includes('gaming') ||
                el.querySelector('[href*="/gaming"]') ||
                el.querySelector('ytd-game-tile-renderer')
            )
        );
    }

    function isSports(el) {
        return (
            (el.tagName === 'YTD-RICH-SHELF-RENDERER' ||
             el.tagName === 'YTD-RICH-SECTION-RENDERER') &&
            (
                el.textContent?.toLowerCase().includes('sports') ||
                el.querySelector('[href*="/sports"]')
            )
        );
    }

    function isFashion(el) {
        return (
            (el.tagName === 'YTD-RICH-SHELF-RENDERER' ||
             el.tagName === 'YTD-RICH-SECTION-RENDERER') &&
            (
                el.textContent?.toLowerCase().includes('fashion') ||
                el.textContent?.toLowerCase().includes('beauty') ||
                el.textContent?.toLowerCase().includes('style')
            )
        );
    }

    function isPromoted(el) {
        return (
            el.textContent?.toLowerCase().includes('promoted') ||
            el.textContent?.toLowerCase().includes('ad') ||
            el.querySelector('[label="Promoted"]') ||
            el.querySelector('[aria-label*="promoted"]')
        );
    }

    function isExploreOrNudge(el) {
        return (
            el.tagName === 'YTD-RICH-SHELF-RENDERER' ||
            el.tagName === 'YTD-RICH-SECTION-RENDERER' ||
            el.tagName === 'YTD-FEED-NUDGE-RENDERER'
        ) && hasBlockedText(el);
    }

    /* ---------------------------------------------------
       MAIN UNWANTED CHECK - COMBINES ALL DETECTION
    --------------------------------------------------- */
    function isUnwanted(el) {
        if (el.hasAttribute(REMOVED_FLAG)) return false;

        return (
            isShorts(el) ||
            isPlayables(el) ||
            isPodcasts(el) ||
            isCommunitySpam(el) ||
            isShopping(el) ||
            isNews(el) ||
            isLiveStreams(el) ||
            isMusic(el) ||
            isGaming(el) ||
            isSports(el) ||
            isFashion(el) ||
            isPromoted(el) ||
            isExploreOrNudge(el) ||
            el.querySelector?.('ytd-talk-to-recs-flow-renderer') ||
            el.querySelector?.('#big-yoodle') ||
            el.tagName === 'YTD-STATEMENT-BANNER-RENDERER'
        );
    }

    /* ---------------------------------------------------
       REMOVE FUNCTION
    --------------------------------------------------- */
    function remove(el) {
        el.setAttribute(REMOVED_FLAG, 'true');
        el.remove();
        console.debug('[YT Cleaner] Removed:', el.tagName);
    }

    /* ---------------------------------------------------
       SCAN FUNCTION WITH COMPREHENSIVE TARGETS
    --------------------------------------------------- */
    function scan(node) {
        if (node.nodeType !== 1) return;

        const targets = [
            'ytd-rich-shelf-renderer',
            'ytd-rich-section-renderer',
            'ytd-feed-nudge-renderer',
            'ytd-statement-banner-renderer',
            'ytd-playable-tile-renderer',
            'ytd-post-renderer',
            'ytd-merch-shelf-renderer',
            'ytd-news-renderer',
            'ytd-music-tile-renderer',
            'ytd-game-tile-renderer',
            'ytd-podcast-tile-renderer'
        ].join(',');

        if (node.matches?.(targets) && isUnwanted(node)) {
            remove(node);
        }

        node.querySelectorAll?.(targets).forEach(el => {
            if (isUnwanted(el)) remove(el);
        });
    }

    /* ---------------------------------------------------
       INIT - WITH MULTIPLE SCANNING METHODS
    --------------------------------------------------- */

    // 1. Initial scan
    scan(document.body);

    // 2. SPA Navigation fix
    let lastUrl = location.href;
    const checkForNavigation = () => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            scan(document.body);
        }
    };
    setInterval(checkForNavigation, 1000);

    // 3. MutationObserver for dynamic content
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

    // 4. Periodic backup scan
    setInterval(() => {
        scan(document.body);
    }, 5000);

    // 5. Additional scan when scrolling (catches lazy-loaded content)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            scan(document.body);
        }, 500);
    }, { passive: true });
})();