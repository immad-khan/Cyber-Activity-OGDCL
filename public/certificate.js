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
    const employeeId = (opts.employeeId || '').trim();
    const department = (opts.department || '').trim();
    const designation = (opts.designation || '').trim();
    const score = opts.score || 0;
    const accuracy = opts.accuracy || 100;
    const level = opts.level || 'Guardian';
    const title = opts.title || 'Cybersecurity Awareness & Digital Safety Assessment';
    const currentDate = opts.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const refNumber = opts.refNumber || `No. CyberSecurity-2026/${Math.floor(100 + Math.random() * 900)}`;

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
    if (assets.logo) placeImage(assets.logo, 20, 17, 30, 12.5);

    font('helvetica', 'bold', 17, C.hdr1);
    text('OIL & GAS DEVELOPMENT COMPANY LTD', CX, baseline(15, 17), 'center', 0.12);
    font('times', 'bold', 15, C.hdr2);
    text('Cybersecurity Department', CX, baseline(24, 15), 'center', 0.16);
    font('helvetica', 'normal', 8, C.hdr3);
    text('ISLAMABAD, PAKISTAN', CX, baseline(32, 8), 'center', 0.56);

    line(20, 39.15, W - 20, 39.15, C.sep, 0.3);
    line(128.5, 39.25, 168.5, 39.25, C.teal, 0.8);

    // ── 2. Body ──
    font('times', 'italic', 12, C.slate);
    text('Awards this certificate of completion to', CX, baseline(50, 12), 'center');

    // Name + Employee ID (bold), shrinks to fit
    const idText = employeeId ? `ID: ${employeeId}` : '';
    const gap = 10.5; // 5mm + 0.5mm bar + 5mm
    const measureName = (pt) => {
      doc.setFont('times', 'bold'); doc.setFontSize(pt);
      return doc.getTextWidth(userName) + (idText ? gap + doc.getTextWidth(idText) : 0);
    };
    let namePt = 24;
    while (namePt > 9 && measureName(namePt) > 235) namePt -= 0.5;

    const nameBase = baseline(59, namePt);
    font('times', 'bold', namePt, C.ink);
    if (idText) {
      const wName = doc.getTextWidth(userName);
      const x0 = CX - measureName(namePt) / 2;
      doc.text(userName, x0, nameBase);
      const em = namePt * PT;
      doc.setFillColor(...C.teal);
      doc.rect(x0 + wName + 5, nameBase - 0.75 * em, 0.5, 0.8 * em, 'F');
      doc.text(idText, x0 + wName + gap, nameBase);
    } else {
      doc.text(userName, CX, nameBase, { align: 'center' });
    }

    // Designation • Department (smaller, lighter), shrinks to fit
    const subText = [designation, department].filter(Boolean).join('   \u2022   ');
    if (subText) {
      let subPt = 10.5;
      const measureSub = (pt) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(pt); return width(subText, 0.02 * pt * PT); };
      while (subPt > 7 && measureSub(subPt) > 235) subPt -= 0.5;
      font('helvetica', 'normal', subPt, C.muted);
      text(subText, CX, baseline(72, subPt), 'center', 0.02 * subPt * PT);
    }

    font('times', 'italic', 12, C.slate);
    text('for successfully completing the', CX, baseline(85, 12), 'center');

    font('times', 'bolditalic', 21, C.ink);
    text(`\u201C${title}\u201D`, CX, baseline(93, 21), 'center');

    // "Completed on <date>"
    const dBase = baseline(105, 12);
    font('times', 'italic', 12, C.slate);
    const w1 = doc.getTextWidth('Completed on');
    font('times', 'normal', 12, C.body);
    const wSp = doc.getTextWidth(' ');
    const w2 = doc.getTextWidth(currentDate);
    const dx = CX - (w1 + wSp + w2) / 2;
    font('times', 'italic', 12, C.slate);
    doc.text('Completed on', dx, dBase);
    font('times', 'normal', 12, C.body);
    doc.text(currentDate, dx + w1 + wSp, dBase);

    // ── 3. Performance strip ──
    doc.setFillColor(...C.box); doc.setDrawColor(...C.teal); doc.setLineWidth(0.4);
    doc.roundedRect(83.7, 114.2, 129.6, 13.6, 2, 2, 'FD');
    line(126.9, 114.4, 126.9, 127.6, C.sep, 0.3);
    line(170.1, 114.4, 170.1, 127.6, C.sep, 0.3);

    const stats = [
      ['TOTAL SCORE', `${score} pts`, 105.4],
      ['ACCURACY', `${accuracy}%`, CX],
      ['SECURITY LEVEL', String(level), 191.6]
    ];
    stats.forEach(([label, value, cx]) => {
      font('helvetica', 'bold', 6.5, C.tealDk);
      text(label, cx, 118.9, 'center', 0.32);
      font('helvetica', 'bold', 12, C.ink);
      text(value, cx, 124.1, 'center');
    });

    // ── 4. Seal (center) ──
    const sx = CX, sy = 154;
    doc.setFillColor(...C.teal); doc.circle(sx, sy, 14, 'F');
    doc.setDrawColor(...C.white); doc.setLineWidth(0.35); doc.circle(sx, sy, 12.2, 'S');
    doc.setFillColor(...C.tealDk); doc.circle(sx, sy, 10.6, 'F');
    font('helvetica', 'bold', 9.5, C.white);
    text('OGDCL', sx, 153.7, 'center', 0.2);
    font('helvetica', 'normal', 4.8, C.white);
    text('VERIFIED', sx, 157, 'center', 0.37);

    // ── 5. Reference (left) and Signature (right) ──
    line(33, 163.15, 77, 163.15, C.faint, 0.3);
    font('helvetica', 'bold', 9.5, C.ink);
    text('Reference No.', 55, 168, 'center');
    font('helvetica', 'normal', 8.5, C.muted);
    text(refNumber, 55, 172.3, 'center');

    if (assets.signature) placeImage(assets.signature, 221, 138, 42, 24.8);
    line(220, 163.15, 264, 163.15, C.faint, 0.3);
    const sigX = 242;
    font('helvetica', 'bold', 9.5, C.ink);
    text('( M. Danish Hussain )', sigX, 168, 'center');
    font('helvetica', 'normal', 8.5, C.muted);
    text('Head Information Security', sigX, 172.3, 'center');
    text('OGDCL Islamabad', sigX, 176.5, 'center');

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

  window.downloadOGDCLCertificate = downloadOGDCLCertificate;
})(window);