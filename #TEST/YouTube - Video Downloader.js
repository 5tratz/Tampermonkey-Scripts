// ==UserScript==
// @name         YouTube - Downloader
// @description  Download YouTube videos with advanced options and features.
// @namespace    http://tampermonkey.net/
// @icon         https://cdn-icons-png.flaticon.com/64/2504/2504965.png
// @supportURL   https://github.com/5tratz/Tampermonkey-Scripts/issues
// @version      0.0.2
// @author       5tratz
// @match        https://www.youtube.com/*
// @license      MIT
// @connect      loader.to
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // ==================== STYLES ====================
    const stylesCss = `
        /* Main download button - matches YouTube's native button style */
        .yt-ultimate-download-btn {
            border: none;
            padding: 8px 16px;
            border-radius: 18px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            margin-left: 8px;
            transition: all 0.1s ease;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-family: 'Roboto', Arial, sans-serif;
            position: relative;
        }
        
        /* Modern download icon SVG */
        .yt-download-icon-svg {
            width: 20px;
            height: 20px;
            display: inline-block;
        }
        
        .yt-download-icon-svg svg {
            width: 100%;
            height: 100%;
            fill: none;
            stroke: currentColor;
            stroke-width: 1.5;
            stroke-linecap: round;
            stroke-linejoin: round;
        }
        
        /* Light theme button */
        .yt-ultimate-download-btn.light-theme {
            background: #f2f2f2;
            color: #0f0f0f;
        }
        
        .yt-ultimate-download-btn.light-theme:hover {
            background: #e5e5e5;
        }
        
        /* Dark theme button */
        .yt-ultimate-download-btn.dark-theme {
            background: rgba(255, 255, 255, 0.08);
            color: #f1f1f1;
        }
        
        .yt-ultimate-download-btn.dark-theme:hover {
            background: rgba(255, 255, 255, 0.12);
        }
        
        /* Active state (when menu is open) */
        .yt-ultimate-download-btn.active {
            background: #3ea6ff;
            color: #0f0f0f;
        }
        
        .yt-ultimate-download-btn.active:hover {
            background: #3ea6ff;
        }
        
        .yt-ultimate-download-btn.loading {
            opacity: 0.7;
            cursor: wait;
            transform: none;
        }
        
        /* Hide YouTube's native Premium download button */
        button[aria-label="Download"],
        ytd-download-button-renderer,
        #download-button,
        yt-icon-button[aria-label="Download"],
        button.yt-spec-button-shape-next--call-to-action[aria-label="Download"],
        ytd-button-renderer[aria-label="Download"] {
            display: none !important;
        }
        
        /* Menu styles */
        .yt-download-menu {
            position: fixed;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            z-index: 10001;
            min-width: 320px;
            max-width: 400px;
            max-height: 550px;
            overflow-y: auto;
            font-family: 'Roboto', Arial, sans-serif;
            animation: slideDown 0.2s ease;
        }
        
        .yt-download-menu.light-theme {
            background: #ffffff;
            border: 1px solid #e5e5e5;
        }
        
        .yt-download-menu.light-theme .yt-download-menu-header {
            background: #f8f8f8;
            border-bottom: 1px solid #e5e5e5;
        }
        
        .yt-download-menu.light-theme .yt-download-menu-header h3 {
            color: #0f0f0f;
        }
        
        .yt-download-menu.light-theme .yt-download-menu-header p {
            color: #606060;
        }
        
        .yt-download-menu.light-theme .yt-download-section-title {
            background: #f0f0f0;
            color: #065fd4;
            border-bottom: 1px solid #e5e5e5;
        }
        
        .yt-download-menu.light-theme .yt-format-item {
            border-bottom: 1px solid #f0f0f0;
        }
        
        .yt-download-menu.light-theme .yt-format-item:hover {
            background: #f8f8f8;
        }
        
        .yt-download-menu.light-theme .yt-format-quality {
            color: #0f0f0f;
        }
        
        .yt-download-menu.light-theme .yt-format-details {
            color: #606060;
        }
        
        .yt-download-menu.light-theme .yt-format-badge {
            background: #f0f0f0;
            color: #065fd4;
        }
        
        .yt-download-menu.light-theme .yt-download-icon-arrow {
            color: #065fd4;
        }
        
        .yt-download-menu.light-theme .yt-menu-close {
            color: #606060;
        }
        
        .yt-download-menu.light-theme .yt-menu-close:hover {
            background: #f0f0f0;
            color: #0f0f0f;
        }
        
        .yt-download-menu.dark-theme {
            background: #212121;
            border: 1px solid #3f3f3f;
        }
        
        .yt-download-menu.dark-theme .yt-download-menu-header {
            background: #2c2c2c;
            border-bottom: 1px solid #3f3f3f;
        }
        
        .yt-download-menu.dark-theme .yt-download-menu-header h3 {
            color: #fff;
        }
        
        .yt-download-menu.dark-theme .yt-download-menu-header p {
            color: #aaa;
        }
        
        .yt-download-menu.dark-theme .yt-download-section-title {
            background: #2c2c2c;
            color: #3ea6ff;
            border-bottom: 1px solid #3f3f3f;
        }
        
        .yt-download-menu.dark-theme .yt-format-item {
            border-bottom: 1px solid #2c2c2c;
        }
        
        .yt-download-menu.dark-theme .yt-format-item:hover {
            background: #2c2c2c;
        }
        
        .yt-download-menu.dark-theme .yt-format-quality {
            color: #fff;
        }
        
        .yt-download-menu.dark-theme .yt-format-details {
            color: #aaa;
        }
        
        .yt-download-menu.dark-theme .yt-format-badge {
            background: #3f3f3f;
            color: #3ea6ff;
        }
        
        .yt-download-menu.dark-theme .yt-download-icon-arrow {
            color: #3ea6ff;
        }
        
        .yt-download-menu.dark-theme .yt-menu-close {
            color: #aaa;
        }
        
        .yt-download-menu.dark-theme .yt-menu-close:hover {
            background: #3f3f3f;
            color: #fff;
        }
        
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .yt-format-item {
            padding: 12px 20px;
            cursor: pointer;
            transition: all 0.15s ease;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .yt-format-info {
            flex: 1;
        }
        
        .yt-format-quality {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 4px;
        }
        
        .yt-format-details {
            font-size: 11px;
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            align-items: center;
        }
        
        .yt-format-badge {
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
        }
        
        .yt-download-icon-arrow {
            font-size: 18px;
            opacity: 0;
            transition: opacity 0.2s;
        }
        
        .yt-format-item:hover .yt-download-icon-arrow {
            opacity: 1;
        }
        
        .yt-menu-close {
            position: absolute;
            top: 16px;
            right: 16px;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 20px;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s;
        }
        
        .yt-spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(128,128,128,0.3);
            border-radius: 50%;
            border-top-color: currentColor;
            animation: spin 0.6s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .progress-bar-container {
            width: 60px;
            background: rgba(128,128,128,0.2);
            border-radius: 10px;
            overflow: hidden;
            margin-right: 8px;
            display: inline-block;
        }
        
        .progress-bar {
            height: 3px;
            background: #3ea6ff;
            width: 0%;
            transition: width 0.3s ease;
            border-radius: 10px;
        }
        
        .yt-download-menu.dark-theme .progress-bar-container {
            background: rgba(255,255,255,0.1);
        }
        
        .yt-download-menu.light-theme .progress-bar-container {
            background: rgba(0,0,0,0.1);
        }
        
        .yt-download-menu.light-theme .progress-bar {
            background: #065fd4;
        }
    `;

    // ==================== MODERN SVG ICONS ====================
    const icons = {
        download: `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3V16M12 16L9 13M12 16L15 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M5 21H19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M5 17H4C3.44772 17 3 17.4477 3 18V20C3 20.5523 3.44772 21 4 21H20C20.5523 21 21 20.5523 21 20V18C21 17.4477 20.5523 17 20 17H19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
        `,
        arrow: `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `,
        spinner: `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="yt-spinner-svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" stroke-dasharray="31.4" stroke-dashoffset="0">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
                </circle>
            </svg>
        `
    };

    // ==================== CONFIGURATION ====================
    const AUDIO_FORMATS = [
        { id: 'mp3', name: 'MP3', quality: 'High Quality', bitrate: '320kbps', badge: 'Most Compatible' },
        { id: 'm4a', name: 'M4A', quality: 'High Quality', bitrate: '256kbps', badge: 'Apple Compatible' },
        { id: 'aac', name: 'AAC', quality: 'High Quality', bitrate: '256kbps', badge: 'Best Quality' },
        { id: 'opus', name: 'OPUS', quality: 'Very High', bitrate: '160kbps', badge: 'Efficient' },
        { id: 'ogg', name: 'OGG', quality: 'High Quality', bitrate: '192kbps', badge: 'Open Source' },
        { id: 'flac', name: 'FLAC', quality: 'Lossless', bitrate: '~1000kbps', badge: 'UHQ' },
        { id: 'wav', name: 'WAV', quality: 'Lossless', bitrate: '1411kbps', badge: 'Studio Quality' }
    ];
    
    const VIDEO_FORMATS = [
        { id: '2160', name: '2160p', resolution: '3840x2160', badge: '4K Ultra HD', bitrate: '~45Mbps' },
        { id: '1440', name: '1440p', resolution: '2560x1440', badge: '2K QHD', bitrate: '~16Mbps' },
        { id: '1080', name: '1080p', resolution: '1920x1080', badge: 'Full HD', bitrate: '~8Mbps' },
        { id: '720', name: '720p', resolution: '1280x720', badge: 'HD', bitrate: '~5Mbps' },
        { id: '480', name: '480p', resolution: '854x480', badge: 'SD', bitrate: '~2.5Mbps' },
        { id: '360', name: '360p', resolution: '640x360', badge: 'Low', bitrate: '~1Mbps' }
    ];

    let currentVideoUrl = window.location.href;
    let currentVideoTitle = '';
    let activeMenu = null;
    let firstBoot = true;
    let currentTheme = 'dark';
    let navigationTimeout = null;
    let isNavigating = false;

    // ==================== THEME DETECTION ====================
    function detectYouTubeTheme() {
        const ytdApp = document.querySelector('ytd-app');
        if (ytdApp && ytdApp.hasAttribute('dark') && ytdApp.getAttribute('dark') !== 'false') {
            return 'dark';
        }
        
        const htmlEl = document.documentElement;
        if (htmlEl.hasAttribute('dark') && htmlEl.getAttribute('dark') !== 'false') {
            return 'dark';
        }
        
        const bodyBg = getComputedStyle(document.body).backgroundColor;
        const darkColors = ['rgb(15, 15, 15)', 'rgb(0, 0, 0)', 'rgb(18, 18, 18)', '#0f0f0f'];
        if (darkColors.some(color => bodyBg.includes(color))) {
            return 'dark';
        }
        
        try {
            const pref = localStorage.getItem('yt-remote-theme-preference');
            if (pref === 'dark') return 'dark';
            if (pref === 'light') return 'light';
        } catch(e) {}
        
        return 'light';
    }
    
    function applyThemeToButton(button) {
        const theme = detectYouTubeTheme();
        currentTheme = theme;
        button.classList.remove('light-theme', 'dark-theme', 'active');
        button.classList.add(theme === 'light' ? 'light-theme' : 'dark-theme');
    }
    
    function applyThemeToMenu(menu) {
        const theme = detectYouTubeTheme();
        menu.classList.remove('light-theme', 'dark-theme');
        menu.classList.add(theme === 'light' ? 'light-theme' : 'dark-theme');
    }
    
    // ==================== HIDE PREMIUM BUTTON ====================
    function hidePremiumButton() {
        const premiumSelectors = [
            'button[aria-label="Download"]',
            'ytd-download-button-renderer',
            '#download-button',
            'yt-icon-button[aria-label="Download"]',
            'button.yt-spec-button-shape-next--call-to-action[aria-label="Download"]',
            'ytd-button-renderer[aria-label="Download"]'
        ];
        
        for (const selector of premiumSelectors) {
            const premiumBtn = document.querySelector(selector);
            if (premiumBtn) {
                premiumBtn.style.display = 'none';
            }
        }
    }
    
    // ==================== UTILITY FUNCTIONS ====================
    function getVideoTitle() {
        const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer, yt-formatted-string.ytd-video-primary-info-renderer, #title h1');
        return titleElement ? titleElement.textContent.trim() : 'youtube_video';
    }
    
    function sanitizeFilename(title) {
        return title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').substring(0, 100);
    }
    
    function getExtension(format) {
        const extMap = {
            'mp3': 'mp3', 'm4a': 'm4a', 'aac': 'aac', 'opus': 'opus', 
            'ogg': 'ogg', 'flac': 'flac', 'wav': 'wav',
            '2160': 'mp4', '1440': 'mp4', '1080': 'mp4', '720': 'mp4', 
            '480': 'mp4', '360': 'mp4'
        };
        return extMap[format] || 'mp4';
    }
    
    function getFormatInfo(formatId) {
        return VIDEO_FORMATS.find(f => f.id === formatId) || AUDIO_FORMATS.find(f => f.id === formatId);
    }
    
    // ==================== DOWNLOAD FUNCTIONS ====================
    function initiateDownload(format, buttonElement, videoUrl, videoTitle) {
        if (!buttonElement) return;
        
        console.log(`Starting download for format: ${format}`);
        
        const detailsDiv = buttonElement.querySelector('.yt-format-details');
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-bar-container';
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressContainer.appendChild(progressBar);
        
        if (detailsDiv) {
            detailsDiv.innerHTML = '';
            detailsDiv.appendChild(progressContainer);
            const statusSpan = document.createElement('span');
            statusSpan.textContent = ' Starting...';
            statusSpan.style.marginLeft = '8px';
            detailsDiv.appendChild(statusSpan);
        }
        
        buttonElement.style.opacity = '0.7';
        buttonElement.style.cursor = 'wait';
        
        GM_xmlhttpRequest({
            method: "GET",
            url: `https://loader.to/ajax/download.php?url=${encodeURIComponent(videoUrl)}&format=${format}&start=1&end=1`,
            onload: function(res) {
                try {
                    const data = JSON.parse(res.responseText);
                    if (data.success || data.id) {
                        console.log("Download initiated with ID:", data.id);
                        checkProgress(data.id, data.download_url, buttonElement, format, videoTitle);
                    } else {
                        showError(buttonElement, format, 'Format not available');
                    }
                } catch(e) {
                    console.error("Download init failed:", e);
                    showError(buttonElement, format, 'Failed to initialize');
                }
            },
            onerror: function(e) {
                console.error("Request failed:", e);
                showError(buttonElement, format, 'Network error');
            }
        });
    }
    
    function checkProgress(id, downloadUrl, buttonElement, format, videoTitle) {
        let attempts = 0;
        let lastValidProgress = 0;
        let consecutiveErrors = 0;
        
        function pollProgress() {
            attempts++;
            
            GM_xmlhttpRequest({
                method: "GET",
                url: `https://loader.to/ajax/progress.php?id=${id}`,
                timeout: 10000,
                onload: function(res) {
                    consecutiveErrors = 0;
                    
                    try {
                        const data = JSON.parse(res.responseText);
                        
                        if (data.download_url && data.download_url !== downloadUrl) {
                            const finalUrl = data.download_url;
                            const filename = `${sanitizeFilename(videoTitle)}_${format}.${getExtension(format)}`;
                            
                            updateProgressDisplay(buttonElement, 100, ' Ready!');
                            buttonElement.style.opacity = '1';
                            buttonElement.style.cursor = 'pointer';
                            buttonElement.setAttribute('data-download-url', finalUrl);
                            buttonElement.setAttribute('data-filename', filename);
                            return;
                        }
                        
                        let progress = data.progress;
                        if (typeof progress === 'string') {
                            progress = parseInt(progress);
                        }
                        
                        if (isNaN(progress) || progress < 0) {
                            progress = lastValidProgress;
                        } else if (progress > 100) {
                            progress = 99;
                        }
                        
                        if (progress >= lastValidProgress - 5 || progress > lastValidProgress) {
                            lastValidProgress = Math.min(progress, 99);
                            updateProgressDisplay(buttonElement, lastValidProgress, ` Processing ${lastValidProgress}%`);
                        }
                        
                        setTimeout(pollProgress, 1500);
                        
                    } catch(e) {
                        console.error("Progress parse error:", e);
                        consecutiveErrors++;
                        if (consecutiveErrors < 5) {
                            setTimeout(pollProgress, 2000);
                        } else {
                            showError(buttonElement, format, 'Progress check failed');
                        }
                    }
                },
                onerror: function(e) {
                    console.error("Progress request failed:", e);
                    consecutiveErrors++;
                    if (consecutiveErrors < 5) {
                        setTimeout(pollProgress, 3000);
                    } else {
                        showError(buttonElement, format, 'Connection error');
                    }
                },
                ontimeout: function() {
                    console.error("Progress request timeout");
                    consecutiveErrors++;
                    if (consecutiveErrors < 5) {
                        setTimeout(pollProgress, 3000);
                    } else {
                        showError(buttonElement, format, 'Timeout');
                    }
                }
            });
        }
        
        function updateProgressDisplay(buttonElement, progress, message) {
            const detailsDiv = buttonElement.querySelector('.yt-format-details');
            if (detailsDiv) {
                const progressBar = detailsDiv.querySelector('.progress-bar');
                const statusSpan = Array.from(detailsDiv.children).find(child => child.tagName === 'SPAN');
                
                if (progressBar) {
                    progressBar.style.width = `${progress}%`;
                }
                if (statusSpan) {
                    statusSpan.textContent = message;
                }
            }
        }
        
        pollProgress();
    }
    
    function showError(buttonElement, format, errorMsg) {
        const detailsDiv = buttonElement.querySelector('.yt-format-details');
        if (detailsDiv) {
            detailsDiv.innerHTML = `<span style="color: #cc0000;">⚠️ ${errorMsg}</span>`;
        }
        buttonElement.style.opacity = '1';
        buttonElement.style.cursor = 'pointer';
        
        setTimeout(() => {
            resetFormatDisplay(buttonElement, format);
        }, 3000);
    }
    
    function resetFormatDisplay(buttonElement, format) {
        const formatInfo = getFormatInfo(format);
        const detailsDiv = buttonElement.querySelector('.yt-format-details');
        if (detailsDiv && formatInfo) {
            if (formatInfo.resolution) {
                detailsDiv.innerHTML = `
                    <span>${formatInfo.resolution}</span>
                    <span class="yt-format-badge">${formatInfo.badge}</span>
                    <span>${formatInfo.bitrate || ''}</span>
                `;
            } else {
                detailsDiv.innerHTML = `
                    <span>${formatInfo.quality}</span>
                    <span class="yt-format-badge">${formatInfo.badge}</span>
                    <span>${formatInfo.bitrate}</span>
                `;
            }
        }
        buttonElement.style.opacity = '1';
    }
    
    function performDownload(url, filename, buttonElement) {
        window.open(url, '_blank');
        const format = buttonElement.getAttribute('data-format');
        setTimeout(() => {
            resetFormatDisplay(buttonElement, format);
            buttonElement.removeAttribute('data-download-url');
            buttonElement.removeAttribute('data-filename');
        }, 3000);
    }
    
    // ==================== MENU CREATION ====================
    function createDownloadMenu(videoUrl, videoTitle) {
        const menu = document.createElement('div');
        menu.className = 'yt-download-menu';
        menu.id = 'yt-download-menu';
        applyThemeToMenu(menu);
        
        const header = document.createElement('div');
        header.className = 'yt-download-menu-header';
        header.innerHTML = `
            <h3>📥 Download Options</h3>
            <p>${videoTitle.substring(0, 50)}${videoTitle.length > 50 ? '...' : ''}</p>
            <button class="yt-menu-close" id="yt-menu-close">✕</button>
        `;
        menu.appendChild(header);
        
        const videoSection = document.createElement('div');
        videoSection.className = 'yt-download-section';
        videoSection.innerHTML = '<div class="yt-download-section-title">🎬 VIDEO FORMATS</div>';
        VIDEO_FORMATS.forEach(format => {
            videoSection.appendChild(createFormatItem(format, 'video', videoUrl, videoTitle));
        });
        menu.appendChild(videoSection);
        
        const audioSection = document.createElement('div');
        audioSection.className = 'yt-download-section';
        audioSection.innerHTML = '<div class="yt-download-section-title">🎵 AUDIO FORMATS</div>';
        AUDIO_FORMATS.forEach(format => {
            audioSection.appendChild(createFormatItem(format, 'audio', videoUrl, videoTitle));
        });
        menu.appendChild(audioSection);
        
        return menu;
    }
    
    function createFormatItem(format, type, videoUrl, videoTitle) {
        const item = document.createElement('div');
        item.className = 'yt-format-item';
        item.setAttribute('data-format', format.id);
        item.setAttribute('data-type', type);
        
        let detailsHtml = '';
        if (type === 'video') {
            detailsHtml = `
                <div class="yt-format-details">
                    <span>${format.resolution || format.name}</span>
                    <span class="yt-format-badge">${format.badge}</span>
                    <span>${format.bitrate || ''}</span>
                </div>
            `;
        } else {
            detailsHtml = `
                <div class="yt-format-details">
                    <span>${format.quality}</span>
                    <span class="yt-format-badge">${format.badge}</span>
                    <span>${format.bitrate}</span>
                </div>
            `;
        }
        
        item.innerHTML = `
            <div class="yt-format-info">
                <div class="yt-format-quality">${format.name}</div>
                ${detailsHtml}
            </div>
            <div class="yt-download-icon-arrow">${icons.arrow}</div>
        `;
        
        item.onclick = (e) => {
            e.stopPropagation();
            const downloadUrl = item.getAttribute('data-download-url');
            if (downloadUrl) {
                const filename = item.getAttribute('data-filename');
                performDownload(downloadUrl, filename, item);
                return;
            }
            initiateDownload(format.id, item, videoUrl, videoTitle);
        };
        
        return item;
    }
    
    // ==================== BUTTON CREATION ====================
    function createDownloadButton() {
        const button = document.createElement('button');
        button.className = 'yt-ultimate-download-btn';
        button.id = 'yt-ultimate-download-btn';
        
        button.innerHTML = `
            <span class="yt-download-icon-svg">${icons.download}</span>
            <span>Download</span>
        `;
        
        applyThemeToButton(button);
        
        button.onclick = async (e) => {
            e.stopPropagation();
            
            const existingMenu = document.getElementById('yt-download-menu');
            if (existingMenu) {
                existingMenu.remove();
                button.classList.remove('active');
                return;
            }
            
            button.classList.add('active');
            button.classList.add('loading');
            button.innerHTML = `
                <span class="yt-download-icon-svg">${icons.spinner}</span>
                <span>Loading...</span>
            `;
            
            const videoUrl = window.location.href;
            const videoTitle = getVideoTitle();
            const menu = createDownloadMenu(videoUrl, videoTitle);
            const rect = button.getBoundingClientRect();
            menu.style.top = `${rect.bottom + window.scrollY + 8}px`;
            menu.style.left = `${rect.left + window.scrollX - 100}px`;
            
            setTimeout(() => {
                const menuRect = menu.getBoundingClientRect();
                if (menuRect.right > window.innerWidth) {
                    menu.style.left = `${window.innerWidth - menuRect.width - 20}px`;
                }
                if (menuRect.bottom > window.innerHeight) {
                    menu.style.top = `${rect.top + window.scrollY - menuRect.height - 8}px`;
                }
            }, 10);
            
            document.body.appendChild(menu);
            
            const closeHandler = (e) => {
                if (!menu.contains(e.target) && e.target !== button) {
                    menu.remove();
                    button.classList.remove('active');
                    document.removeEventListener('click', closeHandler);
                }
            };
            setTimeout(() => document.addEventListener('click', closeHandler), 100);
            
            const closeBtn = menu.querySelector('#yt-menu-close');
            if (closeBtn) {
                closeBtn.onclick = (e) => {
                    e.stopPropagation();
                    menu.remove();
                    button.classList.remove('active');
                };
            }
            
            button.classList.remove('loading');
            button.innerHTML = `
                <span class="yt-download-icon-svg">${icons.download}</span>
                <span>Download</span>
            `;
        };
        
        return button;
    }
    
    // ==================== IMPROVED NAVIGATION HANDLING ====================
    function addDownloadButton() {
        // Don't add button if we're currently navigating
        if (isNavigating) {
            console.log("Navigation in progress, delaying button addition");
            return;
        }
        
        // Hide YouTube's native Premium download button
        hidePremiumButton();
        
        // Find the actions container
        const selectors = ['#top-level-buttons-computed', '#actions', 'ytd-menu-renderer', '#menu-container'];
        let actionsContainer = null;
        for (const selector of selectors) {
            actionsContainer = document.querySelector(selector);
            if (actionsContainer && actionsContainer.children && actionsContainer.children.length > 0) break;
        }
        
        if (actionsContainer && !document.getElementById('yt-ultimate-download-btn')) {
            const videoId = new URLSearchParams(window.location.search).get('v');
            if (!videoId) return;
            
            const downloadBtn = createDownloadButton();
            actionsContainer.appendChild(downloadBtn);
            console.log("Download button added");
        }
    }
    
    // Handle navigation start (when URL is about to change)
    function handleNavigationStart() {
        isNavigating = true;
        
        // Clear any existing timeout
        if (navigationTimeout) {
            clearTimeout(navigationTimeout);
        }
        
        // Remove the button immediately to prevent it from floating
        const existingBtn = document.getElementById('yt-ultimate-download-btn');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        // Remove menu if open
        const existingMenu = document.getElementById('yt-download-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
    }
    
    // Handle navigation end (when new page is loaded)
    function handleNavigationEnd() {
        // Wait a bit for YouTube to fully render the new page
        navigationTimeout = setTimeout(() => {
            isNavigating = false;
            addDownloadButton();
            console.log("Navigation complete, button added");
        }, 800);
    }
    
    // ==================== OBSERVERS ====================
    // Watch for URL changes more intelligently
    let lastUrl = location.href;
    const urlObserver = new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            console.log("URL changed from", lastUrl, "to", url);
            lastUrl = url;
            handleNavigationStart();
            handleNavigationEnd();
        }
    });
    urlObserver.observe(document, { subtree: true, childList: true });
    
    // Also watch for history navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function() {
        handleNavigationStart();
        originalPushState.apply(this, arguments);
        handleNavigationEnd();
    };
    
    history.replaceState = function() {
        handleNavigationStart();
        originalReplaceState.apply(this, arguments);
        handleNavigationEnd();
    };
    
    window.addEventListener('popstate', () => {
        handleNavigationStart();
        setTimeout(handleNavigationEnd, 100);
    });
    
    // Theme watching
    const themeObserver = new MutationObserver(() => {
        const button = document.getElementById('yt-ultimate-download-btn');
        if (button) applyThemeToButton(button);
        const menu = document.getElementById('yt-download-menu');
        if (menu) applyThemeToMenu(menu);
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['dark'] });
    
    // Watch for DOM changes to hide premium button and ensure button persists
    const domObserver = new MutationObserver(() => {
        hidePremiumButton();
        
        // If button should be present but isn't, add it
        const videoId = new URLSearchParams(window.location.search).get('v');
        const hasButton = document.getElementById('yt-ultimate-download-btn');
        
        if (videoId && !hasButton && !isNavigating) {
            console.log("Button missing, re-adding...");
            addDownloadButton();
        }
    });
    domObserver.observe(document.body, { childList: true, subtree: true });
    
    // ==================== INITIALIZATION ====================
    // Add styles
    const styleElement = document.createElement('style');
    styleElement.textContent = stylesCss;
    document.head.appendChild(styleElement);
    
    // Initial load
    if (firstBoot) {
        const waitForPlayer = () => {
            const player = document.querySelector('#top-level-buttons-computed, #actions');
            if (!player) {
                requestAnimationFrame(waitForPlayer);
                return;
            }
            addDownloadButton();
        };
        waitForPlayer();
        firstBoot = false;
    }
    
    console.log('🎬 YouTube Downloader loaded - Fixed navigation handling');
})();