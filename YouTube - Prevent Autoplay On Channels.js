// ==UserScript==
// @name         YouTube - Prevent Autoplay On Channels
// @description  This script prevents autoplayed videos on YouTube channel profile pages.
// @namespace    http://tampermonkey.net/
// @icon         https://cdn-icons-png.flaticon.com/64/2504/2504965.png
// @version      0.0.8
// @author       rxm
// @match        https://www.youtube.com/@*/featured
// @match        https://www.youtube.com/@*
// @match        https://www.youtube.com/*
// @exclude      https://www.youtube.com/watch?v=*
// @license      MIT
// @grant        none  
// ==/UserScript==

// Custom urlchange event (used to monitor URL changes)
function addUrlChangeEvent() {
    history.pushState = (f => function pushState() {
        const ret = f.apply(this, arguments);
        window.dispatchEvent(new Event('pushstate'));
        window.dispatchEvent(new Event('urlchange'));
        return ret;
    })(history.pushState);

    history.replaceState = (f => function replaceState() {
        const ret = f.apply(this, arguments);
        window.dispatchEvent(new Event('replacestate'));
        window.dispatchEvent(new Event('urlchange'));
        return ret;
    })(history.replaceState);

    window.addEventListener('popstate', () => {
        window.dispatchEvent(new Event('urlchange'));
    });
}

if (window.onurlchange === undefined) {
    addUrlChangeEvent();
}

// === Main Logic ===
(function () {
    'use strict';

    function isChannelPage() {
        return location.pathname.startsWith('/@') || location.pathname.startsWith('/channel/');
    }

    function pauseVideo() {
        if (!isChannelPage()) return;

        const video = document.querySelector('video');
        if (video && !video.paused) {
            video.pause();
        }
    }

    // MutationObserver to monitor changes
    const observer = new MutationObserver(() => {
        pauseVideo();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Initial run
    pauseVideo();

    // Fallback interval for early loads
    let executionCount = 0;
    const intervalId = setInterval(() => {
        pauseVideo();
        executionCount++;
        if (executionCount >= 2) {
            clearInterval(intervalId);
        }
    }, 1000);
})();