// File: public/certificate.js
// Official OGDCL Certificate Generator (landscape A4)

(function (window) {
  'use strict';

  // Automatically keep signature asset in sync with signature.png
  if (typeof Image !== 'undefined') {
    try {
      const sigImg = new Image();
      sigImg.crossOrigin = 'anonymous';
      sigImg.onload = function () {
        try {
          const c = document.createElement('canvas');
          c.width = sigImg.naturalWidth || sigImg.width;
          c.height = sigImg.naturalHeight || sigImg.height;
          const ctx = c.getContext('2d');
          ctx.drawImage(sigImg, 0, 0);
          window.CERT_ASSETS = window.CERT_ASSETS || {};
          window.CERT_ASSETS.signature = c.toDataURL('image/png');
        } catch (e) { }
      };
      sigImg.src = 'signature.png?t=' + Date.now();
    } catch (e) { }

    // Automatically keep cybershield logo asset in sync with cybershield.webp / cybershield.png
    try {
      const shieldImg = new Image();
      shieldImg.crossOrigin = 'anonymous';
      shieldImg.onload = function () {
        try {
          const c = document.createElement('canvas');
          c.width = shieldImg.naturalWidth || shieldImg.width;
          c.height = shieldImg.naturalHeight || shieldImg.height;
          const ctx = c.getContext('2d');
          ctx.drawImage(shieldImg, 0, 0);
          window.CERT_ASSETS = window.CERT_ASSETS || {};
          window.CERT_ASSETS.cybershield = c.toDataURL('image/png');
        } catch (e) { }
      };
      shieldImg.onerror = function () {
        try {
          const fallback = new Image();
          fallback.crossOrigin = 'anonymous';
          fallback.onload = function () {
            try {
              const c = document.createElement('canvas');
              c.width = fallback.naturalWidth || fallback.width;
              c.height = fallback.naturalHeight || fallback.height;
              const ctx = c.getContext('2d');
              ctx.drawImage(fallback, 0, 0);
              window.CERT_ASSETS = window.CERT_ASSETS || {};
              window.CERT_ASSETS.cybershield = c.toDataURL('image/png');
            } catch (e) { }
          };
          fallback.src = 'cybershield.png?t=' + Date.now();
        } catch (e) { }
      };
      shieldImg.src = 'cybershield.webp?t=' + Date.now();
    } catch (e) { }

    // Faded background watermark
    try {
      const backgroundImg = new Image();
      backgroundImg.onload = function () {
        try {
          const c = document.createElement('canvas');
          c.width = backgroundImg.naturalWidth || backgroundImg.width;
          c.height = backgroundImg.naturalHeight || backgroundImg.height;
          const ctx = c.getContext('2d');
          if (!ctx) return;
          ctx.globalAlpha = 0.1;
          ctx.drawImage(backgroundImg, 0, 0);
          window.CERT_ASSETS = window.CERT_ASSETS || {};
          window.CERT_ASSETS.background = c.toDataURL('image/png');
        } catch (e) { }
      };
      backgroundImg.src = 'background.webp?t=' + Date.now();
    } catch (e) { }

    // Automatically keep cyber logo asset in sync with cyber-logo.png (top-right logo)
    try {
      const cyberImg = new Image();
      cyberImg.crossOrigin = 'anonymous';
      cyberImg.onload = function () {
        try {
          const c = document.createElement('canvas');
          c.width = cyberImg.naturalWidth || cyberImg.width;
          c.height = cyberImg.naturalHeight || cyberImg.height;
          const ctx = c.getContext('2d');
          ctx.drawImage(cyberImg, 0, 0);
          window.CERT_ASSETS = window.CERT_ASSETS || {};
          window.CERT_ASSETS.cyberLogo = c.toDataURL('image/png');
        } catch (e) { }
      };
      cyberImg.src = 'cyber-logo.png?t=' + Date.now();
    } catch (e) { }
  }

  // ── Palette ──
  const C = {
    teal: [73, 193, 165],
    gold: [190, 143, 43],
    blue: [0, 126, 224],
    ink: [25, 38, 58],
    muted: [71, 85, 105],
    white: [255, 255, 255]
  };

  const PT = 25.4 / 72;                              // pt -> mm
  const baseline = (top, pt) => top + pt * PT * 0.94; // layout "top" -> jsPDF text baseline

  function downloadOGDCLCertificate(opts) {
    opts = opts || {};
    if (typeof window.jspdf === 'undefined' && typeof jsPDF === 'undefined') {
      alert('PDF library not loaded. Please refresh the page.');
      return;
    }

    const { jsPDF } = window.jspdf || window;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const userName = (opts.userName || 'Participant').trim();
    const title = opts.title || 'Cybersecurity Awareness Assessment';
    const currentDate = opts.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const W = 297, H = 210, CX = W / 2;
    const assets = window.CERT_ASSETS || {};

    // ── Helpers ──
    const font = (f, s, pt, c) => { doc.setFont(f, s); doc.setFontSize(pt); doc.setTextColor(...c); };
    const line = (x1, y1, x2, y2, c, w) => { doc.setDrawColor(...c); doc.setLineWidth(w); doc.line(x1, y1, x2, y2); };
    const width = (t, cs) => doc.getTextWidth(t) + (cs || 0) * Math.max(0, t.length - 1);

    // Draw text; with letter-spacing (cs, mm) alignment is done manually
    function text(t, x, y, align, cs) {
      if (!cs) { doc.text(t, x, y, { align: align || 'left' }); return; }
      const w = width(t, cs);
      const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
      if (doc.setCharSpace) doc.setCharSpace(cs);
      doc.text(t, x0, y);
      if (doc.setCharSpace) doc.setCharSpace(0);
    }

    // Place an image inside a box, keeping aspect ratio (centered)
    function placeImage(data, x, y, w, h) {
      try {
        let dw = w, dh = h;
        if (doc.getImageProperties) {
          const p = doc.getImageProperties(data);
          const r = Math.min(w / p.width, h / p.height);
          dw = p.width * r; dh = p.height * r;
        }
        doc.addImage(data, 'PNG', x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
      } catch (e) {
        console.warn('Could not render image in PDF', e);
      }
    }

    // ── Background + frame ──
    doc.setFillColor(...C.white);
    doc.rect(0, 0, W, H, 'F');
    if (assets.background) placeImage(assets.background, 80, 38, 137, 130);
    doc.setDrawColor(...C.teal); doc.setLineWidth(0.8);
    doc.rect(6, 6, W - 12, H - 12);

    // ── Top logos (left: existing logo, right: cyber-logo.png, mirrored) ──
    const LOGO_W = 40, LOGO_H = 16, LOGO_MARGIN = 19, LOGO_TOP = 13;
    if (assets.logo) placeImage(assets.logo, LOGO_MARGIN, LOGO_TOP, LOGO_W, LOGO_H);
    if (assets.cyberLogo) placeImage(assets.cyberLogo, W - LOGO_MARGIN - LOGO_W, LOGO_TOP, LOGO_W, LOGO_H);

    font('times', 'bold', 30, C.gold);
    text('CERTIFICATE OF PARTICIPATION', CX, baseline(46, 30), 'center', 0.28);
    font('helvetica', 'bold', 16, C.blue);
    text('IS PROUDLY PRESENTED TO', CX, baseline(57, 16), 'center', 0.95);

    const measureName = (pt) => {
      doc.setFont('times', 'italic'); doc.setFontSize(pt);
      return doc.getTextWidth(userName);
    };

    let namePt = 31;
    while (namePt > 12 && measureName(namePt) > 220) namePt -= 0.5;
    font('times', 'italic', namePt, C.ink);
    const nameBase = baseline(70, namePt);
    doc.text(userName, CX, nameBase, { align: 'center' });
    const nameWidth = measureName(namePt);
    line(CX - nameWidth / 2, nameBase + 2, CX + nameWidth / 2, nameBase + 2, C.ink, 0.55);

    const completionText = 'has successfully completed activity on';
    font('helvetica', 'normal', 15, C.ink);
    text(completionText, CX, baseline(102, 15), 'center');

    let titlePt = 26;
    const measureTitle = (pt) => {
      doc.setFont('times', 'bold'); doc.setFontSize(pt);
      return doc.getTextWidth(title);
    };
    while (titlePt > 9 && measureTitle(titlePt) > 260) titlePt -= 0.5;
    font('times', 'bold', titlePt, C.blue);
    text(title, CX, baseline(111, titlePt), 'center');

    font('times', 'bolditalic', 18, C.ink);
    text('Your commitment is our shield and your vigilance is our strength.', CX, baseline(133, 18), 'center');

    font('helvetica', 'normal', 11, C.ink);
    text(currentDate, 66, 185, 'center');
    line(32, 188, 100, 188, C.ink, 0.4);
    font('helvetica', 'normal', 9, C.muted);
    text('Date', 66, 193, 'center');

    if (assets.signature) placeImage(assets.signature, 226, 169, 37, 13);
    font('times', 'italic', 13, C.ink);
    text('M. Danish Hussain', 244.5, 184, 'center');
    line(210, 188, 279, 188, C.ink, 0.4);
    font('helvetica', 'normal', 9, C.muted);
    text('Head of Information/CISO', 244.5, 193, 'center');

    // Save PDF
    const safeFileName = userName.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`OGDCL_Certificate_${safeFileName}.pdf`);
  }

  function getActivityCertKey(activity) {
    const slug = String(activity || 'default')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return 'ogdcl_cert_claimed_' + slug;
  }

  // Helper to check if this local device already generated a certificate for this specific activity
  function checkCertificateClaimed(identifier, activity) {
    try {
      const key = getActivityCertKey(activity);
      const val = localStorage.getItem(key);
      if (!val) return false;
      try {
        const parsed = JSON.parse(val);
        return Boolean(parsed && (parsed.claimed === true || parsed.certId));
      } catch (e) {
        return val === 'true' || val.length > 0;
      }
    } catch (e) {
      return false;
    }
  }

  // Marks certificate as claimed on this device for this activity
  function markCertificateClaimed(identifier, activity, certId) {
    try {
      const key = getActivityCertKey(activity);
      const payload = {
        claimed: true,
        claimedAt: new Date().toISOString(),
        certId: certId || ('OGDCL-' + Date.now().toString(36).toUpperCase()),
        activity: activity || '',
        userName: identifier || ''
      };
      localStorage.setItem(key, JSON.stringify(payload));
      if (certId) localStorage.setItem('ogdcl_certificate_id', certId);
    } catch (e) {
      console.warn('Could not store certificate claim in localStorage', e);
    }
  }

  // UI helper: Grey out and disable certificate download button
  function disableCertButton(btn, reason) {
    if (!btn) return;
    btn.disabled = true;
    btn.onclick = null;
    btn.removeAttribute('onclick');
    btn.style.setProperty('background', '#4a5568', 'important');
    btn.style.setProperty('color', '#a0aec0', 'important');
    btn.style.setProperty('cursor', 'not-allowed', 'important');
    btn.style.setProperty('opacity', '0.65', 'important');
    btn.style.setProperty('box-shadow', 'none', 'important');
    btn.style.setProperty('transform', 'none', 'important');
    btn.style.setProperty('pointer-events', 'none', 'important');
    btn.innerHTML = '🔒 Certificate Already Generated';
    btn.title = reason || 'Certificate already generated for this activity on this device.';
  }

  window.getActivityCertKey = getActivityCertKey;
  window.downloadOGDCLCertificate = downloadOGDCLCertificate;
  window.checkCertificateClaimed = checkCertificateClaimed;
  window.markCertificateClaimed = markCertificateClaimed;
  window.disableCertButton = disableCertButton;
})(window);