// File: public/certificate.js
// Official OGDCL Certificate Generator (landscape A4, NUST-style layout)

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
  }

  // ── Palette (unchanged from the original design) ──
  const C = {
    teal: [0, 180, 150], tealDk: [0, 140, 115],
    ink: [15, 23, 42], body: [30, 41, 59], slate: [51, 65, 85], muted: [71, 85, 105],
    faint: [148, 163, 184], hdr1: [20, 24, 33], hdr2: [50, 60, 75], hdr3: [80, 90, 105],
    frame: [210, 215, 225], sep: [220, 225, 235], foot: [226, 232, 240], box: [248, 250, 252],
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
    const score = opts.score || 0;
    const accuracy = opts.accuracy || 100;
    const level = opts.level || 'Guardian';
    const title = opts.title || 'Cybersecurity Awareness & Digital Safety Assessment';
    const currentDate = opts.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const fallbackId = (window.crypto && typeof window.crypto.randomUUID === 'function')
      ? window.crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()
      : `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const refNumber = opts.refNumber || `OGDCL-${new Date().getFullYear()}-${fallbackId}`;

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

    // ── Background + double frame ──
    doc.setFillColor(...C.white);
    doc.rect(0, 0, W, H, 'F');
    doc.setDrawColor(...C.frame); doc.setLineWidth(0.4);
    doc.rect(10.2, 10.2, W - 20.4, H - 20.4);
    doc.setDrawColor(...C.teal); doc.setLineWidth(0.8);
    doc.rect(12.4, 12.4, W - 24.8, H - 24.8);

    // ── 1. Header ──
    // OGDCL logo on left
    if (assets.logo) placeImage(assets.logo, 16, 14, 46, 20);
    // CyberShield logo on opposite side (right) - balanced with OGDCL logo
    const shieldAsset = assets.cybershield || assets.shield;
    if (shieldAsset) placeImage(shieldAsset, 244, 14, 37, 17.5);

    font('helvetica', 'bold', 17, C.hdr1);
    text('OIL & GAS DEVELOPMENT COMPANY LTD', CX, baseline(15, 17), 'center', 0.12);
    font('times', 'bold', 15, C.hdr2);
    text('Cybersecurity Department', CX, baseline(24, 15), 'center', 0.16);
    font('helvetica', 'normal', 8, C.hdr3);
    text('ISLAMABAD, PAKISTAN', CX, baseline(32, 8), 'center', 0.56);

    line(20, 41.5, W - 20, 41.5, C.sep, 0.3);
    line(128.5, 41.6, 168.5, 41.6, C.teal, 0.8);

    // ── 2. Body ──
    font('times', 'italic', 12, C.slate);
    text('Awards this certificate of completion to', CX, baseline(51, 12), 'center');

    // Name (bold), shrinks to fit
    const measureName = (pt) => {
      doc.setFont('times', 'bold'); doc.setFontSize(pt);
      return doc.getTextWidth(userName);
    };
    let namePt = 25;
    while (namePt > 9 && measureName(namePt) > 235) namePt -= 0.5;

    const nameBase = baseline(61, namePt);
    font('times', 'bold', namePt, C.ink);
    doc.text(userName, CX, nameBase, { align: 'center' });

    font('times', 'italic', 12, C.slate);
    text('for successfully completing the', CX, baseline(75, 12), 'center');

    font('times', 'bolditalic', 20, C.ink);
    text(`\u201C${title}\u201D`, CX, baseline(85, 20), 'center');

    // "Completed on <date>"
    const dBase = baseline(98, 11.5);
    font('times', 'italic', 11.5, C.slate);
    const w1 = doc.getTextWidth('Completed on');
    font('times', 'normal', 11.5, C.body);
    const wSp = doc.getTextWidth(' ');
    const w2 = doc.getTextWidth(currentDate);
    const dx = CX - (w1 + wSp + w2) / 2;
    font('times', 'italic', 11.5, C.slate);
    doc.text('Completed on', dx, dBase);
    font('times', 'normal', 11.5, C.body);
    doc.text(currentDate, dx + w1 + wSp, dBase);

    // ── 3. Performance strip ──
    doc.setFillColor(...C.box); doc.setDrawColor(...C.teal); doc.setLineWidth(0.4);
    doc.roundedRect(83.7, 108.5, 129.6, 14, 2, 2, 'FD');
    line(126.9, 108.7, 126.9, 122.3, C.sep, 0.3);
    line(170.1, 108.7, 170.1, 122.3, C.sep, 0.3);

    const stats = [
      ['TOTAL SCORE', `${score} pts`, 105.4],
      ['ACCURACY', `${accuracy}%`, CX],
      ['SECURITY LEVEL', String(level), 191.6]
    ];
    stats.forEach(([label, value, cx]) => {
      font('helvetica', 'bold', 6.5, C.tealDk);
      text(label, cx, 113.3, 'center', 0.32);
      font('helvetica', 'bold', 12, C.ink);
      text(value, cx, 118.8, 'center');
    });

    // ── 4. Reference (left) and Signature (right) ──
    // Note: Seal removed per user request
    font('helvetica', 'bold', 9, C.ink);
    text(refNumber, 55, 153.5, 'center');
    line(33, 157.15, 77, 157.15, C.faint, 0.3);
    font('helvetica', 'bold', 8.5, C.muted);
    text('Certificate ID', 55, 162, 'center');

    if (assets.signature) placeImage(assets.signature, 226.25, 137.5, 31.5, 18.6);
    line(220, 157.15, 264, 157.15, C.faint, 0.3);
    const sigX = 242;
    font('helvetica', 'bold', 9.5, C.ink);
    text('( M. Danish Hussain )', sigX, 162, 'center');
    font('helvetica', 'normal', 8.5, C.muted);
    text('Head Information Security', sigX, 166.3, 'center');
    text('OGDCL Islamabad', sigX, 170.5, 'center');

    // ── 6. Footer ──
    line(20, 184.15, W - 20, 184.15, C.foot, 0.3);
    font('helvetica', 'italic', 7, C.faint);
    text('This certificate is an officially verified electronic credential issued by the OGDCL Information Security & Training Division.', CX, 188.85, 'center');
    font('helvetica', 'normal', 6.5, C.faint);
    text('Cybersecurity Department, OGDCL Head Office, Jinnah Avenue, Islamabad  |  Tel: 051-920024061, 4177  |  Email: cyber.security@ogdcl.com', CX, 193.2, 'center');

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
