'use client';

import { useState, useMemo } from 'react';

// ============================================================
// FEATURE 7: HISTORISCHE VERGLEICHE / DELTA-SCORE
// Alte und neue Version eines Claims nebeneinander mit Delta
// ============================================================
// Datei: src/app/components/ClaimHistory.jsx
// Einbinden in: Claim-Detail-Seite + Überblick-Dashboard
// ============================================================

const RISK_CONFIG = {
  critical: { label: 'KRITISCH', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  high:     { label: 'HOCH',     color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  medium:   { label: 'MITTEL',   color: '#eab308', bg: 'rgba(234,179,8,0.1)' },
  low:      { label: 'NIEDRIG',  color: '#c6e31b', bg: 'rgba(34,197,94,0.1)' },
};

function getRisk(score) {
  if (score >= 75) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 45) return 'medium';
  return 'low';
}

// ── Delta-Badge ──
function DeltaBadge({ oldScore, newScore, size = 'normal' }) {
  const delta = newScore - oldScore;
  const isImproved = delta < 0;
  const isWorsened = delta > 0;
  const isSame = delta === 0;

  const sizeClasses = size === 'large'
    ? 'text-2xl px-4 py-2'
    : size === 'small'
    ? 'text-xs px-2 py-0.5'
    : 'text-sm px-3 py-1';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-bold ${sizeClasses} ${
      isImproved ? 'bg-green-500/20 text-green-400' :
      isWorsened ? 'bg-red-500/20 text-red-400' :
      'bg-gray-700 text-[#3d4f38]'
    }`}>
      {isImproved ? '↓' : isWorsened ? '↑' : '→'}
      {isSame ? '±0' : `${delta > 0 ? '+' : ''}${delta}`}
    </span>
  );
}

// ── Score-Vergleichsanzeige ──
function ScoreComparison({ oldScore, newScore }) {
  const oldRisk = getRisk(oldScore);
  const newRisk = getRisk(newScore);
  const delta = newScore - oldScore;
  const improved = delta < 0;

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-lg">
      {/* Alter Score */}
      <div className="text-center">
        <div className="text-xs text-gray-500 uppercase mb-1">Vorher</div>
        <div className="text-3xl font-bold" style={{ color: RISK_CONFIG[oldRisk].color }}>
          {oldScore}
        </div>
        <div className="text-xs mt-1 px-2 py-0.5 rounded inline-block" style={{
          backgroundColor: RISK_CONFIG[oldRisk].bg,
          color: RISK_CONFIG[oldRisk].color,
        }}>
          {RISK_CONFIG[oldRisk].label}
        </div>
      </div>

      {/* Pfeil + Delta */}
      <div className="flex flex-col items-center gap-1">
        <div className={`text-2xl ${improved ? 'text-green-400' : delta > 0 ? 'text-red-400' : 'text-gray-500'}`}>
          {improved ? '→' : delta > 0 ? '→' : '→'}
        </div>
        <DeltaBadge oldScore={oldScore} newScore={newScore} size="normal" />
      </div>

      {/* Neuer Score */}
      <div className="text-center">
        <div className="text-xs text-gray-500 uppercase mb-1">Nachher</div>
        <div className="text-3xl font-bold" style={{ color: RISK_CONFIG[newRisk].color }}>
          {newScore}
        </div>
        <div className="text-xs mt-1 px-2 py-0.5 rounded inline-block" style={{
          backgroundColor: RISK_CONFIG[newRisk].bg,
          color: RISK_CONFIG[newRisk].color,
        }}>
          {RISK_CONFIG[newRisk].label}
        </div>
      </div>

      {/* Fortschrittsbalken */}
      <div className="flex-1 ml-4">
        <div className="text-xs text-gray-500 mb-1">Risiko-Reduktion</div>
        <div className="w-full bg-gray-700 rounded-full h-3 relative overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(0, 100 - newScore)}%`,
              backgroundColor: RISK_CONFIG[newRisk].color,
            }}
          />
          {/* Marker für alten Score */}
          <div
            className="absolute top-0 h-full w-0.5 bg-white/50"
            style={{ left: `${100 - oldScore}%` }}
            title={`Vorheriger Score: ${oldScore}`}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>100 (kritisch)</span>
          <span>0 (konform)</span>
        </div>
      </div>
    </div>
  );
}

// ── Wort-basierter Textvergleich ──
function TextDiff({ oldText, newText }) {
  const oldWords = oldText.split(/(\s+)/);
  const newWords = newText.split(/(\s+)/);

  // Einfacher LCS-basierter Diff
  const diff = [];
  let i = 0, j = 0;

  while (i < oldWords.length || j < newWords.length) {
    if (i < oldWords.length && j < newWords.length && oldWords[i] === newWords[j]) {
      diff.push({ type: 'same', text: oldWords[i] });
      i++; j++;
    } else {
      let foundOld = -1, foundNew = -1;
      for (let k = 1; k <= 8; k++) {
        if (foundOld === -1 && i + k < oldWords.length && newWords[j] === oldWords[i + k]) foundOld = k;
        if (foundNew === -1 && j + k < newWords.length && oldWords[i] === newWords[j + k]) foundNew = k;
      }

      if (foundOld !== -1 && (foundNew === -1 || foundOld <= foundNew)) {
        for (let k = 0; k < foundOld; k++) diff.push({ type: 'removed', text: oldWords[i + k] });
        i += foundOld;
      } else if (foundNew !== -1) {
        for (let k = 0; k < foundNew; k++) diff.push({ type: 'added', text: newWords[j + k] });
        j += foundNew;
      } else {
        if (i < oldWords.length) { diff.push({ type: 'removed', text: oldWords[i] }); i++; }
        if (j < newWords.length) { diff.push({ type: 'added', text: newWords[j] }); j++; }
      }
    }
  }

  return (
    <div className="text-sm leading-relaxed">
      {diff.map((d, idx) => {
        if (d.type === 'same') return <span key={idx} className="text-[#4d6600]">{d.text}</span>;
        if (d.type === 'removed') return <span key={idx} className="bg-red-500/20 text-red-300 line-through px-0.5 rounded">{d.text}</span>;
        if (d.type === 'added') return <span key={idx} className="bg-green-500/20 text-green-300 px-0.5 rounded font-medium">{d.text}</span>;
        return null;
      })}
    </div>
  );
}

// ── Einzelne Versions-Karte in der Timeline ──
function VersionCard({ version, previousVersion, isLatest, isFirst }) {
  const [expanded, setExpanded] = useState(isLatest);

  const delta = previousVersion
    ? version.score - previousVersion.score
    : null;

  return (
    <div className="relative pl-8">
      {/* Timeline-Linie */}
      {!isFirst && (
        <div className="absolute left-[11px] top-0 w-0.5 h-6 bg-gray-700" />
      )}

      {/* Timeline-Punkt */}
      <div
        className="absolute left-0 top-6 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs"
        style={{
          borderColor: RISK_CONFIG[getRisk(version.score)].color,
          backgroundColor: isLatest ? RISK_CONFIG[getRisk(version.score)].color : 'transparent',
          color: isLatest ? '#8aab00' : RISK_CONFIG[getRisk(version.score)].color,
        }}
      >
        {isLatest ? '★' : (version.versionNumber || '')}
      </div>

      {/* Verbindungslinie nach unten */}
      {!isFirst && (
        <div className="absolute left-[11px] top-[32px] w-0.5 bg-gray-700" style={{ height: 'calc(100% - 32px)' }} />
      )}

      {/* Karte */}
      <div className={`border rounded-xl p-4 mb-4 transition-all cursor-pointer ${
        isLatest ? 'border-[#d4e157]/30 bg-gray-900/60' : 'border-gray-700/50 bg-gray-900/30'
      }`} onClick={() => setExpanded(!expanded)}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {isLatest && (
              <span className="text-[10px] bg-[#d4e157]/20 text-[#d4e157] px-2 py-0.5 rounded uppercase font-bold">
                Aktuell
              </span>
            )}
            <span className="text-[#3d4f38] text-xs">
              {version.date || version.analyzedAt || ''}
            </span>
            <span className="text-xs px-2 py-0.5 rounded" style={{
              backgroundColor: RISK_CONFIG[getRisk(version.score)].bg,
              color: RISK_CONFIG[getRisk(version.score)].color,
            }}>
              Score: {version.score}
            </span>
            {delta !== null && <DeltaBadge oldScore={previousVersion.score} newScore={version.score} size="small" />}
          </div>
          <span className="text-gray-500 text-xs">{expanded ? '▼' : '▶'}</span>
        </div>

        {/* Claim-Text (immer sichtbar) */}
        <p className="text-[#4d6600] text-sm mt-2 line-clamp-2">
          {version.text}
        </p>

        {/* Erweiterter Inhalt */}
        {expanded && (
          <div className="mt-4 space-y-3">
            {/* Textvergleich mit vorheriger Version */}
            {previousVersion && (
              <div>
                <h5 className="text-[#3d4f38] text-xs uppercase tracking-wider mb-2">Textänderungen</h5>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <TextDiff oldText={previousVersion.text} newText={version.text} />
                </div>
              </div>
            )}

            {/* Score-Vergleich */}
            {previousVersion && (
              <ScoreComparison oldScore={previousVersion.score} newScore={version.score} />
            )}

            {/* Analyse-Details */}
            {version.analysis && (
              <div>
                <h5 className="text-[#3d4f38] text-xs uppercase tracking-wider mb-1">Analyse</h5>
                <p className="text-[#3d4f38] text-xs">{version.analysis}</p>
              </div>
            )}

            {/* Änderungsgrund */}
            {version.changeReason && (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                <h5 className="text-blue-400 text-xs uppercase tracking-wider mb-1">Änderungsgrund</h5>
                <p className="text-[#4d6600] text-xs">{version.changeReason}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


// ============================================================
// HAUPTKOMPONENTE: Claim-Verlauf
// ============================================================
export default function ClaimHistory({ claimId, versions = [] }) {
  const sortedVersions = useMemo(() =>
    [...versions].sort((a, b) =>
      new Date(b.analyzedAt || b.date || 0) - new Date(a.analyzedAt || a.date || 0)
    ),
  [versions]);

  // Statistiken berechnen
  const stats = useMemo(() => {
    if (sortedVersions.length < 2) return null;

    const latest = sortedVersions[0];
    const first = sortedVersions[sortedVersions.length - 1];
    const totalDelta = latest.score - first.score;
    const iterationCount = sortedVersions.length;
    const avgImprovement = Math.round(totalDelta / (iterationCount - 1));

    return { totalDelta, iterationCount, avgImprovement, first, latest };
  }, [sortedVersions]);

  if (versions.length === 0) {
    return (
      <div className="bg-gray-900/30 border border-gray-800 border-dashed rounded-xl p-8 text-center">
        <p className="text-gray-500">Noch keine Versionshistorie verfügbar.</p>
        <p className="text-gray-600 text-sm mt-1">
          Sobald ein Claim überarbeitet und erneut geprüft wird, erscheint hier der Vergleich.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Zusammenfassung (nur bei mehreren Versionen) */}
      {stats && (
        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-5">
          <h3 className="text-[#d4e157] uppercase tracking-wider text-xs font-semibold mb-4">
            Verbesserungsverlauf
          </h3>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                <DeltaBadge oldScore={stats.first.score} newScore={stats.latest.score} size="large" />
              </div>
              <div className="text-xs text-[#3d4f38] mt-1 uppercase">Gesamt-Delta</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#4d6600]">{stats.iterationCount}</div>
              <div className="text-xs text-[#3d4f38] mt-1 uppercase">Iterationen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.avgImprovement}</div>
              <div className="text-xs text-[#3d4f38] mt-1 uppercase">Ø pro Iteration</div>
            </div>
          </div>

          {/* Gesamtvergleich */}
          <ScoreComparison oldScore={stats.first.score} newScore={stats.latest.score} />
        </div>
      )}

      {/* Versions-Timeline */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-5">
        <h3 className="text-[#4d6600] font-semibold text-sm uppercase tracking-wider mb-4">
          Versions-Timeline ({sortedVersions.length} Versionen)
        </h3>

        <div className="relative">
          {sortedVersions.map((version, i) => (
            <VersionCard
              key={version.id || i}
              version={{ ...version, versionNumber: sortedVersions.length - i }}
              previousVersion={i < sortedVersions.length - 1 ? sortedVersions[i + 1] : null}
              isLatest={i === 0}
              isFirst={i === sortedVersions.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}


// ============================================================
// EXPORT: Kompakte Delta-Anzeige für Dashboard / Übersichtslisten
// ============================================================
export function ClaimDeltaBadge({ claim }) {
  if (!claim.previousScore && claim.previousScore !== 0) return null;

  return (
    <DeltaBadge
      oldScore={claim.previousScore}
      newScore={claim.riskScore || claim.score || 0}
      size="small"
    />
  );
}
