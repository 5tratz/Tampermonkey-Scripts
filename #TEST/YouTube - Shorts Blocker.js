// ==UserScript==
// @name         YouTube - Shorts Blocker TEST
// @description  Removes ALL YouTube Shorts from every page: homepage, sidebar, search results, channels, subscriptions, everywhere!
// @namespace    http://tampermonkey.net/
// @icon         https://cdn-icons-png.flaticon.com/64/2504/2504965.png
// @version      0.0.1
// @author       rxm
// @match        *://*.youtube.com/*
// @license      MIT
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    
    function isSearchPage() {
        const path = window.location.pathname;
        const search = window.location.search;
        
        // Only TRUE for actual search results pages
        return path.includes('/results') || 
               (search.includes('search_query') && path === '/');
    }
    
    function hideElement(el) {
        if (el) {
            el.style.display = 'none';
            el.style.visibility = 'hidden';
            el.style.height = '0';
            el.style.width = '0';
            el.style.overflow = 'hidden';
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
        }
    }
    
    function removeShorts() {
        // DO NOTHING on search pages only
        if (isSearchPage()) {
            return; // Exit early, don't run any blocking code
        }
        
        console.log('Removing Shorts...');
        
        // Method 1: Find ALL Shorts tabs - FIXED FOR CHANNELS
        const tabSelectors = [
            'tp-yt-paper-tab',
            'ytd-tab',
            '[role="tab"]',
            '.tab',
            'ytd-c4-tabbed-header-renderer *',
            'ytd-channel-tabbed-header-renderer *'
        ];
        
        tabSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                // Check multiple text sources
                const text = el.textContent || el.innerText || el.getAttribute('tab-title') || '';
                const ariaLabel = el.getAttribute('aria-label') || '';
                const title = el.getAttribute('title') || '';
                
                // Check if any text indicates Shorts
                const allText = (text + ' ' + ariaLabel + ' ' + title).toLowerCase();
                if (allText.includes('shorts') && !allText.includes('shortcut')) {
                    hideElement(el);
                }
            });
        });
        
        // Method 2: Find ALL links with /shorts/ in URL
        document.querySelectorAll('a[href*="/shorts/"]').forEach(link => {
            // Hide the link
            hideElement(link);
            
            // Find and hide the video container
            let parent = link;
            for (let i = 0; i < 6; i++) {
                parent = parent.parentElement;
                if (!parent) break;
                
                // Check if this looks like a video container
                const tagName = parent.tagName.toLowerCase();
                if (tagName.includes('renderer') || 
                    tagName.includes('video') || 
                    tagName.includes('grid') ||
                    tagName.includes('item') ||
                    parent.classList.contains('style-scope') ||
                    parent.id.includes('video') ||
                    parent.getAttribute('is-shorts')) {
                    
                    hideElement(parent);
                    
                    // Try to remove the entire shelf if found
                    const shelf = parent.closest('ytd-reel-shelf-renderer, ytd-rich-section-renderer, ytd-item-section-renderer');
                    if (shelf) hideElement(shelf);
                }
            }
        });
        
        // Method 3: Look for Shorts badges - FIXED to avoid player
        document.querySelectorAll('[overlay-style="SHORTS"], [aria-label="Shorts"], [title="Shorts"]').forEach(el => {
            // Skip player elements
            if (el.closest('ytd-player, .ytp-chrome-controls, .ytp-button')) {
                return;
            }
            
            const value = el.getAttribute('overlay-style') || el.getAttribute('aria-label') || el.getAttribute('title') || '';
            if (value.trim().toLowerCase() === 'shorts') {
                hideElement(el);
                const container = el.closest('ytd-video-renderer, ytd-rich-item-renderer, ytd-grid-video-renderer');
                if (container) hideElement(container);
            }
        });
        
        // Method 4: Check for sidebar Shorts
        document.querySelectorAll('ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer').forEach(el => {
            const text = el.textContent || el.innerText || '';
            const title = el.querySelector('a')?.getAttribute('title') || '';
            
            if (text.toLowerCase().includes('shorts') || title.toLowerCase().includes('shorts')) {
                hideElement(el);
            }
        });
        
        // Redirect from Shorts pages
        if (window.location.pathname.includes('/shorts/')) {
            const videoId = window.location.pathname.split('/shorts/')[1];
            if (videoId) {
                window.location.href = `https://www.youtube.com/watch?v=${videoId.split('?')[0]}`;
            }
        }
    }
    
    // Run continuously
    removeShorts();
    setInterval(removeShorts, 1000);
    
    // Watch for new content
    const observer = new MutationObserver(() => {
        setTimeout(removeShorts, 200);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    
})();