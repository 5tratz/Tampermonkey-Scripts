// ==UserScript==
// @name         YouTube - Small As Before Thumbnails
// @description  Shrink large YouTube thumbnails & adjust layout
// @namespace    http://tampermonkey.net/
// @icon         https://cdn-icons-png.flaticon.com/64/2504/2504965.png
// @version      0.0.4
// @author       rxm
// @match        https://www.youtube.com/*
// @license      MIT
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    // Create a <style> element to hold our custom CSS
    const style = document.createElement("style");
    style.id = "CustomCSSwrapper";

    // All of our CSS is in one big block for efficiency
    style.textContent = `
        /* -----------------------------
           YouTube Small Thumbnails CSS
           ----------------------------- */

        /* Force more videos per row in the main grid */
        ytd-rich-grid-renderer {
            --ytd-rich-grid-items-per-row: 6 !important;
            --ytd-rich-grid-posts-per-row: 6 !important;
            --ytd-rich-grid-slim-items-per-row: 6 !important;
        }

        /* Remove extra wrappers so layout is more compact */
        ytd-rich-grid-renderer > #contents > ytd-rich-grid-row,
        ytd-rich-grid-renderer > #contents > ytd-rich-grid-row > #contents {
            display: contents;
        }

        /* Minimum width for each video item */
        ytd-rich-item-renderer { min-width: 210px; }

        /* Hide channel avatar image from video grid */
        #avatar-link { display: none !important; }

        /* Make video titles a bit bigger */
        #video-title { font-size: 1.4rem !important; }

        /* Make channel names bigger */
        #channel-name.ytd-video-meta-block { font-size: 1.3rem !important; }

        /* Make metadata (views, time, etc.) bigger */
        #metadata-line { font-size: 1.3rem !important; }

        /* Hide YouTube's "mini guide" (small left sidebar) */
        .ytd-mini-guide-renderer { display: none !important; }

        /* Standard video thumbnails - fixed size */
        .ytd-video-renderer:not([use-prominent-thumbs]) ytd-thumbnail.ytd-video-renderer {
            flex: none;
            width: 246px;
            height: 138px;
        }

        /* Playlist thumbnails - fixed size */
        ytd-playlist-renderer[use-prominent-thumbs] ytd-playlist-thumbnail.ytd-playlist-renderer,
        ytd-radio-renderer[use-prominent-thumbs] ytd-thumbnail.ytd-radio-renderer {
            max-width: 246px;
            min-width: 240px;
        }
    `;

    // Append our CSS to the document <head> so it takes effect
    document.head.appendChild(style);

    // -----------------------------
    // OPTIONAL: Debugging helper
    // This will print all CSS rules to the first <pre> tag on the page
    // (Commented out so it doesn't break YouTube if no <pre> exists)
    // -----------------------------
    /*
    const rules = style.sheet.cssRules;
    for (let e = 0; e < rules.length; e++) {
        const pre = document.querySelector("pre");
        if (pre) pre.innerHTML += rules[e].cssText + "\n";
    }
    */
})();