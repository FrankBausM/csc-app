"use client";

import { useState, useEffect } from "react";
import { SectionTitle, Button } from "../../components/ui";
import { useAppContext } from "../AppContext";
import { RiskBadge } from "../../components/HighlightedText";
import ExportFormats from "./ExportFormats";

export default function ReportsPage() {
  const appContext = useAppContext();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());

  // Initialisiere Auswahl mit allen Projekten
  useEffect(() => {
    const allProjectIds = [
      ...appContext.fulltextProjects.map(p => p.id),
      ...(appContext.analyzedClaims.some(c => !c.projectId) ? ["standalone"] : [])
    ];
    setSelectedProjects(new Set(allProjectIds));
  }, [appContext.fulltextProjects, appContext.analyzedClaims]);

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

  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    const standaloneCliams = appContext.analyzedClaims.filter(c => !c.projectId);
    const allProjectIds = [
      ...appContext.fulltextProjects.map(p => p.id),
      ...(standaloneCliams.length > 0 ? ["standalone"] : [])
    ];
    
    if (selectedProjects.size === allProjectIds.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(allProjectIds));
    }
  };

  const generateCSVReport = () => {
    // Filtere Claims nach ausgewählten Projekten
    const claimsToExport = appContext.analyzedClaims.filter(c => {
      if (c.projectId) {
        return selectedProjects.has(c.projectId);
      } else {
        return selectedProjects.has("standalone");
      }
    });

    if (claimsToExport.length === 0) {
      alert("Bitte wählen Sie mindestens ein Projekt für den Export aus.");
      return;
    }

    const headers = ["Claim Text", "Risk Level", "Risk Score", "Source", "Project", "Explanation", "Suggested Rewrite", "Timestamp"];
    const rows = claimsToExport.map(c => {
      const project = c.projectId ? appContext.fulltextProjects.find(p => p.id === c.projectId) : null;
      return [
        `"${c.text.replace(/"/g, '""')}"`,
        c.riskLevel,
        c.riskScore,
        c.sourceUrl || "Manuelle Eingabe",
        project ? `"${project.title.replace(/"/g, '""')}"` : "Einzelanalyse",
        `"${c.explanation.replace(/"/g, '""')}"`,
        `"${c.suggestedRewrite.replace(/"/g, '""')}"`,
        new Date(c.timestamp).toLocaleString("de-DE"),
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const selectedCount = selectedProjects.size;
    const fileName = selectedCount === 1 
      ? `claim-report-${new Date().toISOString().split("T")[0]}.csv`
      : `claim-report-${selectedCount}-projekte-${new Date().toISOString().split("T")[0]}.csv`;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateFeedbackReport = () => {
    const feedbackData = appContext.getFeedbackData();
    
    if (feedbackData.length === 0) {
      alert("Keine Feedback-Daten vorhanden. Korrigieren Sie zunächst einige Claims.");
      return;
    }

    const headers = [
      "Claim ID",
      "Claim Text",
      "Original Score",
      "Original Level",
      "Corrected Score",
      "Corrected Level",
      "Feedback Reason",
      "Timestamp"
    ];
    
    const rows = feedbackData.map(f => [
      f.claimId,
      `"${f.claimText.replace(/"/g, '""')}"`,
      f.originalScore,
      f.originalLevel,
      f.correctedScore,
      f.correctedLevel,
      `"${(f.reason || "").replace(/"/g, '""')}"`,
      f.timestamp ? new Date(f.timestamp).toLocaleString("de-DE") : "N/A"
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (appContext.analyzedClaims.length === 0) {
    return (
      <main>
        <section style={{ padding: "40px 0" }}>
          <SectionTitle eyebrow="Berichte" title="Exportierte Audit-Ergebnisse" />
          <div className="panel" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            <p>Noch keine Analysen durchgeführt. Generieren Sie Analysen, um Reports zu exportieren.</p>
          </div>
        </section>
      </main>
    );
  }

  const standaloneCliams = appContext.analyzedClaims.filter(c => !c.projectId);
  const totalSelectableProjects = appContext.fulltextProjects.length + (standaloneCliams.length > 0 ? 1 : 0);

  return (
    <main>
      <section style={{ padding: "40px 0" }}>
        <SectionTitle eyebrow="Berichte" title="Exportiere Audit-Ergebnisse" />

        {/* Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
          <div className="panel">
            <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--color-accent)", marginBottom: 4 }}>
              {appContext.fulltextProjects.length}
            </div>
            <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
              Projekte
            </div>
          </div>
          <div className="panel">
            <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--color-interactive)", marginBottom: 4 }}>
              {appContext.analyzedClaims.length}
            </div>
            <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
              Claims gesamt
            </div>
          </div>
          <div className="panel">
            <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--color-risk-critical)", marginBottom: 4 }}>
              {appContext.getCriticalClaims().length}
            </div>
            <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
              Kritische Risiken
            </div>
          </div>
          <div className="panel">
            <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--color-risk-high)", marginBottom: 4 }}>
              {appContext.getHighRiskClaims().length}
            </div>
            <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
              Hohe Risiken
            </div>
          </div>
        </div>

        {/* Export Formats - Neue erweiterte Export-Optionen */}
        <div style={{ marginBottom: 32 }}>
          <ExportFormats 
            claims={appContext.analyzedClaims.map(claim => ({
              text: claim.text,
              riskScore: claim.riskScore,
              score: claim.riskScore,
              analysis: claim.explanation,
              source: claim.sourceUrl || "Manuelle Eingabe",
              sourceUrl: claim.sourceUrl,
              sourceType: claim.source,
              alternatives: [claim.suggestedRewrite]
            }))}
          />
        </div>

        {/* Legacy CSV Export mit Projektauswahl */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <Button onClick={generateCSVReport} variant="secondary" disabled={selectedProjects.size === 0}>
              📥 CSV-Export (Legacy) ({selectedProjects.size === 0 ? "Keine Auswahl" : `${selectedProjects.size} ${selectedProjects.size === 1 ? "Projekt" : "Projekte"}`})
            </Button>
            <Button 
              onClick={generateFeedbackReport} 
              variant="secondary"
              style={{
                background: "rgba(198, 227, 27, 0.1)",
                border: "2px solid var(--color-accent)"
              }}
            >
              📊 Feedback-Report exportieren ({appContext.getFeedbackData().length})
            </Button>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Button 
              onClick={toggleSelectAll}
              variant="secondary"
              style={{ fontSize: "12px" }}
            >
              {selectedProjects.size === totalSelectableProjects ? "☐ Alle abwählen" : "☑ Alle auswählen"}
            </Button>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              💡 Wählen Sie die Projekte aus, die im CSV-Report enthalten sein sollen
            </span>
          </div>
        </div>

        {/* Feedback-Report Erklärung */}
        {appContext.getFeedbackData().length === 0 && (
          <div style={{ 
            marginBottom: 32, 
            padding: "16px", 
            backgroundColor: "rgba(198, 227, 27, 0.05)", 
            borderRadius: "var(--radius-sm)",
            border: "1px solid rgba(198, 227, 27, 0.2)",
            fontSize: "13px",
            color: "var(--text-secondary)"
          }}>
            <strong>ℹ️ Was ist der Feedback-Report?</strong><br/>
            Der Feedback-Report exportiert manuelle Korrekturen von Claims (z.B. wenn Sie einen automatischen Risiko-Score anpassen). 
            Diese Daten sind wertvoll für Pattern-Training und Algorithmus-Verbesserung. 
            Aktuell liegen noch keine Korrekturen vor.
          </div>
        )}

        {/* Feedback Summary */}
        {appContext.getFeedbackData().length > 0 && (
          <div className="panel" style={{ 
            marginBottom: 32,
            background: "rgba(198, 227, 27, 0.08)",
            border: "1px solid rgba(198, 227, 27, 0.3)"
          }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Feedback-Zusammenfassung</div>
            <h3 style={{ marginTop: 8, fontSize: 18, marginBottom: 16 }}>
              Nutzer-Korrekturen für Pattern-Training
            </h3>
            <div style={{ fontSize: "13px", lineHeight: 1.6, marginBottom: 16 }}>
              💡 <strong>{appContext.getFeedbackData().length} Claims</strong> wurden manuell korrigiert. 
              Diese Daten können verwendet werden, um die Bewertungsregeln zu verbessern und neue Greenwashing-Patterns zu erkennen.
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px",
              }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-medium)" }}>
                    <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: 600 }}>Claim</th>
                    <th style={{ textAlign: "center", padding: "12px 8px", fontWeight: 600 }}>Original</th>
                    <th style={{ textAlign: "center", padding: "12px 8px", fontWeight: 600 }}>Korrigiert</th>
                    <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: 600 }}>Begründung</th>
                  </tr>
                </thead>
                <tbody>
                  {appContext.getFeedbackData().map((feedback, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "12px 8px", maxWidth: "200px", wordBreak: "break-word" }}>
                        {feedback.claimText.substring(0, 60)}...
                      </td>
                      <td style={{ padding: "12px 8px", textAlign: "center" }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: 2 }}>
                          {feedback.originalScore}
                        </div>
                        <div style={{ fontSize: "10px", opacity: 0.7 }}>
                          {feedback.originalLevel}
                        </div>
                      </td>
                      <td style={{ padding: "12px 8px", textAlign: "center" }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-accent)", marginBottom: 2 }}>
                          {feedback.correctedScore}
                        </div>
                        <div style={{ fontSize: "10px", opacity: 0.7 }}>
                          {feedback.correctedLevel}
                        </div>
                      </td>
                      <td style={{ padding: "12px 8px", fontSize: "11px", opacity: 0.8, maxWidth: "250px" }}>
                        {feedback.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Claims nach Projekten gruppiert */}
        <div className="panel">
          <div style={{ marginBottom: 20 }}>
            <div className="eyebrow">Analyse-Report</div>
            <h3 style={{ marginTop: 8, fontSize: 18 }}>Alle erfassten Claims (nach Projekten)</h3>
          </div>

          {/* Volltext-Projekte */}
          {appContext.fulltextProjects.map((project, projectIndex) => {
            const projectClaims = appContext.getProjectClaims(project.id);
            const isExpanded = expandedProjects.has(project.id);

            return (
              <div
                key={project.id}
                style={{
                  marginBottom: "24px",
                  paddingBottom: "16px",
                  borderBottom: projectIndex < appContext.fulltextProjects.length - 1 || standaloneCliams.length > 0
                    ? "2px solid var(--border-medium)" 
                    : "none",
                }}
              >
                {/* Projekt-Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    backgroundColor: "rgba(198,227,27,0.08)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid rgba(198,227,27,0.2)",
                    transition: "all 0.2s ease",
                    marginBottom: isExpanded ? "12px" : "0",
                  }}
                >
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "12px" }}>
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedProjects.has(project.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleProjectSelection(project.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: "18px",
                        height: "18px",
                        cursor: "pointer",
                        accentColor: "var(--color-accent)",
                      }}
                    />
                    
                    {/* Expand/Collapse Arrow */}
                    <span 
                      onClick={() => toggleProject(project.id)}
                      style={{ 
                        fontSize: "14px", 
                        transition: "transform 0.2s ease", 
                        transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                        cursor: "pointer",
                        display: "inline-block",
                        width: "20px"
                      }}
                    >
                      ▶
                    </span>
                    
                    {/* Projekt Info */}
                    <div 
                      onClick={() => toggleProject(project.id)}
                      style={{ flex: 1, cursor: "pointer" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "16px" }}>📄</span>
                        <h4 style={{ fontSize: "14px", fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
                          {project.title}
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", display: "flex", gap: "12px", alignItems: "center" }}>
                    <span>📊 {project.claimCount} Claims</span>
                    <RiskBadge level={project.highestRiskLevel} />
                  </div>
                </div>

                {/* Claims-Tabelle */}
                {isExpanded && (
                  <div style={{ overflowX: "auto", marginTop: "12px" }}>
                    <table style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "12px",
                    }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid var(--border-medium)" }}>
                          <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: 600 }}>Risiko</th>
                          <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: 600 }}>Claim-Text</th>
                          <th style={{ textAlign: "center", padding: "12px 8px", fontWeight: 600 }}>Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectClaims.map((claim) => (
                          <tr key={claim.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                            <td style={{ padding: "12px 8px" }}>
                              <RiskBadge level={claim.riskLevel} />
                            </td>
                            <td style={{ padding: "12px 8px", maxWidth: "400px", wordBreak: "break-word" }}>
                              {claim.text}
                            </td>
                            <td style={{ padding: "12px 8px", textAlign: "center", fontWeight: 600 }}>
                              {claim.riskScore}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}

          {/* Einzelne Claims */}
          {standaloneCliams.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <input
                  type="checkbox"
                  checked={selectedProjects.has("standalone")}
                  onChange={() => toggleProjectSelection("standalone")}
                  style={{
                    width: "18px",
                    height: "18px",
                    cursor: "pointer",
                    accentColor: "var(--color-accent)",
                  }}
                />
                <h4 style={{ fontSize: "14px", fontWeight: 600, margin: 0, color: "var(--text-secondary)" }}>
                  📝 Einzelne Claims (nicht Teil eines Projekts) — {standaloneCliams.length} {standaloneCliams.length === 1 ? "Claim" : "Claims"}
                </h4>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "12px",
                }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--border-medium)" }}>
                      <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: 600 }}>Risiko</th>
                      <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: 600 }}>Claim-Text</th>
                      <th style={{ textAlign: "center", padding: "12px 8px", fontWeight: 600 }}>Score</th>
                      <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: 600 }}>Quelle</th>
                      <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: 600 }}>Zeit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standaloneCliams.map((claim) => (
                      <tr key={claim.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "12px 8px" }}>
                          <RiskBadge level={claim.riskLevel} />
                        </td>
                        <td style={{ padding: "12px 8px", maxWidth: "300px", wordBreak: "break-word" }}>
                          {claim.text}
                        </td>
                        <td style={{ padding: "12px 8px", textAlign: "center", fontWeight: 600 }}>
                          {claim.riskScore}
                        </td>
                        <td style={{ padding: "12px 8px", fontSize: "10px", color: "var(--text-muted)" }}>
                          {claim.sourceUrl ? claim.sourceUrl.substring(0, 20) + "..." : "Manuell"}
                        </td>
                        <td style={{ padding: "12px 8px", fontSize: "10px", color: "var(--text-muted)" }}>
                          {new Date(claim.timestamp).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
