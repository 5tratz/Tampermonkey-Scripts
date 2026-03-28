// ==UserScript==
// @name         YouTube - SmartSponsorBlock
// @description  Automatically skip sponsor segments in YouTube videos using SponsorBlock API
// @namespace    http://tampermonkey.net/
// @icon         https://cdn-icons-png.flaticon.com/64/2504/2504965.png
// @supportURL   https://github.com/5tratz/Tampermonkey-Scripts/issues
// @version      0.0.9
// @author       5tratz
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @grant        GM_xmlhttpRequest
// @connect      api.sponsor.ajay.app
// @license      MIT
// @downloadURL https://update.greasyfork.org/scripts/546387/YouTube%20-%20SmartSponsorBlock.user.js
// @updateURL https://update.greasyfork.org/scripts/546387/YouTube%20-%20SmartSponsorBlock.meta.js
// ==/UserScript==

(() => {
    'use strict';

    /* ================= CONFIG ================= */

    const SB_API = 'https://api.sponsor.ajay.app/api/skipSegments';
    const SKIP_CATEGORIES = ['sponsor', 'selfpromo', 'exclusive_access', 'interaction'];
    const SKIP_PADDING = 0.35;
    const CHECK_INTERVAL = 100; // Check more frequently for better accuracy
    const MAX_RETRIES = 3; // Retry failed API calls

    /* ================= STATE ================= */

    const segmentCache = new Map();
    let currentVideoId = null;
    let currentVideoEl = null;
    let skipInProgress = false; // Prevent multiple simultaneous skips
    let retryCount = 0;

    /* ================= UTILS ================= */

    const log = (...args) => console.debug('[SmartSponsorBlock]', ...args);
    const warn = (...args) => console.warn('[SmartSponsorBlock]', ...args);

    function getVideoId() {
        try {
            const url = new URL(location.href);

            // Normal videos
            if (url.searchParams.get('v')) {
                return url.searchParams.get('v');
            }

            // Shorts
            if (location.pathname.includes('/shorts/')) {
                const shorts = location.pathname.split('/shorts/')[1]?.split(/[?#]/)[0];
                if (shorts) return shorts;
            }

            // Embedded videos
            if (location.pathname.includes('/embed/')) {
                const embed = location.pathname.split('/embed/')[1]?.split(/[?#]/)[0];
                if (embed) return embed;
            }

            // Fallback to meta tag
            const meta = document.querySelector('meta[itemprop="videoId"]');
            if (meta) {
                return meta.getAttribute('content');
            }

            // Try to find video ID in page data
            const ytInitialData = document.getElementById('ytd-player') ||
                                 document.querySelector('script[nonce]');
            if (ytInitialData) {
                const dataStr = ytInitialData.textContent || '';
                const match = dataStr.match(/"videoId":"([^"]+)"/);
                if (match) return match[1];
            }
        } catch (e) {
            warn('Error getting video ID:', e);
        }
        return null;
    }

    function getVideoElement() {
        return document.querySelector('video');
    }

    function waitForElement(selector, timeout = 5000) {
        return new Promise((resolve) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver((mutations, obs) => {
                const element = document.querySelector(selector);
                if (element) {
                    obs.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                resolve(null);
            }, timeout);
        });
    }

    /* ================= SPONSORBLOCK ================= */

    function fetchSegments(videoId, callback, retry = 0) {
        if (segmentCache.has(videoId)) {
            callback(segmentCache.get(videoId));
            return;
        }

        const url = new URL(SB_API);
        url.searchParams.append('videoID', videoId);
        url.searchParams.append('categories', JSON.stringify(SKIP_CATEGORIES));

        // Add minimal fields parameter to reduce response size
        url.searchParams.append('action', 'skipSegments');

        log(`Fetching segments for video ${videoId}`);

        GM_xmlhttpRequest({
            method: 'GET',
            url: url.toString(),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            timeout: 10000, // 10 second timeout
            onload: res => {
                try {
                    if (res.status === 404) {
                        // No segments found
                        segmentCache.set(videoId, []);
                        callback([]);
                        return;
                    }

                    if (res.status !== 200) {
                        throw new Error(`HTTP ${res.status}`);
                    }

                    const data = JSON.parse(res.responseText);
                    const segments = Array.isArray(data)
                        ? data
                              .filter(item => item.segment && item.segment.length === 2)
                              .map(item => ({
                                  start: Math.max(0, item.segment[0]),
                                  end: item.segment[1],
                                  category: item.category,
                                  UUID: item.UUID,
                                  videoDuration: item.videoDuration
                              }))
                              .filter(s => s.end > s.start && s.end - s.start > 0.5) // Ignore very short segments
                              .sort((a, b) => a.start - b.start)
                        : [];

                    // Merge overlapping or adjacent segments
                    const merged = [];
                    for (const s of segments) {
                        const last = merged[merged.length - 1];
                        if (!last || s.start > last.end + 0.1) { // Add small gap tolerance
                            merged.push({ ...s });
                        } else {
                            last.end = Math.max(last.end, s.end);
                        }
                    }

                    log(`Found ${merged.length} sponsor segments for video ${videoId}`);
                    segmentCache.set(videoId, merged);
                    retryCount = 0; // Reset retry count on success
                    callback(merged);
                } catch (e) {
                    warn('Failed to parse SponsorBlock response:', e);

                    if (retry < MAX_RETRIES) {
                        setTimeout(() => {
                            fetchSegments(videoId, callback, retry + 1);
                        }, 1000 * (retry + 1)); // Exponential backoff
                    } else {
                        callback([]);
                    }
                }
            },
            onerror: (err) => {
                warn('Network error fetching segments:', err);

                if (retry < MAX_RETRIES) {
                    setTimeout(() => {
                        fetchSegments(videoId, callback, retry + 1);
                    }, 1000 * (retry + 1));
                } else {
                    callback([]);
                }
            },
            ontimeout: () => {
                warn('Request timeout');

                if (retry < MAX_RETRIES) {
                    setTimeout(() => {
                        fetchSegments(videoId, callback, retry + 1);
                    }, 1000 * (retry + 1));
                } else {
                    callback([]);
                }
            }
        });
    }

    /* ================= SKIP LOGIC ================= */

    function attachSkipper(videoId) {
        const video = getVideoElement();
        if (!video) {
            // Try to wait for video element
            waitForElement('video').then(videoEl => {
                if (videoEl && videoId) {
                    initializeSkipper(videoId, videoEl);
                }
            });
            return;
        }

        initializeSkipper(videoId, video);
    }

    function initializeSkipper(videoId, video) {
        // Skip if same video and element
        if (video === currentVideoEl && videoId === currentVideoId) {
            return;
        }

        // Clean up old listeners
        if (currentVideoEl) {
            currentVideoEl._skipCleanup?.();
        }

        currentVideoEl = video;
        currentVideoId = videoId;

        log(`Initializing skipper for video ${videoId}`);

        fetchSegments(videoId, segments => {
            if (!segments.length) {
                log('No sponsor segments found for this video');
                return;
            }

            let nextIndex = 0;
            let checkTimeout = null;
            let isActive = true;

            const findCurrentSegment = (time) => {
                return segments.find(s => time >= s.start && time < s.end);
            };

            const findNextSegmentIndex = (time) => {
                return segments.findIndex(s => time < s.end);
            };

            const performSkip = (segment) => {
                if (skipInProgress) return;

                skipInProgress = true;

                try {
                    const targetTime = segment.end + SKIP_PADDING;
                    // Ensure we don't skip beyond video duration
                    if (targetTime < video.duration) {
                        video.currentTime = targetTime;
                        log(`✅ Skipped sponsor: ${segment.start.toFixed(2)} → ${segment.end.toFixed(2)}`);

                        // Update nextIndex after skip
                        nextIndex = findNextSegmentIndex(targetTime);
                        if (nextIndex === -1) nextIndex = segments.length;
                    }
                } catch (e) {
                    warn('Error during skip:', e);
                } finally {
                    skipInProgress = false;
                }
            };

            const checkAndSkip = () => {
                if (!isActive || !video || video.paused) return;

                const currentTime = video.currentTime;

                // Find if we're in a segment
                const currentSegment = findCurrentSegment(currentTime);

                if (currentSegment) {
                    performSkip(currentSegment);
                } else {
                    // Update nextIndex for future checks
                    nextIndex = findNextSegmentIndex(currentTime);
                    if (nextIndex === -1) nextIndex = segments.length;
                }
            };

            const handleSeeking = () => {
                if (!isActive) return;

                const currentTime = video.currentTime;
                const currentSegment = findCurrentSegment(currentTime);

                if (currentSegment) {
                    log('User seeked into sponsor, skipping');
                    performSkip(currentSegment);
                } else {
                    nextIndex = findNextSegmentIndex(currentTime);
                    if (nextIndex === -1) nextIndex = segments.length;
                }
            };

            const handlePlay = () => {
                // Check immediately when video starts playing
                checkAndSkip();
            };

            const handleLoadedMetadata = () => {
                // Reset state when video metadata loads
                nextIndex = findNextSegmentIndex(video.currentTime);
                if (nextIndex === -1) nextIndex = segments.length;
            };

            // Add event listeners
            video.addEventListener('timeupdate', checkAndSkip);
            video.addEventListener('seeking', handleSeeking);
            video.addEventListener('play', handlePlay);
            video.addEventListener('loadedmetadata', handleLoadedMetadata);

            // Also check periodically for better reliability
            const intervalId = setInterval(checkAndSkip, CHECK_INTERVAL);

            // Store cleanup function
            video._skipCleanup = () => {
                isActive = false;
                video.removeEventListener('timeupdate', checkAndSkip);
                video.removeEventListener('seeking', handleSeeking);
                video.removeEventListener('play', handlePlay);
                video.removeEventListener('loadedmetadata', handleLoadedMetadata);
                clearInterval(intervalId);
                if (checkTimeout) clearTimeout(checkTimeout);
            };

            // Check immediately in case we're already in a segment
            setTimeout(checkAndSkip, 100);
        });
    }

    /* ================= PAGE OBSERVER ================= */

    let navigationTimeout = null;

    function handleNavigation() {
        if (navigationTimeout) {
            clearTimeout(navigationTimeout);
        }

        navigationTimeout = setTimeout(() => {
            const videoId = getVideoId();
            if (videoId) {
                log(`Navigation detected, video ID: ${videoId}`);
                attachSkipper(videoId);
            }
        }, 800); // Slightly longer delay for YouTube to fully initialize
    }

    function observePage() {
        // YouTube navigation events
        document.addEventListener('yt-navigate-finish', handleNavigation);
        document.addEventListener('yt-page-data-updated', handleNavigation);

        // Also listen for video element changes
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    const addedNodes = Array.from(mutation.addedNodes);
                    const hasVideo = addedNodes.some(node =>
                        node.nodeName === 'VIDEO' ||
                        (node.querySelector && node.querySelector('video'))
                    );

                    if (hasVideo) {
                        const videoId = getVideoId();
                        if (videoId && videoId !== currentVideoId) {
                            handleNavigation();
                        }
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Initial check
        handleNavigation();

        // Fallback periodic check
        setInterval(() => {
            const videoId = getVideoId();
            if (videoId && videoId !== currentVideoId) {
                handleNavigation();
            }
        }, 2000);
    }

    // Start the script
    log('Starting SmartSponsorBlock');
    observePage();
})();