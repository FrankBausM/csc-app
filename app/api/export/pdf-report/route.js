// ============================================================
// API-Route: PDF-Audit-Report generieren
// ============================================================
// Datei: src/app/api/export/pdf-report/route.js
// Benötigt: npm install pdfkit
// ============================================================

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { claims, options } = await request.json();

    // Dynamischer Import von PDFKit (serverseitig)
    const PDFDocument = (await import('pdfkit')).default;
    const path = (await import('path')).default;
    const fs = (await import('fs')).default;

    return new Promise((resolve) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 60, bottom: 60, left: 50, right: 50 },
        info: {
          Title: options.title,
          Author: options.auditor || 'CSC App',
          Subject: 'Sustainability Communication Audit',
          Creator: 'Credible Sustainability Communication',
        },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        
        // Dynamischer Dateiname mit Datum und Uhrzeit
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const filename = `audit-report_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.pdf`;
        
        resolve(
          new NextResponse(buffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="${filename}"`,
            },
          })
        );
      });

      // ── FARBEN ──
      const COLORS = {
        primary: '#d4e157',
        dark: '#1a1a2e',
        light: '#f8f9fa',
        text: '#333333',
        textDark: '#1a1a2e',
        lightGray: '#f5f5f5',
        critical: '#dc2626',
        high: '#ea580c',
        medium: '#ca8a04',
        low: '#16a34a',
        border: '#e0e0e0',
      };

      const riskColor = (score) => {
        if (score >= 75) return COLORS.critical;
        if (score >= 60) return COLORS.high;
        if (score >= 45) return COLORS.medium;
        return COLORS.low;
      };

      const riskLabel = (score) => {
        if (score >= 75) return 'KRITISCH';
        if (score >= 60) return 'HOCH';
        if (score >= 45) return 'MITTEL';
        return 'NIEDRIG';
      };

      // ── DECKBLATT ──
      doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.light);

      // Logo und Branding (Header)
      const logoPath = path.join(process.cwd(), 'public', 'GW_2017_CMYK.jpg');
      
      // Logo einbinden (links oben) - nur width angeben für korrekte Proportionen
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 50, { width: 200 });
        
        // Anwendungsname rechts neben dem Logo - dezent
        doc.fontSize(14).fillColor('#555555').font('Helvetica')
          .text('Credible Sustainability Communication', 270, 60, { width: doc.page.width - 320 });
        doc.fontSize(10).fillColor('#888888')
          .text('Powered by Grüne Welle Kommunikation', 270, 80);
      } else {
        // Fallback: Nur Text, wenn Logo nicht gefunden
        doc.fontSize(14).fillColor('#555555').font('Helvetica')
          .text('Credible Sustainability Communication', 50, 60);
        doc.fontSize(10).fillColor('#888888')
          .text('Powered by Grüne Welle Kommunikation', 50, 80);
      }

      // Akzentlinie nach Header
      doc.rect(50, 120, doc.page.width - 100, 3).fill(COLORS.primary);

      // Titel
      doc.fontSize(14).fillColor(COLORS.dark).font('Helvetica')
        .text(`TITEL: ${options.title}`, 50, 150, { width: doc.page.width - 100 });

      // Untertitel
      doc.moveDown(1);
      doc.fontSize(14).fillColor(COLORS.dark).font('Helvetica')
        .text('COMPLIANCE-PRÜFUNG NACH EMPCO-RICHTLINIE (EU) 2024/825', 50, doc.y);

      // Meta-Informationen
      doc.moveDown(3);
      doc.fontSize(11).fillColor('#555555').font('Helvetica');
      if (options.company) doc.text(`Unternehmen: ${options.company}`, 50);
      if (options.auditor) doc.text(`Erstellt von: ${options.auditor}`, 50);
      doc.text(`Datum: ${options.date}`, 50);
      doc.text(`Claims geprüft: ${claims.length}`, 50);

      // Zusammenfassungszahlen auf Deckblatt
      const criticalCount = claims.filter(c => (c.riskScore || c.score || 0) >= 75).length;
      const highCount = claims.filter(c => { const s = c.riskScore || c.score || 0; return s >= 60 && s < 75; }).length;
      const okCount = claims.filter(c => (c.riskScore || c.score || 0) < 45).length;

      doc.moveDown(3);
      const boxY = doc.y;
      const boxWidth = (doc.page.width - 140) / 3;

      // Kritisch-Box (rot mit weißer Schrift)
      doc.rect(50, boxY, boxWidth, 60).fill(COLORS.critical);
      doc.fontSize(24).fillColor('#ffffff').text(String(criticalCount), 50, boxY + 10, { width: boxWidth, align: 'center' });
      doc.fontSize(9).fillColor('#ffffff').text('KRITISCH', 50, boxY + 40, { width: boxWidth, align: 'center' });

      // Hoch-Box (orange mit weißer Schrift)
      doc.rect(70 + boxWidth, boxY, boxWidth, 60).fill(COLORS.high);
      doc.fontSize(24).fillColor('#ffffff').text(String(highCount), 70 + boxWidth, boxY + 10, { width: boxWidth, align: 'center' });
      doc.fontSize(9).fillColor('#ffffff').text('HOCH', 70 + boxWidth, boxY + 40, { width: boxWidth, align: 'center' });

      // OK-Box (grün mit weißer Schrift)
      doc.rect(90 + boxWidth * 2, boxY, boxWidth, 60).fill(COLORS.low);
      doc.fontSize(24).fillColor('#ffffff').text(String(okCount), 90 + boxWidth * 2, boxY + 10, { width: boxWidth, align: 'center' });
      doc.fontSize(9).fillColor('#ffffff').text('KONFORM', 90 + boxWidth * 2, boxY + 40, { width: boxWidth, align: 'center' });

      // Footer auf Deckblatt
      doc.fontSize(8).fillColor('#666666')
        .text('Powered by Credible Sustainability Communication · Grüne Welle Kommunikation',
          50, doc.page.height - 80, { width: doc.page.width - 100, align: 'center' });

      // Akzentlinie unten
      doc.rect(50, doc.page.height - 54, doc.page.width - 100, 4).fill(COLORS.primary);

      // ── MANAGEMENT SUMMARY ──
      doc.addPage();
      doc.rect(50, 30, doc.page.width - 100, 3).fill(COLORS.primary);
      doc.fontSize(14).fillColor(COLORS.textDark).font('Helvetica-Bold')
        .text('MANAGEMENT SUMMARY', 50, 42);

      doc.fontSize(12).fillColor(COLORS.text).font('Helvetica');
      doc.text('', 50, 65);

      const avgScore = claims.length > 0
        ? Math.round(claims.reduce((sum, c) => sum + (c.riskScore || c.score || 0), 0) / claims.length)
        : 0;

      const claimsToReview = criticalCount + highCount;
      const mediumCount = claims.filter(c => { const s = c.riskScore || c.score || 0; return s >= 45 && s < 60; }).length;

      doc.fontSize(11).fillColor(COLORS.text);
      doc.text(`Im Rahmen dieser Prüfung wurden ${claims.length} Claims auf ihre Konformität mit der EmpCo-Richtlinie (EU) 2024/825 und dem deutschen UWG analysiert.`, 50, 75, { width: doc.page.width - 100 });
      doc.moveDown(1);

      // Wichtigste Info: Anzahl zu prüfender Claims
      doc.fontSize(13).fillColor(COLORS.textDark).font('Helvetica-Bold');
      doc.text(`${claimsToReview} von ${claims.length} Claims erfordern Überarbeitung`, 50);
      doc.font('Helvetica');
      doc.moveDown(1);

      if (criticalCount > 0) {
        doc.fontSize(11).fillColor(COLORS.critical)
          .text(`• ${criticalCount} KRITISCH: Sofortige Überarbeitung erforderlich`, 50);
        doc.moveDown(0.3);
      }
      if (highCount > 0) {
        doc.fillColor(COLORS.high)
          .text(`• ${highCount} HOCH: Dringende Prüfung empfohlen`, 50);
        doc.moveDown(0.3);
      }
      if (mediumCount > 0) {
        doc.fillColor(COLORS.medium)
          .text(`• ${mediumCount} MITTEL: Verbesserungspotenzial vorhanden`, 50);
        doc.moveDown(0.3);
      }
      if (okCount > 0) {
        doc.fillColor(COLORS.low)
          .text(`• ${okCount} KONFORM: Keine Beanstandungen`, 50);
        doc.moveDown(0.3);
      }

      doc.moveDown(1);
      doc.fillColor(COLORS.text);

      // ── CLAIM-DETAILS ──
      doc.addPage();
      doc.rect(50, 30, doc.page.width - 100, 3).fill(COLORS.primary);
      doc.fontSize(14).fillColor(COLORS.textDark).font('Helvetica-Bold')
        .text('CLAIM-ANALYSE — EINZELERGEBNISSE', 50, 42);

      let yPos = 65;

      claims.forEach((claim, index) => {
        const score = claim.riskScore || claim.score || 0;
        const color = riskColor(score);
        const label = riskLabel(score);

        // Seitenumbruch prüfen
        if (yPos > doc.page.height - 200) {
          doc.addPage();
          doc.rect(50, 30, doc.page.width - 100, 3).fill(COLORS.primary);
          doc.fontSize(14).fillColor(COLORS.textDark).font('Helvetica-Bold')
            .text('CLAIM-ANALYSE — EINZELERGEBNISSE (Fortsetzung)', 50, 42);
          yPos = 65;
        }

        // Risiko-Badge
        doc.rect(50, yPos, 80, 20).fill(color);
        doc.fontSize(8).fillColor('#ffffff')
          .text(label, 50, yPos + 6, { width: 80, align: 'center' });

        doc.fontSize(9).fillColor('#999999')
          .text(`Score: ${score}/100`, 140, yPos + 5);

        yPos += 28;

        // Claim-Text
        doc.fontSize(10).fillColor(COLORS.text)
          .text(`${index + 1}. ${claim.text || claim.claimText || ''}`, 50, yPos, {
            width: doc.page.width - 100,
          });
        yPos = doc.y + 8;

        // Analyse-Begründung
        if (claim.analysis || claim.reason) {
          doc.fontSize(9).fillColor('#666666')
            .text(claim.analysis || claim.reason, 60, yPos, {
              width: doc.page.width - 120,
            });
          yPos = doc.y + 8;
        }

        // Alternative Formulierungen
        if (options.includeAlternatives && claim.alternatives?.length > 0) {
          doc.fontSize(8).fillColor(COLORS.primary)
            .text('Alternative Formulierungen:', 60, yPos);
          yPos = doc.y + 4;

          claim.alternatives.forEach((alt, i) => {
            const altText = typeof alt === 'string' ? alt : alt.text || alt;
            doc.fontSize(8).fillColor('#555555')
              .text(`  ${i + 1}. ${altText}`, 65, yPos, { width: doc.page.width - 130 });
            yPos = doc.y + 3;
          });
        }

        // Quelle
        if (claim.source) {
          doc.fontSize(8).fillColor('#999999')
            .text(`Quelle: ${claim.source}`, 60, yPos);
          yPos = doc.y + 5;
        }

        // Trennlinie
        doc.rect(50, yPos, doc.page.width - 100, 0.5).fill(COLORS.border);
        yPos += 15;
      });

      // ── QUELLENVERZEICHNIS ──
      if (options.includeSources) {
        doc.addPage();
        doc.rect(50, 30, doc.page.width - 100, 3).fill(COLORS.primary);
        doc.fontSize(14).fillColor(COLORS.textDark).font('Helvetica-Bold')
          .text('QUELLENVERZEICHNIS — RECHTSGRUNDLAGEN', 50, 42);

        doc.fontSize(9).fillColor(COLORS.text).font('Helvetica');
        const sources = [
          ['EmpCo-Richtlinie (EU) 2024/825', 'https://eur-lex.europa.eu/eli/dir/2024/825/oj?locale=de'],
          ['UWG — Gesetz gegen den unlauteren Wettbewerb', 'https://www.gesetze-im-internet.de/uwg_2004/'],
          ['EN ISO 14024 — Umweltkennzeichnungen Typ I', 'https://www.iso.org/standard/72458.html'],
          ['Science Based Targets initiative (SBTi)', 'https://sciencebasedtargets.org/'],
          ['EU Ecolabel', 'https://environment.ec.europa.eu/topics/circular-economy/eu-ecolabel-home_en'],
        ];

        let srcY = 65;
        sources.forEach(([name, url]) => {
          doc.fontSize(9).fillColor(COLORS.text).text(name, 50, srcY);
          doc.fontSize(8).fillColor('#4a90d9').text(url, 50, doc.y + 2);
          srcY = doc.y + 12;
        });
      }

      // ── SEITEN-FOOTER ──
      const pages = doc.bufferedPageRange();
      for (let i = 1; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(7).fillColor('#999999')
          .text(`${options.title} · ${options.date} · Seite ${i + 1}`,
            50, doc.page.height - 40, { width: doc.page.width - 100, align: 'center' });
      }

      doc.end();
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'PDF-Generierung fehlgeschlagen' }, { status: 500 });
  }
}
