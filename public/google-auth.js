// Google Sign-In Integration for OGDCL Cybersecurity Portal
// Client ID configured for this application
const GOOGLE_CLIENT_ID = '724059477347-hp80qu61crf53g63alvpn4gu5vlsn4cf.apps.googleusercontent.com';

(function () {
    // Inject custom styling for Google Sign-In and Verified User Card
    const style = document.createElement('style');
    style.id = 'google-auth-styles';
    style.textContent = `
        .google-auth-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin: 15px 0 20px 0;
            width: 100%;
        }
        .google-btn-wrapper {
            display: flex;
            justify-content: center;
            margin: 10px 0;
            min-height: 44px;
        }
        .google-verified-card {
            display: flex;
            align-items: center;
            gap: 15px;
            background: linear-gradient(135deg, rgba(66, 133, 244, 0.15), rgba(52, 168, 83, 0.15));
            border: 2px solid rgba(66, 133, 244, 0.6);
            border-radius: 16px;
            padding: 12px 18px;
            margin: 15px auto;
            max-width: 480px;
            width: 100%;
            box-sizing: border-box;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            animation: fadeInCard 0.4s ease-out;
        }
        @keyframes fadeInCard {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .google-avatar {
            width: 46px;
            height: 46px;
            border-radius: 50%;
            border: 2px solid #4285F4;
            object-fit: cover;
            flex-shrink: 0;
        }
        .google-user-details {
            flex: 1;
            text-align: left;
            min-width: 0;
        }
        .google-user-name {
            font-size: 1.05rem;
            font-weight: 700;
            color: #ffffff;
            display: flex;
            align-items: center;
            gap: 8px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .google-verified-tag {
            background: rgba(52, 168, 83, 0.25);
            border: 1px solid #34A853;
            color: #70EF9A;
            font-size: 0.72rem;
            font-weight: 600;
            padding: 2px 7px;
            border-radius: 10px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            letter-spacing: 0.3px;
        }
        .google-user-email {
            font-size: 0.85rem;
            color: #A0C3FF;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .google-switch-btn {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: #e0e0e0;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 0.75rem;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
            flex-shrink: 0;
        }
        .google-switch-btn:hover {
            background: rgba(234, 67, 53, 0.2);
            border-color: #EA4335;
            color: #ff8a80;
        }
        .locked-field-badge {
            font-size: 0.75rem;
            color: #70EF9A;
            display: block;
            margin-top: -6px;
            margin-bottom: 10px;
            text-align: left;
        }
        input.input-locked {
            background: rgba(66, 133, 244, 0.08) !important;
            border-color: rgba(66, 133, 244, 0.6) !important;
            color: #e3f2fd !important;
            cursor: not-allowed !important;
            opacity: 0.9 !important;
        }
        .google-notice {
            font-size: 0.88rem;
            color: #ffd54f;
            margin: 6px 0 12px 0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }
    `;
    document.head.appendChild(style);
})();

// JWT Token parser helper (RFC 7519 compliant base64url decode)
function parseGoogleJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Failed to parse Google JWT:', e);
        return null;
    }
}

// Retrieve currently active verified Google user
window.getVerifiedGoogleUser = function () {
    try {
        const stored = localStorage.getItem('ogdcl_google_user');
        return stored ? JSON.parse(stored) : null;
    } catch (e) {
        return null;
    }
};

// Handle Google Login Callback
window.handleGoogleCredentialResponse = function (response) {
    if (!response || !response.credential) {
        console.error('Invalid Google response');
        return;
    }

    const payload = parseGoogleJwt(response.credential);
    if (!payload || !payload.email) {
        console.error('Could not extract user details from Google token');
        return;
    }

    const userData = {
        name: payload.name || payload.given_name || 'Google User',
        email: payload.email.toLowerCase().trim(),
        picture: payload.picture || '',
        sub: payload.sub,
        verifiedAt: Date.now()
    };

    localStorage.setItem('ogdcl_google_user', JSON.stringify(userData));
    localStorage.setItem('ogdcl_user_name', userData.name);
    localStorage.setItem('ogdcl_user_email', userData.email);

    // Update global variables if present in the page
    if (typeof currentUserName !== 'undefined') currentUserName = userData.name;
    if (typeof currentUserEmail !== 'undefined') currentUserEmail = userData.email;

    applyGoogleVerifiedState(userData);

    if (typeof showNotification === 'function') {
        showNotification(`✅ Signed in as ${userData.name}`, 'success');
    }
};

// Sign out from Google
window.googleSignOut = function () {
    if (confirm('Sign out from your Google account?')) {
        localStorage.removeItem('ogdcl_google_user');
        localStorage.removeItem('ogdcl_user_name');
        localStorage.removeItem('ogdcl_user_email');

        if (typeof currentUserName !== 'undefined') currentUserName = '';
        if (typeof currentUserEmail !== 'undefined') currentUserEmail = '';

        const nameInput = document.getElementById('userNameStart');
        const emailInput = document.getElementById('userEmailStart');
        if (nameInput) {
            nameInput.value = '';
            nameInput.readOnly = false;
            nameInput.classList.remove('input-locked');
        }
        if (emailInput) {
            emailInput.value = '';
            emailInput.readOnly = false;
            emailInput.classList.remove('input-locked');
        }

        renderGoogleAuthUI();
        if (typeof showNotification === 'function') {
            showNotification('Signed out from Google', 'info');
        }
    }
};

// Apply verified state to inputs and render card
function applyGoogleVerifiedState(user) {
    const nameInput = document.getElementById('userNameStart');
    const emailInput = document.getElementById('userEmailStart');

    if (nameInput) {
        nameInput.value = user.name;
        nameInput.readOnly = true;
        nameInput.classList.add('input-locked');
        nameInput.title = 'Verified via Google Account (Locked to prevent fake inputs)';
    }

    if (emailInput) {
        emailInput.value = user.email;
        emailInput.readOnly = true;
        emailInput.classList.add('input-locked');
        emailInput.title = 'Verified via Google Account (Locked to prevent fake inputs)';
    }

    // Also update any certificate end-screen name input if present
    const nameEnd = document.getElementById('userName') || document.getElementById('userNameEnd');
    if (nameEnd) {
        nameEnd.value = user.name;
        nameEnd.readOnly = true;
        nameEnd.classList.add('input-locked');
    }

    // Display the verified user card above the inputs
    const authWrapper = document.getElementById('googleAuthWrapper');
    if (authWrapper) {
        authWrapper.innerHTML = `
            <div class="google-verified-card">
                ${user.picture ? `<img src="${user.picture}" class="google-avatar" alt="Avatar" referrerpolicy="no-referrer" />` : '<div style="font-size:2rem;">🛡️</div>'}
                <div class="google-user-details">
                    <div class="google-user-name">
                        <span>${escapeHtmlAuth(user.name)}</span>
                        <span class="google-verified-tag">✓ Verified</span>
                    </div>
                    <div class="google-user-email">${escapeHtmlAuth(user.email)}</div>
                </div>
                <button type="button" class="google-switch-btn" onclick="googleSignOut()" title="Switch to another Google account">Switch</button>
            </div>
            <div style="font-size: 0.8rem; color: #70EF9A; margin-bottom: 8px;">
                🔒 Name & Email locked to your verified Google Identity.
            </div>
        `;
    }
}

function escapeHtmlAuth(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Render Google Login button & UI
function renderGoogleAuthUI() {
    const nameSec = document.getElementById('name-input-section');
    if (!nameSec) return;

    let authWrapper = document.getElementById('googleAuthWrapper');
    if (!authWrapper) {
        authWrapper = document.createElement('div');
        authWrapper.id = 'googleAuthWrapper';
        authWrapper.className = 'google-auth-container';
        // Insert at top of name input section
        const p = nameSec.querySelector('p');
        if (p) {
            p.insertAdjacentElement('afterend', authWrapper);
        } else {
            nameSec.insertBefore(authWrapper, nameSec.firstChild);
        }
    }

    const verifiedUser = window.getVerifiedGoogleUser();
    if (verifiedUser && verifiedUser.email) {
        applyGoogleVerifiedState(verifiedUser);
        return;
    }

    // User is NOT logged in: Show Google Sign-in button
    authWrapper.innerHTML = `
        <div class="google-notice">
            🔒 Official Verification Required
        </div>
        <div id="googleSignInBtn" class="google-btn-wrapper"></div>
        <p style="font-size: 0.85rem; color: #ffd54f; font-weight: 500; margin-top: 6px;">
            ⚠️ Please use your company's email address to sign in.
        </p>
    `;

    // Initialize Google Identity Services
    if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: true
            });

            const btnContainer = document.getElementById('googleSignInBtn');
            if (btnContainer) {
                window.google.accounts.id.renderButton(btnContainer, {
                    theme: 'filled_blue',
                    size: 'large',
                    type: 'standard',
                    shape: 'pill',
                    text: 'continue_with',
                    logo_alignment: 'left',
                    width: 280
                });
            }

            // Also try One-Tap prompt
            window.google.accounts.id.prompt((notification) => {
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                    // One-tap wasn't shown or dismissed, the button is still visible
                }
            });
        } catch (err) {
            console.warn('Google Auth initialization error:', err);
        }
    } else {
        // If GIS script hasn't loaded yet, retry shortly
        setTimeout(renderGoogleAuthUI, 300);
    }
}

// Hook into page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(renderGoogleAuthUI, 200);
    });
} else {
    setTimeout(renderGoogleAuthUI, 200);
}
