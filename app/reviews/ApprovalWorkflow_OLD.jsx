'use client';

import { useState, useMemo } from 'react';

// ============================================================
// FEATURE 6: ERWEITERTER FREIGABE-WORKFLOW
// Ausstehend → In Prüfung → Änderungen angefordert → Genehmigt / Abgelehnt
// Mit Kommentarfeld, Änderungshistorie und Benachrichtigungen
// ============================================================
// Datei: src/app/reviews/ApprovalWorkflow.jsx
// ERSETZT die bestehende Freigaben-Darstellung in:
//   src/app/reviews/page.jsx
// ============================================================

const STATUSES = {
  pending:    { label: 'Ausstehend',              color: '#eab308', bg: 'rgba(234,179,8,0.1)',   icon: '⏳', next: ['in_review'] },
  in_review:  { label: 'In Prüfung',              color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  icon: '🔍', next: ['changes_requested', 'approved', 'rejected'] },
  changes_requested: { label: 'Änderungen angefordert', color: '#f97316', bg: 'rgba(249,115,22,0.1)', icon: '✏️', next: ['in_review', 'approved', 'rejected'] },
  approved:   { label: 'Genehmigt',               color: '#c6e31b', bg: 'rgba(34,197,94,0.1)',   icon: '✅', next: [] },
  rejected:   { label: 'Abgelehnt',               color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   icon: '❌', next: ['in_review'] },
};

const STATUS_ORDER = ['pending', 'in_review', 'changes_requested', 'approved', 'rejected'];

// ============================================================
// Hilfsfunktion: Extrahiert ersten konkreten Vorschlag
// ============================================================
function extractFirstSuggestion(suggestedRewrite) {
  if (!suggestedRewrite) return 'Keine konkrete Umformulierung verfügbar';
  
  // Extrahiere nur den ersten Vorschlag (vor den allgemeinen Hinweisen)
  const lines = suggestedRewrite.split('\n');
  const suggestion = [];
  let foundStart = false;
  
  for (const line of lines) {
    if (line.includes('📌')) {
      foundStart = true;
      continue; // Überspringe die Überschrift selbst
    }
    if (foundStart) {
      if (line.includes('💡') || line.includes('📌') && suggestion.length > 0) {
        break; // Stop bei nächstem Vorschlag oder Hinweisen
      }
      if (line.trim()) {
        suggestion.push(line.trim());
      }
    }
  }
  
  return suggestion.join(' ').replace(/^["']|["']$/g, '') || 'Siehe empfohlene Umformulierung unten';
}

// ============================================================
// Status-Fortschrittsanzeige
// ============================================================
function StatusProgress({ currentStatus }) {
  const mainFlow = ['pending', 'in_review', 'approved'];
  const currentIndex = mainFlow.indexOf(currentStatus);
  const isSpecial = currentStatus === 'changes_requested' || currentStatus === 'rejected';

  return (
    <div className="flex items-center gap-1 mb-4">
      {mainFlow.map((status, i) => {
        const s = STATUSES[status];
        const isActive = status === currentStatus;
        const isPast = currentIndex > i;

        return (
          <div key={status} className="flex items-center">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isActive ? 'border-2' : isPast ? 'opacity-70' : 'opacity-30'
            }`} style={{
              borderColor: isActive ? s.color : 'transparent',
              backgroundColor: isActive || isPast ? s.bg : 'transparent',
              color: isActive || isPast ? s.color : '#666',
            }}>
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </div>
            {i < mainFlow.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 ${isPast ? 'bg-green-500' : 'bg-gray-700'}`} />
            )}
          </div>
        );
      })}
      {isSpecial && (
        <div className="flex items-center ml-2">
          <div className="w-4 h-0.5 bg-gray-600 mx-1" />
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2"
            style={{
              borderColor: STATUSES[currentStatus].color,
              backgroundColor: STATUSES[currentStatus].bg,
              color: STATUSES[currentStatus].color,
            }}>
            <span>{STATUSES[currentStatus].icon}</span>
            <span>{STATUSES[currentStatus].label}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Kommentar-Thread
// ============================================================
function CommentThread({ comments = [], onAddComment }) {
  const [newComment, setNewComment] = useState('');
  const [isExpanded, setIsExpanded] = useState(comments.length <= 3);

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    onAddComment(newComment.trim());
    setNewComment('');
  };

  const visibleComments = isExpanded ? comments : comments.slice(-3);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-[#3d4f38] text-xs uppercase tracking-wider">
          Kommentare ({comments.length})
        </h5>
        {comments.length > 3 && !isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="text-[#d4e157] text-xs hover:underline"
          >
            Alle {comments.length} anzeigen
          </button>
        )}
      </div>

      {/* Kommentar-Liste */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {visibleComments.map((comment, i) => (
          <div key={comment.id || i} className="flex gap-3 text-sm">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{
                backgroundColor: comment.statusChange ? STATUSES[comment.statusChange]?.bg : 'rgba(212,225,87,0.15)',
                color: comment.statusChange ? STATUSES[comment.statusChange]?.color : '#d4e157',
              }}>
              {comment.statusChange ? STATUSES[comment.statusChange]?.icon : comment.author?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[#4d6600] text-xs font-semibold">{comment.author || 'Reviewer'}</span>
                <span className="text-gray-500 text-xs">{comment.timestamp || ''}</span>
                {comment.statusChange && (
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{
                    backgroundColor: STATUSES[comment.statusChange]?.bg,
                    color: STATUSES[comment.statusChange]?.color,
                  }}>
                    → {STATUSES[comment.statusChange]?.label}
                  </span>
                )}
              </div>
              <p className="text-[#4d6600] text-xs mt-0.5 break-words">{comment.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Neuer Kommentar */}
      <div className="flex gap-2 mt-3">
        <input
          type="text"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Kommentar hinzufügen..."
          className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-[#4d6600] text-sm focus:border-[#d4e157] focus:outline-none"
        />
        <button
          onClick={handleSubmit}
          disabled={!newComment.trim()}
          className="bg-gray-700 text-[#4d6600] px-3 py-2 rounded-lg hover:bg-gray-600 disabled:opacity-30 text-sm"
        >
          Senden
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Einzelne Review-Karte mit Vorher-Nachher-Vergleich
// ============================================================
function ReviewCard({ review, onStatusChange, onAddComment }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [changeReason, setChangeReason] = useState('');
  const [targetStatus, setTargetStatus] = useState(null);
  const [revisedVersion, setRevisedVersion] = useState('');

  const status = STATUSES[review.status] || STATUSES.pending;
  const nextStatuses = status.next || [];
  const score = review.riskScore || review.score || 0;
  const originalClaim = review.text || review.claimText || '';

  const handleStatusChange = () => {
    if (!targetStatus) return;

    const requiresComment = targetStatus === 'changes_requested' || targetStatus === 'rejected';
    if (requiresComment && !changeReason.trim()) return;

    onStatusChange(review.id, targetStatus, changeReason.trim());
    setChangeReason('');
    setTargetStatus(null);
    setShowActions(false);
  };

  // Risk Level bestimmen
  const getRiskLevel = (score) => {
    if (score >= 75) return { label: 'CRITICAL', color: '#c62828', bg: 'transparent' };
    if (score >= 60) return { label: 'HIGH', color: '#d97706', bg: 'rgba(217,119,6,0.1)' };
    if (score >= 36) return { label: 'MEDIUM', color: '#ffc107', bg: 'rgba(255,193,7,0.1)' };
    return { label: 'LOW', color: '#4caf50', bg: 'rgba(76,175,80,0.1)' };
  };
  const riskLevel = getRiskLevel(score);

  return (
    <div className="border-2 rounded-2xl overflow-hidden transition-all shadow-lg" style={{
      borderColor: riskLevel.color + '40',
      backgroundColor: '#8aab00',
    }}>
      {/* Header - Kompakt, Immer sichtbar */}
      <div 
        className="p-5 cursor-pointer hover:bg-gray-800/20 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between gap-6">
          {/* Links: Status + Expand-Icon */}
          <div className="flex items-center gap-4">
            <span className="text-lg transition-transform" style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              color: '#d4e157',
            }}>
              ▼
            </span>
            
            <span className="text-sm font-bold px-3 py-1.5 rounded-lg" style={{
              backgroundColor: status.color + '20',
              color: status.color,
              border: `2px solid ${status.color}60`,
            }}>
              {status.icon} {status.label}
            </span>
          </div>

          {/* Mitte: Claim-Preview */}
          <div className="flex-1 min-w-0">
            <p className="text-[#4d6600] font-medium text-base truncate">
              {originalClaim}
            </p>
          </div>

          {/* Rechts: Score + Risk Level in EINER Zeile */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-5 py-2 rounded-lg" style={{
              backgroundColor: riskLevel.bg,
              border: `2px solid ${riskLevel.color}60`,
            }}>
              <div className="text-3xl font-bold" style={{ color: riskLevel.color }}>
                {score}
              </div>
              <div className="text-lg font-bold uppercase tracking-wide" style={{ color: riskLevel.color }}>
                {riskLevel.label}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Erweiterte Details - Ausklappbar */}
      {isExpanded && (
        <div className="border-t-4" style={{ borderColor: riskLevel.color + '40' }}>
          <div className="p-8 space-y-8" style={{ backgroundColor: '#0f1729' }}>
            
            {/* VORHER-NACHHER-VERGLEICH - Kernstück der Freigabe */}
            <div>
              <h5 className="text-[#d4e157] text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>🔄</span> VORHER-NACHHER-VERGLEICH
              </h5>
              
              <div className="grid grid-cols-2 gap-6">
                {/* VORHER - Original-Claim */}
                <div className="border-2 border-red-500/30 rounded-xl p-5 bg-red-900/10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-red-400 font-bold text-sm uppercase">❌ Original (Problematisch)</span>
                  </div>
                  <p className="text-[#4d6600] text-base leading-relaxed italic">
                    "{originalClaim}"
                  </p>
                  <div className="mt-4 pt-4 border-t border-red-500/20">
                    <p className="text-red-300 text-sm font-semibold mb-2">Zentrale Verstöße:</p>
                    <div className="text-red-200 text-sm leading-relaxed space-y-1">
                      {review.analysis?.split('\n').slice(2, 5).filter(line => line.trim().startsWith('•')).map((line, i) => (
                        <div key={i}>{line}</div>
                      )) || <div>Siehe vollständige Analyse unten</div>}
                    </div>
                  </div>
                </div>

                {/* NACHHER - Empfohlene Version (zur Freigabe) */}
                <div className="border-2 border-green-500/30 rounded-xl p-5 bg-green-900/10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-green-400 font-bold text-sm uppercase">✅ Empfohlene Umformulierung (zur Freigabe)</span>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[#4d6600] text-base leading-relaxed">
                      "{extractFirstSuggestion(review.suggestedRewrite)}"
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-green-500/20">
                    <p className="text-green-300 text-xs">
                      💡 Diese Version erfüllt die EmpCo-Richtlinie und kann freigegeben werden.
                    </p>
                  </div>
                </div>
              </div>

              {/* Optionale manuelle Überarbeitung */}
              <div className="mt-6 p-4 bg-gray-800/30 rounded-lg border border-gray-600">
                <label className="text-[#4d6600] text-sm font-semibold mb-2 block">
                  📝 Alternativ: Eigene Überarbeitung eingeben
                </label>
                <textarea
                  value={revisedVersion}
                  onChange={e => setRevisedVersion(e.target.value)}
                  placeholder="Falls Sie eine abweichende Formulierung bevorzugen, können Sie diese hier eingeben..."
                  className="w-full h-20 bg-gray-900 border border-gray-600 rounded-lg p-3 text-[#4d6600] text-sm focus:border-[#d4e157] focus:outline-none resize-y"
                />
              </div>
            </div>

            {/* Vollständige Begründung + Alle Umformulierungs-Vorschläge */}
            <div className="border-t border-gray-700 pt-6">
              <h5 className="text-[#3d4f38] text-xs uppercase tracking-wider mb-3">📋 Vollständige Analyse & Alle Vorschläge</h5>
              
              {/* Begründung */}
              <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                <p className="text-[#4d6600] text-sm leading-relaxed whitespace-pre-line">
                  {review.analysis}
                </p>
              </div>

              {/* Alle Umformulierungs-Optionen (für Referenz) */}
              {review.suggestedRewrite && (
                <details className="bg-gray-800/30 rounded-lg border border-gray-600">
                  <summary className="cursor-pointer p-4 text-[#d4e157] text-sm font-semibold hover:bg-gray-800/50">
                    📚 Alle Umformulierungs-Varianten anzeigen (Referenz)
                  </summary>
                  <div className="p-4 pt-0">
                    <p className="text-[#4d6600] text-sm leading-relaxed whitespace-pre-line">
                      {review.suggestedRewrite}
                    </p>
                  </div>
                </details>
              )}
            </div>

            {/* Status-Fortschritt */}
            <div className="border-t border-gray-700 pt-6">
              <h5 className="text-[#3d4f38] text-xs uppercase tracking-wider mb-3">Workflow-Status</h5>
              <StatusProgress currentStatus={review.status} />
            </div>

            {/* Freigabe-Aktionen */}
            {nextStatuses.length > 0 && (
              <div className="border-t-2 border-[#d4e157]/20 pt-6">
                <h5 className="text-[#d4e157] text-sm font-bold uppercase tracking-wider mb-4">
                  ⚡ FREIGABE-ENTSCHEIDUNG
                </h5>
                
                {!showActions ? (
                  <div className="flex gap-4 flex-wrap">
                    {nextStatuses.map(ns => (
                      <button
                        key={ns}
                        onClick={() => { setTargetStatus(ns); setShowActions(true); }}
                        className="px-6 py-3 rounded-xl text-base font-bold transition-all border-2 shadow-lg hover:shadow-xl"
                        style={{
                          borderColor: STATUSES[ns].color,
                          color: STATUSES[ns].color,
                          backgroundColor: STATUSES[ns].bg,
                        }}
                        onMouseEnter={e => {
                          e.target.style.backgroundColor = STATUSES[ns].color;
                          e.target.style.color = '#ffffff';
                        }}
                        onMouseLeave={e => {
                          e.target.style.backgroundColor = STATUSES[ns].bg;
                          e.target.style.color = STATUSES[ns].color;
                        }}
                      >
                        {STATUSES[ns].icon} {STATUSES[ns].label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-5 bg-gray-800/70 rounded-xl p-6 border-2" style={{
                    borderColor: STATUSES[targetStatus]?.color
                  }}>
                    <div className="flex items-center gap-3">
                      <span className="text-[#4d6600] text-base font-semibold">Gewählte Aktion:</span>
                      <span className="text-base font-bold px-4 py-2 rounded-lg" style={{
                        backgroundColor: STATUSES[targetStatus]?.bg,
                        color: STATUSES[targetStatus]?.color,
                        border: `2px solid ${STATUSES[targetStatus]?.color}`,
                      }}>
                        {STATUSES[targetStatus]?.icon} {STATUSES[targetStatus]?.label}
                      </span>
                    </div>

                    {/* Begründung (Pflicht bei Änderungen/Ablehnung) */}
                    {(targetStatus === 'changes_requested' || targetStatus === 'rejected') && (
                      <div>
                        <label className="text-[#4d6600] text-sm font-semibold block mb-2">
                          Begründung {targetStatus === 'changes_requested' ? '(Was muss geändert werden?)' : '(Warum wird abgelehnt?)'} *
                        </label>
                        <textarea
                          value={changeReason}
                          onChange={e => setChangeReason(e.target.value)}
                          placeholder={targetStatus === 'changes_requested'
                            ? 'z.B. "Bitte konkreten Prozentsatz der CO2-Reduktion ergänzen und Quelle angeben."'
                            : 'z.B. "Claim ist nicht belegbar und muss vollständig gestrichen werden."'}
                          className="w-full h-28 bg-gray-900 border-2 border-gray-600 rounded-lg p-4 text-[#4d6600] text-base focus:border-[#d4e157] focus:outline-none resize-y"
                        />
                      </div>
                    )}

                    {/* Optionaler Kommentar bei Genehmigung */}
                    {(targetStatus === 'approved' || targetStatus === 'in_review') && (
                      <div>
                        <label className="text-[#4d6600] text-sm font-semibold block mb-2">Kommentar (optional)</label>
                        <input
                          type="text"
                          value={changeReason}
                          onChange={e => setChangeReason(e.target.value)}
                          placeholder="Optionaler Kommentar zur Freigabe..."
                          className="w-full bg-gray-900 border-2 border-gray-600 rounded-lg px-4 py-3 text-[#4d6600] text-base focus:border-[#d4e157] focus:outline-none"
                        />
                      </div>
                    )}

                    <div className="flex gap-4 pt-2">
                      <button
                        onClick={handleStatusChange}
                        disabled={(targetStatus === 'changes_requested' || targetStatus === 'rejected') && !changeReason.trim()}
                        className="px-8 py-3 rounded-xl text-base font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
                        style={{
                          backgroundColor: STATUSES[targetStatus]?.color,
                          color: '#4d6600',
                        }}
                      >
                        ✓ Bestätigen
                      </button>
                      <button
                        onClick={() => { setShowActions(false); setTargetStatus(null); setChangeReason(''); }}
                        className="px-8 py-3 border-2 border-gray-500 text-[#4d6600] rounded-xl hover:bg-gray-700 text-base font-semibold"
                      >
                        ✕ Abbrechen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Kommentar-Thread / Historie */}
            <div className="border-t border-gray-700 pt-6">
              <CommentThread
                comments={review.comments || []}
                onAddComment={(text) => onAddComment(review.id, text)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Status-Filter-Leiste
// ============================================================
function StatusFilterBar({ counts, activeFilter, onFilter }) {
  return (
    <div className="flex gap-2 mb-6">
      <button
        onClick={() => onFilter('all')}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
          activeFilter === 'all'
            ? 'bg-[#d4e157] text-[#8aab00]'
            : 'bg-gray-800 text-[#4d6600] hover:bg-gray-700'
        }`}
      >
        Alle ({counts.all || 0})
      </button>
      {STATUS_ORDER.map(status => {
        const s = STATUSES[status];
        const count = counts[status] || 0;
        if (count === 0) return null;
        return (
          <button
            key={status}
            onClick={() => onFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeFilter === status
                ? 'text-[#4d6600]'
                : 'bg-gray-800 text-[#4d6600] hover:bg-gray-700'
            }`}
            style={activeFilter === status ? {
              backgroundColor: s.color,
            } : {}}
          >
            {s.label} ({count})
          </button>
        );
      })}
    </div>
  );
}


// ============================================================
// HAUPTKOMPONENTE
// ============================================================
export default function ApprovalWorkflow({ reviews: initialReviews = [] }) {
  const [reviews, setReviews] = useState(() =>
    initialReviews.map(r => ({
      ...r,
      status: r.status || 'pending',
      comments: r.comments || [],
    }))
  );
  const [filter, setFilter] = useState('all');

  // Status-Zähler
  const counts = useMemo(() => {
    const c = { all: reviews.length };
    reviews.forEach(r => { c[r.status] = (c[r.status] || 0) + 1; });
    return c;
  }, [reviews]);

  // Status ändern
  const handleStatusChange = (reviewId, newStatus, reason) => {
    setReviews(prev => prev.map(r => {
      if (r.id !== reviewId) return r;

      const comment = {
        id: `comment-${Date.now()}`,
        author: 'Reviewer',
        text: reason || `Status geändert zu "${STATUSES[newStatus]?.label}"`,
        timestamp: new Date().toLocaleString('de-DE'),
        statusChange: newStatus,
      };

      return {
        ...r,
        status: newStatus,
        comments: [...r.comments, comment],
        updatedAt: new Date().toISOString(),
      };
    }));

    // Benachrichtigung (Browser Notification API)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Freigabe-Status geändert', {
        body: `Claim wurde auf "${STATUSES[newStatus]?.label}" gesetzt.`,
        icon: '/favicon.ico',
      });
    }
  };

  // Kommentar hinzufügen
  const handleAddComment = (reviewId, text) => {
    setReviews(prev => prev.map(r => {
      if (r.id !== reviewId) return r;
      return {
        ...r,
        comments: [...r.comments, {
          id: `comment-${Date.now()}`,
          author: 'Reviewer',
          text,
          timestamp: new Date().toLocaleString('de-DE'),
        }],
      };
    }));
  };

  // Gefilterte Reviews
  const filtered = filter === 'all' ? reviews : reviews.filter(r => r.status === filter);

  return (
    <div className="space-y-6">
      {/* Filter */}
      <StatusFilterBar counts={counts} activeFilter={filter} onFilter={setFilter} />

      {/* Review-Liste */}
      <div className="space-y-6">
        {filtered.length > 0 ? (
          filtered.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              onStatusChange={handleStatusChange}
              onAddComment={handleAddComment}
            />
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Keine Reviews in dieser Kategorie.</p>
          </div>
        )}
      </div>
    </div>
  );
}
