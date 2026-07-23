"use client";

import { useState } from "react";
import { SectionTitle, TextInput, Button } from "../../components/ui";
import { SourceLink } from "../../components/SourceLink";
import { useAppContext } from "../AppContext";
import { RiskBadge } from "../../components/HighlightedText";

interface NewEvidence {
  title: string;
  evidenceType: string;
  issuer: string;
  validity: string;
  file?: File | null;
}

export default function EvidencePage() {
  const appContext = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<NewEvidence>({
    title: "",
    evidenceType: "STUDY",
    issuer: "",
    validity: "",
    file: null,
  });
  const [userEvidence, setUserEvidence] = useState<any[]>([]);

  const handleAddEvidence = () => {
    if (!formData.title.trim() || !formData.issuer.trim()) {
      alert("Bitte füllen Sie mindestens Titel und Aussteller aus.");
      return;
    }

    const newEvidence = {
      id: `e${Date.now()}`,
      title: formData.title,
      evidenceType: formData.evidenceType,
      issuer: formData.issuer,
      validity: formData.validity || "VALID TO 2026-12-31",
      verificationStatus: "PENDING",
      linkedClaims: 0,
    };

    setUserEvidence([...userEvidence, newEvidence]);
    setFormData({
      title: "",
      evidenceType: "STUDY",
      issuer: "",
      validity: "",
      file: null,
    });
    setShowForm(false);
  };

  // Claims die Evidenz benötigen
  const claimsNeedingEvidence = [
    ...appContext.getCriticalClaims(),
    ...appContext.getHighRiskClaims(),
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      VERIFIED: "var(--color-risk-low)",
      PENDING: "var(--color-risk-medium)",
      EXPIRED: "var(--color-risk-critical)",
    };
    return colors[status] || "var(--text-secondary)";
  };

  return (
    <main>
      <section style={{ padding: "40px 0" }}>
        <SectionTitle eyebrow="Evidenz-Hub" title="Nachweise für analysierte Claims" />

        {/* Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
          <div className="panel">
            <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--color-accent)", marginBottom: 4 }}>
              {claimsNeedingEvidence.length}
            </div>
            <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
              Claims benötigen Evidenz
            </div>
          </div>
          <div className="panel">
            <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--color-risk-critical)", marginBottom: 4 }}>
              {appContext.getCriticalClaims().length}
            </div>
            <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
              Kritisch
            </div>
          </div>
          <div className="panel">
            <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--color-interactive)", marginBottom: 4 }}>
              {userEvidence.length}
            </div>
            <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
              Hochgeladene Nachweise
            </div>
          </div>
        </div>

        {/* Add Evidence Button */}
        {!showForm && (
          <Button onClick={() => setShowForm(true)} variant="primary" style={{ marginBottom: 20 }}>
            + Neuer Nachweis
          </Button>
        )}

        {/* Recognized Certifications */}
        <div className="panel" style={{ marginBottom: 28, background: "rgba(198, 227, 27, 0.05)", border: "1px solid rgba(198, 227, 27, 0.2)" }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Anerkannte Zertifizierungen</div>
          <h3 style={{ fontSize: "16px", fontWeight: 600, marginTop: 0, marginBottom: 16 }}>
            Akzeptierte Nachweise für Claims
          </h3>
          <div style={{ fontSize: "13px", lineHeight: 1.8 }}>
            <div style={{ marginBottom: 16 }}>
              Die folgenden Zertifizierungen werden als gültige Nachweise für Nachhaltigkeits-Claims anerkannt:
            </div>
            

            <div style={{ marginBottom: 16, fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>
              Beispiele: <SourceLink sourceKey="ISO 14064">ISO 14064</SourceLink>-Zertifikat, <SourceLink sourceKey="EU Ecolabel">EU Ecolabel</SourceLink>-Nachweis, <SourceLink sourceKey="Science Based Targets">SBTi</SourceLink>-Validierung
            </div>
            <div style={{ marginBottom: 12, fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.7 }}>
              EU & Deutsche Labels
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px", marginBottom: 16 }}>
              <div>• <SourceLink sourceKey="EU Ecolabel">EU Ecolabel</SourceLink></div>
              <div>• <SourceLink sourceKey="Blauer Engel">Blauer Engel</SourceLink></div>
              <div>• <SourceLink sourceKey="Nordic Swan">Nordic Swan Ecolabel</SourceLink></div>
              <div>• <SourceLink sourceKey="EMAS">EMAS</SourceLink></div>
            </div>
            
            <div style={{ marginBottom: 12, fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.7 }}>
              Klima & CO₂
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px", marginBottom: 16 }}>
              <div>• <SourceLink sourceKey="Science Based Targets">Science Based Targets</SourceLink></div>
              <div>• <SourceLink sourceKey="ISO 14064">ISO 14064</SourceLink> (THG-Inventar)</div>
              <div>• <SourceLink sourceKey="ISO 14067">ISO 14067</SourceLink> (CO₂-Fußabdruck)</div>
              <div>• <SourceLink sourceKey="Gold Standard">Gold Standard</SourceLink></div>
              <div>• <SourceLink sourceKey="VCS">Verified Carbon Standard</SourceLink></div>
              <div>• <SourceLink sourceKey="GHG Protocol">GHG Protocol</SourceLink></div>
            </div>
            
            <div style={{ marginBottom: 12, fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.7 }}>
              Branchen-spezifisch
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px", marginBottom: 16 }}>
              <div>• <SourceLink sourceKey="FSC">FSC</SourceLink> (Holz/Papier)</div>
              <div>• <SourceLink sourceKey="MSC">MSC</SourceLink> (Fischerei)</div>
              <div>• <SourceLink sourceKey="GOTS">GOTS</SourceLink> (Textil)</div>
              <div>• <SourceLink sourceKey="Cradle to Cradle">Cradle to Cradle</SourceLink></div>
              <div>• <SourceLink sourceKey="B Corp">B Corp Certification</SourceLink></div>
            </div>
          </div>
        </div>

        {/* Add Evidence Form */}
        {showForm && (
          <div className="panel" style={{ marginBottom: 20 }}>
            <div className="eyebrow" style={{ marginBottom: 16 }}>Neuen Nachweis hochladen</div>

            <TextInput
              label="Nachweis-Titel"
              placeholder="z.B. ISO 14067 Product Carbon Footprint Study 2025"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <TextInput
              label="Ausstellende Organisation"
              placeholder="z.B. Independent Auditor GmbH"
              value={formData.issuer}
              onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
            />

            <div style={{ display: "flex", gap: 12 }}>
              <Button onClick={handleAddEvidence} variant="primary">
                Hochladen
              </Button>
              <Button onClick={() => setShowForm(false)} variant="secondary">
                Abbrechen
              </Button>
            </div>
          </div>
        )}

        {/* User Evidence List */}
        {userEvidence.length > 0 && (
          <div className="panel" style={{ marginBottom: 28 }}>
            <div className="eyebrow" style={{ marginBottom: 16 }}>Hochgeladene Nachweise</div>
            {userEvidence.map((e, i) => (
              <div key={e.id} style={{ borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)", paddingTop: i === 0 ? 0 : 16, paddingBottom: 16 }}>
                <div className="row-title">{e.title}</div>
                <div className="row-meta">Aussteller: {e.issuer}</div>
              </div>
            ))}
          </div>
        )}

        {/* Claims Needing Evidence */}
        {claimsNeedingEvidence.length === 0 ? (
          <div className="panel" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            <p>Alle Claims haben ausreichende Risiko-Bewertungen. Keine Evidenz erforderlich.</p>
          </div>
        ) : (
          <div className="panel">
            <div className="eyebrow" style={{ marginBottom: 16 }}>Claim-Liste (Evidenzanforderung)</div>
            {claimsNeedingEvidence.map((claim, i) => (
              <div key={claim.id} style={{ borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)", padding: "16px 0" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 12, marginBottom: 8, alignItems: "center" }}>
                      <RiskBadge level={claim.riskLevel} />
                      <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>Score: {claim.riskScore}</span>
                    </div>
                    <div className="row-title">{claim.text}</div>
                    <div className="row-meta" style={{ marginTop: 8, color: "rgba(255,255,255,0.75)" }}>{claim.explanation}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
