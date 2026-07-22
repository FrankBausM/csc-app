"use client";

import { useState } from "react";
import { TextInput, Button, Select } from "./ui";
import { analyzeClaim, extractClaimsFromText } from "../lib/appContext";
import { HighlightedText, RiskBadge } from "./HighlightedText";
import { useAppContext } from "../app/AppContext";

interface URLAnalysisResult {
  url: string;
  title: string;
  text: string;
  claims: Array<{
    id: string;
    text: string;
    riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    riskScore: number;
    explanation: string;
    suggestedRewrite: string;
  }>;
}

// Simulate web content analysis (in production, this would call a backend API)
const generateRealisticContent = (url: string): string => {
  // Verschiedene Inhaltstypen basierend auf URL-Pattern
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes("sustainability") || urlLower.includes("nachhaltigkeit") || urlLower.includes("csr")) {
    return `
Nachhaltigkeitsbericht 2025

Unsere Vision für eine grüne Zukunft:
Wir haben 100% nachhaltige Produkte entwickelt. Alle unsere Produkte sind klimaneutral und verwenden ausschließlich recycelte Materialien.
Unsere Verpackung ist komplett ökologisch abbaubar. Wir garantieren die höchsten Umweltstandards.

Emissionsreduktion:
Die Emissionen wurden um 50% seit 2020 reduziert. Durch innovative Verfahren erreichen wir kontinuierliche Verbesserungen.
100% der Energie stammt von erneuerbaren Quellen. Wir haben eine Netto-Null-Strategie bis 2030 implementiert.

Lieferkettentransparenz:
Alle Lieferketten entsprechen höchsten Standards. Jeder Partner wird jährlich auditiert.
Wir setzen auf faire Arbeitsbedingungen und unterstützen lokale Gemeinschaften.

Zertifizierungen:
ISO 14001 Environmental Management System
B Corp Certified
Carbon Trust Standard
    `;
  } else if (urlLower.includes("environmental") || urlLower.includes("umwelt")) {
    return `
Umweltmanagement und Compliance:
Unser Unternehmen ist vollständig CO2-neutral. Wir haben alle Emissionen kompensiert.
Die Wassernutzung wurde um 60% gesenkt gegenüber dem Vorjahr.
100% unseres Abfalls wird recycelt oder wiederverwendet. Keine Deponierungen finden statt.

Biodiversity Programme:
Wir schützen bedrohte Arten durch gezielte Investitionen. 500 Hektar Regenwald wurden wiederaufgeforstet.
Alle unsere Standorte nutzen nachhaltige Landwirtschaft.
    `;
  } else if (urlLower.includes("product") || urlLower.includes("produkt")) {
    return `
Produktlinie Nachhaltigkeit:
Alle Produkte sind 100% umweltfreundlich und nachhaltig. Wir verwenden nur natürliche, biologische Materialien.
Die Verpackung besteht zu 100% aus recyceltem Kunststoff. Komplett plastikfrei und biologisch abbaubar.
Emissionsfreie Produktion und CO2-neutrale Lieferung inklusive.

Qualitätsstandards:
Höchste internationale Zertifikate und Standards erfüllt. Alle Tests von unabhängigen Instituten bestätigt.
    `;
  } else {
    return `
Unternehmenswebseite: ${url}

Unternehmensverpflichtung zu Nachhaltigkeit:
Wir sind vollständig CO2-neutral seit 2024. Alle Prozesse wurden optimiert.
100% erneuerbare Energien nutzen wir bereits heute. Unser Ziel: Netto-Negativ bis 2030.

Nachhaltige Praktiken:
Alle Mitarbeiter arbeiten nach strengsten Nachhaltigkeitskriterien. Keine Kompromisse bei Umweltschutz.
Wir investieren 10% unseres Budgets in grüne Technologien.
    `;
  }
};

const simulateWebAnalysis = async (url: string): Promise<URLAnalysisResult> => {
  // Rufe die echte Backend-API auf
  const response = await fetch("/api/analyze-website", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(errorData.error || `Website konnte nicht geladen werden (HTTP ${response.status})`);
  }

  const data = await response.json();
  
  // Validierung: Stelle sicher, dass claims vorhanden sind
  if (!data.claims || data.claims.length === 0) {
    throw new Error("Keine analysierbaren Claims auf der Website gefunden");
  }
  
  return data;
};

export function URLAnalyzer() {
  const appContext = useAppContext();
  const [url, setUrl] = useState("");
  const [assetType, setAssetType] = useState("WEBSITE");
  const [analysisResult, setAnalysisResult] = useState<URLAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyzeURL = async () => {
    if (!url.trim()) {
      alert("Bitte geben Sie eine gültige URL ein.");
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null); // Reset vorherige Ergebnisse
    
    try {
      const result = await simulateWebAnalysis(url);
      
      // Automatisch als Projekt speichern
      const projectTitle = result.title || `Website-Analyse: ${new URL(url).hostname}`;
      const claims = result.claims.map((claim, index) => ({
        text: claim.text,
        riskLevel: claim.riskLevel,
        riskScore: claim.riskScore,
        explanation: claim.explanation,
        suggestedRewrite: claim.suggestedRewrite,
        source: "url" as const,
        sourceUrl: url,
        textPosition: index,
      }));
      
      // Projekt erstellen
      appContext.addFulltextProject(projectTitle, result.text, claims);
      
      setAnalysisResult(result);
      console.log("✅ URL-Analyse abgeschlossen und als Projekt gespeichert:", projectTitle);
    } catch (error) {
      console.error("Fehler bei URL-Analyse:", error);
      alert(`Fehler beim Analysieren der Website:\n\n${error instanceof Error ? error.message : "Unbekannter Fehler"}\n\nBitte überprüfen Sie die URL und versuchen Sie es erneut.`);
    } finally {
      setIsLoading(false);
    }
  };

  if (analysisResult) {
    const criticalClaims = analysisResult.claims.filter(c => c.riskLevel === "CRITICAL").length;
    const highClaims = analysisResult.claims.filter(c => c.riskLevel === "HIGH").length;

    return (
      <div style={{ marginTop: 20 }}>
        {/* Analysis Summary */}
        <div className="panel" style={{ marginBottom: 20, borderColor: "var(--border-accent)", backgroundColor: "rgba(198,227,27,0.03)" }}>
          <div style={{ marginBottom: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>✓ Analyse abgeschlossen</div>
            <div style={{ fontSize: "16px", fontWeight: 500, marginBottom: 8 }}>{url}</div>
            <div style={{ color: "var(--text-secondary)" }}>
              {analysisResult.claims.length} Claims erkannt
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ padding: "12px", backgroundColor: "rgba(224,85,85,0.1)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ fontSize: "20px", fontWeight: 600, color: "var(--color-risk-critical)" }}>
                {criticalClaims}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: 4 }}>KRITISCH</div>
            </div>
            <div style={{ padding: "12px", backgroundColor: "rgba(212,120,58,0.1)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ fontSize: "20px", fontWeight: 600, color: "var(--color-risk-high)" }}>
                {highClaims}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: 4 }}>HOCH</div>
            </div>
            <div
              style={{
                padding: "12px",
                backgroundColor: "rgba(198,227,27,0.1)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <div style={{ fontSize: "20px", fontWeight: 600, color: "var(--color-accent)" }}>
                {analysisResult.claims.length - criticalClaims - highClaims}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: 4 }}>OK</div>
            </div>
          </div>

          <Button onClick={() => setAnalysisResult(null)} variant="secondary">
            Neue URL überprüfen
          </Button>
        </div>

        {/* Highlighted Content */}
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Analysierter Text (kritische Abschnitte hervorgehoben)</div>
          <div
            style={{
              padding: "16px",
              backgroundColor: "rgba(255,255,255,0.02)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
              fontSize: "14px",
              lineHeight: 1.8,
            }}
          >
            <HighlightedText text={analysisResult.text} />
          </div>
        </div>

        {/* Claims Details */}
        <div className="panel">
          <div className="eyebrow" style={{ marginBottom: 16 }}>Erkannte Claims im Detail</div>
          {analysisResult.claims.map((claim, i) => (
            <div className="row" key={claim.id} style={{ borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 8 }}>
                  <RiskBadge level={claim.riskLevel} />
                  <div style={{ flex: 1 }}>
                    <div className="row-title" style={{ fontWeight: 500 }}>
                      {claim.text}
                    </div>
                  </div>
                </div>
                <div className="row-meta" style={{ marginTop: 8 }}>
                  {claim.explanation}
                </div>
                <div
                  style={{
                    marginTop: 12,
                    padding: "12px",
                    backgroundColor: "rgba(198,227,27,0.05)",
                    borderRadius: "var(--radius-sm)",
                    borderLeft: "3px solid var(--color-accent)",
                    color: "var(--text-secondary)",
                    fontSize: "13px",
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 6, color: "var(--color-accent)" }}>Verbesserungsvorschlag:</div>
                  {claim.suggestedRewrite}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <TextInput
        label="Website oder Webseiten-Link"
        placeholder='z.B. "https://example.com/sustainability"'
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <Select
        label="Asset-Typ"
        value={assetType}
        onChange={(e) => setAssetType(e.target.value)}
        options={[
          { value: "WEBSITE", label: "Website" },
          { value: "PRESS_RELEASE", label: "Pressemitteilung" },
          { value: "REPORT", label: "Report/Whitepaper" },
          { value: "SOCIAL_MEDIA", label: "Social Media Post" },
          { value: "ADVERTISEMENT", label: "Werbeanzeige" },
        ]}
      />

      <Button onClick={handleAnalyzeURL} variant="primary" disabled={isLoading}>
        {isLoading ? "Wird analysiert..." : "URL analysieren"}
      </Button>

      <div style={{ marginTop: 12, fontSize: "12px", color: "var(--text-muted)" }}>
        💡 Beispiel-URLs zum Testen:
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
          <span><strong>→ </strong>https://example.com/sustainability</span>
          <span><strong>→ </strong>https://company.de/nachhaltigkeit</span>
          <span><strong>→ </strong>https://example.com/environmental-policy</span>
          <span><strong>→ </strong>https://company.com/products</span>
        </div>
      </div>
    </div>
  );
}
