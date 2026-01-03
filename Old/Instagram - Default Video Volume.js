// ==UserScript==
// @name         Instagram - Default Video Volume
// @description  Forces Instagram videos to play at a set volume by default
// @namespace    http://tampermonkey.net/
// @icon         https://cdn-icons-png.flaticon.com/128/15713/15713420.png
// @version      0.0.2
// @author       rxm
// @match        https://www.instagram.com/*
// @license      MIT
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const TARGET_VOLUME = 0.05;
    const processed = new WeakSet();

    function forceVolume(video) {
        if (!video) return;

        // Always force — no condition
        try {
            video.volume = TARGET_VOLUME;
            video.muted = false;
        } catch (e) {}
    }

    function hook(video) {
        if (processed.has(video)) return;
        processed.add(video);

        // Force immediately
        forceVolume(video);

        // Force when playback starts
        video.addEventListener('play', () => forceVolume(video), true);

        // Force when metadata loads
        video.addEventListener('loadedmetadata', () => forceVolume(video), true);

        // Force when Instagram touches volume
        video.addEventListener('volumechange', () => {
            if (video.volume !== TARGET_VOLUME) {
                forceVolume(video);
            }
        }, true);
    }

    function scan() {
        document.querySelectorAll('video').forEach(hook);
    }

    // Observe DOM changes (infinite scroll, reels recycling)
    const observer = new MutationObserver(scan);
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Safety net: periodic enforcement
    setInterval(scan, 500);

    // Initial run
    scan();

})();