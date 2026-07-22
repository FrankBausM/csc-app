"use client";

import { useState, useEffect } from "react";
import { analyzeClaim } from "../../lib/appContext";
import { Button } from "../../components/ui";
import { useAppContext } from "../AppContext";

interface Finding {
  text: string;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  riskScore: number;
  explanation: string;
  suggestedRewrite: string;
  startIndex: number;
  endIndex: number;
}

interface Statistics {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

const STORAGE_KEY_TEXT = "fullTextAnalyzer_inputText";
const STORAGE_KEY_FINDINGS = "fullTextAnalyzer_findings";
const STORAGE_KEY_STATS = "fullTextAnalyzer_statistics";

export default function FullTextAnalyzer() {
  const appContext = useAppContext();
  const [inputText, setInputText] = useState("");
  const [findings, setFindings] = useState<Finding[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [projectSaved, setProjectSaved] = useState(false);

  // Lade gespeicherte Daten beim Mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedText = localStorage.getItem(STORAGE_KEY_TEXT);
      const savedFindings = localStorage.getItem(STORAGE_KEY_FINDINGS);
      const savedStats = localStorage.getItem(STORAGE_KEY_STATS);
      
      if (savedText) setInputText(savedText);
      if (savedFindings) {
        try {
          setFindings(JSON.parse(savedFindings));
        } catch (e) {
          console.error("Fehler beim Laden der Findings:", e);
        }
      }
      if (savedStats) {
        try {
          setStatistics(JSON.parse(savedStats));
        } catch (e) {
          console.error("Fehler beim Laden der Statistik:", e);
        }
      }
    }
  }, []);

  // Speichere inputText bei jeder Änderung
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (inputText) {
        localStorage.setItem(STORAGE_KEY_TEXT, inputText);
      } else {
        localStorage.removeItem(STORAGE_KEY_TEXT);
      }
    }
  }, [inputText]);

  // Speichere findings und statistics bei jeder Änderung
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (findings.length > 0) {
        localStorage.setItem(STORAGE_KEY_FINDINGS, JSON.stringify(findings));
      } else {
        localStorage.removeItem(STORAGE_KEY_FINDINGS);
      }
    }
  }, [findings]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (statistics) {
        localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(statistics));
      } else {
        localStorage.removeItem(STORAGE_KEY_STATS);
      }
    }
  }, [statistics]);

  const analyzeFullText = () => {
    if (!inputText.trim()) {
      alert("Bitte geben Sie einen Text ein.");
      return;
    }

    setIsAnalyzing(true);
    setSelectedFinding(null);

    // Text in Sätze aufteilen
    const sentences = inputText
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15);

    const results: Finding[] = [];
    let currentIndex = 0;

    sentences.forEach((sentence) => {
      const analysis = analyzeClaim(sentence);
      
      // Finde Position im Original-Text
      const startIndex = inputText.indexOf(sentence, currentIndex);
      const endIndex = startIndex + sentence.length;
      currentIndex = endIndex;

      // Nur problematische Passagen speichern (ab MEDIUM aufwärts)
      if (analysis.riskScore >= 26) {
        results.push({
          text: sentence,
          riskLevel: analysis.riskLevel,
          riskScore: analysis.riskScore,
          explanation: analysis.explanation,
          suggestedRewrite: analysis.suggestedRewrite,
          startIndex,
          endIndex,
        });
      }
    });

    setFindings(results);
    
    const stats = {
      total: results.length,
      critical: results.filter((f) => f.riskLevel === "CRITICAL").length,
      high: results.filter((f) => f.riskLevel === "HIGH").length,
      medium: results.filter((f) => f.riskLevel === "MEDIUM").length,
      low: results.filter((f) => f.riskLevel === "LOW").length,
    };
    
    setStatistics(stats);
    setIsAnalyzing(false);
    
    // IMMER als Projekt speichern (auch wenn keine kritischen Findings)
    const firstLine = inputText.split(/\n/)[0].trim();
    const title = firstLine.length > 100 ? firstLine.substring(0, 100) + "..." : firstLine;

    // Claims für Projekt vorbereiten (mit textPosition für korrekte Sortierung)
    const claims = results.map((finding, index) => ({
      text: finding.text,
      riskLevel: finding.riskLevel,
      riskScore: finding.riskScore,
      explanation: finding.explanation,
      suggestedRewrite: finding.suggestedRewrite,
      source: "fulltext" as const,
      textPosition: index, // Position im Originaltext
    }));

    // Projekt automatisch speichern
    appContext.addFulltextProject(title, inputText, claims);
    setProjectSaved(true);
    
    console.log("✅ Volltext-Analyse abgeschlossen und als Projekt gespeichert:", title);
  };

  const saveAsProject = () => {
    if (!inputText || findings.length === 0) return;

    // Titel: Erste Zeile des Textes (max 100 Zeichen)
    const firstLine = inputText.split(/\n/)[0].trim();
    const title = firstLine.length > 100 ? firstLine.substring(0, 100) + "..." : firstLine;

    // Claims für Projekt vorbereiten (mit textPosition für korrekte Sortierung)
    const claims = findings.map((finding, index) => ({
      text: finding.text,
      riskLevel: finding.riskLevel,
      riskScore: finding.riskScore,
      explanation: finding.explanation,
      suggestedRewrite: finding.suggestedRewrite,
      source: "fulltext" as const,
      textPosition: index, // Position im Originaltext
    }));

    // Projekt speichern
    appContext.addFulltextProject(title, inputText, claims);
    setProjectSaved(true);
  };

  const getRiskColor = (level: string, opacity = 1) => {
    const colors = {
      CRITICAL: `rgba(255, 107, 107, ${opacity})`,
      HIGH: `rgba(217, 119, 6, ${opacity})`,
      MEDIUM: `rgba(255, 193, 7, ${opacity})`,
      LOW: `rgba(76, 175, 80, ${opacity})`,
    };
    return colors[level as keyof typeof colors] || `rgba(128, 128, 128, ${opacity})`;
  };

  const renderHighlightedText = () => {
    if (!inputText || findings.length === 0) {
      return <div style={{ color: "var(--text-secondary)", fontStyle: "italic", padding: "20px" }}>
        ✓ Keine problematischen Passagen gefunden.
      </div>;
    }

    // Text in Segmente aufteilen (markiert und nicht-markiert)
    const segments: Array<{ text: string; finding?: Finding; index?: number }> = [];
    let lastIndex = 0;

    findings.forEach((finding, idx) => {
      // Text vor dem Finding
      if (finding.startIndex > lastIndex) {
        segments.push({
          text: inputText.substring(lastIndex, finding.startIndex),
        });
      }

      // Das Finding selbst
      segments.push({
        text: finding.text,
        finding,
        index: idx,
      });

      lastIndex = finding.endIndex;
    });

    // Rest-Text nach dem letzten Finding
    if (lastIndex < inputText.length) {
      segments.push({
        text: inputText.substring(lastIndex),
      });
    }

    return (
      <div
        style={{
          fontSize: "15px",
          lineHeight: "1.8",
          color: "var(--text-primary)",
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
        }}
      >
        {segments.map((segment, idx) => {
          if (segment.finding) {
            const isHovered = hoveredIndex === segment.index;
            const isSelected = selectedFinding === segment.finding;
            
            return (
              <mark
                key={idx}
                onClick={() => setSelectedFinding(segment.finding!)}
                onMouseEnter={() => setHoveredIndex(segment.index!)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  backgroundColor: getRiskColor(segment.finding.riskLevel, isHovered || isSelected ? 0.4 : 0.25),
                  borderBottom: `2px solid ${getRiskColor(segment.finding.riskLevel, 1)}`,
                  cursor: "pointer",
                  padding: "2px 0",
                  borderRadius: "2px",
                  transition: "all 0.2s",
                  position: "relative",
                  fontWeight: isSelected ? 600 : 400,
                }}
                title={`${segment.finding.riskLevel} (Score: ${segment.finding.riskScore}) - Klicken für Details`}
              >
                {segment.text}
              </mark>
            );
          }
          return <span key={idx}>{segment.text}</span>;
        })}
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h3
          style={{
            color: "var(--color-accent)",
            fontSize: "13px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            fontWeight: 600,
            marginBottom: "8px",
          }}
        >
          📄 Volltext-Scanner
        </h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.6" }}>
          Fügen Sie einen längeren Text ein (z.B. Pressemitteilung, Website-Content, Produktbeschreibung).
          Problematische Passagen werden <mark style={{ backgroundColor: "transparent", padding: "2px 4px" }}>farblich markiert</mark> wie bei einer Rechtschreibprüfung.
        </p>
      </div>

      {/* Eingabebereich */}
      <div style={{ marginBottom: "24px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "8px",
            fontSize: "12px",
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Text zur Analyse
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Fügen Sie hier Ihren Text ein. Die Analyse identifiziert automatisch problematische Formulierungen nach EmpCo-Richtlinie..."
          style={{
            width: "100%",
            minHeight: "200px",
            padding: "16px",
            fontSize: "14px",
            lineHeight: "1.6",
            backgroundColor: "#ffffff",
            border: "1px solid var(--border-medium)",
            borderRadius: "var(--radius-sm)",
            color: "#4d6600",
            resize: "vertical",
            fontFamily: "inherit",
          }}
          disabled={isAnalyzing}
        />
        <div style={{ marginTop: "12px" }}>
          <Button
            onClick={analyzeFullText}
            disabled={isAnalyzing || !inputText.trim()}
            style={{
              backgroundColor: "var(--color-accent)",
              color: "#000",
              opacity: isAnalyzing || !inputText.trim() ? 0.5 : 1,
            }}
          >
            {isAnalyzing ? "Analysiere..." : "🔍 Text analysieren"}
          </Button>
          {projectSaved && (
            <span
              style={{
                marginLeft: "12px",
                color: "#4caf50",
                fontSize: "14px",
              }}
            >
              ✓ Automatisch als Projekt gespeichert
            </span>
          )}
          {inputText && (
            <Button
              onClick={() => {
                setInputText("");
                setFindings([]);
                setStatistics(null);
                setSelectedFinding(null);
                setProjectSaved(false);
                
                // Lösche auch localStorage
                if (typeof window !== "undefined") {
                  localStorage.removeItem(STORAGE_KEY_TEXT);
                  localStorage.removeItem(STORAGE_KEY_FINDINGS);
                  localStorage.removeItem(STORAGE_KEY_STATS);
                }
              }}
              style={{
                marginLeft: "12px",
                backgroundColor: "transparent",
                border: "1px solid var(--border-medium)",
                color: "var(--text-secondary)",
              }}
            >
              ✕ Zurücksetzen
            </Button>
          )}
        </div>
      </div>

      {/* Ergebnisse */}
      {statistics && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
          {/* Markierter Text */}
          <div>
            <div
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-medium)",
                borderRadius: "var(--radius-md)",
                padding: "24px",
                minHeight: "400px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                  paddingBottom: "16px",
                  borderBottom: "1px solid var(--border-medium)",
                }}
              >
                <h4 style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: 600 }}>
                  Analysierter Text
                </h4>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  {statistics.total === 0 ? (
                    <span style={{ color: "#4caf50" }}>✓ Keine Probleme gefunden</span>
                  ) : (
                    <span>
                      {statistics.total} {statistics.total === 1 ? "Problem" : "Probleme"} gefunden
                    </span>
                  )}
                </div>
              </div>
              {renderHighlightedText()}
            </div>

            {/* Legende */}
            {statistics.total > 0 && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "16px",
                  backgroundColor: "rgba(0,0,0,0.2)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "12px",
                  }}
                >
                  Farbcodierung
                </div>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  {[
                    { level: "CRITICAL", label: "Kritisch (76-100)" },
                    { level: "HIGH", label: "Hoch (51-75)" },
                    { level: "MEDIUM", label: "Mittel (26-50)" },
                  ].map((item) => (
                    <div key={item.level} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          width: "16px",
                          height: "16px",
                          backgroundColor: getRiskColor(item.level, 0.4),
                          border: `2px solid ${getRiskColor(item.level, 1)}`,
                          borderRadius: "3px",
                        }}
                      />
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Statistik & Details */}
          <div>
            {/* Statistik-Box */}
            <div
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-medium)",
                borderRadius: "var(--radius-md)",
                padding: "20px",
                marginBottom: "16px",
              }}
            >
              <h4
                style={{
                  color: "var(--color-accent)",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "16px",
                }}
              >
                Statistik
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { level: "CRITICAL", count: statistics.critical, label: "Kritisch" },
                  { level: "HIGH", count: statistics.high, label: "Hoch" },
                  { level: "MEDIUM", count: statistics.medium, label: "Mittel" },
                ].map((stat) => (
                  <div
                    key={stat.level}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      borderRadius: "4px",
                      backgroundColor: stat.count > 0 ? getRiskColor(stat.level, 0.1) : "transparent",
                    }}
                  >
                    <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>
                      {stat.label}
                    </span>
                    <span
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: stat.count > 0 ? getRiskColor(stat.level, 1) : "var(--text-tertiary)",
                      }}
                    >
                      {stat.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detail-Ansicht */}
            {selectedFinding && (
              <div
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  border: `2px solid ${getRiskColor(selectedFinding.riskLevel, 1)}`,
                  borderRadius: "var(--radius-md)",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "16px",
                  }}
                >
                  <h4
                    style={{
                      color: "var(--text-primary)",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Details
                  </h4>
                  <button
                    onClick={() => setSelectedFinding(null)}
                    style={{
                      color: "var(--text-secondary)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "16px",
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div
                  style={{
                    padding: "12px",
                    backgroundColor: getRiskColor(selectedFinding.riskLevel, 0.15),
                    borderRadius: "4px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: getRiskColor(selectedFinding.riskLevel, 1),
                      fontWeight: 700,
                      marginBottom: "8px",
                    }}
                  >
                    {selectedFinding.riskLevel} (Score: {selectedFinding.riskScore})
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: "1.5" }}>
                    "{selectedFinding.text}"
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "8px",
                    }}
                  >
                    Begründung
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--text-primary)",
                      lineHeight: "1.6",
                    }}
                  >
                    {selectedFinding.explanation}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "8px",
                    }}
                  >
                    ✨ Alternative Formulierung
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--color-accent)",
                      lineHeight: "1.6",
                      padding: "12px",
                      backgroundColor: "rgba(198,227,27,0.1)",
                      borderRadius: "4px",
                      border: "1px solid rgba(198,227,27,0.3)",
                    }}
                  >
                    {selectedFinding.suggestedRewrite}
                  </div>
                </div>
              </div>
            )}

            {!selectedFinding && statistics.total > 0 && (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "var(--text-tertiary)",
                  fontSize: "12px",
                  fontStyle: "italic",
                }}
              >
                Klicken Sie auf eine markierte Passage im Text, um Details anzuzeigen.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
