'use client';

import { useState, useMemo } from 'react';

// Status-Definitionen
const STATUSES = {
  pending:    { label: 'Ausstehend', color: '#eab308', next: ['in_review'] },
  in_review:  { label: 'In Prüfung', color: '#3b82f6', next: ['changes_requested', 'approved', 'rejected'] },
  changes_requested: { label: 'Änderungen angefordert', color: '#f97316', next: ['in_review', 'approved', 'rejected'] },
  approved:   { label: 'Genehmigt', color: '#c6e31b', next: [] },
  rejected:   { label: 'Abgelehnt', color: '#ef4444', next: ['in_review'] },
};

const STATUS_ORDER = ['pending', 'in_review', 'changes_requested', 'approved', 'rejected'];

// Hilfsfunktion: Extrahiert ersten konkreten Vorschlag
function extractFirstSuggestion(suggestedRewrite) {
  if (!suggestedRewrite) return 'Keine konkrete Umformulierung verfügbar';
  
  const lines = suggestedRewrite.split('\n');
  const suggestion = [];
  let foundStart = false;
  
  for (const line of lines) {
    if (line.includes('📌')) {
      foundStart = true;
      continue;
    }
    if (foundStart) {
      if (line.includes('💡') || line.includes('📌') && suggestion.length > 0) {
        break;
      }
      if (line.trim()) {
        suggestion.push(line.trim());
      }
    }
  }
  
  return suggestion.join(' ').replace(/^["']|["']$/g, '') || 'Siehe empfohlene Umformulierung unten';
}

// Kommentar-Thread
function CommentThread({ comments, onAddComment }) {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    onAddComment(newComment.trim());
    setNewComment('');
  };

  return (
    <div>
      {comments.length > 0 && (
        <div className="space-y-2 mb-3">
          {comments.map(comment => (
            <div key={comment.id} className="bg-gray-800/50 rounded p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#3d4f38] text-xs font-semibold">{comment.author}</span>
                <span className="text-gray-500 text-xs">{comment.timestamp}</span>
              </div>
              <p className="text-[#4d6600] text-xs">{comment.text}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Kommentar hinzufügen..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-[#4d6600] text-sm focus:border-[#d4e157] focus:outline-none"
        />
        <button
          onClick={handleSubmit}
          disabled={!newComment.trim()}
          className="bg-gray-700 text-[#4d6600] px-3 py-2 rounded hover:bg-gray-600 disabled:opacity-30 text-sm"
        >
          Senden
        </button>
      </div>
    </div>
  );
}

// Review-Card - VEREINFACHTES LAYOUT
function ReviewCard({ review, onStatusChange, onAddComment }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [targetStatus, setTargetStatus] = useState(null);
  const [changeReason, setChangeReason] = useState('');
  const [revisedVersion, setRevisedVersion] = useState('');

  const originalClaim = review.claimText || review.text || '';
  const score = review.score || review.riskScore || 0;
  const status = STATUSES[review.status] || STATUSES.pending;
  const nextStatuses = status.next || [];

  // Risk Level
  const getRiskLevel = (score) => {
    if (score >= 75) return { label: 'CRITICAL', color: '#ef4444' };
    if (score >= 60) return { label: 'HIGH', color: '#f97316' };
    if (score >= 36) return { label: 'MEDIUM', color: '#eab308' };
    return { label: 'LOW', color: '#4caf50' };
  };
  const riskLevel = getRiskLevel(score);

  // Extrahiere zentrale Verstöße (max 3, ohne Emojis)
  const getCentralViolations = (analysis) => {
    if (!analysis) return [];
    const lines = analysis.split('\n');
    const violations = lines
      .filter(line => line.trim().startsWith('•'))
      .slice(0, 3)
      .map(line => line.replace(/^•\s*/, '').replace(/🚨\s*/g, '').replace(/⚠️\s*/g, '').replace(/📋\s*/g, ''));
    return violations.length > 0 ? violations : ['Siehe vollständige Analyse'];
  };
  const violations = getCentralViolations(review.analysis);

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden bg-[#8aab00]">
      {/* Header - Kompakt */}
      <div 
        className="p-6 cursor-pointer hover:bg-gray-800/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-6">
          {/* Links: Status + Claim */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-bold px-2 py-1 rounded" style={{
                backgroundColor: status.color + '30',
                color: status.color,
              }}>
                {status.label}
              </span>
              <span className="text-xs text-gray-500">
                Score: {score} | {riskLevel.label}
              </span>
            </div>
            
            {/* CLAIM - Fett und groß */}
            <p className="text-[#4d6600] font-bold text-xl leading-relaxed mb-4">
              "{originalClaim}"
            </p>
            
            {/* Zentrale Verstöße - Kompakt, keine Emojis */}
            <div className="text-sm text-[#4d6600] space-y-1">
              {violations.map((v, i) => (
                <div key={i}>• {v}</div>
              ))}
            </div>
          </div>

          {/* Rechts: Expand Icon */}
          <div className="text-2xl text-gray-500 transition-transform" style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}>
            ▼
          </div>
        </div>
      </div>

      {/* Erweiterte Details */}
      {isExpanded && (
        <div className="border-t border-gray-700 p-6 bg-[#0f1729] space-y-6">
          
          {/* Empfohlene Umformulierung - EINE Variante */}
          <div>
            <h5 className="text-[#3d4f38] text-sm font-bold mb-3">Empfohlene Umformulierung</h5>
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <p className="text-[#4d6600] text-base leading-relaxed">
                "{extractFirstSuggestion(review.suggestedRewrite)}"
              </p>
            </div>
          </div>

          {/* Optionale manuelle Überarbeitung */}
          <div>
            <label className="text-[#3d4f38] text-sm font-semibold mb-2 block">
              Eigene Überarbeitung (optional)
            </label>
            <textarea
              value={revisedVersion}
              onChange={e => setRevisedVersion(e.target.value)}
              placeholder="Falls Sie eine abweichende Formulierung bevorzugen..."
              className="w-full h-20 bg-gray-900 border border-gray-600 rounded-lg p-3 text-[#4d6600] text-sm focus:border-[#d4e157] focus:outline-none resize-y"
            />
          </div>

          {/* Freigabe-Aktionen */}
          {nextStatuses.length > 0 && (
            <div className="border-t border-gray-700 pt-6">
              <h5 className="text-[#3d4f38] text-sm font-bold mb-4">Freigabe-Entscheidung</h5>
              
              {!showActions ? (
                <div className="flex gap-3">
                  {nextStatuses.map(ns => (
                    <button
                      key={ns}
                      onClick={() => { setTargetStatus(ns); setShowActions(true); }}
                      className="px-6 py-3 rounded-lg text-base font-bold transition-all hover:opacity-80"
                      style={{
                        backgroundColor: STATUSES[ns].color,
                        color: '#fff',
                      }}
                    >
                      {STATUSES[ns].label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    value={changeReason}
                    onChange={e => setChangeReason(e.target.value)}
                    placeholder="Begründung (optional)..."
                    className="w-full h-24 bg-gray-900 border border-gray-600 rounded-lg p-3 text-[#4d6600] text-sm focus:border-[#d4e157] focus:outline-none"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        onStatusChange(review.id, targetStatus, changeReason);
                        setShowActions(false);
                        setTargetStatus(null);
                        setChangeReason('');
                      }}
                      className="px-6 py-3 rounded-lg text-base font-bold transition-all hover:opacity-80"
                      style={{
                        backgroundColor: STATUSES[targetStatus]?.color || '#4caf50',
                        color: '#fff',
                      }}
                    >
                      Bestätigen
                    </button>
                    <button
                      onClick={() => { setShowActions(false); setTargetStatus(null); setChangeReason(''); }}
                      className="px-6 py-3 border border-gray-600 text-[#4d6600] rounded-lg hover:bg-gray-700 text-base font-semibold"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vollständige Details - Ausklappbar */}
          <details className="border-t border-gray-700 pt-6">
            <summary className="cursor-pointer text-[#3d4f38] text-sm font-semibold hover:text-[#d4e157]">
              Vollständige Analyse & Details anzeigen
            </summary>
            <div className="mt-4 space-y-4">
              {/* Vollständige Analyse */}
              <div>
                <h6 className="text-[#3d4f38] text-xs uppercase mb-2">Vollständige Begründung</h6>
                <div className="bg-gray-800/50 rounded-lg p-4 text-[#4d6600] text-sm whitespace-pre-line">
                  {review.analysis}
                </div>
              </div>

              {/* Alle Umformulierungsvorschläge */}
              {review.suggestedRewrite && (
                <div>
                  <h6 className="text-[#3d4f38] text-xs uppercase mb-2">Alle Umformulierungsvorschläge</h6>
                  <div className="bg-gray-800/50 rounded-lg p-4 text-[#4d6600] text-sm whitespace-pre-line">
                    {review.suggestedRewrite}
                  </div>
                </div>
              )}

              {/* Kommentar-Thread */}
              <div>
                <h6 className="text-[#3d4f38] text-xs uppercase mb-2">Kommentare & Historie</h6>
                <CommentThread
                  comments={review.comments || []}
                  onAddComment={(text) => onAddComment(review.id, text)}
                />
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

// Status-Filter-Leiste
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

// HAUPTKOMPONENTE
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
      };

      return {
        ...r,
        status: newStatus,
        comments: [...r.comments, comment],
      };
    }));

    // Benachrichtigung
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Freigabe-Status geändert', {
        body: `Claim wurde auf "${STATUSES[newStatus]?.label}" gesetzt.`,
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
