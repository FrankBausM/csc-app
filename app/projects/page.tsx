"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SectionTitle, Button } from "../../components/ui";
import { useAppContext } from "../AppContext";
import { RiskBadge } from "../../components/HighlightedText";
import { LinkedRegulatoryText } from "../../components/SourceLink";

export default function ProjectsPage() {
  const router = useRouter();
  const appContext = useAppContext();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [selectedProjectFinding, setSelectedProjectFinding] = useState<{ projectId: string; claim: any } | null>(null);

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

  const getRiskColor = (level: string, opacity = 1) => {
    const colors = {
      CRITICAL: `rgba(255, 107, 107, ${opacity})`,
      HIGH: `rgba(217, 119, 6, ${opacity})`,
      MEDIUM: `rgba(255, 193, 7, ${opacity})`,
      LOW: `rgba(76, 175, 80, ${opacity})`,
    };
    return colors[level as keyof typeof colors] || `rgba(128, 128, 128, ${opacity})`;
  };

  const renderProjectHighlightedText = (project: any, claims: any[]) => {
    if (!project.fullText || claims.length === 0) {
      return (
        <div style={{ color: "var(--text-secondary)", fontStyle: "italic", padding: "20px" }}>
          ✓ Keine problematischen Passagen gefunden.
        </div>
      );
    }

    const claimsWithPositions = claims.map(claim => {
      const index = project.fullText.indexOf(claim.text);
      return {
        ...claim,
        startIndex: index,
        endIndex: index + claim.text.length,
      };
    }).filter(c => c.startIndex >= 0)
      .sort((a, b) => a.startIndex - b.startIndex);

    const segments: Array<{ text: string; claim?: any }> = [];
    let lastIndex = 0;

    claimsWithPositions.forEach(claim => {
      if (claim.startIndex > lastIndex) {
        segments.push({
          text: project.fullText.substring(lastIndex, claim.startIndex),
        });
      }
      segments.push({
        text: claim.text,
        claim,
      });
      lastIndex = claim.endIndex;
    });

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
                onClick={() => setSelectedProjectFinding({ projectId: project.id, claim: segment.claim })}
                style={{
                  backgroundColor: getRiskColor(segment.claim.riskLevel, isSelected ? 0.5 : 0.3),
                  borderBottom: `2px solid ${getRiskColor(segment.claim.riskLevel, 1)}`,
                  cursor: "pointer",
                  padding: "2px 0",
                  transition: "all 0.2s ease",
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

  if (appContext.fulltextProjects.length === 0 && appContext.analyzedClaims.length === 0) {
    return (
      <main>
        <section style={{ padding: "40px 0" }}>
          <SectionTitle eyebrow="Projektübersicht" title="Alle Projekte" />
          <div className="panel" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            <p>Noch keine Analysen durchgeführt. Starten Sie mit der Analyse von Texten oder URLs unter "Asset-Prüfung"!</p>
          </div>
        </section>
      </main>
    );
  }

  const standaloneCliams = appContext.analyzedClaims.filter(c => !c.projectId);

  return (
    <main>
      <section style={{ padding: "40px 0" }}>
        <SectionTitle eyebrow="Projektübersicht" title="Alle Projekte" />

        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
          <div className="panel">
            <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--color-accent)", marginBottom: 4 }}>
              {appContext.fulltextProjects.length}
            </div>
            <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
              Volltext-Projekte
            </div>
          </div>
          <div className="panel">
            <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--color-risk-high)", marginBottom: 4 }}>
              {appContext.fulltextProjects.filter(p => p.highestRiskLevel === "CRITICAL" || p.highestRiskLevel === "HIGH").length}
            </div>
            <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
              Hohe Risiken
            </div>
          </div>
          <div className="panel">
            <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--color-interactive)", marginBottom: 4 }}>
              {appContext.analyzedClaims.length}
            </div>
            <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
              Analysen gesamt
            </div>
          </div>
        </div>

        {/* Volltext-Projekte */}
        {appContext.fulltextProjects.length > 0 && (
          <div className="panel" style={{ marginBottom: 32 }}>
            <div style={{ marginBottom: 20 }}>
              <div className="eyebrow">Volltext-Projekte</div>
              <h3 style={{ marginTop: 8, fontSize: 18 }}>
                {appContext.fulltextProjects.length} {appContext.fulltextProjects.length === 1 ? "Projekt" : "Projekte"}
              </h3>
            </div>

            {appContext.fulltextProjects.map((project, projectIndex) => {
              const projectClaims = appContext.getProjectClaims(project.id);
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
                  {/* Projekt-Header */}
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
                        e.stopPropagation();
                        if (confirm(`Projekt "${project.title}" wirklich löschen?\n\n${project.claimCount} Claims werden ebenfalls entfernt.`)) {
                          appContext.removeProject(project.id);
                        }
                      }}
                    >
                      🗑️ Projekt löschen
                    </Button>
                  </div>

                  {/* Aufgeklappter Inhalt */}
                  {isExpanded && (
                    <div style={{ marginTop: "8px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: selectedFinding ? "1fr 400px" : "1fr", gap: "16px" }}>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "12px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            📝 Volltext mit markierten Passagen
                          </div>
                          {renderProjectHighlightedText(project, projectClaims)}
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "12px", fontStyle: "italic" }}>
                            💡 Klicken Sie auf markierte Passagen, um Details anzuzeigen
                          </div>
                        </div>

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
                                  router.push("/claim-detail");
                                }}
                              >
                                Vollständige Details →
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Statistik */}
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
          </div>
        )}

        {/* Einzelne Claims */}
        {standaloneCliams.length > 0 && (
          <div className="panel">
            <div style={{ marginBottom: 20 }}>
              <div className="eyebrow">Einzelanalysen</div>
              <h3 style={{ marginTop: 8, fontSize: 18 }}>
                Claims ohne Projekt ({standaloneCliams.length})
              </h3>
            </div>
            {standaloneCliams.map((claim, i) => (
              <div
                key={claim.id}
                className="row"
                style={{
                  borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 12, marginBottom: 8, alignItems: "center" }}>
                    <RiskBadge level={claim.riskLevel} />
                    <span style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 500 }}>
                      Score: {claim.riskScore}
                    </span>
                  </div>
                  <div className="row-title" style={{ marginBottom: 6 }}>
                    {claim.text}
                  </div>
                  <div className="row-meta" style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)" }}>
                    {claim.sourceUrl || "Manuelle Eingabe"}
                  </div>
                </div>
                <Button 
                  variant="secondary" 
                  style={{ fontSize: "12px" }}
                  onClick={() => {
                    appContext.setSelectedClaim(claim);
                    router.push("/claim-detail");
                  }}
                >
                  Details →
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
