"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MetricCard, SectionTitle, Button } from "../components/ui";
import { RiskBadge } from "../components/HighlightedText";
import { RiskDashboardCharts } from "../components/RiskDashboardCharts";
import { TrafficLight } from "../components/TrafficLight";
import { ViolationDetails } from "../components/ViolationDetails";
import { LinkedRegulatoryText } from "../components/SourceLink";
import { useAppContext } from "./AppContext";

type FilterType = "all" | "critical" | "high" | "medium" | "low";

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appContext = useAppContext();
  const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [selectedProjectFinding, setSelectedProjectFinding] = useState<{ projectId: string; claim: any } | null>(null);

  // Scroll zu Claim beim Zurückkommen von Detail-Seite
  useEffect(() => {
    // Prüfe localStorage für Scroll-Ziel
    if (typeof window === 'undefined') return;
    
    const scrollToClaimId = localStorage.getItem('scrollToClaimId');
    
    if (scrollToClaimId) {
      // Prüfe ob Claim in einem Projekt ist (defensive check für undefined)
      const claimInProject = appContext.analyzedClaims?.find(c => `claim-${c.id}` === scrollToClaimId);
      
      const projectIdToExpand = claimInProject?.projectId;
      if (projectIdToExpand) {
        // Klappe das Projekt auf
        setExpandedProjects(prev => {
          const newSet = new Set(prev);
          newSet.add(projectIdToExpand);
          return newSet;
        });
      }
      
      // Lösche localStorage-Item sofort
      localStorage.removeItem('scrollToClaimId');
      
      // Scroll zum Element mit mehreren Versuchen (falls DOM noch lädt)
      let attempts = 0;
      const maxAttempts = 10;
      
      const tryScroll = () => {
        attempts++;
        const element = document.getElementById(scrollToClaimId);
        
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          // Visuelles Highlight (kurz aufleuchten)
          element.style.transition = "background 0.3s ease";
          element.style.background = "rgba(198, 227, 27, 0.4)";
          setTimeout(() => {
            element.style.background = "";
          }, 2000);
        } else if (attempts < maxAttempts) {
          // Versuche es nochmal nach kurzem Delay
          setTimeout(tryScroll, 150);
        } else {
          console.warn('Element not found after', maxAttempts, 'attempts');
        }
      };
      
      // Starte erste Scroll-Versuch nach kurzem Delay
      setTimeout(tryScroll, 100);
    }
  }, []); // Leeres Array = nur beim Mount ausführen

  // Weitere Statistiken aus analysierten Claims
  const criticalClaims = appContext.getCriticalClaims();
  const highClaims = appContext.getHighRiskClaims();
  const mediumClaims = appContext.getMediumRiskClaims();
  const lowClaims = appContext.getLowRiskClaims();
  const totalClaims = appContext.analyzedClaims.length;
  const avgRiskScore = appContext.getTotalScore();
  const approvalRate = appContext.getApprovalRate();

  // Filter Claims basierend auf aktiver Filterung
  let filteredClaims = appContext.analyzedClaims;
  if (activeFilter === "critical") {
    filteredClaims = criticalClaims;
  } else if (activeFilter === "high") {
    filteredClaims = highClaims;
  } else if (activeFilter === "medium") {
    filteredClaims = mediumClaims;
  } else if (activeFilter === "low") {
    filteredClaims = lowClaims;
  }

  // Hilfsfunktion: Projekt aufklappen/zuklappen
  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  // Hilfsfunktion: Risiko-Farbe
  const getRiskColor = (level: string, opacity = 1) => {
    const colors = {
      CRITICAL: `rgba(255, 107, 107, ${opacity})`,
      HIGH: `rgba(217, 119, 6, ${opacity})`,
      MEDIUM: `rgba(255, 193, 7, ${opacity})`,
      LOW: `rgba(76, 175, 80, ${opacity})`,
    };
    return colors[level as keyof typeof colors] || `rgba(128, 128, 128, ${opacity})`;
  };

  // Hilfsfunktion: Volltext mit Markierungen rendern
  const renderProjectHighlightedText = (project: any, claims: any[]) => {
    if (!project.fullText || claims.length === 0) {
      return (
        <div style={{ color: "var(--text-secondary)", fontStyle: "italic", padding: "20px" }}>
          ✓ Keine problematischen Passagen gefunden.
        </div>
      );
    }

    // Finde die Positionen der Claims im Text
    const claimsWithPositions = claims.map(claim => {
      const index = project.fullText.indexOf(claim.text);
      return {
        ...claim,
        startIndex: index,
        endIndex: index + claim.text.length,
      };
    }).filter(c => c.startIndex >= 0)
      .sort((a, b) => a.startIndex - b.startIndex);

    // Text in Segmente aufteilen
    const segments: Array<{ text: string; claim?: any }> = [];
    let lastIndex = 0;

    claimsWithPositions.forEach(claim => {
      // Text vor dem Claim
      if (claim.startIndex > lastIndex) {
        segments.push({
          text: project.fullText.substring(lastIndex, claim.startIndex),
        });
      }

      // Der Claim selbst
      segments.push({
        text: claim.text,
        claim,
      });

      lastIndex = claim.endIndex;
    });

    // Rest-Text nach dem letzten Claim
    if (lastIndex < project.fullText.length) {
      segments.push({
        text: project.fullText.substring(lastIndex),
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
          padding: "20px",
          backgroundColor: "rgba(0,0,0,0.2)",
          borderRadius: "var(--radius-sm)",
        }}
      >
        {segments.map((segment, idx) => {
          if (segment.claim) {
            const isSelected = selectedProjectFinding?.projectId === project.id && 
                               selectedProjectFinding?.claim.id === segment.claim.id;

            return (
              <mark
                key={idx}
                id={`claim-${segment.claim.id}`}
                onClick={() => setSelectedProjectFinding({ projectId: project.id, claim: segment.claim })}
                style={{
                  backgroundColor: getRiskColor(segment.claim.riskLevel, isSelected ? 0.5 : 0.3),
                  borderBottom: `2px solid ${getRiskColor(segment.claim.riskLevel, 1)}`,
                  cursor: "pointer",
                  padding: "2px 0",
                  transition: "all 0.2s ease",
                  scrollMarginTop: "100px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = getRiskColor(segment.claim.riskLevel, 0.5);
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = getRiskColor(segment.claim.riskLevel, 0.3);
                  }
                }}
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
    <main>
      <section className="hero">
        <div className="eyebrow">Grüne Welle Kommunikation</div>
        <h1>Credible & Compliant Sustainability Communication</h1>
        <p className="lead">
          Die App für regelkonforme Nachhaltigkeits-Kommunikation nach CSRD, European Sustainability Standards (ESRS), EU-Taxonomie und EmpCo-Richtlinie (verbindlich ab 27.09.2026).
        </p>
        <p className="lead" style={{ marginTop: "8px" }}>
          Erkennung riskanter Claims, Evidenz-Management, Freigaben und Exporte — entwickelt für professionelle Kommunikation im Nachhaltigkeitssektor.
        </p>
        
        {/* Bedienungsanleitung */}
        <div 
          className="panel" 
          style={{ 
            padding: "16px 20px", 
            marginTop: 24,
            background: "rgba(100, 150, 255, 0.08)",
            border: "1px solid rgba(100, 150, 255, 0.3)"
          }}
        >
          <div 
            style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              cursor: "pointer"
            }}
            onClick={() => setShowGuide(!showGuide)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: "20px" }}>📘</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: 4 }}>
                  Erste Schritte – Bedienungsanleitung
                </div>
                <div style={{ fontSize: "12px", opacity: 0.7 }}>
                  6 Bereiche für professionelle Nachhaltigkeitskommunikation
                </div>
              </div>
            </div>
            <span style={{ fontSize: "20px", opacity: 0.5 }}>
              {showGuide ? "▼" : "▶"}
            </span>
          </div>
          
          {showGuide && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: "13px", lineHeight: 1.8 }}>
                
                {/* Überblick über alle 6 Bereiche */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
                  
                  {/* 1. Überblick/Dashboard */}
                  <div style={{ padding: "16px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", border: "1px solid rgba(100,150,255,0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: "24px" }}>📊</span>
                      <div style={{ fontWeight: 600, fontSize: "15px" }}>1. Überblick (Dashboard)</div>
                    </div>
                    <div style={{ fontSize: "12px", opacity: 0.85, lineHeight: 1.7 }}>
                      <strong>Zweck:</strong> Zentrale Übersicht aller analysierten Claims mit Risikobewertung
                      <br /><br />
                      <strong>Funktionen:</strong>
                      <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                        <li>Filterbare Claim-Liste (Critical/High/Medium/Low)</li>
                        <li>Visualisierte Kennzahlen & Charts</li>
                        <li>Traffic Light Status für compliance</li>
                        <li>Direkter Zugriff auf Claim-Details</li>
                      </ul>
                      <strong>Für:</strong> Management, Compliance-Verantwortliche
                    </div>
                  </div>
                  
                  {/* 2. Asset-Prüfung */}
                  <div style={{ padding: "16px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", border: "1px solid rgba(100,150,255,0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: "24px" }}>🔍</span>
                      <div style={{ fontWeight: 600, fontSize: "15px" }}>2. Asset-Prüfung</div>
                    </div>
                    <div style={{ fontSize: "12px", opacity: 0.85, lineHeight: 1.7 }}>
                      <strong>Zweck:</strong> Claims & Texte auf Greenwashing-Risiken testen
                      <br /><br />
                      <strong>3 Analyse-Modi:</strong>
                      <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                        <li><strong>Einzelanalyse:</strong> Manuellen Text oder einzelne URL analysieren</li>
                        <li><strong>Multi-Asset:</strong> Mehrere URLs gleichzeitig vergleichen (z.B. Wettbewerber)</li>
                        <li><strong>Volltext:</strong> Komplette Website mit In-Context-Highlighting</li>
                      </ul>
                      <strong>Features:</strong>
                      <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                        <li>Diff-View: Side-by-Side-Vergleich von Alternativen</li>
                        <li>Automatische Claim-Extraktion aus HTML</li>
                        <li>Risk Score (0-100) mit EmpCo-Compliance-Check</li>
                      </ul>
                      <strong>Für:</strong> Marketing-Teams, Texter, Content-Manager, Competitive Intelligence
                    </div>
                  </div>
                  
                  {/* 3. Projekte */}
                  <div style={{ padding: "16px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", border: "1px solid rgba(100,150,255,0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: "24px" }}>📁</span>
                      <div style={{ fontWeight: 600, fontSize: "15px" }}>3. Projekte</div>
                    </div>
                    <div style={{ fontSize: "12px", opacity: 0.85, lineHeight: 1.7 }}>
                      <strong>Zweck:</strong> Claims nach Kampagnen/Projekten organisieren
                      <br /><br />
                      <strong>Funktionen:</strong>
                      <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                        <li>Automatische Gruppierung nach URL-Quelle</li>
                        <li>Projekt-Risikobewertung (höchster Claim-Score)</li>
                        <li>Übersicht über Status & Anzahl</li>
                      </ul>
                      <strong>Für:</strong> Projektmanager, Kampagnen-Verantwortliche
                    </div>
                  </div>
                  
                  {/* 4. Reviews */}
                  <div style={{ padding: "16px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", border: "1px solid rgba(100,150,255,0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: "24px" }}>✅</span>
                      <div style={{ fontWeight: 600, fontSize: "15px" }}>4. Reviews <span style={{ fontSize: "10px", background: "rgba(198,227,27,0.2)", padding: "2px 6px", borderRadius: "4px", marginLeft: 6 }}>NEU</span></div>
                    </div>
                    <div style={{ fontSize: "12px", opacity: 0.85, lineHeight: 1.7 }}>
                      <strong>Zweck:</strong> Erweiterter Freigabe-Workflow für kritische Claims
                      <br /><br />
                      <strong>Neue Funktionen:</strong>
                      <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                        <li><strong>5-stufiger Workflow:</strong> Pending → In Review → Changes Requested → Approved/Rejected</li>
                        <li><strong>Kommentar-Threads:</strong> Diskussion zu jedem Review mit Zeitstempel</li>
                        <li><strong>Browser-Benachrichtigungen:</strong> Automatische Alerts bei Status-Änderungen</li>
                        <li><strong>Status-Filter:</strong> Schnellfilterung nach Bearbeitungsstand</li>
                        <li>Automatische Review-Queue (Critical & High Risk)</li>
                      </ul>
                      <strong>Für:</strong> Compliance-Teams, Rechtsabteilungen, Senior Management
                    </div>
                  </div>
                  
                  {/* 5. Reports */}
                  <div style={{ padding: "16px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", border: "1px solid rgba(100,150,255,0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: "24px" }}>📑</span>
                      <div style={{ fontWeight: 600, fontSize: "15px" }}>5. Reports <span style={{ fontSize: "10px", background: "rgba(198,227,27,0.2)", padding: "2px 6px", borderRadius: "4px", marginLeft: 6 }}>NEU</span></div>
                    </div>
                    <div style={{ fontSize: "12px", opacity: 0.85, lineHeight: 1.7 }}>
                      <strong>Zweck:</strong> Professionelle Dokumentation & Export für Audits
                      <br /><br />
                      <strong>Neue Export-Formate:</strong>
                      <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                        <li><strong>PDF-Reports:</strong> Professionelle Audit-Berichte mit Cover-Page, Risk-Summary, Claim-Details und Quellen</li>
                        <li><strong>Word-Dokumente:</strong> Editierbare Alternative-Formulierungen als Tabellen oder Listen</li>
                        <li><strong>CSV-Export:</strong> Vollständige Daten mit Zeitstempeln & Risikobewertungen</li>
                      </ul>
                      <strong>Konfigurierbar:</strong> Detailgrad (Vollständig/Zusammenfassung/Nur Kritische), Format-Präferenzen
                      <br /><br />
                      <strong>Für:</strong> Audits, Stakeholder-Reports, Management-Präsentationen
                    </div>
                  </div>
                  
                  {/* 6. Evidenz-Hub */}
                  <div style={{ padding: "16px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", border: "1px solid rgba(100,150,255,0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: "24px" }}>📋</span>
                      <div style={{ fontWeight: 600, fontSize: "15px" }}>6. Evidenz-Hub</div>
                    </div>
                    <div style={{ fontSize: "12px", opacity: 0.85, lineHeight: 1.7 }}>
                      <strong>Zweck:</strong> Nachweise & Zertifikate für Claims verwalten
                      <br /><br />
                      <strong>Funktionen:</strong>
                      <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                        <li>Automatische Anzeige von Claims, die Belege benötigen</li>
                        <li>Upload von ISO-Zertifikaten, Audits, Studien</li>
                        <li>Tracking fehlender vs. vorhandener Nachweise</li>
                      </ul>
                      <strong>Für:</strong> Nachhaltigkeits-Manager, CSR-Teams, Compliance
                    </div>
                  </div>
                  
                </div>
                
                {/* Quick Start Guide */}
                <div style={{ 
                  marginTop: 24, 
                  padding: "16px", 
                  background: "rgba(198, 227, 27, 0.1)", 
                  borderRadius: "8px",
                  border: "1px solid rgba(198, 227, 27, 0.3)"
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 12, fontSize: "14px" }}>
                    🚀 Quick Start – So starten Sie:
                  </div>
                  <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "12px", lineHeight: 1.8 }}>
                    <li>
                      <strong>Asset-Prüfung aufrufen</strong> → Navigation oben links
                    </li>
                    <li>
                      <strong>Analyse-Modus wählen</strong> → Einzelanalyse (Text/URL), Multi-Asset (Vergleich) oder Volltext (komplette Website)
                    </li>
                    <li>
                      <strong>Claim/URL eingeben</strong> → z.B. "100% klimaneutral durch Kompensation" oder Website-Link
                    </li>
                    <li>
                      <strong>"Analyse starten" klicken</strong> → Automatische Greenwashing-Erkennung mit EmpCo-Check
                    </li>
                    <li>
                      <strong>Ergebnis prüfen</strong> → Risk Score + detaillierte Probleme + Verbesserungsvorschläge
                    </li>
                    <li>
                      <strong>Zurück zum Dashboard</strong> → Alle analysierten Claims sehen, filtern
                    </li>
                    <li>
                      <strong>✨ NEU: Reports aufrufen</strong> → PDF/Word-Export für professionelle Dokumentation
                    </li>
                    <li>
                      <strong>✨ NEU: Reviews nutzen</strong> → Freigabe-Workflow mit Kommentaren & Benachrichtigungen
                    </li>
                  </ol>
                </div>
                
                {/* Compliance-Hinweis */}
                <div style={{ 
                  marginTop: 16, 
                  padding: "12px", 
                  background: "transparent", 
                  borderRadius: "6px",
                  border: "1px solid transparent",
                  fontSize: "11px",
                  lineHeight: 1.6
                }}>
                  ⚖️ <strong>Rechtlicher Hinweis:</strong> Diese App basiert auf der 
                  EmpCo-Richtlinie (verbindlich ab 27.09.2026 — bereits in deutsches Recht umgesetzt) und deutschem UWG. 53-56% aller 
                  Nachhaltigkeits-Claims enthalten irreführende Aussagen – diese App hilft Ihnen, 
                  rechtssichere Kommunikation zu gewährleisten.
                </div>
                
                {/* Risk Score Berechnung - Detaillierte Erklärung */}
                <div style={{ 
                  marginTop: 16, 
                  padding: "16px", 
                  background: "rgba(100,150,255,0.08)", 
                  borderRadius: "8px",
                  border: "1px solid rgba(100,150,255,0.2)",
                  fontSize: "12px",
                  lineHeight: 1.7
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 12, fontSize: "13px", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "18px" }}>📊</span>
                    So wird der Risk Score (0-100) berechnet:
                  </div>
                  
                  <div style={{ marginBottom: 12 }}>
                    <strong>1. Start bei 0 Punkten (perfekter Claim):</strong><br/>
                    Jeder Claim beginnt mit 0 Punkten. Der Score erhöht sich nur, wenn konkrete Greenwashing-Risiken oder EmpCo-Verstöße erkannt werden. Ein sauberer, gut belegter Claim bleibt bei 0 Punkten.
                  </div>
                  
                  <div style={{ marginBottom: 12 }}>
                    <strong>2. Risiko-Faktoren erhöhen den Score:</strong><br/>
                    Die App durchsucht den Text nach verschiedenen Greenwashing-Mustern. Jedes gefundene Problem setzt den Score auf einen spezifischen Wert:
                    <ul style={{ margin: "6px 0", paddingLeft: "20px", fontSize: "11px" }}>
                      <li><strong>Schwerste EmpCo-Verstöße (85-94 Punkte):</strong> Zero-Impact-Claims (94), "klimaneutral durch Kompensation" (92), "100% nachhaltige Lieferkette" (92), unbelegte Umweltaussagen (88), erfundene Siegel (85)</li>
                      <li><strong>Schwere Verstöße (75-84 Punkte):</strong> Absolute Aussagen ohne Beleg (75-85), Superlative ohne Verifizierung (75-94), gesetzliche Pflichten als Besonderheit (78)</li>
                      <li><strong>Moderate Risiken (60-74 Punkte):</strong> Vage Aussagen ohne Belege (72), Leuchtturm-Produkte (70), Verzögerungstaktiken (65), grüne Bildsprache ohne Substanz (60)</li>
                      <li><strong>Geringe Hinweise (36-59 Punkte):</strong> Teilweise qualifizierte Aussagen (48), Custom Patterns (individuell)</li>
                    </ul>
                  </div>
                  
                  <div style={{ marginBottom: 12 }}>
                    <strong>3. Finaler Score = Höchster gefundener Wert:</strong><br/>
                    Wenn mehrere Probleme erkannt werden, zählt der <em>höchste</em> Score (keine Addition!). Beispiel: Ein Claim mit "klimaneutral durch Kompensation" (92 Punkte) + "100% nachhaltig" (86 Punkte) erhält 92 Punkte als finalen Score.
                  </div>
                  
                  <div style={{ marginBottom: 12 }}>
                    <strong>4. Risk Level basiert auf finalem Score:</strong>
                    <ul style={{ margin: "6px 0", paddingLeft: "20px", fontSize: "11px" }}>
                      <li><strong style={{ color: "#c62828" }}>CRITICAL (75-100 Punkte):</strong> Schwere EmpCo-Verstöße, rechtlich problematisch ab Sept. 2026</li>
                      <li><strong style={{ color: "#d97706" }}>HIGH (60-74 Punkte):</strong> Hohes Greenwashing-Risiko, Anpassung dringend empfohlen</li>
                      <li><strong style={{ color: "#ffc107" }}>MEDIUM (36-59 Punkte):</strong> Mittleres Risiko, Präzisierung empfohlen</li>
                      <li><strong style={{ color: "#4caf50" }}>LOW (0-35 Punkte):</strong> Kein oder geringes Risiko, EmpCo-konform</li>
                    </ul>
                  </div>
                  
                  <div style={{ 
                    padding: "10px", 
                    background: "rgba(198,227,27,0.1)", 
                    borderRadius: "4px",
                    border: "1px solid rgba(198,227,27,0.3)",
                    fontSize: "11px"
                  }}>
                    <strong>💡 Beispiel:</strong> Der Claim "Wir sind 100% klimaneutral dank Kompensation" erhält:<br/>
                    • Start: 0 Punkte<br/>
                    • "Klimaneutral + Kompensation ohne Vermeidung" erkannt → Score wird auf 92 Punkte gesetzt<br/>
                    • "100% + absolute Aussage ohne Beleg" erkannt → Score würde auf 86 gesetzt (aber 92 ist höher)<br/>
                    • <strong>Finaler Score: 92 Punkte → CRITICAL</strong><br/>
                    • Begründung: BGH-Urteil Juni 2024 stuft Klimaneutralität auf Basis von Kompensation ohne Priorisierung der Vermeidung als irreführend ein
                  </div>
                </div>
                
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Traffic Light Status */}
      {totalClaims > 0 && (
        <section style={{ padding: "32px 0" }}>
          <TrafficLight claims={appContext.analyzedClaims} avgRiskScore={avgRiskScore} />
        </section>
      )}

      {/* Kompakte Statistik-Übersicht */}
      <section style={{ 
        padding: "24px 0", 
        marginBottom: 32,
        display: "flex",
        gap: "16px",
        flexWrap: "wrap",
        alignItems: "center",
        fontSize: "14px",
        lineHeight: "1.6"
      }}>
        <div style={{ fontWeight: 600 }}>
          📊 Analyse-Übersicht:
        </div>
        <div>
          <strong style={{ color: "#d32f2f" }}>{criticalClaims.length}</strong> Kritisch
        </div>
        <div style={{ opacity: 0.5 }}>•</div>
        <div>
          <strong style={{ color: "#f57c00" }}>{highClaims.length}</strong> Hoch
        </div>
        <div style={{ opacity: 0.5 }}>•</div>
        <div>
          <strong style={{ color: "#fbc02d" }}>{mediumClaims.length}</strong> Mittel
        </div>
        <div style={{ opacity: 0.5 }}>•</div>
        <div>
          <strong style={{ color: "#689f38" }}>{lowClaims.length}</strong> Niedrig
        </div>
        <div style={{ opacity: 0.5 }}>•</div>
        <div>
          Ø Score: <strong>{avgRiskScore}/100</strong>
        </div>
        <div style={{ opacity: 0.5 }}>•</div>
        <div>
          {appContext.fulltextProjects.length} {appContext.fulltextProjects.length === 1 ? "Projekt" : "Projekte"}
        </div>
        <div style={{ opacity: 0.5 }}>•</div>
        <div>
          Freigabe-Rate: <strong>{approvalRate}%</strong>
        </div>
      </section>

      {/* Dashboard Charts & Visualisierungen */}
      {totalClaims > 0 && (
        <section style={{ marginBottom: 32 }}>
          <RiskDashboardCharts claims={appContext.analyzedClaims} />
        </section>
      )}

      {/* Analysierte Claims Detail-View - gruppiert nach Projekten */}
      {totalClaims > 0 && (
        <section className="grid grid-1" style={{ paddingBottom: 32 }}>
          <div className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 8 }}>Live Analysen</div>
                <h2 style={{ marginTop: 0, fontSize: 22, fontWeight: 500 }}>
                  {activeFilter ? filteredClaims.length : totalClaims} Claims
                  {activeFilter && ` (${activeFilter.toUpperCase()})`}
                </h2>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {activeFilter && (
                  <Button onClick={() => setActiveFilter(null)} variant="secondary">
                    Filter löschen
                  </Button>
                )}
                {totalClaims > 0 && (
                  <Button 
                    onClick={() => {
                      if (confirm(`Wirklich ALLE ${totalClaims} Claims löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
                        appContext.clearClaims();
                        setActiveFilter(null);
                      }
                    }}
                    variant="secondary"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#c62828"
                    }}
                  >
                    🗑️ Alle löschen
                  </Button>
                )}
              </div>
            </div>

            {filteredClaims.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                Keine Claims in dieser Kategorie
              </div>
            ) : (
              <>
                {/* Volltext-Projekte (chronologisch, neuestes zuerst) - Accordion-Style */}
                {appContext.fulltextProjects
                  .filter(project => {
                    // Zeige nur Projekte mit Claims, die den Filter erfüllen
                    if (!activeFilter) return true;
                    const projectClaims = appContext.getProjectClaims(project.id);
                    return projectClaims.some(c => {
                      if (activeFilter === "critical") return c.riskLevel === "CRITICAL";
                      if (activeFilter === "high") return c.riskLevel === "HIGH";
                      if (activeFilter === "medium") return c.riskLevel === "MEDIUM";
                      if (activeFilter === "low") return c.riskLevel === "LOW";
                      return true;
                    });
                  })
                  .map((project, projectIndex) => {
                    const projectClaims = appContext.getProjectClaims(project.id)
                      .filter(claim => {
                        if (!activeFilter) return true;
                        if (activeFilter === "critical") return claim.riskLevel === "CRITICAL";
                        if (activeFilter === "high") return claim.riskLevel === "HIGH";
                        if (activeFilter === "medium") return claim.riskLevel === "MEDIUM";
                        if (activeFilter === "low") return claim.riskLevel === "LOW";
                        return false;
                      });

                    if (projectClaims.length === 0) return null;

                    const isExpanded = expandedProjects.has(project.id);
                    const selectedFinding = selectedProjectFinding?.projectId === project.id ? selectedProjectFinding.claim : null;

                    return (
                      <div
                        key={project.id}
                        style={{
                          marginBottom: "24px",
                          paddingBottom: "16px",
                          borderBottom: projectIndex < appContext.fulltextProjects.length - 1 
                            ? "2px solid var(--border-medium)" 
                            : "none",
                        }}
                      >
                        {/* Projekt-Header (klickbar) */}
                        <div
                          onClick={() => toggleProject(project.id)}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "16px 20px",
                            backgroundColor: "rgba(198,227,27,0.08)",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid rgba(198,227,27,0.2)",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            marginBottom: isExpanded ? "16px" : "0",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(198,227,27,0.12)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(198,227,27,0.08)";
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                              <span style={{ fontSize: "18px", transition: "transform 0.2s ease", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>
                                ▶
                              </span>
                              <span style={{ fontSize: "20px" }}>📄</span>
                              <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
                                {project.title}
                              </h3>
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", gap: "16px", marginLeft: "42px" }}>
                              <span>
                                📅 {new Date(project.timestamp).toLocaleDateString("de-DE", { 
                                  day: "2-digit", 
                                  month: "2-digit", 
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                              <span>📊 {project.claimCount} {project.claimCount === 1 ? "Passage" : "Passagen"}</span>
                              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <RiskBadge level={project.highestRiskLevel} />
                                <span>Höchster Score: {project.highestRiskScore}</span>
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="secondary"
                            style={{
                              fontSize: "11px",
                              background: "transparent",
                              border: "none",
                              color: "#c62828",
                            }}
                            onClick={(e) => {
                              e.stopPropagation(); // Verhindert das Aufklappen beim Löschen
                              if (confirm(`Projekt "${project.title}" wirklich löschen?\n\n${project.claimCount} Claims werden ebenfalls entfernt.`)) {
                                appContext.removeProject(project.id);
                              }
                            }}
                          >
                            🗑️ Projekt löschen
                          </Button>
                        </div>

                        {/* Aufgeklappter Projekt-Inhalt */}
                        {isExpanded && (
                          <div style={{ marginTop: "8px" }}>
                            {/* Zwei-Spalten-Layout: Links Volltext, Rechts Details */}
                            <div style={{ display: "grid", gridTemplateColumns: selectedFinding ? "1fr 400px" : "1fr", gap: "16px" }}>
                              {/* Linke Spalte: Farbig markierter Volltext */}
                              <div>
                                <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "12px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                  📝 Volltext mit markierten Passagen
                                </div>
                                {renderProjectHighlightedText(project, projectClaims)}
                                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "12px", fontStyle: "italic" }}>
                                  💡 Klicken Sie auf markierte Passagen, um Details anzuzeigen
                                </div>
                              </div>

                              {/* Rechte Spalte: Detail-View für ausgewähltes Finding */}
                              {selectedFinding && (
                                <div
                                  style={{
                                    padding: "20px",
                                    backgroundColor: "rgba(0,0,0,0.3)",
                                    borderRadius: "var(--radius-sm)",
                                    border: `2px solid ${getRiskColor(selectedFinding.riskLevel, 0.5)}`,
                                  }}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                    <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>Passage-Details</h4>
                                    <button
                                      onClick={() => setSelectedProjectFinding(null)}
                                      style={{
                                        background: "transparent",
                                        border: "none",
                                        color: "var(--text-secondary)",
                                        cursor: "pointer",
                                        fontSize: "18px",
                                        padding: "0",
                                      }}
                                    >
                                      ✕
                                    </button>
                                  </div>

                                  <div style={{ marginBottom: "12px" }}>
                                    <RiskBadge level={selectedFinding.riskLevel} />
                                    <span style={{ marginLeft: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
                                      Score: {selectedFinding.riskScore}
                                    </span>
                                  </div>

                                  <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "rgba(0,0,0,0.2)", borderRadius: "var(--radius-sm)", fontSize: "13px" }}>
                                    <strong>Passage:</strong>
                                    <div style={{ marginTop: "8px", fontStyle: "italic" }}>"{selectedFinding.text}"</div>
                                  </div>

                                  <div style={{ marginBottom: "16px" }}>
                                    <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "8px", color: "var(--text-secondary)" }}>
                                      Begründung:
                                    </div>
                                    <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
                                      <LinkedRegulatoryText text={selectedFinding.explanation} />
                                    </div>
                                  </div>

                                  {/* Unsicherheits-Markierungen */}
                                  {selectedFinding.uncertaintyFlags && selectedFinding.uncertaintyFlags.length > 0 && (
                                    <div style={{ 
                                      marginBottom: "16px", 
                                      padding: "10px 12px", 
                                      background: "rgba(251, 192, 45, 0.15)", 
                                      borderRadius: "6px",
                                      border: "1px solid rgba(251, 192, 45, 0.3)"
                                    }}>
                                      <div style={{ fontSize: "11px", fontWeight: 600, color: "#fbc02d", marginBottom: 6 }}>
                                        ⚠️ HINWEISE ZUR BEWERTUNG
                                      </div>
                                      {selectedFinding.uncertaintyFlags.map((flag: string, idx: number) => (
                                        <div key={idx} style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", marginBottom: 4 }}>
                                          {flag}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <div>
                                    <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "8px", color: "var(--text-secondary)" }}>
                                      Empfohlene Umformulierung:
                                    </div>
                                    <div style={{ fontSize: "13px", lineHeight: "1.6", color: "var(--color-accent)" }}>
                                      {selectedFinding.suggestedRewrite}
                                    </div>
                                  </div>

                                  <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
                                    <Button
                                      variant="secondary"
                                      style={{ fontSize: "11px", flex: 1 }}
                                      onClick={() => {
                                        appContext.setSelectedClaim(selectedFinding);
                                        router.push(`/claim-detail?from=claim-${selectedFinding.id}`);
                                      }}
                                    >
                                      Vollständige Details →
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Statistik-Übersicht */}
                            <div style={{ marginTop: "16px", display: "flex", gap: "12px", fontSize: "12px" }}>
                              <div style={{ padding: "8px 12px", backgroundColor: "transparent", borderRadius: "var(--radius-sm)", border: "none" }}>
                                <span style={{ color: "#c62828", fontWeight: 600 }}>
                                  {projectClaims.filter(c => c.riskLevel === "CRITICAL").length}
                                </span> Kritisch
                              </div>
                              <div style={{ padding: "8px 12px", backgroundColor: "rgba(217, 119, 6, 0.1)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(217, 119, 6, 0.3)" }}>
                                <span style={{ color: "#d97706", fontWeight: 600 }}>
                                  {projectClaims.filter(c => c.riskLevel === "HIGH").length}
                                </span> Hoch
                              </div>
                              <div style={{ padding: "8px 12px", backgroundColor: "rgba(255, 193, 7, 0.1)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(255, 193, 7, 0.3)" }}>
                                <span style={{ color: "#ffc107", fontWeight: 600 }}>
                                  {projectClaims.filter(c => c.riskLevel === "MEDIUM").length}
                                </span> Mittel
                              </div>
                              <div style={{ padding: "8px 12px", backgroundColor: "rgba(76, 175, 80, 0.1)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(76, 175, 80, 0.3)" }}>
                                <span style={{ color: "#4caf50", fontWeight: 600 }}>
                                  {projectClaims.filter(c => c.riskLevel === "LOW").length}
                                </span> Niedrig
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                {/* Einzelne Claims ohne Projekt */}
                {(() => {
                  const standaloneCliams = filteredClaims.filter(c => !c.projectId);
                  if (standaloneCliams.length === 0) return null;

                  return (
                    <div>
                      {appContext.fulltextProjects.length > 0 && (
                        <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "16px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          📝 Einzelne Claims (nicht Teil eines Projekts)
                        </h3>
                      )}
                      {standaloneCliams.map((claim, i) => (
                        <div
                          key={claim.id}
                          id={`claim-${claim.id}`}
                          className="row"
                          style={{
                            borderTop: i === 0 && appContext.fulltextProjects.length === 0 ? "none" : "1px solid var(--border-subtle)",
                            scrollMarginTop: "100px", // Offset für Navigation-Header
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", gap: 12, marginBottom: 8, alignItems: "center" }}>
                              <RiskBadge level={claim.riskLevel} />
                              <span style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 500 }}>
                                Score: {claim.riskScore} • {new Date(claim.timestamp).toLocaleDateString("de-DE", { 
                                  day: "2-digit", 
                                  month: "2-digit", 
                                  year: "numeric" 
                                })} {new Date(claim.timestamp).toLocaleTimeString("de-DE", {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                            </div>
                            <div className="row-title" style={{ marginBottom: 6 }}>
                              {claim.text}
                            </div>
                            <div className="row-meta" style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)" }}>
                              <LinkedRegulatoryText text={claim.explanation} />
                            </div>

                            {/* Unsicherheits-Markierungen */}
                            {claim.uncertaintyFlags && claim.uncertaintyFlags.length > 0 && (
                              <div style={{ 
                                marginTop: "12px",
                                marginBottom: "12px",
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

                            <ViolationDetails violations={claim.violations} riskLevel={claim.riskLevel} />
                            {claim.sourceUrl && (
                              <div style={{ marginTop: 8, fontSize: "11px", color: "var(--text-muted)" }}>
                                🔗 von: <a href={claim.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-interactive)" }}>
                                  {claim.sourceUrl.substring(0, 50)}...
                                </a>
                              </div>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 8, textAlign: "right" }}>
                            <Button 
                              variant="secondary" 
                              style={{ 
                                fontSize: "12px",
                                background: "transparent",
                                border: "none",
                                color: "#c62828"
                              }}
                              onClick={() => {
                                if (confirm(`Claim wirklich löschen?\n\n"${claim.text.substring(0, 60)}..."`)) {
                                  appContext.removeClaim(claim.id);
                                }
                              }}
                            >
                              🗑️ Löschen
                            </Button>
                            <Button 
                              variant="secondary" 
                              style={{ fontSize: "12px" }}
                              onClick={() => {
                                appContext.setSelectedClaim(claim);
                                router.push(`/claim-detail?from=claim-${claim.id}`);
                              }}
                            >
                              Details →
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardPageContent />
    </Suspense>
  );
}
