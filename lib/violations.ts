import { RuleViolation } from "../app/AppContext";

/**
 * Generiert potenzielle Regelbrüche basierend auf den Analysierte Quellen
 * Wird bei der automatischen Claim-Analyse verwendet
 */
export function generateViolationsForClaim(
  text: string,
  riskScore: number,
  riskLevel: string
): RuleViolation[] {
  const violations: RuleViolation[] = [];

  // EmpCo-Richtlinie Checks
  if (text.toLowerCase().includes("100%") || text.toLowerCase().includes("vollständig")) {
    violations.push({
      rule: "Absolute Claims vermeiden",
      source: "EmpCo-Richtlinie",
      description:
        "Absolute Aussagen wie '100% nachhaltig' oder 'vollständig grün' sind schwer zu substanziieren und können als Greenwashing interpretiert werden.",
      recommendation:
        "Verwenden Sie quantifizierbare und nachweisbare Aussagen, z.B. 'um 50% reduziert' statt 'vollständig grün'",
    });
  }

  // Textile Exchange - Materials Reporting
  if (
    text.toLowerCase().includes("nachhaltig") &&
    !text.toLowerCase().includes("zertifiziert")
  ) {
    violations.push({
      rule: "Fehlende Zertifizierung bei Materialclaims",
      source: "Textile Exchange Materials Report 2025",
      description:
        "Nachhaltige Materialclaims sollten durch anerkannte Zertifizierungen (z.B. FSC, GOTS, EU Ecolabel) belegt sein.",
      recommendation:
        "Fügen Sie Zertifizierungsnummern oder Links zu Zertifikaten hinzu",
    });
  }

  // CSRD/ESRS Compliance
  if (text.toLowerCase().includes("einsparung") && riskScore > 60) {
    violations.push({
      rule: "CSRD/ESRS Berichtspflicht",
      source: "CSRD/ESRS 2026",
      description:
        "Quantitative Einsparungsaussagen müssen im Einklang mit der Nachhaltigkeitsberichterstattung stehen und verifizierbar sein.",
      recommendation:
        "Dokumentieren Sie die Berechnung und verlinken Sie zur CSRD-Berichterstattung",
    });
  }

  // LPB Greenwashing Prevention
  if (riskLevel === "CRITICAL" || riskScore > 75) {
    violations.push({
      rule: "Greenwashing-Verdacht",
      source: "Bundeszentrale für politische Bildung (LPB)",
      description:
        "Der Claim weist Charakteristiken von Greenwashing auf: unpräzise Aussagen, fehlende Evidenz oder Marketing-Fokus statt substanzielle Verbesserungen.",
      recommendation:
        "Überarbeiten Sie den Claim mit konkreten Facts, Zahlen und anerkannten Standards",
    });
  }

  // PwC Sustainability Standards
  if (
    text.toLowerCase().includes("reduktion") ||
    text.toLowerCase().includes("verbesserung")
  ) {
    violations.push({
      rule: "Baseline und Zeitrahmen erforderlich",
      source: "PwC Sustainability Analysis",
      description:
        "Alle Verbesserungsaussagen müssen eine klare Baseline (Ausgangswert) und einen Zeitrahmen haben.",
      recommendation:
        "Präzisieren Sie: 'um 30% reduziert seit 2020' statt nur 'reduziert'",
    });
  }

  // EU Taxonomy Alignment
  if (text.toLowerCase().includes("umwelt") && riskScore > 50) {
    violations.push({
      rule: "EU-Taxonomie Konformität",
      source: "EU Taxonomie-Verordnung",
      description:
        "Aussagen zu Umweltauswirkungen sollten der EU-Taxonomie für nachhaltige Aktivitäten entsprechen.",
      recommendation:
        "Validieren Sie Ihren Claim gegen die sechs EU-Umweltziele",
    });
  }

  return violations;
}

/**
 * Validiert einen Claim gegen bekannte Greenwashing-Indikatoren
 */
export function calculateRiskScoreWithViolations(
  violations: RuleViolation[]
): number {
  const baseScore = violations.length * 15; // 15 Punkte pro Regelbruch
  return Math.min(baseScore, 100); // Max 100
}
