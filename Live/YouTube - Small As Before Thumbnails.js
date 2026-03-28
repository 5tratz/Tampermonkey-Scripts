// ==UserScript==
// @name         YouTube - Small As Before Thumbnails
// @description  Shrink large YouTube thumbnails & adjust layout
// @namespace    http://tampermonkey.net/
// @icon         https://cdn-icons-png.flaticon.com/64/2504/2504965.png
// @supportURL   https://github.com/5tratz/Tampermonkey-Scripts/issues
// @version      0.1.3
// @author       5tratz
// @match        https://www.youtube.com/*
// @license      MIT
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-start
// @downloadURL https://update.greasyfork.org/scripts/545720/YouTube%20-%20Small%20As%20Before%20Thumbnails.user.js
// @updateURL https://update.greasyfork.org/scripts/545720/YouTube%20-%20Small%20As%20Before%20Thumbnails.meta.js
// ==/UserScript==

(function() {
    'use strict';

    // Configuration with defaults
    const config = {
        thumbnailWidth: GM_getValue('thumbnailWidth', 246),
        thumbnailHeight: GM_getValue('thumbnailHeight', 138),
        gapSize: GM_getValue('gapSize', 8),
        thumbnailsPerRow: GM_getValue('thumbnailsPerRow', 5),
        useResponsiveMode: GM_getValue('useResponsiveMode', false),
        responsiveMinWidth: GM_getValue('responsiveMinWidth', 180),
        responsiveMaxWidth: GM_getValue('responsiveMaxWidth', 320)
    };

    // Register menu commands for configuration
    GM_registerMenuCommand('Configure Thumbnail Layout', configureLayout);
    GM_registerMenuCommand('Enable/Disable Responsive Mode', toggleResponsiveMode);
    GM_registerMenuCommand('Reset to Defaults', resetToDefaults);

    // FIXED FUNCTION: Only update thumbnails on main feed, not channel pages
    function updateThumbnailSources(targetWidth) {
        // Only run on homepage, not on channel pages
        if (window.location.pathname !== '/' && !window.location.pathname.startsWith('/feed/')) {
            return; // Skip on channel pages, search results, etc.
        }
        
        // Target only main feed thumbnails, not channel page thumbnails
        const thumbnails = document.querySelectorAll('ytd-rich-grid-renderer ytd-thumbnail img:not([src*="yt3.ggpht.com"])');
        const targetHeight = Math.round(targetWidth * 9/16);
        
        thumbnails.forEach(img => {
            // Check if the image has a src and it's a YouTube video thumbnail URL
            if (img.src && img.src.includes('ytimg.com/vi/')) {
                try {
                    // Extract the video ID from the URL
                    const videoIdMatch = img.src.match(/\/vi\/([^\/]+)\//);
                    if (!videoIdMatch) return;
                    
                    const videoId = videoIdMatch[1];
                    
                    // Check if this is already a maxresdefault or high-quality thumbnail
                    const isHighQuality = img.src.includes('maxresdefault') || 
                                         img.src.includes('sddefault') || 
                                         img.src.includes('hqdefault');
                    
                    // Only upgrade if it's a low quality thumbnail AND we're on the homepage
                    if (img.src.includes('default.jpg') && !isHighQuality) {
                        // Construct the maxresdefault URL
                        const baseUrl = img.src.substring(0, img.src.indexOf('/vi/') + 4);
                        const newSrc = `${baseUrl}/${videoId}/maxresdefault.jpg`;
                        
                        // Test if the maxresdefault exists (without actually loading it yet)
                        const testImg = new Image();
                        testImg.onload = function() {
                            // If maxresdefault loads successfully, update the thumbnail
                            img.src = newSrc;
                        };
                        testImg.onerror = function() {
                            // If maxresdefault fails, try sddefault
                            const sdSrc = `${baseUrl}/${videoId}/sddefault.jpg`;
                            const testSdImg = new Image();
                            testSdImg.onload = function() {
                                img.src = sdSrc;
                            };
                            testSdImg.src = sdSrc;
                        };
                        testImg.src = newSrc;
                    }
                    
                    // Handle size parameters in URL (for responsive images)
                    if (img.src.includes('=w') || img.src.includes('-h')) {
                        const newSrc = img.src.replace(/=w\d+-h\d+/g, `=w${targetWidth}-h${targetHeight}`)
                                             .replace(/\/w\d+-h\d+\//g, `/w${targetWidth}-h${targetHeight}/`);
                        if (newSrc !== img.src) {
                            img.src = newSrc;
                        }
                    }
                    
                } catch (e) {
                    // Silently fail
                }
            }
        });
    }

    // Function to toggle responsive mode
    function toggleResponsiveMode() {
        config.useResponsiveMode = !config.useResponsiveMode;
        GM_setValue('useResponsiveMode', config.useResponsiveMode);

        if (config.useResponsiveMode) {
            const minWidth = prompt('Minimum thumbnail width for responsive mode (pixels, 120-250 recommended) - (default is 180):', config.responsiveMinWidth);
            if (minWidth !== null) {
                const parsedMinWidth = parseInt(minWidth);
                if (!isNaN(parsedMinWidth) && parsedMinWidth >= 100 && parsedMinWidth <= 300) {
                    config.responsiveMinWidth = parsedMinWidth;
                    GM_setValue('responsiveMinWidth', parsedMinWidth);
                }
            }

            const maxWidth = prompt('Maximum thumbnail width for responsive mode (pixels, 250-400 recommended) - (default is 320):', config.responsiveMaxWidth);
            if (maxWidth !== null) {
                const parsedMaxWidth = parseInt(maxWidth);
                if (!isNaN(parsedMaxWidth) && parsedMaxWidth >= 200 && parsedMaxWidth <= 500) {
                    config.responsiveMaxWidth = parsedMaxWidth;
                    GM_setValue('responsiveMaxWidth', parsedMaxWidth);
                }
            }

            alert('Responsive Mode ENABLED!\n\nThumbnails will automatically adjust size based on screen width.\nMin: ' + config.responsiveMinWidth + 'px, Max: ' + config.responsiveMaxWidth + 'px');
        } else {
            alert('Responsive Mode DISABLED!\n\nUsing fixed thumbnail size: ' + config.thumbnailWidth + 'px');
        }

        applyCustomCSS();
    }

    // Function to show configuration dialog
    function configureLayout() {
        const width = prompt('Thumbnail width (pixels) - (default is 246):', config.thumbnailWidth);
        if (width !== null) {
            const parsedWidth = parseInt(width);
            if (!isNaN(parsedWidth) && parsedWidth > 0) {
                config.thumbnailWidth = parsedWidth;
                config.thumbnailHeight = Math.round(parsedWidth * (9/16));
                GM_setValue('thumbnailWidth', config.thumbnailWidth);
                GM_setValue('thumbnailHeight', config.thumbnailHeight);
            }
        }

        const gap = prompt('Gap between thumbnails (pixels) - (default is 8):', config.gapSize);
        if (gap !== null) {
            const parsedGap = parseInt(gap);
            if (!isNaN(parsedGap) && parsedGap >= 0) {
                config.gapSize = parsedGap;
                GM_setValue('gapSize', config.gapSize);
            }
        }

        const perRow = prompt('Thumbnails per row (4-6 recommended) - (default is 5):', config.thumbnailsPerRow);
        if (perRow !== null) {
            const parsedPerRow = parseInt(perRow);
            if (!isNaN(parsedPerRow) && parsedPerRow >= 3 && parsedPerRow <= 8) {
                config.thumbnailsPerRow = parsedPerRow;
                GM_setValue('thumbnailsPerRow', config.thumbnailsPerRow);
            }
        }

        applyCustomCSS();
        alert('Settings saved! Refresh YouTube page to see changes.');
    }

    // Function to reset to defaults
    function resetToDefaults() {
        config.thumbnailWidth = 246;
        config.thumbnailHeight = 138;
        config.gapSize = 8;
        config.thumbnailsPerRow = 5;
        config.useResponsiveMode = false;
        config.responsiveMinWidth = 180;
        config.responsiveMaxWidth = 320;

        GM_setValue('thumbnailWidth', config.thumbnailWidth);
        GM_setValue('thumbnailHeight', config.thumbnailHeight);
        GM_setValue('gapSize', config.gapSize);
        GM_setValue('thumbnailsPerRow', config.thumbnailsPerRow);
        GM_setValue('useResponsiveMode', config.useResponsiveMode);
        GM_setValue('responsiveMinWidth', config.responsiveMinWidth);
        GM_setValue('responsiveMaxWidth', config.responsiveMaxWidth);

        applyCustomCSS();
        alert('Reset to defaults! Refresh YouTube page to see changes.');
    }

    // Function to calculate responsive thumbnail width
    function calculateResponsiveWidth() {
        if (!config.useResponsiveMode) {
            const maxWidth = Math.floor((window.innerWidth - 100) / config.thumbnailsPerRow);
            return Math.min(config.thumbnailWidth, maxWidth);
        }

        const screenWidth = window.innerWidth;
        let responsiveWidth;

        if (screenWidth < 1280) {
            responsiveWidth = config.responsiveMinWidth;
        } else if (screenWidth < 1920) {
            responsiveWidth = config.responsiveMinWidth + (config.responsiveMaxWidth - config.responsiveMinWidth) * 0.3;
        } else if (screenWidth < 2560) {
            responsiveWidth = config.responsiveMinWidth + (config.responsiveMaxWidth - config.responsiveMinWidth) * 0.6;
        } else if (screenWidth < 3840) {
            responsiveWidth = config.responsiveMinWidth + (config.responsiveMaxWidth - config.responsiveMinWidth) * 0.8;
        } else {
            responsiveWidth = config.responsiveMaxWidth;
        }

        responsiveWidth = Math.max(config.responsiveMinWidth, Math.min(config.responsiveMaxWidth, responsiveWidth));
        const maxPossibleWidth = Math.floor((screenWidth - 100) / config.thumbnailsPerRow);
        return Math.min(Math.floor(responsiveWidth), maxPossibleWidth);
    }

    // Function to add or update the style
    function applyCustomCSS() {
        let style = document.getElementById('CustomCSSwrapper');
        if (!style) {
            style = document.createElement('style');
            style.id = 'CustomCSSwrapper';
            document.head.appendChild(style);
        }

        const calculatedWidth = calculateResponsiveWidth();
        const calculatedHeight = Math.round(calculatedWidth * (9/16));

        const responsiveCSS = config.useResponsiveMode ? `
            @media (min-width: 3840px) {
                #video-title {
                    font-size: 1.5rem !important;
                }
                #channel-name.ytd-video-meta-block {
                    font-size: 1.4rem !important;
                }
                #metadata-line {
                    font-size: 1.4rem !important;
                }
            }

            @media (min-width: 5120px) {
                #video-title {
                    font-size: 1.6rem !important;
                }
                #channel-name.ytd-video-meta-block {
                    font-size: 1.5rem !important;
                }
                #metadata-line {
                    font-size: 1.5rem !important;
                }
            }

            ytd-rich-grid-renderer {
                max-width: 100vw !important;
            }
        ` : '';

        style.textContent = `
            /* YouTube Small Thumbnails CSS - Updated March 2026 */

            ytd-rich-grid-renderer,
            ytd-rich-grid-row,
            #contents.ytd-rich-grid-row,
            #contents.ytd-rich-grid-renderer {
                --ytd-rich-grid-items-per-row: ${config.thumbnailsPerRow + 1} !important;
            }

            ytd-rich-item-renderer {
                min-width: ${calculatedWidth}px !important;
                max-width: ${calculatedWidth}px !important;
                width: ${calculatedWidth}px !important;
                flex: 0 0 ${calculatedWidth}px !important;
            }

            ytd-rich-grid-renderer {
                display: block !important;
            }

            ytd-rich-grid-row {
                display: flex !important;
                flex-wrap: wrap !important;
                justify-content: center !important;
                gap: ${config.gapSize}px !important;
            }

            #contents.ytd-rich-grid-row,
            #contents.ytd-rich-grid-renderer {
                display: grid !important;
                grid-template-columns: repeat(auto-fill, minmax(${calculatedWidth}px, 1fr)) !important;
                gap: ${config.gapSize}px !important;
                width: 100% !important;
                max-width: 100% !important;
                justify-content: center !important;
                grid-auto-flow: row !important;
            }

            ytd-rich-grid-renderer #contents {
                display: grid !important;
                grid-template-columns: repeat(auto-fill, minmax(${calculatedWidth}px, 1fr)) !important;
                justify-content: center !important;
                grid-auto-flow: row !important;
            }

            ytd-rich-grid-renderer ytd-thumbnail,
            ytd-rich-item-renderer ytd-thumbnail {
                width: ${calculatedWidth}px !important;
                height: ${calculatedHeight}px !important;
                aspect-ratio: 16/9 !important;
            }

            ytd-rich-grid-renderer #avatar-link {
                display: none !important;
            }

            #video-title {
                font-size: 1.4rem !important;
            }

            #channel-name.ytd-video-meta-block {
                font-size: 1.3rem !important;
            }

            #metadata-line {
                font-size: 1.3rem !important;
            }

            .ytd-mini-guide-renderer {
                display: none !important;
            }

            ytd-rich-grid-renderer > #contents {
                max-width: none !important;
            }

            ytd-rich-shelf-renderer ytd-rich-item-renderer {
                min-width: ${calculatedWidth}px !important;
                max-width: ${calculatedWidth}px !important;
                width: ${calculatedWidth}px !important;
            }

            ytd-rich-item-renderer {
                margin: 0 !important;
            }

            #primary.ytd-browse {
                padding-left: 0 !important;
                padding-right: 0 !important;
            }

            ytd-rich-grid-renderer[use-prominent-thumbs] #contents,
            ytd-rich-grid-renderer[use-spring-loading] #contents {
                display: grid !important;
                grid-template-columns: repeat(auto-fill, minmax(${calculatedWidth}px, 1fr)) !important;
                justify-content: center !important;
                grid-auto-flow: row !important;
            }

            ${responsiveCSS}

            @media (min-width: 3000px) {
                ytd-rich-grid-renderer #contents,
                #contents.ytd-rich-grid-row {
                    justify-content: flex-start !important;
                }
            }
        `;

        // Only run thumbnail source update on homepage, not on channel pages
        setTimeout(() => {
            updateThumbnailSources(calculatedWidth);
        }, 500);
    }

    // Apply CSS immediately
    applyCustomCSS();

    // Reapply when page changes (for SPA navigation)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(() => {
                applyCustomCSS();
            }, 100);
        }
    }).observe(document, { subtree: true, childList: true });

    setInterval(applyCustomCSS, 2000);

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(applyCustomCSS, 150);
    });
})();