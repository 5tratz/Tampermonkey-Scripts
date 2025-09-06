// ==UserScript==
// @name         YouTube - SmartSponsorBlock
// @description  Automatically skip sponsors in YouTube videos using SponsorBlock API
// @namespace    http://tampermonkey.net/
// @icon         https://cdn-icons-png.flaticon.com/64/2504/2504965.png
// @version      0.0.4
// @author       rxm
// @match        https://www.youtube.com/*
// @grant        GM_xmlhttpRequest
// @connect      api.sponsor.ajay.app
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const SB_API = 'https://api.sponsor.ajay.app/api/skipSegments';
    const sbDataCache = new Map();
    let activeVideoId = null;
    let listenerAttached = false;

    // Only skip *real sponsor ads* (not intros, outros, selfpromo, etc.)
    const skipCategories = ['sponsor'];

    function log(...args) {
        console.debug('[SponsorBlock]', ...args);
    }

    function getVideoId() {
        try {
            const u = new URL(location.href);
            if (u.searchParams.get('v')) return u.searchParams.get('v');
            const shorts = location.pathname.match(/\/shorts\/([^/?#]+)/);
            if (shorts) return shorts[1];
            const meta = document.querySelector('meta[itemprop="videoId"]');
            if (meta) return meta.getAttribute('content');
        } catch {}
        return null;
    }

    function getVideoElement() {
        return document.querySelector('video.html5-main-video');
    }

    function fetchSponsorSegments(videoId, callback, attempt = 1) {
        if (sbDataCache.has(videoId)) {
            callback(sbDataCache.get(videoId));
            return;
        }

        const url = `${SB_API}?videoID=${encodeURIComponent(videoId)}&categories=${encodeURIComponent(JSON.stringify(skipCategories))}`;

        GM_xmlhttpRequest({
            method: 'GET',
            url,
            headers: { 'Accept': 'application/json' },
            onload: (res) => {
                try {
                    const data = JSON.parse(res.responseText);
                    const segments = (Array.isArray(data) ? data : []).map(item => {
                        const seg = item.segment || item.segments || [];
                        const cat = item.category || (item.categories && item.categories[0]) || 'sponsor';
                        const start = Number(seg[0]) || 0;
                        const end = Number(seg[1]) || 0;
                        return end > start ? { start, end, category: cat } : null;
                    }).filter(Boolean).sort((a, b) => a.start - b.start);

                    // Merge overlapping segments
                    const merged = [];
                    for (const s of segments) {
                        const last = merged[merged.length - 1];
                        if (!last || s.start > last.end) {
                            merged.push({ ...s });
                        } else {
                            last.end = Math.max(last.end, s.end);
                        }
                    }

                    sbDataCache.set(videoId, merged);
                    callback(merged);
                } catch (e) {
                    if (attempt < 2) {
                        log('Retrying fetch due to parse error…');
                        return fetchSponsorSegments(videoId, callback, attempt + 1);
                    }
                    log('Failed to parse API response', e);
                    callback([]);
                }
            },
            onerror: () => {
                if (attempt < 2) {
                    log('Retrying fetch due to network error…');
                    fetchSponsorSegments(videoId, callback, attempt + 1);
                } else {
                    callback([]);
                }
            },
            ontimeout: () => callback([])
        });
    }

    function attachSkipper(videoId) {
        const vid = getVideoElement();
        if (!vid || !videoId) return;
        if (activeVideoId === videoId && listenerAttached) return;

        fetchSponsorSegments(videoId, (segments) => {
            if (!segments.length) return;

            activeVideoId = videoId;
            let nextSegIndex = 0;

            const onTimeUpdate = () => {
                let t = vid.currentTime || 0;
                while (nextSegIndex < segments.length) {
                    const seg = segments[nextSegIndex];
                    if (seg && t >= seg.start && t < seg.end) {
                        t = vid.currentTime = +(seg.end + 0.35).toFixed(2); // skip forward safely
                        log(`Skipped ${seg.category}: ${seg.start} → ${seg.end}`);
                        nextSegIndex++;
                    } else {
                        break;
                    }
                }
            };

            const onSeeking = () => {
                // Recalculate based on current position
                nextSegIndex = segments.findIndex(s => vid.currentTime < s.end);
                if (nextSegIndex < 0) nextSegIndex = segments.length;

                // If you land inside a sponsor block, skip it immediately
                const inside = segments.find(s => vid.currentTime >= s.start && vid.currentTime < s.end);
                if (inside) {
                    vid.currentTime = +(inside.end + 0.35).toFixed(2);
                    log(`Seek landed inside sponsor, skipped ${inside.category}`);
                    nextSegIndex = segments.indexOf(inside) + 1;
                }
            };

            vid.addEventListener('timeupdate', onTimeUpdate);
            vid.addEventListener('seeking', onSeeking);
            listenerAttached = true;

            // Watch if the video element gets replaced
            const checkInterval = setInterval(() => {
                if (!document.contains(vid) || getVideoElement() !== vid) {
                    try {
                        vid.removeEventListener('timeupdate', onTimeUpdate);
                        vid.removeEventListener('seeking', onSeeking);
                    } catch {}
                    clearInterval(checkInterval);
                    listenerAttached = false;
                    activeVideoId = null;
                }
            }, 1500);
        });
    }

    // Monitor for video changes
    function observePage() {
        let lastVideoId = null;
        setInterval(() => {
            const videoId = getVideoId();
            if (videoId && videoId !== lastVideoId) {
                lastVideoId = videoId;
                attachSkipper(videoId);
            }
        }, 2000);
    }

    observePage();
})();
