'use client';

import { useState } from 'react';

// ============================================================
// FEATURE 5: ERWEITERTE EXPORT-FORMATE
// PDF-Audit-Report + Word-Export der Alternativformulierungen
// ============================================================
// Datei: src/app/reports/ExportFormats.jsx
// Einbinden in: src/app/reports/page.jsx
// ============================================================

const RISK_LABELS = {
  critical: { label: 'KRITISCH', emoji: '🔴' },
  high:     { label: 'HOCH',     emoji: '🟠' },
  medium:   { label: 'MITTEL',   emoji: '🟡' },
  low:      { label: 'NIEDRIG',  emoji: '🟢' },
};

function getRiskLevel(score) {
  if (score >= 75) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 45) return 'medium';
  return 'low';
}

// ============================================================
// PDF-Audit-Report generieren (via API-Route)
// ============================================================
async function generatePdfReport(claims, options = {}) {
  const response = await fetch('/api/export/pdf-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      claims,
      options: {
        title: options.title || 'Sustainability Communication Audit Report',
        company: options.company || '',
        auditor: options.auditor || '',
        date: new Date().toLocaleDateString('de-DE', {
          year: 'numeric', month: 'long', day: 'numeric'
        }),
        includeAlternatives: options.includeAlternatives ?? true,
        includeSources: options.includeSources ?? true,
        includePatterns: options.includePatterns ?? false,
      }
    }),
  });

  if (!response.ok) throw new Error('PDF-Generierung fehlgeschlagen');

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  // Dateiname mit Datum und Uhrzeit: audit-report-2026-06-08-15-30
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  a.download = `audit-report-${year}-${month}-${day}-${hours}-${minutes}.pdf`;
  
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// Word-Export der Alternativformulierungen (via API-Route)
// ============================================================
async function generateWordExport(claims, options = {}) {
  const response = await fetch('/api/export/word-alternatives', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      claims,
      options: {
        title: options.title || 'Alternative Formulierungen — Redaktionsdokument',
        company: options.company || '',
        date: new Date().toLocaleDateString('de-DE', {
          year: 'numeric', month: 'long', day: 'numeric'
        }),
        format: options.format || 'table', // 'table' oder 'list'
        includeOriginal: options.includeOriginal ?? true,
        includeReason: options.includeReason ?? true,
      }
    }),
  });

  if (!response.ok) throw new Error('Word-Export fehlgeschlagen');

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  // Dateiname mit Datum und Uhrzeit
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  a.download = `alternative-formulierungen-${year}-${month}-${day}-${hours}-${minutes}.docx`;
  
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// Export-Konfiguration Modal
// ============================================================
function ExportConfigModal({ type, onExport, onCancel, claimCount, claims }) {
  const isPdf = type === 'pdf';
  const autoTitle = generateAutoTitle(claims);
  const [options, setOptions] = useState({
    title: isPdf ? autoTitle : `Redaktionsdokument: ${autoTitle}`,
    company: '',
    auditor: '',
    includeAlternatives: true,
    includeSources: true,
    includePatterns: false,
    includeOriginal: true,
    includeReason: true,
    format: 'table',
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[#4d6600] text-lg font-bold">
              {isPdf ? '📄 PDF-Audit-Report' : '📝 Word-Export'} konfigurieren
            </h2>
            <button onClick={onCancel} className="text-[#3d4f38] hover:text-[#4d6600] text-xl">✕</button>
          </div>

          <div className="space-y-4">
            {/* Titel */}
            <div>
              <label className="text-[#3d4f38] text-xs uppercase tracking-wider block mb-1">Report-Titel</label>
              <input
                type="text"
                value={options.title}
                onChange={e => setOptions(o => ({ ...o, title: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 text-[#4d6600] focus:border-[#d4e157] focus:outline-none text-sm"
              />
            </div>

            {/* Unternehmen */}
            <div>
              <label className="text-[#3d4f38] text-xs uppercase tracking-wider block mb-1">Unternehmen / Kunde</label>
              <input
                type="text"
                value={options.company}
                onChange={e => setOptions(o => ({ ...o, company: e.target.value }))}
                placeholder="z.B. Grüne Welle Kommunikation"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 text-[#4d6600] focus:border-[#d4e157] focus:outline-none text-sm"
              />
            </div>

            {/* Auditor (nur PDF) */}
            {isPdf && (
              <div>
                <label className="text-[#3d4f38] text-xs uppercase tracking-wider block mb-1">Erstellt von</label>
                <input
                  type="text"
                  value={options.auditor}
                  onChange={e => setOptions(o => ({ ...o, auditor: e.target.value }))}
                  placeholder="Name des Prüfers"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 text-[#4d6600] focus:border-[#d4e157] focus:outline-none text-sm"
                />
              </div>
            )}

            {/* Optionen */}
            <div className="border-t border-gray-700 pt-4">
              <label className="text-[#3d4f38] text-xs uppercase tracking-wider block mb-3">Inhalt</label>

              {isPdf ? (
                <div className="space-y-2">
                  <ToggleOption
                    label="Alternative Formulierungen einschließen"
                    checked={options.includeAlternatives}
                    onChange={v => setOptions(o => ({ ...o, includeAlternatives: v }))}
                  />
                  <ToggleOption
                    label="Quellenverweise einschließen"
                    checked={options.includeSources}
                    onChange={v => setOptions(o => ({ ...o, includeSources: v }))}
                  />
                  <ToggleOption
                    label="Pattern-Regeln anhängen"
                    checked={options.includePatterns}
                    onChange={v => setOptions(o => ({ ...o, includePatterns: v }))}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <ToggleOption
                    label="Originaltexte anzeigen"
                    checked={options.includeOriginal}
                    onChange={v => setOptions(o => ({ ...o, includeOriginal: v }))}
                  />
                  <ToggleOption
                    label="Begründung der Änderung anzeigen"
                    checked={options.includeReason}
                    onChange={v => setOptions(o => ({ ...o, includeReason: v }))}
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setOptions(o => ({ ...o, format: 'table' }))}
                      className={`flex-1 py-2 rounded-lg text-sm ${
                        options.format === 'table'
                          ? 'bg-[#d4e157]/20 border border-[#d4e157]/50 text-[#d4e157]'
                          : 'bg-gray-800 border border-gray-600 text-[#3d4f38]'
                      }`}
                    >
                      Tabellenformat
                    </button>
                    <button
                      onClick={() => setOptions(o => ({ ...o, format: 'list' }))}
                      className={`flex-1 py-2 rounded-lg text-sm ${
                        options.format === 'list'
                          ? 'bg-[#d4e157]/20 border border-[#d4e157]/50 text-[#d4e157]'
                          : 'bg-gray-800 border border-gray-600 text-[#3d4f38]'
                      }`}
                    >
                      Listenformat
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-[#3d4f38]">
              {claimCount} Claims werden exportiert · {isPdf ? 'PDF' : 'DOCX'} · Datum: {new Date().toLocaleDateString('de-DE')}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
            <button
              onClick={() => onExport(options)}
              className="flex-1 bg-[#d4e157] text-gray-900 font-bold py-3 rounded-lg hover:bg-[#e6ee9c] transition-colors uppercase tracking-wider text-sm"
            >
              {isPdf ? '📄 PDF generieren' : '📝 Word exportieren'}
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-3 border border-gray-600 text-[#4d6600] rounded-lg hover:bg-gray-800 transition-colors text-sm"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleOption({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${
          checked ? 'bg-[#d4e157]' : 'bg-gray-600'
        }`}
      >
        <span className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`} />
      </button>
      <span className="text-[#4d6600] text-sm">{label}</span>
    </label>
  );
}


// ============================================================
// Hilfsfunktion: Automatischer Titel aus Claims generieren
// ============================================================
function generateAutoTitle(claims) {
  if (!claims || claims.length === 0) {
    return 'Sustainability Communication Audit Report';
  }

  // Prüfe ob URL-basierte Analyse vorliegt
  const urlClaim = claims.find(c => c.sourceUrl && c.sourceType === 'url');
  if (urlClaim) {
    return urlClaim.sourceUrl;
  }

  // Andernfalls: Erste 5 Worte des ersten Claims
  const firstClaim = claims[0];
  if (firstClaim && firstClaim.text) {
    const words = firstClaim.text.trim().split(/\s+/);
    const title = words.slice(0, 5).join(' ');
    return title + (words.length > 5 ? '...' : '');
  }

  return 'Sustainability Communication Audit Report';
}

// ============================================================
// HAUPTKOMPONENTE: Export-Buttons für die Reports-Seite
// ============================================================
export default function ExportFormats({ claims = [] }) {
  const [exportType, setExportType] = useState(null); // 'pdf' | 'word' | null
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  const handleExport = async (options) => {
    setIsExporting(true);
    setError(null);

    try {
      if (exportType === 'pdf') {
        await generatePdfReport(claims, options);
      } else if (exportType === 'word') {
        await generateWordExport(claims, options);
      }
      setExportType(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const criticalCount = claims.filter(c => (c.riskScore || c.score) >= 75).length;
  const highCount = claims.filter(c => {
    const s = c.riskScore || c.score;
    return s >= 60 && s < 75;
  }).length;
  const withAlternatives = claims.filter(c => c.alternatives?.length > 0).length;

  return (
    <div className="space-y-4">
      {/* Export-Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Bestehender CSV-Export */}
        <button
          onClick={() => {
            // Bestehende CSV-Export-Logik aufrufen
            window.dispatchEvent(new CustomEvent('export-csv'));
          }}
          className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 text-left hover:border-gray-500 transition-all group"
        >
          <div className="text-2xl mb-2">📊</div>
          <h4 className="text-[#4d6600] font-semibold text-sm">Claims-Report als CSV</h4>
          <p className="text-[#3d4f38] text-xs mt-1">Rohdaten für Excel / Google Sheets</p>
          <span className="text-[#d4e157] text-xs mt-3 inline-block group-hover:underline">Exportieren →</span>
        </button>

        {/* PDF-Audit-Report */}
        <button
          onClick={() => setExportType('pdf')}
          className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 text-left hover:border-[#d4e157]/50 transition-all group"
        >
          <div className="text-2xl mb-2">📄</div>
          <h4 className="text-[#4d6600] font-semibold text-sm">PDF-Audit-Report</h4>
          <p className="text-[#3d4f38] text-xs mt-1">
            Professioneller Report mit Zusammenfassung, Risikobewertung und Quellenverweisen
          </p>
          <div className="flex gap-2 mt-2">
            {criticalCount > 0 && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">{criticalCount} kritisch</span>}
            {highCount > 0 && <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">{highCount} hoch</span>}
          </div>
          <span className="text-[#d4e157] text-xs mt-2 inline-block group-hover:underline">Konfigurieren →</span>
        </button>

        {/* Word-Export Alternativen */}
        <button
          onClick={() => setExportType('word')}
          className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 text-left hover:border-[#d4e157]/50 transition-all group"
        >
          <div className="text-2xl mb-2">📝</div>
          <h4 className="text-[#4d6600] font-semibold text-sm">Word-Redaktionsdokument</h4>
          <p className="text-[#3d4f38] text-xs mt-1">
            Original vs. Alternativen als editierbares Word-Dokument für den Redaktionsprozess
          </p>
          <div className="mt-2">
            <span className="text-xs bg-gray-700 text-[#4d6600] px-2 py-0.5 rounded">
              {withAlternatives} Claims mit Alternativen
            </span>
          </div>
          <span className="text-[#d4e157] text-xs mt-2 inline-block group-hover:underline">Konfigurieren →</span>
        </button>
      </div>

      {/* Fehler */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
          Export-Fehler: {error}
        </div>
      )}

      {/* Konfigurations-Modal */}
      {exportType && (
        <ExportConfigModal
          type={exportType}
          claimCount={claims.length}
          claims={claims}
          onExport={handleExport}
          onCancel={() => setExportType(null)}
        />
      )}

      {/* Loading Overlay */}
      {isExporting && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 text-center">
            <div className="text-3xl mb-3 animate-pulse">
              {exportType === 'pdf' ? '📄' : '📝'}
            </div>
            <p className="text-[#4d6600] font-semibold">
              {exportType === 'pdf' ? 'PDF-Report' : 'Word-Dokument'} wird erstellt...
            </p>
            <p className="text-[#3d4f38] text-sm mt-1">Einen Moment bitte.</p>
          </div>
        </div>
      )}
    </div>
  );
}
