"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { AnalyzedClaim, useAppContext } from "../app/AppContext";

interface RiskDashboardChartsProps {
  claims: AnalyzedClaim[];
}

// Custom Tooltip für detaillierte Score-Informationen
const CustomScoreTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        padding: "12px",
        borderRadius: "6px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
      }}>
        <p style={{ margin: 0, fontWeight: 600, marginBottom: 8 }}>
          Risk Score: {label}
        </p>
        <p style={{ margin: 0, color: "var(--color-accent)" }}>
          Claims: {payload[0].value}
        </p>
        <p style={{ margin: "8px 0 0 0", fontSize: "11px", opacity: 0.7 }}>
          Berechnungsfaktoren:
        </p>
        <ul style={{ margin: "4px 0 0 0", paddingLeft: "16px", fontSize: "11px", opacity: 0.7 }}>
          <li>Absolute Aussagen (+43)</li>
          <li>Kompensation statt Reduktion (+50)</li>
          <li>Vage Begriffe (+33)</li>
          <li>Fehlende Zertifizierung (+30)</li>
          <li>Greenwashing-Imagery (+23)</li>
        </ul>
      </div>
    );
  }
  return null;
};

export function RiskDashboardCharts({ claims }: RiskDashboardChartsProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const router = useRouter();
  const appContext = useAppContext();

  // Daten für Risk Level Verteilung
  const riskDistribution = [
    { 
      name: "CRITICAL", 
      label: "Kritisch",
      value: claims.filter((c) => c.riskLevel === "CRITICAL").length,
      description: "Score 75-100: Schwere EmpCo-Verstöße"
    },
    { 
      name: "HIGH", 
      label: "Hoch",
      value: claims.filter((c) => c.riskLevel === "HIGH").length,
      description: "Score 60-74: Dringende Anpassung nötig"
    },
    { 
      name: "MEDIUM", 
      label: "Mittel",
      value: claims.filter((c) => c.riskLevel === "MEDIUM").length,
      description: "Score 36-59: Präzisierung empfohlen"
    },
    { 
      name: "LOW", 
      label: "Niedrig",
      value: claims.filter((c) => c.riskLevel === "LOW").length,
      description: "Score 0-35: EmpCo-konform"
    },
  ].filter((item) => item.value > 0);

  // Daten für Risk Score Verteilung mit neuen Schwellenwerten (konsistent mit Ampel-Schema)
  // LOW: 0-35 | MEDIUM: 36-59 | HIGH: 60-74 | CRITICAL: 75-100
  const scoreData = [
    {
      range: "0-35",
      label: "Niedrig",
      count: claims.filter((c) => c.riskScore >= 0 && c.riskScore <= 35).length,
      color: "#4caf50"  // Grün (LOW)
    },
    {
      range: "36-59",
      label: "Mittel",
      count: claims.filter((c) => c.riskScore >= 36 && c.riskScore <= 59).length,
      color: "#ffc107"  // Gelb (MEDIUM)
    },
    {
      range: "60-74",
      label: "Hoch",
      count: claims.filter((c) => c.riskScore >= 60 && c.riskScore <= 74).length,
      color: "#d97706"  // Dunkles Orange (HIGH)
    },
    {
      range: "75-100",
      label: "Kritisch",
      count: claims.filter((c) => c.riskScore >= 75 && c.riskScore <= 100).length,
      color: "#c62828"  // Rot (CRITICAL)
    },
  ];

  // Score Timeline nach Text-Position sortiert (wie Claims im Originaltext erscheinen)
  // Sortiere nach textPosition falls vorhanden, sonst nach Array-Index (Fallback)
  const sortedByTextPosition = [...claims].sort((a, b) => {
    // Falls textPosition vorhanden: danach sortieren
    if (a.textPosition !== undefined && b.textPosition !== undefined) {
      return a.textPosition - b.textPosition;
    }
    // Fallback: Claims ohne textPosition kommen ans Ende
    if (a.textPosition !== undefined) return -1;
    if (b.textPosition !== undefined) return 1;
    return 0; // Beide ohne textPosition: Original-Reihenfolge
  });
  
  const timelineData = sortedByTextPosition
    .slice(-20) // Letzte 20 Claims
    .map((claim, idx) => ({
      index: idx + 1,
      score: claim.riskScore,
      time: new Date(claim.timestamp).toLocaleTimeString("de-DE", { 
        hour: "2-digit", 
        minute: "2-digit" 
      }),
      claimId: claim.id,
      claim: claim,
    }));
  
  // Funktion zum Navigieren zu einem Claim
  const handleClaimClick = (claimData: typeof timelineData[0]) => {
    console.log("handleClaimClick aufgerufen mit:", claimData);
    if (claimData && claimData.claim) {
      console.log("Claim gesetzt:", claimData.claim);
      appContext.setSelectedClaim(claimData.claim);
      router.push("/claim-detail");
    } else {
      console.error("Kein Claim-Daten gefunden:", claimData);
    }
  };

  const COLORS: Record<string, string> = {
    CRITICAL: "#c62828",  // Rot
    HIGH: "#d97706",      // Dunkles Orange
    MEDIUM: "#ffc107",    // Gelb
    LOW: "#4caf50",       // Grün
  };

  return (
    <div style={{ marginTop: "48px" }}>
      <div className="eyebrow">VISUELLE ÜBERSICHT</div>
      <h2 style={{ marginTop: 8, fontSize: 28, fontWeight: 500, textTransform: "uppercase", letterSpacing: "-0.02em", marginBottom: 16 }}>
        Analyse-Dashboard
      </h2>
      
      {/* Erklärung der Score-Berechnung */}
      <div 
        className="panel" 
        style={{ 
          padding: "16px 20px", 
          marginBottom: 32,
          background: "rgba(198, 227, 27, 0.08)",
          border: "1px solid rgba(198, 227, 27, 0.3)"
        }}
      >
        <div 
          style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            cursor: "pointer"
          }}
          onClick={() => setShowExplanation(!showExplanation)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: "20px" }}>📊</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: 4 }}>
                Risk Score Berechnung
              </div>
              <div style={{ fontSize: "12px", opacity: 0.7 }}>
                7-Faktor-Analyse nach EmpCo-Richtlinie
              </div>
            </div>
          </div>
          <span style={{ fontSize: "20px", opacity: 0.5 }}>
            {showExplanation ? "▼" : "▶"}
          </span>
        </div>
        
        {showExplanation && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(77, 102, 0, 0.2)" }}>
            <div style={{ fontSize: "13px", lineHeight: 1.7, color: "#4d6600" }}>
              <p style={{ marginTop: 0, fontWeight: 600 }}>Der Risk Score (0-100) errechnet sich aus folgenden Faktoren:</p>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginTop: 16 }}>
                <div>
                  <div style={{ color: "var(--color-accent)", fontWeight: 600, marginBottom: 6 }}>
                    🚩 Kompensation (+50 Punkte)
                  </div>
                  <div style={{ opacity: 0.8, fontSize: "12px" }}>
                    "Klimaneutral durch Kompensation" statt echter Reduktion
                  </div>
                </div>
                
                <div>
                  <div style={{ color: "var(--color-accent)", fontWeight: 600, marginBottom: 6 }}>
                    ⚠️ Absolute Aussagen (+43 Punkte)
                  </div>
                  <div style={{ opacity: 0.8, fontSize: "12px" }}>
                    "100%", "alle", "komplett" ohne Qualifizierung oder Beweis
                  </div>
                </div>
                
                <div>
                  <div style={{ color: "var(--color-accent)", fontWeight: 600, marginBottom: 6 }}>
                    📋 Vage Begriffe (+33 Punkte)
                  </div>
                  <div style={{ opacity: 0.8, fontSize: "12px" }}>
                    "Nachhaltig", "umweltfreundlich" ohne Zertifizierung
                  </div>
                </div>
                
                <div>
                  <div style={{ color: "var(--color-accent)", fontWeight: 600, marginBottom: 6 }}>
                    ❓ Dubios Siegel (+30 Punkte)
                  </div>
                  <div style={{ opacity: 0.8, fontSize: "12px" }}>
                    Siegel/Labels ohne erkennbare ISO/FSC/MSC Zertifizierung
                  </div>
                </div>
                
                <div>
                  <div style={{ color: "var(--color-accent)", fontWeight: 600, marginBottom: 6 }}>
                    💼 Leuchtturm-Produkte (+35 Punkte)
                  </div>
                  <div style={{ opacity: 0.8, fontSize: "12px" }}>
                    Einzelne nachhaltige Produkte bei problematischem Kerngeschäft
                  </div>
                </div>
                
                <div>
                  <div style={{ color: "var(--color-accent)", fontWeight: 600, marginBottom: 6 }}>
                    ⏳ Verzögerungstaktik (+27 Punkte)
                  </div>
                  <div style={{ opacity: 0.8, fontSize: "12px" }}>
                    "Weitere Forschung nötig", "unter Untersuchung"
                  </div>
                </div>
                
                <div>
                  <div style={{ color: "var(--color-accent)", fontWeight: 600, marginBottom: 6 }}>
                    🎨 Grüne Bildsprache (+23 Punkte)
                  </div>
                  <div style={{ opacity: 0.8, fontSize: "12px" }}>
                    "Grüne Energie", "Blatt", "Natur" ohne substantielle Belege
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop: 20, padding: "12px", background: "rgba(0,0,0,0.2)", borderRadius: "4px" }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>📐 Formel:</div>
                <code style={{ fontSize: "12px", opacity: 0.9 }}>
                  Base Score = 35 (Medium) <br />
                  Final Score = max(Base, Faktor 1, Faktor 2, ..., Faktor 7) <br />
                  Risk Level = Score {'>='}75 ? CRITICAL : Score {'>='}60 ? HIGH : Score {'>='}45 ? MEDIUM : LOW
                </code>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "32px" }}>
        {/* Risk Level Distribution */}
        {riskDistribution.length > 0 && (
          <div className="panel chart-panel" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.8 }}>
              Risikoverteilung nach Level
            </h3>
            <div style={{ fontSize: "11px", opacity: 0.6, marginBottom: 16 }}>
              Kategorisierung der analysierten Claims
            </div>
            <div style={{ width: "100%", height: "280px", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <PieChart width={700} height={280}>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ label, value, percent }) => `${label}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskDistribution.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name] || "#888"} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as typeof riskDistribution[0];
                      return (
                        <div style={{
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border-subtle)",
                          padding: "12px",
                          borderRadius: "6px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                        }}>
                          <p style={{ margin: 0, fontWeight: 600, marginBottom: 4 }}>
                            {data.label}
                          </p>
                          <p style={{ margin: 0, color: "var(--color-accent)", marginBottom: 8 }}>
                            {data.value} Claims
                          </p>
                          <p style={{ margin: 0, fontSize: "11px", opacity: 0.7 }}>
                            {data.description}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </div>
          </div>
        )}

        {/* Score Distribution mit verbesserter X/Y-Achse */}
        {scoreData.some((item) => item.count > 0) && (
          <div className="panel chart-panel" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.8 }}>
              Score-Verteilung (0-100)
            </h3>
            <div style={{ fontSize: "11px", opacity: 0.6, marginBottom: 16 }}>
              X-Achse: Score-Bereiche • Y-Achse: Anzahl Claims
            </div>
            <div style={{ width: "100%", height: "280px", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <BarChart width={700} height={280} data={scoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(77, 102, 0, 0.2)" />
                <XAxis 
                  dataKey="range" 
                  label={{ 
                    value: "Risk Score Bereich", 
                    position: "insideBottom", 
                    offset: -5,
                    style: { fontSize: "11px", fill: "#4d6600" }
                  }}
                  tick={{ fontSize: 11, fill: "#4d6600" }}
                />
                <YAxis 
                  label={{ 
                    value: "Anzahl Claims", 
                    angle: -90, 
                    position: "insideLeft",
                    style: { fontSize: "11px", fill: "#4d6600" }
                  }}
                  tick={{ fontSize: 11, fill: "#4d6600" }}
                />
                <Tooltip content={<CustomScoreTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {scoreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </div>
            <div style={{ marginTop: 12, fontSize: "11px", opacity: 0.6, textAlign: "center" }}>
              💡 Je höher der Score, desto größer das Greenwashing-Risiko
            </div>
          </div>
        )}
      </div>

      {/* Timeline Graph (falls genug Daten vorhanden) */}
      {timelineData.length > 3 && (
        <div className="panel" style={{ padding: "24px", marginTop: 32 }}>
          <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.8 }}>
            Risk Score Timeline
          </h3>
          <div style={{ fontSize: "11px", opacity: 0.6, marginBottom: 8 }}>
            X-Achse: Position im Originaltext (1. Claim → letzter Claim) • Y-Achse: Risk Score (0-100)
          </div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginBottom: 16, padding: "8px 12px", background: "rgba(198, 227, 27, 0.08)", borderRadius: "4px", border: "1px solid rgba(198, 227, 27, 0.2)" }}>
            💡 <strong>Hinweis:</strong> Die Timeline zeigt Claims in der Reihenfolge, wie sie im Originaltext erscheinen. 
            <strong style={{ color: "var(--color-accent)" }}> Klicken Sie auf die Punkte</strong>, um zum jeweiligen Claim-Detail zu springen.
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart 
              data={timelineData}
              onClick={(data: any) => {
                console.log("LineChart onClick:", data);
                if (data && data.activePayload && data.activePayload[0]) {
                  const clickedData = data.activePayload[0].payload;
                  console.log("Clicked payload:", clickedData);
                  handleClaimClick(clickedData);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(77, 102, 0, 0.2)" />
              <XAxis 
                dataKey="index"
                label={{ 
                  value: "Position im Text (Claim-Nummer)", 
                  position: "insideBottom", 
                  offset: -5,
                  style: { fontSize: "11px", fill: "#4d6600" }
                }}
                tick={{ fontSize: 11, fill: "#4d6600" }}
              />
              <YAxis 
                domain={[0, 100]}
                label={{ 
                  value: "Risk Score", 
                  angle: -90, 
                  position: "insideLeft",
                  style: { fontSize: "11px", fill: "#4d6600" }
                }}
                tick={{ fontSize: 11, fill: "#4d6600" }}
              />
              <Tooltip 
                cursor={{ stroke: "var(--color-accent)", strokeWidth: 2, strokeDasharray: "5 5" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div style={{
                        background: "var(--bg-elevated)",
                        border: "2px solid var(--color-accent)",
                        padding: "12px",
                        borderRadius: "6px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                        cursor: "pointer"
                      }}>
                        <p style={{ margin: 0, fontWeight: 600 }}>
                          Claim #{data.index}
                        </p>
                        <p style={{ margin: "4px 0 0 0", color: "var(--color-accent)" }}>
                          Score: {data.score}
                        </p>
                        <p style={{ margin: "4px 0 0 0", fontSize: "11px", opacity: 0.7 }}>
                          Analysiert: {data.time}
                        </p>
                        <p style={{ margin: "8px 0 0 0", fontSize: "10px", opacity: 0.6, fontStyle: "italic" }}>
                          → Auf Punkt oder Chart klicken für Details
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="var(--color-accent)" 
                strokeWidth={2}
                dot={{ 
                  fill: "var(--color-accent)", 
                  r: 5,
                  strokeWidth: 2,
                  stroke: "#4d6600",
                  style: { cursor: "pointer" }
                }}
                activeDot={{ 
                  r: 8,
                  fill: "var(--color-accent)",
                  strokeWidth: 3,
                  stroke: "#4d6600",
                  style: { cursor: "pointer" },
                  onClick: (event: any, payload: any) => {
                    console.log("activeDot onClick:", payload);
                    if (payload && payload.payload) {
                      handleClaimClick(payload.payload);
                    }
                  }
                }}
              />
              {/* Schwellwert-Linien */}
              <Line 
                type="monotone" 
                dataKey={() => 75} 
                stroke="#d32f2f" 
                strokeDasharray="5 5" 
                strokeWidth={1}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey={() => 60} 
                stroke="#f57c00" 
                strokeDasharray="5 5" 
                strokeWidth={1}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey={() => 45} 
                stroke="#fbc02d" 
                strokeDasharray="5 5" 
                strokeWidth={1}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 12, display: "flex", gap: 16, justifyContent: "center", fontSize: "11px" }}>
            <span style={{ opacity: 0.6 }}>
              <span style={{ color: "#d32f2f" }}>━━</span> Critical (75+)
            </span>
            <span style={{ opacity: 0.6 }}>
              <span style={{ color: "#f57c00" }}>━━</span> High (60+)
            </span>
            <span style={{ opacity: 0.6 }}>
              <span style={{ color: "#fbc02d" }}>━━</span> Medium (45+)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
