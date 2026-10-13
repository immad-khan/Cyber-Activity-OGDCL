// File: public/activity-lock.js
// Enforces global and per-activity locking for OGDCL Cybersecurity platform

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
        'privacy-week': {
            id: 'activity_3',
            name: 'Activity 3: Data Privacy Week'
        },
        'social-engineering-week': {
            id: 'activity_4',
            name: 'Activity 4: Social Engineering Week'
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
        if (document.getElementById('adminSiteLockBanner')) return;
        injectLockStyles();
        document.body.classList.add('activity-locked');

        // Stop video playback if running
        const vid = document.getElementById('trainingVideo') || document.querySelector('video');
        if (vid) {
            try { vid.pause(); } catch(e) {}
        }

        const banner = document.createElement('div');
        banner.id = 'adminSiteLockBanner';
        banner.innerHTML = `
            <span class="lock-icon">🔒</span>
            <span class="lock-badge">Module Locked</span>
            <span class="lock-msg">
                ${isGlobal
                    ? 'All platform activities have been temporarily locked by the administrator.'
                    : `${currentActivity.name} has been temporarily locked by the administrator.`
                }
            </span>
        `;
        document.body.insertBefore(banner, document.body.firstChild);

        const overlay = document.createElement('div');
        overlay.className = 'activity-locked-overlay';
        document.body.appendChild(overlay);
    }

    function updateNavLocks(activityLocks) {
        const pageLookup = {
            activity_1: 'phishing-week.html',
            activity_2: 'mfa-week.html',
            activity_3: 'privacy-week.html',
            activity_4: 'social-engineering-week.html'
        };

        Object.entries(activityLocks).forEach(([actId, isLocked]) => {
            if (!isLocked) return;
            const targetPage = pageLookup[actId];
            if (!targetPage) return;

            // Target nav buttons and dropdown items
            document.querySelectorAll(`a[href*="${targetPage}"], .dropdown-item[onclick*="${targetPage}"]`).forEach(el => {
                el.classList.add('nav-item-locked');
                el.title = 'This activity is locked by the administrator';
                el.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof showNotification === 'function') {
                        showNotification('🔒 This activity is currently locked by the administrator.', 'error');
                    } else {
                        alert('🔒 This activity is currently locked by the administrator.');
                    }
                }, true);
            });
        });
    }

    async function checkLock() {
        try {
            const res = await fetch('/api/admin-settings');
            const data = await res.json();
            if (!data.success) return;

            const isCurrentLocked = data.locked || !!(data.activityLocks && data.activityLocks[currentActivity.id]);
            if (isCurrentLocked) {
                showLockBanner(data.locked);
            }

            if (data.activityLocks) {
                updateNavLocks(data.activityLocks);
            }
        } catch(e) {
            console.warn('Failed to verify activity lock status:', e);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkLock);
    } else {
        checkLock();
    }
})();
