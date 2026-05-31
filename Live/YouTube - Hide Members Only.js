// ==UserScript==
// @name         YouTube - Hide Members Only
// @description  Hides "Members Only" or "Members First" videos on all channels
// @namespace    http://tampermonkey.net/
// @icon         https://cdn-icons-png.flaticon.com/64/2504/2504965.png
// @supportURL   https://github.com/5tratz/Tampermonkey-Scripts/issues
// @version      0.0.1
// @author       5tratz
// @match        *://*.youtube.com/*
// @license      MIT
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    function hideMembers() {
        document.querySelectorAll('.ytBadgeShapeText:not([data-members-checked])')
            .forEach(badge => {

            badge.dataset.membersChecked = '1';

            const text = badge.textContent.trim().toLowerCase();

            if (
                text === 'members only' ||
                text === 'members first'
            ) {
                const video =
                      badge.closest('ytd-rich-item-renderer') ||
                      badge.closest('ytd-grid-video-renderer') ||
                      badge.closest('ytd-video-renderer');

                if (video) {
                    video.remove();
                }
            }
        });
    }

    new MutationObserver(hideMembers)
        .observe(document.documentElement, {
            childList: true,
            subtree: true
        });

    hideMembers();
})();