// ==UserScript==
// @name         YouTube - Proper Description (2025 Fix)
// @description  Forces the video description to live below the video with a reliable open/close toggle. Updated for modern YouTube DOM (no yt.msgs_ dependency).
// @namespace    http://tampermonkey.net/
// @icon         https://cdn-icons-png.flaticon.com/64/2504/2504965.png
// @version      0.0.3
// @author       rxm
// @match        *://www.youtube.com/watch*
// @license      MIT
// @grant        none
// @run-at       document-end
// ==/UserScript==

(() => {
  'use strict';

  function waitFor(selector, root = document) {
    return new Promise(resolve => {
      const el = root.querySelector(selector);
      if (el) return resolve(el);
      const mo = new MutationObserver(() => {
        const el = root.querySelector(selector);
        if (el) {
          mo.disconnect();
          resolve(el);
        }
      });
      mo.observe(root, { childList: true, subtree: true });
    });
  }

  async function init() {
    const meta = await waitFor('#meta-contents');
    const secondary = meta.querySelector('ytd-video-secondary-info-renderer');
    if (!secondary) return;
    const expander = secondary.querySelector('ytd-expander');
    if (!expander) return;

    // Move expander below meta
    meta.parentNode.appendChild(expander);

    // Create toggle
    let toggle = document.createElement('div');
    toggle.className = 'desc-toggle';
    toggle.style.cursor = 'pointer';
    toggle.style.marginTop = '4px';
    toggle.style.fontWeight = '500';
    toggle.style.color = 'var(--yt-spec-text-primary)';
    meta.parentNode.insertBefore(toggle, expander.nextSibling);

    function updateLabel() {
      const collapsed = expander.hasAttribute('collapsed');
      toggle.textContent = collapsed ? 'Show more' : 'Show less';
    }

    toggle.addEventListener('click', () => {
      if (expander.hasAttribute('collapsed')) {
        expander.removeAttribute('collapsed');
      } else {
        expander.setAttribute('collapsed', '');
      }
      updateLabel();
    });

    const mo = new MutationObserver(updateLabel);
    mo.observe(expander, { attributes: true, attributeFilter: ['collapsed'] });

    updateLabel();
  }

  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      if (location.pathname === '/watch') {
        setTimeout(init, 500);
      }
    }
  }, 500);

  if (location.pathname === '/watch') init();
})();