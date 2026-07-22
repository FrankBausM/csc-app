"use client";

import { useState, useEffect } from "react";
import { SectionTitle, TextInput, Select, Button } from "../../components/ui";
import { analyzeClaim, extractClaimsFromText } from "../../lib/appContext";
import { RiskBadge } from "../../components/HighlightedText";
import { URLAnalyzer } from "../../components/URLAnalyzer";
import { LinkedRegulatoryText } from "../../components/SourceLink";
import { useAppContext } from "../AppContext";
import FullTextAnalyzer from "./FullTextAnalyzer";
import MultiAssetAnalyzer from "./MultiAssetAnalyzer";

export default function AssetReviewPage() {
  const appContext = useAppContext();
  const [inputMode, setInputMode] = useState<"manual" | "url" | "fulltext" | "batch">("fulltext");
  const [newClaimText, setNewClaimText] = useState("");
  const [claimType, setClaimType] = useState("CARBON_NEUTRALITY");
  const [submittedClaims, setSubmittedClaims] = useState<any[]>([]);

  // Wenn ein Claim aus der Überblick-Seite ausgewählt wurde, vorausfüllen
  useEffect(() => {
    if (appContext.selectedClaim) {
      setNewClaimText(appContext.selectedClaim.text);
    }
  }, [appContext.selectedClaim]);

  const handleSubmitClaim = () => {
    if (!newClaimText.trim()) {
      alert("Bitte geben Sie einen Claim-Text ein.");
      return;
    }

    try {
      // Verarbeite den Text - teile in Sätze auf oder nutze den ganzen Text
      let claimTexts: string[] = [];
      
      if (newClaimText.includes(".") && newClaimText.split(".").length > 2) {
        // Wenn mehrere Sätze vorhanden, extrahiere sie
        claimTexts = extractClaimsFromText(newClaimText);
      } else {
        // Sonst nutze den Text direkt
        claimTexts = [newClaimText.trim()];
      }

      // Fallback falls extractClaimsFromText nicht arbeitet oder leeres Array gibt
      if (claimTexts.length === 0) {
        claimTexts = [newClaimText.trim()];
      }

      const newClaims: any[] = claimTexts.map((text, i) => {
        // Übergebe claimType an Analyse-Funktion
        // WICHTIG: EmpCo-Verstöße werden IMMER als kritisch markiert, unabhängig vom Typ
        const analysis = analyzeClaim(text.trim(), claimType);
        
        return {
          id: `c${Date.now()}-${i}`,
          text: text.trim(),
          claimType: claimType,
          ...analysis,
        };
      });

      if (newClaims.length === 0) {
        alert("Kein analyzierbarer Text gefunden.");
        return;
      }

      // Als Projekt speichern
      const projectTitle = `Manuelle Eingabe: ${newClaimText.substring(0, 50)}${newClaimText.length > 50 ? '...' : ''}`;
      const claims = newClaims.map((claim, index) => ({
        text: claim.text,
        riskLevel: claim.riskLevel,
        riskScore: claim.riskScore,
        explanation: claim.explanation,
        suggestedRewrite: claim.suggestedRewrite,
        source: "manual" as const,
        textPosition: index,
      }));

      // Projekt erstellen
      appContext.addFulltextProject(projectTitle, newClaimText, claims);

      setSubmittedClaims([...submittedClaims, ...newClaims]);
      setNewClaimText("");
      console.log("✅ Manuelle Eingabe als Projekt gespeichert:", projectTitle);
    } catch (error) {
      console.error("Fehler bei handleSubmitClaim:", error);
      alert("Fehler bei der Verarbeitung: " + (error instanceof Error ? error.message : "Unbekannter Fehler"));
    }
  };

  return (
    <main>
      <section style={{ padding: "40px 0" }}>
        <SectionTitle eyebrow="Asset-Prüfung" title="Geben Sie Texte oder URLs zur Überprüfung ein" />

        {/* Input Tabs */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <button
            onClick={() => setInputMode("fulltext")}
            style={{
              padding: "12px 20px",
              borderRadius: "var(--radius-sm)",
              border: inputMode === "fulltext" ? "2px solid var(--color-accent)" : "1px solid var(--border-medium)",
              backgroundColor: inputMode === "fulltext" ? "rgba(198,227,27,0.1)" : "transparent",
              color: inputMode === "fulltext" ? "var(--color-accent)" : "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontWeight: 500,
              transition: "all 0.2s ease",
            }}
          >
            📄 Volltext-Scan
          </button>
          <button
            onClick={() => setInputMode("manual")}
            style={{
              padding: "12px 20px",
              borderRadius: "var(--radius-sm)",
              border: inputMode === "manual" ? "2px solid var(--color-accent)" : "1px solid var(--border-medium)",
              backgroundColor: inputMode === "manual" ? "rgba(198,227,27,0.1)" : "transparent",
              color: inputMode === "manual" ? "var(--color-accent)" : "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontWeight: 500,
              transition: "all 0.2s ease",
            }}
          >
            📝 Manuell eingeben
          </button>
          <button
            onClick={() => setInputMode("url")}
            style={{
              padding: "12px 20px",
              borderRadius: "var(--radius-sm)",
              border: inputMode === "url" ? "2px solid var(--color-accent)" : "1px solid var(--border-medium)",
              backgroundColor: inputMode === "url" ? "rgba(198,227,27,0.1)" : "transparent",
              color: inputMode === "url" ? "var(--color-accent)" : "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontWeight: 500,
              transition: "all 0.2s ease",
            }}
          >
            🔗 URL analysieren
          </button>
          <button
            onClick={() => setInputMode("batch")}
            style={{
              padding: "12px 20px",
              borderRadius: "var(--radius-sm)",
              border: inputMode === "batch" ? "2px solid var(--color-accent)" : "1px solid var(--border-medium)",
              backgroundColor: inputMode === "batch" ? "rgba(198,227,27,0.1)" : "transparent",
              color: inputMode === "batch" ? "var(--color-accent)" : "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontWeight: 500,
              transition: "all 0.2s ease",
            }}
          >
            📦 Multi-Asset
          </button>
        </div>

        {/* URL Mode */}
        {inputMode === "url" && (
          <div className="panel" style={{ marginBottom: 20 }}>
            <div className="eyebrow" style={{ marginBottom: 16 }}>Webseite automatisiert überprüfen</div>
            <URLAnalyzer />
          </div>
        )}

        {/* Volltext-Scan Mode */}
        {inputMode === "fulltext" && (
          <div className="panel" style={{ marginBottom: 20 }}>
            <FullTextAnalyzer />
          </div>
        )}

        {/* Multi-Asset Mode */}
        {inputMode === "batch" && (
          <div className="panel" style={{ marginBottom: 20 }}>
            <MultiAssetAnalyzer />
          </div>
        )}

        {/* Manual Mode */}
        {inputMode === "manual" && (
          <>
            {/* Input Form */}
            <div className="panel" style={{ marginBottom: 20 }}>
              <div className="eyebrow" style={{ marginBottom: 20 }}>Neue Claims überprüfen</div>

              <TextInput
                label="Zu überprüfender Text"
                placeholder='z.B. "Unsere Produkte sind 100% klimaneutral und vollständig umweltfreundlich." oder mehrere Sätze.'
                value={newClaimText}
                onChange={(e) => setNewClaimText(e.target.value)}
                multiline
              />

              <Select
                label="Claim-Typ"
                value={claimType}
                onChange={(e) => setClaimType(e.target.value)}
                options={[
                  { value: "CARBON_NEUTRALITY", label: "Kohlenstoffneutralität" },
                  { value: "COMPARATIVE_CLAIM", label: "Vergleichsaussage" },
                  { value: "ENVIRONMENTAL_CLAIM", label: "Umweltaussage" },
                  { value: "SOCIAL_CLAIM", label: "Sozialaussage" },
                  { value: "PERFORMANCE_CLAIM", label: "Leistungsaussage" },
                ]}
              />

              <Button onClick={handleSubmitClaim} variant="primary">
                Überprüfen
              </Button>
            </div>

            {/* Submitted Claims Results */}
            {submittedClaims.length > 0 && (
              <div className="panel">
                <div className="eyebrow" style={{ marginBottom: 16 }}>
                  ✓ Überprüfte Claims ({submittedClaims.length})
                </div>

                {submittedClaims.map((claim, i) => {
                  const isCritical = claim.riskLevel === "CRITICAL";
                  return (
                    <div
                      key={claim.id}
                      className="row"
                      style={{
                        borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)",
                        backgroundColor: isCritical ? "rgba(224,85,85,0.05)" : "transparent",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                          <RiskBadge level={claim.riskLevel} />
                          <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>Score: {claim.riskScore}</span>
                        </div>
                        <div className="row-title">{claim.text}</div>
                        <div className="row-meta" style={{ marginTop: 8, color: "rgba(255,255,255,0.75)" }}>
                          <LinkedRegulatoryText text={claim.explanation} />
                        </div>

                        {/* Unsicherheits-Markierungen */}
                        {claim.uncertaintyFlags && claim.uncertaintyFlags.length > 0 && (
                          <div style={{ 
                            marginTop: 12, 
                            padding: "10px 12px", 
                            background: "rgba(251, 192, 45, 0.15)", 
                            borderRadius: "6px",
                            border: "1px solid rgba(251, 192, 45, 0.3)"
                          }}>
                            <div style={{ fontSize: "11px", fontWeight: 600, color: "#fbc02d", marginBottom: 6 }}>
                              ⚠️ HINWEISE ZUR BEWERTUNG
                            </div>
                            {claim.uncertaintyFlags.map((flag: string, idx: number) => (
                              <div key={idx} style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", marginBottom: 4 }}>
                                {flag}
                              </div>
                            ))}
                          </div>
                        )}

                        <div
                          style={{
                            marginTop: 16,
                            padding: "12px",
                            backgroundColor: "rgba(198,227,27,0.08)",
                            borderRadius: "var(--radius-sm)",
                            borderLeft: "3px solid var(--color-accent)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "11px",
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                              color: "var(--color-accent)",
                              marginBottom: 8,
                              fontWeight: 600,
                            }}
                          >
                            ✨ Alternative Formulierungen
                          </div>
                          <div
                            style={{
                              color: "rgba(255,255,255,0.75)",
                              fontSize: "13px",
                              lineHeight: 1.7,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {claim.suggestedRewrite}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
                  <Button
                    onClick={() => {
                      setSubmittedClaims([]);
                      setNewClaimText("");
                    }}
                    variant="secondary"
                  >
                    Alle Überprüfungen löschen
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
