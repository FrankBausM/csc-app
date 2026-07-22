"use client";

import { useState } from "react";
import { SectionTitle, Pill, TextInput, Select, Button } from "../../components/ui";
import { useAppContext } from "../AppContext";

interface NewProject {
  name: string;
  owner: string;
  description: string;
  riskLevel: string;
}

export default function ProjectsPage() {
  const appContext = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<NewProject>({
    name: "",
    owner: "",
    description: "",
    riskLevel: "MEDIUM",
  });

  // Generiere Projekte aus AppContext Claims basierend auf Quelle/URL
  const projects = Array.from(
    appContext.analyzedClaims.reduce((acc, claim) => {
      const projectKey = claim.sourceUrl || "Manuelle Eingabe";
      if (!acc.has(projectKey)) {
        const projectClaims = appContext.analyzedClaims.filter(c => (c.sourceUrl || "Manuelle Eingabe") === projectKey);
        const maxScore = Math.max(...projectClaims.map(c => c.riskScore));
        
        // Bestimme Risiko-Level basierend auf höchstem Score
        let riskLevel = "LOW";
        if (maxScore >= 75) riskLevel = "CRITICAL";
        else if (maxScore >= 60) riskLevel = "HIGH";
        else if (maxScore >= 45) riskLevel = "MEDIUM";
        
        const highRiskCount = projectClaims.filter(c => c.riskScore >= 60).length;
        
        acc.set(projectKey, {
          id: `p_${projectKey}`,
          name: claim.sourceUrl || "Manuelle Analysen",
          owner: "System",
          status: "ACTIVE",
          riskLevel,
          assetsCount: 0,
          pendingApprovals: highRiskCount,
          claimsCount: 0,
        });
      }
      const proj = acc.get(projectKey);
      if (proj) proj.claimsCount!++;
      return acc;
    }, new Map())
  ).map(([_, p]) => p);

  const getRiskColor = (level: string) => {
    const colors: Record<string, string> = {
      CRITICAL: "var(--color-risk-critical)",
      HIGH: "var(--color-risk-high)",
      MEDIUM: "var(--color-risk-medium)",
      LOW: "var(--color-risk-low)",
    };
    return colors[level] || "var(--text-secondary)";
  };

  const getRiskIcon = (level: string) => {
    const icons: Record<string, string> = {
      CRITICAL: "🔴",
      HIGH: "🟠",
      MEDIUM: "🟡",
      LOW: "🟢",
    };
    return icons[level] || "⚪";
  };

  // Wenn noch keine Claims analysiert wurden
  if (projects.length === 0) {
    return (
      <main>
        <section style={{ padding: "40px 0" }}>
          <SectionTitle eyebrow="Projektübersicht" title="Alle Projekte" />
          <div className="panel" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            <p>Noch keine Analysen durchgeführt. Starten Sie mit der Analyse von Texten oder URLs unter "Überprüfung"!</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section style={{ padding: "40px 0" }}>
        <SectionTitle eyebrow="Projektübersicht" title="Alle Projekte" />

        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
          <div className="panel">
            <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--color-accent)", marginBottom: 4 }}>
              {projects.length}
            </div>
            <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
              Quellen gesamt
            </div>
          </div>
          <div className="panel">
            <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--color-risk-high)", marginBottom: 4 }}>
              {projects.filter(p => p.riskLevel === "CRITICAL" || p.riskLevel === "HIGH").length}
            </div>
            <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
              Hohe Risiken
            </div>
          </div>
          <div className="panel">
            <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--color-interactive)", marginBottom: 4 }}>
              {projects.reduce((sum, p) => sum + (p.claimsCount || 0), 0)}
            </div>
            <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
              Claims gesamt
            </div>
          </div>
        </div>

        {/* Projects List */}
        <div className="panel">
          {projects.map((p, i) => (
            <div className="row" key={p.id} style={{ borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)" }}>
              <div>
                <div className="row-title">{p.name}</div>
                <div className="row-meta">
                  {p.claimsCount} analysierte Claims · Zuletzt aktualisiert: {new Date().toLocaleDateString("de-DE")}
                </div>
              </div>
              <div className="stack">
                <Pill style={{ color: getRiskColor(p.riskLevel) }}>{getRiskIcon(p.riskLevel)} {p.riskLevel}</Pill>
                <Pill>{p.status}</Pill>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
