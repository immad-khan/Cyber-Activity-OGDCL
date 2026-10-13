// File: public/certificate.js
// Official OGDCL Certificate Generator for CyberShield

(function (window) {
  'use strict';

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
    const refNumber = opts.refNumber || `No. OIST/CS-2026/${Math.floor(100 + Math.random() * 900)}`;

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
        doc.addImage(assets.logo, 'PNG', 18, 16, 42, 16);
      } catch (e) {
        console.warn('Could not render logo in PDF', e);
      }
    }

    // Header Title (Centered)
    doc.setTextColor(20, 24, 33);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('OIL & GAS DEVELOPMENT COMPANY LTD', 125, 22, { align: 'center' });

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 60, 75);
    doc.text('OGDCL INSTITUTE OF SCIENCE & TECHNOLOGY', 125, 28, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 90, 105);
    doc.text('ISLAMABAD, PAKISTAN', 125, 33, { align: 'center' });

    // Thin separator under header
    doc.setDrawColor(220, 225, 235);
    doc.setLineWidth(0.3);
    doc.line(18, 38, pageWidth - 18, 38);

    // ── 2. CONTACT DETAILS & ADDRESS ──
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');

    // Left Column (Contact Numbers)
    const leftX = 18;
    let contactY = 44;
    const contactLines = [
      'Voice:  +92-51-9258591',
      'PABX:   +92-51-9258691-6',
      'FAX:     +92-51-9258152',
      'Telex:   5692 OGDC-PK',
      'Email:   oistinfo@ogdcl.com'
    ];
    contactLines.forEach(line => {
      doc.text(line, leftX, contactY);
      contactY += 3.8;
    });

    // Right Column (Address)
    const rightX = pageWidth - 18;
    let addrY = 44;
    const addrLines = [
      '136-137 Street 16,',
      'Sector I-9,',
      'Islamabad 44790,',
      'Pakistan.'
    ];
    addrLines.forEach(line => {
      doc.text(line, rightX, addrY, { align: 'right' });
      addrY += 3.8;
    });

    // Separator
    doc.setDrawColor(220, 225, 235);
    doc.setLineWidth(0.3);
    doc.line(18, 66, pageWidth - 18, 66);

    // Reference No. and Date
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(refNumber, 18, 73);
    doc.text(currentDate, rightX, 73, { align: 'right' });

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
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(18, boxY, pageWidth - 36, 32, 2, 2, 'F');
    doc.setDrawColor(0, 180, 150);
    doc.setLineWidth(0.4);
    doc.roundedRect(18, boxY, pageWidth - 36, 32, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(0, 140, 115);
    doc.text('ASSESSMENT PERFORMANCE SUMMARY', 24, boxY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);

    // Column 1
    doc.text(`• Participant: ${userName}`, 24, boxY + 14);
    doc.text(`• Total Score: ${score} points`, 24, boxY + 20);
    doc.text(`• Assessment Accuracy: ${accuracy}%`, 24, boxY + 26);

    // Column 2
    doc.text(`• Module: ${activityName}`, 115, boxY + 14);
    doc.text(`• Security Level: ${level}`, 115, boxY + 20);
    doc.text(`• Completion Date: ${currentDate}`, 115, boxY + 26);

    // ── 6. CLOSING STATEMENT ──
    const bodyText2 = 'His/Her performance during the training and assessment remained commendable.';
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59);
    doc.text(bodyText2, 18, 178);

    // ── 7. OFFICIAL SEAL & SIGNATURE ──
    const bottomY = 205;

    // Official Seal (Bottom Left)
    if (assets.seal) {
      try {
        doc.addImage(assets.seal, 'PNG', 24, bottomY - 6, 38, 38);
      } catch (e) {
        console.warn('Could not render seal', e);
      }
    }

    // Seal text under seal
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('OGDCL VERIFIED & SEALED', 43, bottomY + 36, { align: 'center' });

    // Official Signature (Bottom Right)
    if (assets.signature) {
      try {
        doc.addImage(assets.signature, 'PNG', 134, bottomY - 14, 46, 21);
      } catch (e) {
        console.warn('Could not render signature', e);
      }
    }

    // Signatory Text (Bottom Right)
    const sigX = 157;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('(Muhammad Naveed Raza)', sigX, bottomY + 13, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Manager (P&P) OIST', sigX, bottomY + 18, { align: 'center' });
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
