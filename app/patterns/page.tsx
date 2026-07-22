"use client";

import { useState } from "react";
import { SectionTitle, Button } from "../../components/ui";
import { SourceLink } from "../../components/SourceLink";
import CustomPatterns from "./CustomPatterns";

// Aktuelle Patterns aus der Analyse-Engine (Read-Only für MVP)
const CURRENT_PATTERNS = {
  absoluteWords: [
    "alle", "100%", "komplett", "vollständig", "immer", "niemals", "nie", 
    "keinerlei", "absolut", "garantiert", "total", "ganz", "durchweg", "fundamental"
  ],
  redFlags: [
    { pattern: "klimaneutral.*kompensation", risk: 85, type: "COMPENSATION", description: "Kompensation statt Reduktion" },
    { pattern: "100%.*nachhaltig", risk: 82, type: "ABSOLUTE", description: "Absolute Nachhaltigkeits-Aussage" },
    { pattern: "100%.*recycelt", risk: 75, type: "ABSOLUTE", description: "Absolute Recycling-Aussage" },
    { pattern: "CO₂.*kompensation", risk: 80, type: "COMPENSATION", description: "CO₂-Kompensations-Claim" },
    { pattern: "grün.*siegel|siegel.*grün", risk: 70, type: "DUBIOUS_SEAL", description: "Dubioser Siegel-Verweis" },
    { pattern: "umweltfreundlich\\b(?!.*zertifiziert|.*belegt|.*nachgewiesen)", risk: 72, type: "UNSUBSTANTIATED", description: "Unbe­legte Umweltfreundlichkeit" },
    { pattern: "weitere forschung.*nötig|noch nicht.*erforscht", risk: 65, type: "DELAY_TACTIC", description: "Verzögerungs­taktik" },
  ],
  greenwashPhrases: [
    { phrase: "nachhaltig", context: "without evidence", riskIncrease: 33 },
    { phrase: "grün", context: "without certification", riskIncrease: 30 },
    { phrase: "bio", context: "uncertified", riskIncrease: 35 },
    { phrase: "ökologisch", context: "unsubstantiated", riskIncrease: 32 },
    { phrase: "natürlich", context: "legally unprotected", riskIncrease: 27 },
    { phrase: "umweltfreundlich", context: "without proof", riskIncrease: 33 },
  ],
};

export default function PatternsPage() {
  const [selectedCategory, setSelectedCategory] = useState<"absolute" | "redFlags" | "phrases">("redFlags");

  return (
    <main>
      <section style={{ padding: "40px 0" }}>
        <SectionTitle 
          eyebrow="Pattern-Management" 
          title="Greenwashing-Erkennungs-Regeln" 
        />

        {/* Info-Banner */}
        <div className="panel" style={{ 
          marginBottom: 32,
          background: "rgba(198, 227, 27, 0.08)",
          border: "1px solid rgba(198, 227, 27, 0.3)"
        }}>
          <div style={{ fontSize: "13px", lineHeight: 1.8 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>
              📚 Pattern-Bibliothek (Read-Only)
            </div>
            <div style={{ marginBottom: 16, opacity: 0.9 }}>
              Diese Seite zeigt alle aktuellen Bewertungsregeln, die für die Greenwashing-Erkennung verwendet werden. 
              Die Patterns basieren auf:
              <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                <li><SourceLink sourceKey="EmpCo-Richtlinie">EmpCo-Richtlinie</SourceLink> (verbindlich ab Sept. 2026)</li>
                <li><SourceLink sourceKey="UWG">Deutsches UWG</SourceLink> (Unlauterer Wettbewerb)</li>
                <li>Forschung: <SourceLink sourceKey="Changing Markets Foundation">Changing Markets Foundation</SourceLink></li>
              </ul>
            </div>
            <div style={{ 
              padding: "12px", 
              background: "rgba(0,0,0,0.2)", 
              borderRadius: "6px",
              fontSize: "12px",
              marginTop: 12
            }}>
              💡 <strong>Zukünftige Funktion:</strong> Admin-Nutzer können hier neue Patterns hinzufügen, 
              basierend auf Feedback-Daten aus dem Reports-Bereich. Für MVP: Read-Only-Ansicht.
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div style={{ 
          display: "flex", 
          gap: 12, 
          marginBottom: 24,
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: 16
        }}>
          <button
            onClick={() => setSelectedCategory("redFlags")}
            style={{
              padding: "10px 20px",
              background: selectedCategory === "redFlags" ? "var(--color-accent)" : "transparent",
              color: selectedCategory === "redFlags" ? "#000" : "#fff",
              border: "2px solid var(--color-accent)",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            🚩 Red Flags ({CURRENT_PATTERNS.redFlags.length})
          </button>
          <button
            onClick={() => setSelectedCategory("absolute")}
            style={{
              padding: "10px 20px",
              background: selectedCategory === "absolute" ? "var(--color-accent)" : "transparent",
              color: selectedCategory === "absolute" ? "#000" : "#fff",
              border: "2px solid var(--color-accent)",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            ⚠️ Absolute Wörter ({CURRENT_PATTERNS.absoluteWords.length})
          </button>
          <button
            onClick={() => setSelectedCategory("phrases")}
            style={{
              padding: "10px 20px",
              background: selectedCategory === "phrases" ? "var(--color-accent)" : "transparent",
              color: selectedCategory === "phrases" ? "#000" : "#fff",
              border: "2px solid var(--color-accent)",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            📋 Greenwash-Phrasen ({CURRENT_PATTERNS.greenwashPhrases.length})
          </button>
        </div>

        {/* Red Flags */}
        {selectedCategory === "redFlags" && (
          <div className="panel">
            <div className="eyebrow" style={{ marginBottom: 8 }}>Kritische Patterns</div>
            <h3 style={{ marginTop: 8, fontSize: 18, marginBottom: 20 }}>
              Hochrisiko-Greenwashing-Muster
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {CURRENT_PATTERNS.redFlags.map((flag, idx) => (
                <div 
                  key={idx}
                  className="row"
                  style={{
                    padding: "16px",
                    background: "transparent",
                    border: "none",
                    borderRadius: "8px"
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
                      <span style={{ 
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "4px 8px",
                        background: "transparent",
                        borderRadius: "4px"
                      }}>
                        {flag.type}
                      </span>
                      <span style={{ fontSize: "13px", fontWeight: 600 }}>
                        Risk Score: +{flag.risk}
                      </span>
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 500, marginBottom: 8 }}>
                      {flag.description}
                    </div>
                    <div style={{ 
                      fontSize: "12px", 
                      fontFamily: "monospace",
                      background: "rgba(0,0,0,0.3)",
                      padding: "8px 12px",
                      borderRadius: "4px",
                      color: "var(--color-accent)"
                    }}>
                      Pattern: /{flag.pattern}/i
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Absolute Words */}
        {selectedCategory === "absolute" && (
          <div className="panel">
            <div className="eyebrow" style={{ marginBottom: 8 }}>Absolute Aussagen</div>
            <h3 style={{ marginTop: 8, fontSize: 18, marginBottom: 20 }}>
              Wörter die absolute Claims triggern
            </h3>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: 12
            }}>
              {CURRENT_PATTERNS.absoluteWords.map((word, idx) => (
                <div 
                  key={idx}
                  style={{
                    padding: "12px 16px",
                    background: "rgba(251, 192, 45, 0.1)",
                    border: "1px solid rgba(251, 192, 45, 0.3)",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: 500,
                    textAlign: "center"
                  }}
                >
                  "{word}"
                </div>
              ))}
            </div>
            <div style={{ 
              marginTop: 24,
              padding: "12px",
              background: "rgba(0,0,0,0.2)",
              borderRadius: "6px",
              fontSize: "12px",
              lineHeight: 1.6
            }}>
              ⚠️ <strong>Hinweis:</strong> Diese Wörter erhöhen den Risk Score signifikant, wenn sie ohne 
              qualifizierende Zusätze (z.B. "ca.", "bis zu", "X%") verwendet werden.
            </div>
          </div>
        )}

        {/* Greenwash Phrases */}
        {selectedCategory === "phrases" && (
          <div className="panel">
            <div className="eyebrow" style={{ marginBottom: 8 }}>Vage Begriffe</div>
            <h3 style={{ marginTop: 8, fontSize: 18, marginBottom: 20 }}>
              Greenwashing-anfällige Phrasen
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {CURRENT_PATTERNS.greenwashPhrases.map((phrase, idx) => (
                <div 
                  key={idx}
                  className="row"
                  style={{
                    padding: "16px",
                    background: "rgba(198, 227, 27, 0.05)",
                    border: "1px solid rgba(198, 227, 27, 0.2)",
                    borderRadius: "6px"
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ fontSize: "16px", fontWeight: 600 }}>
                        "{phrase.phrase}"
                      </div>
                      <span style={{ 
                        fontSize: "12px",
                        fontWeight: 600,
                        padding: "4px 10px",
                        background: "rgba(198, 227, 27, 0.2)",
                        borderRadius: "4px"
                      }}>
                        +{phrase.riskIncrease} Risk
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", opacity: 0.8 }}>
                      Kontext: {phrase.context}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Patterns Section */}
        <div style={{ marginTop: 48 }}>
          <CustomPatterns />
        </div>

        {/* Future Feature Placeholder */}
        <div className="panel" style={{ 
          marginTop: 32,
          background: "rgba(255,255,255,0.02)",
          border: "1px dashed rgba(255,255,255,0.2)"
        }}>
          <div style={{ textAlign: "center", padding: "32px" }}>
            <div style={{ fontSize: "40px", marginBottom: 16 }}>🔮</div>
            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: 12 }}>
              Zukünftige Features
            </h3>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.8, maxWidth: "600px", margin: "0 auto" }}>
              <ul style={{ textAlign: "left", margin: "16px 0", paddingLeft: "20px" }}>
                <li>➕ <strong>Neue Patterns hinzufügen</strong> basierend auf Feedback-Daten</li>
                <li>🔧 <strong>Pattern-Editor</strong> mit Regex-Validator</li>
                <li>📊 <strong>Pattern-Performance</strong> Dashboard (Precision/Recall)</li>
                <li>🤖 <strong>ML-basierte Pattern-Vorschläge</strong> aus Feedback-Korrekturen</li>
                <li>🌐 <strong>Multi-Language Support</strong> für internationale Claims</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
