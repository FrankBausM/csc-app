// ============================================================
// API-Route: Word-Export der alternativen Formulierungen
// ============================================================
// Datei: src/app/api/export/word-alternatives/route.js
// Benötigt: npm install docx
// ============================================================

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { claims, options } = await request.json();

    const {
      Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
      HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
      Header, Footer, PageNumber, LevelFormat,
    } = await import('docx');

    // ── Hilfsfunktionen ──
    const riskLabel = (score) => {
      if (score >= 75) return 'KRITISCH';
      if (score >= 60) return 'HOCH';
      if (score >= 45) return 'MITTEL';
      return 'NIEDRIG';
    };

    const riskColorHex = (score) => {
      if (score >= 75) return 'FDECEC';
      if (score >= 60) return 'FFF3E0';
      if (score >= 45) return 'FFFDE7';
      return 'E8F5E9';
    };

    const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
    const borderTop = { style: BorderStyle.SINGLE, size: 3, color: 'C6E31B' };
    const borders = { top: border, bottom: border, left: border, right: border };
    const bordersHeader = { top: borderTop, bottom: border, left: border, right: border };
    const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

    // ── Dokument-Inhalte aufbauen ──
    const children = [];

    // Titel
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 },
        children: [new TextRun({ text: options.title, bold: true, size: 32, font: 'Arial' })],
      })
    );

    // Meta-Info
    const metaLines = [];
    if (options.company) metaLines.push(`Unternehmen: ${options.company}`);
    metaLines.push(`Datum: ${options.date}`);
    metaLines.push(`Anzahl Claims: ${claims.length}`);
    metaLines.push('');

    metaLines.forEach(line => {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: line, size: 20, color: '888888', font: 'Arial' })],
        })
      );
    });

    // Einleitung
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 300 },
        children: [new TextRun({
          text: 'Dieses Dokument enthält die analysierten Claims mit ihren vorgeschlagenen alternativen Formulierungen. Die Alternativen sind so formuliert, dass sie den Anforderungen der EmpCo-Richtlinie (EU) 2024/825 entsprechen. Sie können direkt in den Redaktionsprozess übernommen werden.',
          size: 20,
          font: 'Arial',
        })],
      })
    );

    // ── Claims mit Alternativen ──
    const claimsWithAlts = claims.filter(c =>
      c.alternatives?.length > 0 || c.suggestions?.length > 0
    );

    if (options.format === 'table') {
      // ── TABELLENFORMAT ──
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
          children: [new TextRun({ text: 'Redaktionstabelle', bold: true, size: 28, font: 'Arial' })],
        })
      );

      // Tabellen-Header
      const headerRow = new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            borders: bordersHeader,
            width: { size: 600, type: WidthType.DXA },
            shading: { fill: 'F8F9FA', type: ShadingType.CLEAR },
            margins: cellMargins,
            children: [new Paragraph({ children: [new TextRun({ text: '#', bold: true, color: '1a1a2e', size: 18, font: 'Arial' })] })],
          }),
          new TableCell({
            borders: bordersHeader,
            width: { size: 1200, type: WidthType.DXA },
            shading: { fill: 'F8F9FA', type: ShadingType.CLEAR },
            margins: cellMargins,
            children: [new Paragraph({ children: [new TextRun({ text: 'Risiko', bold: true, color: '1a1a2e', size: 18, font: 'Arial' })] })],
          }),
          new TableCell({
            borders: bordersHeader,
            width: { size: 3580, type: WidthType.DXA },
            shading: { fill: 'F8F9FA', type: ShadingType.CLEAR },
            margins: cellMargins,
            children: [new Paragraph({ children: [new TextRun({ text: 'Original', bold: true, color: '1a1a2e', size: 18, font: 'Arial' })] })],
          }),
          new TableCell({
            borders: bordersHeader,
            width: { size: 3980, type: WidthType.DXA },
            shading: { fill: 'F8F9FA', type: ShadingType.CLEAR },
            margins: cellMargins,
            children: [new Paragraph({ children: [new TextRun({ text: 'Empfohlene Alternative', bold: true, color: '1a1a2e', size: 18, font: 'Arial' })] })],
          }),
        ],
      });

      const dataRows = claims.map((claim, i) => {
        const score = claim.riskScore || claim.score || 0;
        const alts = claim.alternatives || claim.suggestions || [];
        const altText = alts.length > 0
          ? (typeof alts[0] === 'string' ? alts[0] : alts[0].text || '')
          : '(Keine Alternative vorgeschlagen)';

        return new TableRow({
          children: [
            new TableCell({
              borders, margins: cellMargins,
              width: { size: 600, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: String(i + 1), size: 18, font: 'Arial' })] })],
            }),
            new TableCell({
              borders, margins: cellMargins,
              width: { size: 1200, type: WidthType.DXA },
              shading: { fill: riskColorHex(score), type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: `${riskLabel(score)} (${score})`, bold: true, size: 16, font: 'Arial' })] })],
            }),
            new TableCell({
              borders, margins: cellMargins,
              width: { size: 3580, type: WidthType.DXA },
              shading: { fill: 'FFF5F5', type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({
                text: claim.text || claim.claimText || '',
                size: 18, font: 'Arial',
                strike: true,
              })] })],
            }),
            new TableCell({
              borders, margins: cellMargins,
              width: { size: 3980, type: WidthType.DXA },
              shading: { fill: 'F0FFF0', type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: altText, size: 18, font: 'Arial' })] })],
            }),
          ],
        });
      });

      children.push(
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [600, 1200, 3580, 3980],
          rows: [headerRow, ...dataRows],
        })
      );

    } else {
      // ── LISTENFORMAT ──
      claims.forEach((claim, i) => {
        const score = claim.riskScore || claim.score || 0;
        const alts = claim.alternatives || claim.suggestions || [];

        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 100 },
            children: [new TextRun({
              text: `Claim ${i + 1} — ${riskLabel(score)} (Score: ${score})`,
              bold: true, size: 24, font: 'Arial',
            })],
          })
        );

        // Original
        if (options.includeOriginal) {
          children.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [new TextRun({ text: 'ORIGINAL:', bold: true, size: 18, color: '999999', font: 'Arial' })],
            })
          );
          children.push(
            new Paragraph({
              spacing: { after: 100 },
              indent: { left: 360 },
              children: [new TextRun({
                text: claim.text || claim.claimText || '',
                size: 20, font: 'Arial', strike: true, color: 'CC0000',
              })],
            })
          );
        }

        // Begründung
        if (options.includeReason && (claim.analysis || claim.reason)) {
          children.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [new TextRun({ text: 'BEGRÜNDUNG:', bold: true, size: 18, color: '999999', font: 'Arial' })],
            })
          );
          children.push(
            new Paragraph({
              spacing: { after: 100 },
              indent: { left: 360 },
              children: [new TextRun({
                text: claim.analysis || claim.reason || '',
                size: 18, italics: true, color: '666666', font: 'Arial',
              })],
            })
          );
        }

        // Alternativen
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: 'EMPFOHLENE ALTERNATIVEN:', bold: true, size: 18, color: '2E7D32', font: 'Arial' })],
          })
        );

        if (alts.length > 0) {
          alts.forEach((alt, j) => {
            const altText = typeof alt === 'string' ? alt : alt.text || '';
            const altLabel = typeof alt === 'object' && alt.label ? ` (${alt.label})` : '';
            children.push(
              new Paragraph({
                spacing: { after: 60 },
                indent: { left: 360 },
                children: [
                  new TextRun({ text: `Variante ${j + 1}${altLabel}: `, bold: true, size: 20, font: 'Arial' }),
                  new TextRun({ text: altText, size: 20, font: 'Arial', color: '2E7D32' }),
                ],
              })
            );
          });
        } else {
          children.push(
            new Paragraph({
              indent: { left: 360 },
              spacing: { after: 60 },
              children: [new TextRun({ text: '(Keine Alternative vorgeschlagen)', size: 18, italics: true, color: '999999', font: 'Arial' })],
            })
          );
        }
      });
    }

    // ── Dokument erstellen ──
    const doc = new Document({
      styles: {
        default: {
          document: { run: { font: 'Arial', size: 22 } },
        },
        paragraphStyles: [
          {
            id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
            run: { size: 32, bold: true, font: 'Arial' },
            paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 },
          },
          {
            id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
            run: { size: 28, bold: true, font: 'Arial' },
            paragraph: { spacing: { before: 180, after: 180 }, outlineLevel: 1 },
          },
        ],
      },
      sections: [{
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 1440, right: 1200, bottom: 1440, left: 1200 },
          },
        },
        headers: {
          default: new Header({
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: 'Credible Sustainability Communication', size: 16, color: 'AAAAAA', font: 'Arial' })],
            })],
          }),
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: `${options.date} · Seite `, size: 16, color: 'AAAAAA', font: 'Arial' }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: 'AAAAAA', font: 'Arial' }),
              ],
            })],
          }),
        },
        children,
      }],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="alternative-formulierungen.docx"',
      },
    });

  } catch (error) {
    console.error('Word export error:', error);
    return NextResponse.json({ error: 'Word-Export fehlgeschlagen' }, { status: 500 });
  }
}
