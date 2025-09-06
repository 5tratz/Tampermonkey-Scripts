// ==UserScript==
// @name         YouTube - Hide Recommended Popups
// @description  Remove all "Talk to Recs" / experimental recommendation sections from YouTube
// @namespace    http://tampermonkey.net/
// @icon         https://cdn-icons-png.flaticon.com/64/2504/2504965.png
// @version      0.0.4
// @author       rxm
// @match        https://www.youtube.com/*
// @license      MIT
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /**
     * Function to find and remove unwanted YouTube sections.
     * This targets "Talk to Recs" and other experimental recommendation blocks,
     * as well as new banner-style promos like "Noteworthy creativity".
     */
    const hideExperimentalRecs = () => {
        // Look for all "rich section" containers on the YouTube homepage
        document.querySelectorAll('ytd-rich-section-renderer, ytd-statement-banner-renderer').forEach(el => {

            // Check for signs this is a "Talk to Recs" or other experimental section:
            if (
                // Case 1: Contains the special component used for "Talk to Recs"
                el.querySelector('ytd-talk-to-recs-flow-renderer') ||

                // Case 2: Contains the title container used by these experimental sections
                el.querySelector('.ytwTalkToRecsTitle') ||

                // Case 3: Text contains "ask for videos" (case-insensitive)
                el.textContent.match(/ask for videos/i) ||

                // Case 4: Text contains "recommend videos" (case-insensitive)
                el.textContent.match(/recommend videos/i) ||

                // Case 5: New banners like "Noteworthy creativity" / "YouTube featured"
                el.querySelector('#big-yoodle') ||
                el.querySelector('ytd-statement-banner-renderer') ||
                el.textContent.match(/YouTube featured/i)
            ) {
                // If matched, remove the entire section
                el.remove();
                console.log("[YT Cleaner] Removed experimental/featured recommendation section");
            }
        });
    };

    // Run immediately when the page first loads
    hideExperimentalRecs();

    // Keep watching for dynamically loaded content (YouTube uses infinite scroll)
    const observer = new MutationObserver(hideExperimentalRecs);
    observer.observe(document.body, { childList: true, subtree: true });

})();