"use client";

import { useState } from "react";
import { Button } from "../../components/ui";

interface Suggestion {
  text: string;
  label: string;
  reason: string;
}

interface DiffViewProps {
  originalText: string;
  suggestions: Suggestion[];
  onComplete?: (chosenText: string) => void;
}

export default function DiffView({ originalText, suggestions, onComplete }: DiffViewProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showDiff, setShowDiff] = useState(true);

  const currentSuggestion = suggestions[selectedIndex];

  // Einfacher Diff-Algorithmus: Wörter vergleichen
  const calculateDiff = (original: string, modified: string) => {
    const originalWords = original.split(/(\s+)/);
    const modifiedWords = modified.split(/(\s+)/);

    const diff: { type: "same" | "removed" | "added"; text: string }[] = [];
    
    let i = 0, j = 0;
    
    while (i < originalWords.length || j < modifiedWords.length) {
      if (i >= originalWords.length) {
        diff.push({ type: "added", text: modifiedWords[j] });
        j++;
      } else if (j >= modifiedWords.length) {
        diff.push({ type: "removed", text: originalWords[i] });
        i++;
      } else if (originalWords[i] === modifiedWords[j]) {
        diff.push({ type: "same", text: originalWords[i] });
        i++;
        j++;
      } else {
        // Suche nach dem nächsten übereinstimmenden Wort
        const nextMatchInOriginal = originalWords.slice(i + 1).findIndex(w => w === modifiedWords[j]);
        const nextMatchInModified = modifiedWords.slice(j + 1).findIndex(w => w === originalWords[i]);

        if (nextMatchInOriginal !== -1 && (nextMatchInModified === -1 || nextMatchInOriginal <= nextMatchInModified)) {
          diff.push({ type: "removed", text: originalWords[i] });
          i++;
        } else if (nextMatchInModified !== -1) {
          diff.push({ type: "added", text: modifiedWords[j] });
          j++;
        } else {
          diff.push({ type: "removed", text: originalWords[i] });
          diff.push({ type: "added", text: modifiedWords[j] });
          i++;
          j++;
        }
      }
    }

    return diff;
  };

  const diff = showDiff ? calculateDiff(originalText, currentSuggestion.text) : [];

  const handleAccept = () => {
    if (onComplete) {
      onComplete(currentSuggestion.text);
    }
  };

  const handleReject = () => {
    if (selectedIndex < suggestions.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    } else {
      // Alle Vorschläge abgelehnt - nutze Original
      if (onComplete) {
        onComplete(originalText);
      }
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h3
          style={{
            fontSize: "18px",
            fontWeight: 600,
            marginBottom: "8px",
            color: "var(--text-primary)",
          }}
        >
          ✏️ Alternative Formulierung vorgeschlagen
        </h3>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
          Vorschlag {selectedIndex + 1} von {suggestions.length}: {currentSuggestion.label}
        </p>
      </div>

      {/* Suggestion Navigation */}
      {suggestions.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "24px",
            padding: "12px",
            borderRadius: "var(--radius-sm)",
            backgroundColor: "var(--bg-secondary)",
          }}
        >
          {suggestions.map((sug, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                border: selectedIndex === index ? "2px solid var(--color-accent)" : "1px solid var(--border-medium)",
                backgroundColor: selectedIndex === index ? "rgba(198,227,27,0.1)" : "transparent",
                color: selectedIndex === index ? "var(--color-accent)" : "var(--text-secondary)",
                fontSize: "13px",
                fontWeight: selectedIndex === index ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {sug.label}
            </button>
          ))}
        </div>
      )}

      {/* Reason Box */}
      <div
        style={{
          padding: "16px",
          borderRadius: "var(--radius-sm)",
          backgroundColor: "rgba(198,227,27,0.1)",
          border: "1px solid var(--color-accent)",
          marginBottom: "24px",
        }}
      >
        <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--color-accent)" }}>
          💡 Warum dieser Vorschlag:
        </div>
        <div style={{ fontSize: "14px", lineHeight: "1.5", color: "var(--text-primary)" }}>
          {currentSuggestion.reason}
        </div>
      </div>

      {/* Toggle Diff/Clean View */}
      <div style={{ marginBottom: "12px" }}>
        <button
          onClick={() => setShowDiff(!showDiff)}
          style={{
            padding: "8px 16px",
            fontSize: "13px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-medium)",
            backgroundColor: "var(--bg-secondary)",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          {showDiff ? "👁️ Änderungen ausblenden" : "👁️ Änderungen anzeigen"}
        </button>
      </div>

      {/* Comparison View */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {/* Original */}
        <div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "8px",
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            ❌ Original (problematisch)
          </div>
          <div
            style={{
              padding: "16px",
              borderRadius: "var(--radius-sm)",
              border: "2px solid #c62828",
              backgroundColor: "transparent",
              minHeight: "120px",
              fontSize: "14px",
              lineHeight: "1.6",
              color: "var(--text-primary)",
            }}
          >
            {showDiff ? (
              <span>
                {diff.map((part, index) => {
                  if (part.type === "removed" || part.type === "same") {
                    return (
                      <span
                        key={index}
                        style={{
                          backgroundColor: part.type === "removed" ? "#c6e31b" : "transparent",
                          textDecoration: part.type === "removed" ? "line-through" : "none",
                        }}
                      >
                        {part.text}
                      </span>
                    );
                  }
                  return null;
                })}
              </span>
            ) : (
              originalText
            )}
          </div>
        </div>

        {/* Suggestion */}
        <div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "8px",
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            ✅ Vorschlag (EmpCo-konform)
          </div>
          <div
            style={{
              padding: "16px",
              borderRadius: "var(--radius-sm)",
              border: "2px solid #4caf50",
              backgroundColor: "rgba(76, 175, 80, 0.05)",
              minHeight: "120px",
              fontSize: "14px",
              lineHeight: "1.6",
              color: "var(--text-primary)",
            }}
          >
            {showDiff ? (
              <span>
                {diff.map((part, index) => {
                  if (part.type === "added" || part.type === "same") {
                    return (
                      <span
                        key={index}
                        style={{
                          backgroundColor: part.type === "added" ? "rgba(76, 175, 80, 0.3)" : "transparent",
                          fontWeight: part.type === "added" ? 600 : 400,
                        }}
                      >
                        {part.text}
                      </span>
                    );
                  }
                  return null;
                })}
              </span>
            ) : (
              currentSuggestion.text
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
        <Button
          onClick={handleReject}
          style={{
            backgroundColor: "transparent",
            border: "1px solid var(--border-medium)",
            color: "var(--text-secondary)",
          }}
        >
          ❌ {selectedIndex < suggestions.length - 1 ? "Nächster Vorschlag" : "Alle ablehnen"}
        </Button>
        <Button
          onClick={handleAccept}
          style={{
            backgroundColor: "var(--color-accent)",
            color: "#000",
          }}
        >
          ✅ Diesen Vorschlag übernehmen
        </Button>
      </div>
    </div>
  );
}
