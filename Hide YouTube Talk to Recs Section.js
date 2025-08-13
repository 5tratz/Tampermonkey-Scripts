// ==UserScript==
// @name         Hide YouTube Experimental Recs Sections
// @description  Remove all "Talk to Recs" / experimental recommendation sections from YouTube
// @namespace    http://tampermonkey.net/
// @icon         https://cdn-icons-png.flaticon.com/64/2504/2504965.png
// @version      0.0.1
// @author       rxm
// @match        https://www.youtube.com/*
// @license      MIT
// @grant        none
// @downloadURL  
// @updateURL
// ==/UserScript==

(function() {
    'use strict';

    /**
     * Function to find and remove unwanted YouTube sections.
     * This targets "Talk to Recs" and similar experimental recommendation blocks.
     */
    const hideExperimentalRecs = () => {
        // Look for all "rich section" containers on the YouTube homepage
        document.querySelectorAll('ytd-rich-section-renderer').forEach(el => {

            // Check for signs this is a "Talk to Recs" or similar experimental section:
            if (
                // Case 1: Contains the special component used for "Talk to Recs"
                el.querySelector('ytd-talk-to-recs-flow-renderer') ||

                // Case 2: Contains the title container used by these experimental sections
                el.querySelector('.ytwTalkToRecsTitle') ||

                // Case 3: Text contains "ask for videos" (case-insensitive)
                el.textContent.match(/ask for videos/i) ||

                // Case 4: Text contains "recommend videos" (case-insensitive)
                el.textContent.match(/recommend videos/i)
            ) {
                // If matched, remove the entire section
                el.remove();
                console.log("[YT Cleaner] Removed experimental recommendation section");
            }
        });
    };

    // Run immediately when the page first loads
    hideExperimentalRecs();

    // Keep watching for dynamically loaded content (YouTube uses infinite scroll)
    const observer = new MutationObserver(hideExperimentalRecs);
    observer.observe(document.body, { childList: true, subtree: true });

})();