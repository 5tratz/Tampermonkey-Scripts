// ==UserScript==
// @name         Twitch - Drop Alerts
// @description  Get notified when new Twitch drops appear
// @namespace    http://tampermonkey.net/
// @icon         https://cdn-icons-png.flaticon.com/128/14857/14857405.png
// @version      0.0.2
// @author       5tratz
// @license      MIT
// @match        https://*/*
// @grant        GM_notification
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    const CHECK_INTERVAL = 60 * 60 * 1000; // 60 minutes

    // Multiple data sources
    const API_SOURCES = [
        {
            name: 'Primary API',
            url: 'https://twitch-drops-api.sunkwi.com/drops',
            parser: (data) => {
                if (Array.isArray(data)) {
                    return data.map(d => d.game || d.name || 'Unknown Drop');
                }
                return [];
            }
        },
        {
            name: 'Alternative Source',
            url: 'https://raw.githubusercontent.com/5tratz/Tampermonkey-Scripts/main/drops-feed.json', // You'd need to maintain this
            parser: (data) => {
                return data.drops || [];
            }
        }
    ];

    const STORAGE_KEY = 'seenDropCampaigns';

    function fetchFromSource(source) {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: source.url,
                timeout: 10000,
                onload: function(response) {
                    if (response.status === 200) {
                        try {
                            const data = JSON.parse(response.responseText);
                            const drops = source.parser(data);
                            console.log(`✅ ${source.name}: Found ${drops.length} drops`);
                            resolve(drops);
                        } catch (e) {
                            console.log(`❌ ${source.name}: Parse error`, e);
                            resolve([]);
                        }
                    } else {
                        console.log(`❌ ${source.name}: Status ${response.status}`);
                        resolve([]);
                    }
                },
                onerror: function() {
                    console.log(`❌ ${source.name}: Network error`);
                    resolve([]);
                },
                ontimeout: function() {
                    console.log(`❌ ${source.name}: Timeout`);
                    resolve([]);
                }
            });
        });
    }

    async function fetchAndCheckDrops() {
        console.log('🔄 Checking multiple sources for Twitch drops...');

        // Try all sources in parallel
        const results = await Promise.all(
            API_SOURCES.map(source => fetchFromSource(source))
        );

        // Combine all drops and remove duplicates
        const allDrops = [...new Set(results.flat())];
        console.log('📊 Total unique drops found:', allDrops);

        if (allDrops.length > 0) {
            checkForNewDrops(allDrops);
        } else {
            console.log('ℹ️ No drops found from any source');

            // As a fallback, show known active drops as a test
            const knownActiveDrops = [
                'Marathon Server Slam',
                'World of Warcraft: Midnight',
                'Arc Raiders'
            ];

            console.log('📋 Known active drops (for reference):', knownActiveDrops);
        }
    }

    function checkForNewDrops(currentDrops) {
        let seenDrops = GM_getValue(STORAGE_KEY, []);

        const newDrops = currentDrops.filter(drop => !seenDrops.includes(drop));

        if (newDrops.length > 0) {
            const message = newDrops.length === 1
                ? `New drop available: ${newDrops[0]}`
                : `New drops available:\n${newDrops.join('\n')}`;

            GM_notification({
                title: '🎮 New Twitch Drop Alert!',
                text: message,
                timeout: 15000,
                onclick: function() {
                    window.open('https://www.twitch.tv/drops/inventory', '_blank');
                }
            });

            const updatedSeen = [...new Set([...seenDrops, ...newDrops])];
            GM_setValue(STORAGE_KEY, updatedSeen);
        }
    }

    console.log('🚀 Twitch Drop Notifier (Multi-Source) started');
    fetchAndCheckDrops();
    setInterval(fetchAndCheckDrops, CHECK_INTERVAL);
})();