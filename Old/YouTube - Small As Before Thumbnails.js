// ==UserScript==
// @name         YouTube - Small As Before Thumbnails
// @description  Shrink large YouTube thumbnails & adjust layout
// @namespace    http://tampermonkey.net/
// @icon         https://cdn-icons-png.flaticon.com/64/2504/2504965.png
// @version      0.0.7
// @author       rxm
// @match        https://www.youtube.com/*
// @license      MIT
// @grant        none
// @run-at       document-start
// @downloadURL https://update.greasyfork.org/scripts/545720/YouTube%20-%20Small%20As%20Before%20Thumbnails.user.js
// @updateURL https://update.greasyfork.org/scripts/545720/YouTube%20-%20Small%20As%20Before%20Thumbnails.meta.js
// ==/UserScript==

(function() {
    'use strict';

    // Function to add or update the style
    function applyCustomCSS() {
        let style = document.getElementById('CustomCSSwrapper');
        if (!style) {
            style = document.createElement('style');
            style.id = 'CustomCSSwrapper';
            document.head.appendChild(style);
        }

        style.textContent = `
            /* -----------------------------
               YouTube Small Thumbnails CSS
               ----------------------------- */

            /* Target all grid containers including featured rows */
            ytd-rich-grid-renderer,
            ytd-rich-grid-row,
            #contents.ytd-rich-grid-row,
            #contents.ytd-rich-grid-renderer {
                --ytd-rich-grid-items-per-row: 6 !important;
            }

            /* Control ALL rich items consistently */
            ytd-rich-item-renderer {
                min-width: 246px !important;
                max-width: 246px !important;
                width: 246px !important;
                flex: 0 0 246px !important;
            }

            /* Fix grid container layout */
            ytd-rich-grid-renderer {
                display: block !important;
            }

            /* Fix row containers */
            ytd-rich-grid-row {
                display: flex !important;
                flex-wrap: wrap !important;
                justify-content: center !important;
                gap: 16px !important;
            }

            /* Fix the content wrapper in rows */
            #contents.ytd-rich-grid-row,
            #contents.ytd-rich-grid-renderer {
                display: grid !important;
                grid-template-columns: repeat(auto-fill, minmax(246px, 1fr)) !important;
                gap: 16px !important;
                width: 100% !important;
                max-width: 100% !important;
            }

            /* Ensure all thumbnails have consistent size - HOME PAGE ONLY */
            ytd-rich-grid-renderer ytd-thumbnail,
            ytd-rich-item-renderer ytd-thumbnail {
                width: 246px !important;
                height: 138px !important;
                aspect-ratio: 16/9 !important;
            }

            /* Hide channel avatar image from video grid - HOME PAGE ONLY */
            ytd-rich-grid-renderer #avatar-link { 
                display: none !important; 
            }

            /* Make video titles a bit bigger */
            #video-title { 
                font-size: 1.4rem !important; 
            }

            /* Make channel names bigger */
            #channel-name.ytd-video-meta-block { 
                font-size: 1.3rem !important; 
            }

            /* Make metadata (views, time, etc.) bigger */
            #metadata-line { 
                font-size: 1.3rem !important; 
            }

            /* Hide YouTube's "mini guide" (small left sidebar) */
            .ytd-mini-guide-renderer { 
                display: none !important; 
            }

            /* Remove any max-width constraints on the main grid */
            ytd-rich-grid-renderer > #contents {
                max-width: none !important;
            }

            /* Fix for promoted/shorts shelf if needed */
            ytd-rich-shelf-renderer ytd-rich-item-renderer {
                min-width: 246px !important;
                max-width: 246px !important;
                width: 246px !important;
            }

            /* Ensure consistent spacing */
            ytd-rich-item-renderer {
                margin: 0 !important;
            }

            /* Optional: Remove any padding that might affect layout */
            #primary.ytd-browse {
                padding-left: 0 !important;
                padding-right: 0 !important;
            }
        `;
    }

    // Apply CSS immediately
    applyCustomCSS();

    // Reapply when page changes (for SPA navigation)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            // Small delay to ensure DOM is ready
            setTimeout(applyCustomCSS, 100);
        }
    }).observe(document, { subtree: true, childList: true });

    // Also reapply periodically to catch dynamic content
    setInterval(applyCustomCSS, 2000);
})();