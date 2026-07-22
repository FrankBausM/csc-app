"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button, SectionTitle, TextInput, Select } from "../../components/ui";
import { RiskBadge } from "../../components/HighlightedText";
import { ViolationDetails } from "../../components/ViolationDetails";
import { SourceLink, LinkedRegulatoryText } from "../../components/SourceLink";
import { useAppContext } from "../AppContext";
import { useEffect, useState } from "react";

export default function ClaimDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appContext = useAppContext();
  const claim = appContext.selectedClaim;
  const [showCorrectionPanel, setShowCorrectionPanel] = useState(false);
  const [correctedScore, setCorrectedScore] = useState(claim?.riskScore || 0);
  const [correctedLevel, setCorrectedLevel] = useState<"CRITICAL" | "HIGH" | "MEDIUM" | "LOW">(claim?.riskLevel || "MEDIUM");
  const [feedbackReason, setFeedbackReason] = useState("");
  
  // URL-Parameter für Zurück-Navigation (Scroll-Position)
  const fromClaimId = searchParams.get('from');
  
  const handleBackNavigation = () => {
    appContext.setSelectedClaim(null);
    if (fromClaimId) {
      // Speichere Scroll-Ziel in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('scrollToClaimId', fromClaimId);
      }
    }
    router.push("/");
  };

  useEffect(() => {
    // Wenn kein Claim ausgewählt wurde, zurück zur Übersicht
    if (!claim) {
      router.push("/");
    }
  }, [claim, router]);

  if (!claim) {
    return (
      <main>
        <section style={{ padding: "80px 0", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: 16 }}>🔍</div>
          <h2>Kein Claim ausgewählt</h2>
          <p style={{ color: "var(--text-muted)", marginTop: 12, marginBottom: 32 }}>
            Bitte wählen Sie einen Claim aus der Übersicht aus.
          </p>
          <Button onClick={() => router.push("/")}>
            Zur Übersicht
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section style={{ padding: "40px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <SectionTitle 
            eyebrow="Claim-Details" 
            title="Vollständige Analyse-Ergebnisse" 
          />
          <Button 
            variant="secondary" 
            onClick={handleBackNavigation}
          >
            ← Zurück zur Übersicht
          </Button>
        </div>

        {/* Haupt-Info Card */}
        <div className="panel" style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 24 }}>
            <RiskBadge level={claim.riskLevel} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.6, marginBottom: 8 }}>
                Claim-Text
              </div>
              <div style={{ fontSize: "18px", fontWeight: 500, lineHeight: 1.5, marginBottom: 12 }}>
                {claim.text}
              </div>
              <div style={{ display: "flex", gap: 24, fontSize: "12px", color: "var(--text-muted)" }}>
                <div>
                  <span style={{ opacity: 0.7 }}>Risk Score:</span>{" "}
                  <span style={{ fontWeight: 600, color: "var(--color-accent)" }}>{claim.riskScore}</span> / 100
                </div>
                <div>
                  <span style={{ opacity: 0.7 }}>Analysiert:</span>{" "}
                  {new Date(claim.timestamp).toLocaleString("de-DE")}
                </div>
                {claim.source && (
                  <div>
                    <span style={{ opacity: 0.7 }}>Quelle:</span>{" "}
                    {claim.source}
                  </div>
                )}
              </div>
            </div>
          </div>

          {claim.sourceUrl && (
            <div style={{ padding: "12px", background: "rgba(0,0,0,0.2)", borderRadius: "6px", marginBottom: 24 }}>
              <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.6, marginBottom: 6 }}>
                URL-Quelle
              </div>
              <a 
                href={claim.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: "var(--color-interactive)", 
                  fontSize: "13px",
                  wordBreak: "break-all"
                }}
              >
                {claim.sourceUrl}
              </a>
            </div>
          )}
        </div>

        {/* Risiko-Analyse */}
        <div className="panel" style={{ marginBottom: 32 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Risiko-Analyse</div>
          <h3 style={{ fontSize: "18px", fontWeight: 600, marginTop: 0, marginBottom: 20 }}>
            Erkannte Probleme & Bewertung
          </h3>
          <div style={{ 
            fontSize: "14px", 
            lineHeight: 1.8, 
            whiteSpace: "pre-wrap",
            padding: "16px",
            background: "rgba(0,0,0,0.2)",
            borderRadius: "6px",
            color: "rgba(255,255,255,0.75)",
            borderLeft: `4px solid ${
              claim.riskLevel === "CRITICAL" ? "#d32f2f" :
              claim.riskLevel === "HIGH" ? "#f57c00" :
              claim.riskLevel === "MEDIUM" ? "#fbc02d" :
              "#388e3c"
            }`
          }}>
            <LinkedRegulatoryText text={claim.explanation} />
          </div>

          {/* Unsicherheits-Markierungen */}
          {claim.uncertaintyFlags && claim.uncertaintyFlags.length > 0 && (
            <div style={{ 
              marginTop: 16, 
              padding: "12px 16px", 
              background: "rgba(251, 192, 45, 0.15)", 
              borderRadius: "6px",
              border: "1px solid rgba(251, 192, 45, 0.3)"
            }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#fbc02d", marginBottom: 8 }}>
                ⚠️ HINWEISE ZUR BEWERTUNG
              </div>
              {claim.uncertaintyFlags.map((flag, idx) => (
                <div key={idx} style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>
                  {flag}
                </div>
              ))}
            </div>
          )}

          {/* Debug-Info (nur Development-Mode) */}
          {claim.debugInfo && process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: 16, fontSize: "12px", opacity: 0.6 }}>
              <summary style={{ cursor: "pointer", marginBottom: 8 }}>
                🔍 Debug-Info (nur Dev-Mode)
              </summary>
              <div style={{ padding: "8px", background: "rgba(0,0,0,0.3)", borderRadius: "4px" }}>
                <div><strong>Erkannte Patterns:</strong> {claim.debugInfo.detectedPatterns.join(", ")}</div>
                <div><strong>EmpCo-Verstöße:</strong> {claim.debugInfo.empcoViolationsCount}</div>
                <div><strong>Andere Issues:</strong> {claim.debugInfo.otherIssuesCount}</div>
              </div>
            </details>
          )}

          {claim.violations && claim.violations.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <ViolationDetails violations={claim.violations} riskLevel={claim.riskLevel} />
            </div>
          )}
        </div>

        {/* Verbesserungsvorschläge */}
        <div className="panel" style={{ marginBottom: 32 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Empfohlene Umformulierungen</div>
          <h3 style={{ fontSize: "18px", fontWeight: 600, marginTop: 0, marginBottom: 20 }}>
            Alternative Formulierungen nach EmpCo-Richtlinie
          </h3>
          <div style={{ 
            fontSize: "14px", 
            lineHeight: 1.8, 
            whiteSpace: "pre-wrap",
            padding: "16px",
            background: "rgba(198, 227, 27, 0.08)",
            borderRadius: "6px",
            border: "1px solid rgba(198, 227, 27, 0.3)",
            color: "rgba(255,255,255,0.75)"
          }}>
            <LinkedRegulatoryText text={claim.suggestedRewrite} />
          </div>
          
          <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
            <Button 
              variant="primary"
              onClick={() => {
                navigator.clipboard.writeText(claim.suggestedRewrite);
                alert("Vorschläge in die Zwischenablage kopiert! 📋");
              }}
            >
              📋 Vorschläge kopieren
            </Button>
            <Button 
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(claim.text);
                alert("Original-Text in die Zwischenablage kopiert! 📋");
              }}
            >
              Original kopieren
            </Button>
          </div>
        </div>

        {/* Linked Claims / Erkannte Muster */}
        {claim.linkedClaims && claim.linkedClaims.length > 0 && (
          <div className="panel" style={{ marginBottom: 32 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Erkannte Greenwashing-Muster</div>
            <h3 style={{ fontSize: "18px", fontWeight: 600, marginTop: 0, marginBottom: 16 }}>
              Detektierte Probleme ({claim.linkedClaims.length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {claim.linkedClaims.map((issue, idx) => (
                <div 
                  key={idx}
                  style={{
                    padding: "12px 16px",
                    background: "transparent",
                    border: "1px solid transparent",
                    borderRadius: "6px",
                    fontSize: "13px",
                    lineHeight: 1.6
                  }}
                >
                  {issue}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manuelle Korrektur / Feedback */}
        <div className="panel" style={{ 
          marginBottom: 32,
          background: claim.isManuallyOverridden ? "rgba(198, 227, 27, 0.08)" : "rgba(255,255,255,0.03)",
          border: claim.isManuallyOverridden ? "2px solid rgba(198, 227, 27, 0.4)" : "1px solid rgba(255,255,255,0.1)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Bewertungs-Korrektur</div>
              <h3 style={{ fontSize: "18px", fontWeight: 600, marginTop: 0, marginBottom: 4 }}>
                {claim.isManuallyOverridden ? "✅ Manuelle Korrektur aktiv" : "⚠️ Bewertung korrigieren"}
              </h3>
              {claim.isManuallyOverridden && (
                <div style={{ fontSize: "12px", color: "var(--color-accent)", marginTop: 8 }}>
                  Korrigiert am: {claim.feedbackTimestamp ? new Date(claim.feedbackTimestamp).toLocaleString("de-DE") : "N/A"}
                </div>
              )}
            </div>
            {!showCorrectionPanel && (
              <Button 
                variant={claim.isManuallyOverridden ? "secondary" : "primary"}
                onClick={() => {
                  setShowCorrectionPanel(true);
                  setCorrectedScore(claim.riskScore);
                  setCorrectedLevel(claim.riskLevel);
                  setFeedbackReason(claim.feedbackReason || "");
                }}
              >
                {claim.isManuallyOverridden ? "🔧 Erneut bearbeiten" : "⚠️ Bewertung ist falsch"}
              </Button>
            )}
          </div>

          {claim.isManuallyOverridden && !showCorrectionPanel && (
            <div style={{ 
              padding: "16px", 
              background: "rgba(0,0,0,0.2)", 
              borderRadius: "6px",
              marginTop: 16
            }}>
              <div style={{ display: "flex", gap: 24, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: "11px", opacity: 0.6, marginBottom: 4 }}>Original-Bewertung</div>
                  <div style={{ fontSize: "14px", fontWeight: 600 }}>
                    Score: {claim.originalRiskScore} • {claim.originalRiskLevel}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", opacity: 0.6, marginBottom: 4 }}>Korrigierte Bewertung</div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-accent)" }}>
                    Score: {claim.userCorrectedScore} • {claim.userCorrectedLevel}
                  </div>
                </div>
              </div>
              {claim.feedbackReason && (
                <div style={{ marginTop: 12, fontSize: "13px" }}>
                  <div style={{ fontSize: "11px", opacity: 0.6, marginBottom: 4 }}>Begründung:</div>
                  <div style={{ fontStyle: "italic", opacity: 0.9 }}>
                    "{claim.feedbackReason}"
                  </div>
                </div>
              )}
            </div>
          )}

          {showCorrectionPanel && (
            <div style={{ 
              marginTop: 20,
              padding: "20px",
              background: "rgba(0,0,0,0.3)",
              borderRadius: "8px",
              border: "1px solid rgba(198, 227, 27, 0.3)"
            }}>
              <div style={{ fontSize: "13px", marginBottom: 20, lineHeight: 1.6, opacity: 0.9 }}>
                📝 <strong>Warum korrigieren?</strong><br />
                Die automatische Analyse kann in manchen Fällen ungenau sein. Ihre Korrekturen helfen uns, 
                die Bewertungsregeln zu verbessern und zukünftige Pattern zu erkennen.
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: 8 }}>
                    Korrigierter Risk Score (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={correctedScore}
                    onChange={(e) => setCorrectedScore(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "rgba(198, 227, 27, 0.15)",
                      border: "2px solid var(--color-accent)",
                      borderRadius: "6px",
                      color: "#fff",
                      fontSize: "14px"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: 8 }}>
                    Korrigiertes Risk Level
                  </label>
                  <select
                    value={correctedLevel}
                    onChange={(e) => setCorrectedLevel(e.target.value as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW")}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "rgba(198, 227, 27, 0.15)",
                      border: "2px solid var(--color-accent)",
                      borderRadius: "6px",
                      color: "#fff",
                      fontSize: "14px"
                    }}
                  >
                    <option value="LOW">LOW - Regelkonform</option>
                    <option value="MEDIUM">MEDIUM - Verbesserung empfohlen</option>
                    <option value="HIGH">HIGH - Präzisierung nötig</option>
                    <option value="CRITICAL">CRITICAL - Greenwashing-Risiko</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: 8 }}>
                  Begründung (warum ist die Original-Bewertung falsch?)
                </label>
                <textarea
                  value={feedbackReason}
                  onChange={(e) => setFeedbackReason(e.target.value)}
                  placeholder="z.B. 'Der Claim enthält zwar absolute Aussagen, ist aber durch ISO 14067 zertifiziert und sollte daher besser bewertet werden.'"
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "rgba(198, 227, 27, 0.15)",
                    border: "2px solid var(--color-accent)",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "14px",
                    lineHeight: 1.6,
                    resize: "vertical"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (!feedbackReason.trim()) {
                      alert("Bitte geben Sie eine Begründung für die Korrektur ein.");
                      return;
                    }
                    appContext.overrideClaimRisk(claim.id, correctedScore, correctedLevel, feedbackReason);
                    setShowCorrectionPanel(false);
                    alert("✅ Korrektur gespeichert! Die Bewertung wurde überschrieben.");
                  }}
                >
                  ✅ Korrektur speichern
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowCorrectionPanel(false);
                    setCorrectedScore(claim.riskScore);
                    setCorrectedLevel(claim.riskLevel);
                    setFeedbackReason(claim.feedbackReason || "");
                  }}
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Compliance Info */}
        <div className="panel" style={{ background: "rgba(198, 227, 27, 0.05)", border: "1px solid rgba(198, 227, 27, 0.2)" }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Compliance-Hinweise</div>
          <h3 style={{ fontSize: "18px", fontWeight: 600, marginTop: 0, marginBottom: 16 }}>
            Relevante Richtlinien
          </h3>
          <div style={{ fontSize: "13px", lineHeight: 1.8 }}>
            <div style={{ marginBottom: 12 }}>
              ⚖️ <strong><SourceLink sourceKey="EmpCo-Richtlinie">EmpCo-Richtlinie</SourceLink></strong> – Verbindlich ab 27. September 2026 (EmpCo) (Strafe bei Verstößen)
            </div>
            <div style={{ marginBottom: 12 }}>
              🇩🇪 <strong><SourceLink sourceKey="UWG">UWG (Unlauterer Wettbewerb)</SourceLink></strong> – Deutsche Gesetzgebung gegen Greenwashing
            </div>
            <div style={{ marginBottom: 12 }}>
              🇩🇪 <strong><SourceLink sourceKey="BGBl. 2026 I Nr. 43">BGBl. 2026 I Nr. 43</SourceLink></strong> – Deutsches Umsetzungsgesetz zur EmpCo-Richtlinie
            </div>
            
            <div style={{ marginTop: 24, marginBottom: 12, fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.7 }}>
              Anerkannte Zertifizierungen
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px", marginBottom: 20 }}>
              <div>• <SourceLink sourceKey="EU Ecolabel">EU Ecolabel</SourceLink></div>
              <div>• <SourceLink sourceKey="Blauer Engel">Blauer Engel</SourceLink></div>
              <div>• <SourceLink sourceKey="Science Based Targets">Science Based Targets</SourceLink></div>
              <div>• <SourceLink sourceKey="B Corp">B Corp</SourceLink></div>
              <div>• <SourceLink sourceKey="FSC">FSC</SourceLink></div>
              <div>• <SourceLink sourceKey="MSC">MSC</SourceLink></div>
              <div>• <SourceLink sourceKey="GOTS">GOTS</SourceLink></div>
              <div>• <SourceLink sourceKey="Cradle to Cradle">Cradle to Cradle</SourceLink></div>
            </div>
            
            <div style={{ marginTop: 24, marginBottom: 12, fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.7 }}>
              Relevante ISO-Standards
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" }}>
              <div>• <SourceLink sourceKey="EN ISO 14024">EN ISO 14024</SourceLink></div>
              <div>• <SourceLink sourceKey="ISO 14064">ISO 14064</SourceLink></div>
              <div>• <SourceLink sourceKey="ISO 14067">ISO 14067</SourceLink></div>
              <div>• <SourceLink sourceKey="ISO 14046">ISO 14046</SourceLink></div>
              <div>• <SourceLink sourceKey="ISO 14001">ISO 14001</SourceLink></div>
            </div>
            
            <div style={{ marginTop: 20, padding: "12px", background: "rgba(0,0,0,0.2)", borderRadius: "6px", fontSize: "12px", opacity: 0.8 }}>
              💡 <strong>Empfehlung:</strong> Alle Claims sollten durch unabhängige Zertifizierungen (<SourceLink sourceKey="ISO 14064">ISO 14064</SourceLink>, <SourceLink sourceKey="ISO 14067">ISO 14067</SourceLink>, <SourceLink sourceKey="Science Based Targets">Science Based Targets</SourceLink>) 
              oder messbare Daten belegt werden. Absolute Aussagen wie "100%" oder "klimaneutral" erfordern vollständige Transparenz 
              über Berechnungsmethoden und Baseline-Vergleiche.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
