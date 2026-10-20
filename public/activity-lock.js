// File: public/activity-lock.js
// Enforces global and per-activity locking & synchronizes dynamic videos and MCQs from Admin Portal

(function() {
    const ACTIVITY_CONFIG = {
        'phishing-week': {
            id: 'activity_1',
            name: 'Activity 1: The Executive Target'
        },
        'mfa-week': {
            id: 'activity_2',
            name: 'Activity 2: Password Protection'
        },
        'social-engineering-week': {
            id: 'activity_3',
            name: 'Activity 3: Social Engineering'
        },
        'privacy-week': {
            id: 'activity_4',
            name: 'Activity 4: Data Privacy'
        },
        'index': {
            id: 'index',
            name: 'Index: Overview'
        }
    };

    const path = window.location.pathname.toLowerCase();
    let currentActivity = null;

    for (const [key, cfg] of Object.entries(ACTIVITY_CONFIG)) {
        if (path.includes(key)) {
            currentActivity = cfg;
            break;
        }
    }

    if (!currentActivity && (path === '' || path === '/' || path.endsWith('/index.html') || path.endsWith('index'))) {
        currentActivity = ACTIVITY_CONFIG['index'];
    }

    if (!currentActivity) return;

    function injectLockStyles() {
        const id = 'ogdcl-activity-lock-styles';
        if (document.getElementById(id)) return;

        const style = document.createElement('style');
        style.id = id;
        style.textContent = `
            #adminSiteLockBanner {
                position: fixed;
                top: 0; left: 0; right: 0;
                z-index: 99999;
                background: linear-gradient(90deg, #1c0000 0%, #3b0000 50%, #1c0000 100%);
                border-bottom: 2px solid #ef4444;
                box-shadow: 0 4px 24px rgba(239,68,68,0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 14px;
                padding: 14px 24px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                animation: lockSlideDown 0.4s cubic-bezier(0.16,1,0.3,1) both;
            }
            @keyframes lockSlideDown {
                from { transform: translateY(-100%); opacity: 0; }
                to   { transform: translateY(0);     opacity: 1; }
            }
            #adminSiteLockBanner .lock-icon {
                font-size: 20px;
                animation: lockPulse 2s ease-in-out infinite;
            }
            @keyframes lockPulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50%      { opacity: 0.6; transform: scale(0.92); }
            }
            #adminSiteLockBanner .lock-badge {
                background: rgba(239,68,68,0.2);
                border: 1px solid rgba(239,68,68,0.5);
                border-radius: 100px;
                padding: 4px 12px;
                font-size: 0.72rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1.2px;
                color: #fca5a5;
                white-space: nowrap;
            }
            #adminSiteLockBanner .lock-msg {
                color: #fecaca;
                font-size: 0.9rem;
                font-weight: 500;
                text-align: center;
            }
            body.activity-locked {
                padding-top: 58px !important;
            }
            body.activity-locked .start-button,
            body.activity-locked .quiz-button,
            body.activity-locked .option-btn,
            body.activity-locked .quiz-option,
            body.activity-locked .name-input-section button,
            body.activity-locked .name-input-section input,
            body.activity-locked .video-container video,
            body.activity-locked .video-container,
            body.activity-locked button[onclick*="startQuiz"],
            body.activity-locked button[onclick*="submitAnswer"],
            body.activity-locked button[onclick*="handleAnswer"],
            body.activity-locked button[onclick*="resetQuiz"],
            body.activity-locked button[onclick*="downloadCertificate"],
            body.activity-locked button[onclick*="generateCertificate"],
            body.activity-locked .quiz-section,
            body.activity-locked #name-input-section,
            body.activity-locked #quiz-content {
                pointer-events: none !important;
                opacity: 0.45 !important;
                filter: grayscale(0.7) !important;
                cursor: not-allowed !important;
            }
            .activity-locked-overlay {
                position: fixed;
                inset: 0;
                background: rgba(10,5,15,0.5);
                z-index: 9000;
                pointer-events: none;
                backdrop-filter: blur(1.5px);
                animation: overlayFade 0.5s ease both;
            }
            @keyframes overlayFade {
                from { opacity: 0; }
                to   { opacity: 1; }
            }
            .nav-item-locked {
                opacity: 0.45 !important;
                filter: grayscale(0.7) !important;
                cursor: not-allowed !important;
            }
        `;
        document.head.appendChild(style);
    }

    function showLockBanner(isGlobal) {
        injectLockStyles();
        document.body.classList.add('activity-locked');

        // Stop video playback if running
        const vid = document.getElementById('trainingVideo') || document.querySelector('video');
        if (vid) {
            try { vid.pause(); } catch(e) {}
        }

        let banner = document.getElementById('adminSiteLockBanner');
        const lockMessage = isGlobal
            ? 'All platform activities have been temporarily locked by the administrator.'
            : `${currentActivity.name} has been temporarily locked by the administrator.`;

        if (banner) {
            const msgEl = banner.querySelector('.lock-msg');
            if (msgEl) msgEl.textContent = lockMessage;
            return;
        }

        banner = document.createElement('div');
        banner.id = 'adminSiteLockBanner';
        banner.innerHTML = `
            <span class="lock-icon">🔒</span>
            <span class="lock-badge">Module Locked</span>
            <span class="lock-msg">${lockMessage}</span>
        `;
        document.body.insertBefore(banner, document.body.firstChild);

        if (!document.querySelector('.activity-locked-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'activity-locked-overlay';
            document.body.appendChild(overlay);
        }
    }

    function removeLockBanner() {
        document.body.classList.remove('activity-locked');
        const banner = document.getElementById('adminSiteLockBanner');
        if (banner) banner.remove();
        const overlay = document.querySelector('.activity-locked-overlay');
        if (overlay) overlay.remove();
    }

    function lockClickHandler(e) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof showNotification === 'function') {
            showNotification('🔒 This activity is currently locked by the administrator.', 'error');
        } else {
            alert('🔒 This activity is currently locked by the administrator.');
        }
    }

    function updateNavLocks(activityLocks) {
        const pageLookup = {
            activity_1: 'phishing-week.html',
            activity_2: 'mfa-week.html',
            activity_3: 'social-engineering-week.html',
            activity_4: 'privacy-week.html'
        };

        Object.entries(activityLocks).forEach(([actId, isLocked]) => {
            const targetPage = pageLookup[actId];
            if (!targetPage) return;

            document.querySelectorAll(`a[href*="${targetPage}"], .dropdown-item[onclick*="${targetPage}"]`).forEach(el => {
                if (isLocked) {
                    el.classList.add('nav-item-locked');
                    el.title = 'This activity is locked by the administrator';
                    el.removeEventListener('click', lockClickHandler, true);
                    el.addEventListener('click', lockClickHandler, true);
                } else {
                    el.classList.remove('nav-item-locked');
                    el.title = '';
                    el.removeEventListener('click', lockClickHandler, true);
                }
            });
        });
    }

    // ── Dynamic Video Sync ──
    let currentLoadedVideoUrl = null;
    let currentLoadedVideoType = null;

    function syncDynamicVideo(vidCfg) {
        if (!vidCfg || !vidCfg.url) return;
        const container = document.querySelector('.video-container');
        if (!container) return;

        const targetType = vidCfg.sourceType === 'youtube' ? 'youtube' : 'mp4';
        const targetUrl = vidCfg.url.trim();

        if (currentLoadedVideoUrl === targetUrl && currentLoadedVideoType === targetType) {
            return;
        }

        currentLoadedVideoUrl = targetUrl;
        currentLoadedVideoType = targetType;

        if (targetType === 'youtube') {
            container.innerHTML = `
                <iframe id="trainingVideoIframe" 
                        src="${targetUrl}" 
                        title="${vidCfg.title || 'Training Video'}" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowfullscreen style="width:100%;height:100%;border:none;border-radius:15px;aspect-ratio:16/9;">
                </iframe>
            `;

            const marksDisplay = document.querySelector('.marks-display');
            if (marksDisplay && !document.getElementById('claimVideoBtn')) {
                const claimDiv = document.createElement('div');
                claimDiv.style.marginTop = '10px';
                claimDiv.innerHTML = `
                    <button id="claimVideoBtn" onclick="if(typeof awardVideoMarks === 'function'){awardVideoMarks();}else if(typeof window.claimVideoDefault === 'function'){window.claimVideoDefault();}" 
                            class="claim-video-btn" 
                            style="background: linear-gradient(45deg, #00ffff, #00b4d8); border: none; color: #000; padding: 10px 22px; border-radius: 20px; font-weight: 700; cursor: pointer; transition: transform 0.2s;">
                        🎁 Finished Watching? Claim 50 Video Marks
                    </button>
                `;
                marksDisplay.appendChild(claimDiv);
            }
        } else {
            container.innerHTML = `
                <video id="trainingVideo" controls controlsList="nodownload" preload="metadata" playsinline poster="${vidCfg.poster || ''}" style="width:100%;border-radius:15px;display:block;">
                    <source src="${targetUrl}" type="video/mp4">
                    Your browser does not support HTML5 video streaming.
                </video>
            `;

            const vid = document.getElementById('trainingVideo');
            if (vid) {
                vid.addEventListener('ended', function() {
                    if (typeof awardVideoMarks === 'function') {
                        awardVideoMarks();
                    } else if (typeof window.claimVideoDefault === 'function') {
                        window.claimVideoDefault();
                    }
                });
            }
        }
    }

    // ── Dynamic MCQs Sync ──
    let lastLoadedMcqHash = null;

    function syncDynamicMcqs(mcqs) {
        if (!Array.isArray(mcqs) || mcqs.length === 0) return;
        const hash = JSON.stringify(mcqs);
        if (hash === lastLoadedMcqHash) return;
        lastLoadedMcqHash = hash;

        // 1. If page has dedicated updater
        if (typeof window.applyDynamicQuizQuestions === 'function') {
            window.applyDynamicQuizQuestions(mcqs);
        }

        // 2. If window.quizQuestions exists
        if (Array.isArray(window.quizQuestions)) {
            window.quizQuestions.splice(0, window.quizQuestions.length, ...mcqs);
        }
    }

    window.claimVideoDefault = function() {
        if (window.videoWatched) {
            if (typeof showNotification === 'function') showNotification('Video marks already awarded!', 'info');
            return;
        }
        window.videoWatched = true;
        if (typeof updateScore === 'function') updateScore(50, 'video_completed');
        if (typeof showNotification === 'function') showNotification('Video Complete! You earned 50 marks!', 'success');
        if (typeof celebrateVideoCompletion === 'function') celebrateVideoCompletion();
        const btn = document.getElementById('claimVideoBtn');
        if (btn) { btn.disabled = true; btn.textContent = '✅ 50 Video Marks Awarded!'; }
        if (typeof saveToDatabase === 'function' && window.currentUserName) saveToDatabase();
    };

    let lastKnownLock = null;

    async function checkLock() {
        try {
            const res = await fetch('/api/admin-settings', { cache: 'no-store' });
            const data = await res.json();
            if (!data.success) return;

            const isCurrentLocked = !!(data.locked || (currentActivity.id !== 'index' && data.activityLocks && data.activityLocks[currentActivity.id]));

            if (isCurrentLocked) {
                showLockBanner(data.locked);
                if (lastKnownLock === false) {
                    if (typeof showNotification === 'function') {
                        showNotification('🔒 This activity has been locked by the administrator.', 'warning');
                    }
                }
            } else {
                removeLockBanner();
                if (lastKnownLock === true) {
                    if (typeof showNotification === 'function') {
                        showNotification('🔓 This activity is now unlocked!', 'success');
                    }
                }
            }

            lastKnownLock = isCurrentLocked;

            if (data.activityLocks) {
                updateNavLocks(data.activityLocks);
            }

            // Sync dynamic module video & MCQs
            if (currentActivity && currentActivity.id) {
                if (data.moduleVideos && data.moduleVideos[currentActivity.id]) {
                    syncDynamicVideo(data.moduleVideos[currentActivity.id]);
                }
                if (data.moduleMcqs && data.moduleMcqs[currentActivity.id]) {
                    syncDynamicMcqs(data.moduleMcqs[currentActivity.id]);
                }
            }
        } catch(e) {
            console.warn('Failed to verify activity settings status:', e);
        }
    }

    // Initial check
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkLock);
    } else {
        checkLock();
    }

    // Live continuous polling
    setInterval(checkLock, 2500);

    // Instant check when switching tabs or window focus
    window.addEventListener('focus', checkLock);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkLock();
    });
})();
