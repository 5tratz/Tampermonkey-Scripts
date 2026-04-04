// ==UserScript==
// @name         [TEST] YouTube - Classic Metadata Layout
// @description  Restore old metadata layout with correct font sizing
// @namespace    http://tampermonkey.net/
// @icon         https://cdn-icons-png.flaticon.com/64/2504/2504965.png
// @supportURL   https://github.com/5tratz/Tampermonkey-Scripts/issues
// @version      0.0.3
// @author       5tratz
// @match        https://www.youtube.com/*
// @license      MIT
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // Only run on homepage
    function isHomepage() {
        const path = window.location.pathname;
        return path === '/' || path.startsWith('/feed/');
    }

	function fixRows() {
		if (!isHomepage()) return;

		const rows = document.querySelectorAll('.ytContentMetadataViewModelMetadataRow');

		rows.forEach(row => {
			if (row.dataset.fixed) return;

			const spans = row.querySelectorAll('.ytContentMetadataViewModelMetadataText');
			if (spans.length < 2) return;

			let channelEl = spans[0];
			let viewsEl = spans[1] || null;
			let dateEl = spans[2] || null;
			let verifiedIcon = row.querySelector('svg');

			if (!channelEl) return;

			const container = document.createElement('div');

			const channelLine = document.createElement('div');
			channelLine.className = "yt-fix-channel";
			const channelClone = channelEl.cloneNode(true);

			if (verifiedIcon) {
				const iconClone = verifiedIcon.cloneNode(true);
				iconClone.style.width = "14px";
				iconClone.style.height = "14px";
				iconClone.style.marginLeft = "4px";
				iconClone.style.verticalAlign = "middle";
				channelClone.appendChild(iconClone);
			}

			channelLine.appendChild(channelClone);

			const metaLine = document.createElement('div');
			metaLine.className = "yt-fix-meta";
			metaLine.textContent = viewsEl
				? dateEl
					? `${viewsEl.textContent.trim()} · ${dateEl.textContent.trim()}`
					: viewsEl.textContent.trim()
				: "";

			row.innerHTML = '';
			container.appendChild(channelLine);
			container.appendChild(metaLine);
			row.appendChild(container);

			row.dataset.fixed = "true";
		});
	}

    function removeJunk() {
        if (!isHomepage()) return;

        document.querySelectorAll('ytd-rich-section-renderer, ytd-shelf-renderer')
            .forEach(el => {
                const text = el.innerText;
                if (
                    text.includes('Shorts') ||
                    text.includes('Mixes') ||
                    text.includes('People also watched') ||
                    text.includes('For you')
                ) {
                    el.remove();
                }
            });
    }

    function injectCSS() {
        if (document.getElementById('yt-fix-style')) return;

        const style = document.createElement('style');
        style.id = 'yt-fix-style';
        style.textContent = `
            .yt-fix-channel {
                font-size: 14px !important;
                font-weight: 500 !important;
                line-height: 1.35 !important;
            }

            .yt-fix-meta {
                font-size: 13px !important;
                color: #aaa !important;
                line-height: 1.35 !important;
                margin-top: 2px;
            }
        `;
        document.head.appendChild(style);
    }

    function run() {
        fixRows();
        removeJunk();
    }

    function init() {
        injectCSS();
        run();

        const observer = new MutationObserver(run);
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    // Run instantly
    init();

    // SPA navigation
    document.addEventListener('yt-navigate-finish', run);
})();