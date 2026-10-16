// File: public/certificate.js
// Official OGDCL Certificate Generator

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

  function downloadOGDCLCertificate(opts) {
    if (typeof window.jspdf === 'undefined' && typeof jsPDF === 'undefined') {
      alert('PDF library not loaded. Please refresh the page.');
      return;
    }

    const { jsPDF } = window.jspdf || window;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const userName = (opts.userName || 'Participant').trim();
    const score = opts.score || 0;
    const accuracy = opts.accuracy || 100;
    const level = opts.level || 'Guardian';
    const activityName = opts.activity || 'Cybersecurity Awareness & Threat Defense';
    const currentDate = opts.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const refNumber = opts.refNumber || `No. CyberSecurity-2026/${Math.floor(100 + Math.random() * 900)}`;

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 22;

    // Background - crisp official white
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Subtle, elegant outer border (official letterhead frame)
    doc.setDrawColor(210, 215, 225);
    doc.setLineWidth(0.4);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    doc.setDrawColor(0, 180, 150);
    doc.setLineWidth(0.8);
    doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

    // ── 1. HEADER SECTION ──
    const assets = window.CERT_ASSETS || {};

    // OGDCL Logo (Top Left)
    if (assets.logo) {
      try {
        doc.addImage(assets.logo, 'PNG', 18, 17, 30, 12.5);
      } catch (e) {
        console.warn('Could not render logo in PDF', e);
      }
    }

    // Header Title (Centralized on Certificate)
    const headerCenterX = pageWidth / 2;
    doc.setTextColor(20, 24, 33);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('OIL & GAS DEVELOPMENT COMPANY LTD', headerCenterX, 22, { align: 'center' });

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 60, 75);
    doc.text('CYBERSECURITY DEPARTMENT', headerCenterX, 28, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 90, 105);
    doc.text('ISLAMABAD, PAKISTAN', headerCenterX, 33, { align: 'center' });

    // Thin separator under header
    doc.setDrawColor(220, 225, 235);
    doc.setLineWidth(0.3);
    doc.line(18, 38, pageWidth - 18, 38);

    // ── 2. CONTACT DETAILS & ADDRESS ──
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');

    // Left Column (Address)
    const leftX = 18;
    let contactY = 44;
    const addrLines = [
      'Cybersecurity Department,',
      'OGDCL Head Office, Jinnah Avenue,',
      'Islamabad.'
    ];
    addrLines.forEach(line => {
      doc.text(line, leftX, contactY);
      contactY += 4;
    });

    // Right Column (Contact)
    const rightX = pageWidth - 18;
    let contactRightY = 44;
    const contactLines = [
      'Tel: 051-920024061, 4177',
      'Email: cyber.security@ogdcl.com'
    ];
    contactLines.forEach(line => {
      doc.text(line, rightX, contactRightY, { align: 'right' });
      contactRightY += 4;
    });

    // Separator
    doc.setDrawColor(220, 225, 235);
    doc.setLineWidth(0.3);
    doc.line(18, 62, pageWidth - 18, 62);

    // Reference No. and Date
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(refNumber, 18, 70);
    doc.text(currentDate, rightX, 70, { align: 'right' });

    // ── 3. MAIN TITLE ──
    const titleY = 88;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('TO WHOM IT MAY CONCERN', pageWidth / 2, titleY, { align: 'center' });

    // Title Underline
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.line(70, titleY + 1.8, 140, titleY + 1.8);

    // ── 4. BODY CONTENT ──
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59);

    const bodyText1 = `It is certified that Mr./Ms. ${userName} has successfully completed the Cybersecurity Awareness & Digital Safety Assessment conducted by OGDCL. During this program, they demonstrated exemplary diligence, understanding of digital threat vectors, password protection, phishing mitigation, and enterprise information security protocols.`;

    const splitText1 = doc.splitTextToSize(bodyText1, pageWidth - 36);
    doc.text(splitText1, 18, 104, { lineHeightFactor: 1.5 });

    // ── 5. PERFORMANCE SUMMARY BOX ──
    const boxY = 132;
    const col1X = 24;
    const col2X = 104;
    const col1Width = 76;
    const col2Width = 84;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    // Calculate wrapped lines to prevent text exceeding certificate bounds
    const nameLines = doc.splitTextToSize(`• Participant: ${userName}`, col1Width);
    const modLines = doc.splitTextToSize(`• Module: ${activityName}`, col2Width);

    const totalLinesCol1 = nameLines.length + 2; // name + score + accuracy
    const totalLinesCol2 = modLines.length + 2;  // module + level + date
    const maxItems = Math.max(totalLinesCol1, totalLinesCol2);

    // Dynamic height based on wrapped lines
    const lineHeight = 5.2;
    const boxHeight = Math.max(34, 13 + (maxItems - 1) * lineHeight + 7);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(18, boxY, pageWidth - 36, boxHeight, 2, 2, 'F');
    doc.setDrawColor(0, 180, 150);
    doc.setLineWidth(0.4);
    doc.roundedRect(18, boxY, pageWidth - 36, boxHeight, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(0, 140, 115);
    doc.text('ASSESSMENT PERFORMANCE SUMMARY', 24, boxY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);

    // Column 1
    let c1Y = boxY + 14;
    nameLines.forEach((line, idx) => {
      doc.text(line, idx === 0 ? col1X : col1X + 3.5, c1Y);
      if (idx < nameLines.length - 1) c1Y += 4.5;
    });
    c1Y += lineHeight;
    doc.text(`• Total Score: ${score} points`, col1X, c1Y);
    c1Y += lineHeight;
    doc.text(`• Assessment Accuracy: ${accuracy}%`, col1X, c1Y);

    // Column 2
    let c2Y = boxY + 14;
    modLines.forEach((line, idx) => {
      doc.text(line, idx === 0 ? col2X : col2X + 3.5, c2Y);
      if (idx < modLines.length - 1) c2Y += 4.5;
    });
    c2Y += lineHeight;
    doc.text(`• Security Level: ${level}`, col2X, c2Y);
    c2Y += lineHeight;
    doc.text(`• Completion Date: ${currentDate}`, col2X, c2Y);

    // ── 6. CLOSING STATEMENT ──
    const closingY = Math.max(176, boxY + boxHeight + 8);
    const bodyText2 = 'His/Her performance during the training and assessment remained commendable.';
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59);
    doc.text(bodyText2, 18, closingY);

    // ── 7. OFFICIAL SIGNATURE ──
    const bottomY = Math.max(204, closingY + 26);

    // Official Signature (Bottom Right)
    if (assets.signature) {
      try {
        // Native aspect ratio 237 / 140 = 1.693
        const sigW = 42;
        const sigH = sigW / 1.693; // ~24.8mm
        const sigXPos = 157 - (sigW / 2);
        const sigYPos = bottomY - 14;
        doc.addImage(assets.signature, 'PNG', sigXPos, sigYPos, sigW, sigH);
      } catch (e) {
        console.warn('Could not render signature', e);
      }
    }

    // Signatory Text (Bottom Right)
    const sigX = 157;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('( M. Danish Hussain )', sigX, bottomY + 13, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Head Information Security', sigX, bottomY + 18, { align: 'center' });
    doc.text('OGDCL Islamabad', sigX, bottomY + 22.5, { align: 'center' });

    // ── 8. FOOTER NOTE ──
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(18, pageHeight - 16, pageWidth - 18, pageHeight - 16);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    doc.text(
      'This certificate is an officially verified electronic credential issued by the OGDCL Information Security & Training Division.',
      pageWidth / 2,
      pageHeight - 11,
      { align: 'center' }
    );

    // Save PDF
    const safeFileName = userName.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`OGDCL_Certificate_${safeFileName}.pdf`);
  }

  window.downloadOGDCLCertificate = downloadOGDCLCertificate;
})(window);
