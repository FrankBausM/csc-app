// Lädt die versionierte Rechtsgrundlage (lib/legal-rules.json) und stellt sie
// typisiert für den Rest der App bereit. Dies ist die EINZIGE Stelle, an der
// legal-rules.json in Code umgewandelt wird (z.B. Regex-Strings -> RegExp).
//
// Wichtig für Updates: Wenn sich Gesetze/Fristen ändern, reicht es in der Regel,
// lib/legal-rules.json zu bearbeiten. Dieser Loader und die Konsumenten
// (z.B. lib/appContext.ts) müssen dafür NICHT angefasst werden, solange nur
// Werte (nicht die Struktur/Feldnamen) geändert werden.

import rulesData from "./legal-rules.json";

export interface RegulatorySource {
  url: string;
  label: string;
}

export interface RedFlagRuleDefinition {
  id: string;
  pattern: string;
  flags: string;
  risk: number;
  type: string;
  legalBasis: string;
}

export interface CompiledRedFlagRule {
  id: string;
  pattern: RegExp;
  risk: number;
  type: string;
  legalBasis: string;
}

export interface GreenwashPhrase {
  phrase: string;
  context: string;
}

interface LegalRulesData {
  _readme: string;
  meta: { version: string; lastReviewed: string; reviewedBy: string };
  deadlines: {
    empcoAdopted: string;
    empcoTranspositionDeadline: string;
    empcoFullApplication: string;
    germanPartialEffect: string;
    notes: string;
  };
  sanctions: { maxFinePercentOfRevenue: number; notes: string };
  germanImplementation: {
    law: string;
    bgblReference: string;
    publishedDate: string;
    implementsDirective: string;
  };
  legalCases: Record<string, { court: string; date: string; gist: string }>;
  sources: Record<string, RegulatorySource>;
  bannedTerms: string[];
  approvedLabels: string[];
  greenwashingIndicators: {
    absoluteWords: string[];
    superlatives: string[];
    redFlags: RedFlagRuleDefinition[];
    greenwashPhrases: GreenwashPhrase[];
  };
  changelog: { date: string; change: string }[];
}

const data = rulesData as LegalRulesData;

// ── Versionsinfo (z.B. für Debug-Ausgaben oder ein künftiges "Regelwerk-Stand"-Label in der UI) ──
export const RULES_VERSION = data.meta.version;
export const RULES_LAST_REVIEWED = data.meta.lastReviewed;

// ── Fristen & Sanktionen ──
export const LEGAL_DEADLINES = data.deadlines;
export const LEGAL_SANCTIONS = data.sanctions;
export const GERMAN_IMPLEMENTATION = data.germanImplementation;
export const LEGAL_CASES = data.legalCases;

function formatGermanDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}.${month}.${year}`;
}

/** z.B. "27.09.2026" — für Texte wie "Deadline EmpCo: {{deadline}}" */
export const EMPCO_DEADLINE_TEXT = formatGermanDate(
  data.deadlines.empcoFullApplication
);

/** z.B. "Mind. 4% Jahresumsatz" */
export const EMPCO_SANCTION_TEXT = `Mind. ${data.sanctions.maxFinePercentOfRevenue}% Jahresumsatz`;

// ── Quellen (Gesetze, ISO-Normen, Zertifizierungen, Studien) ──
export const REGULATORY_SOURCES: Record<string, RegulatorySource> =
  data.sources;

// ── Kernbegriffe für die Claim-Analyse ──
export const EMPCO_BANNED_TERMS: string[] = data.bannedTerms;
export const EMPCO_APPROVED_LABELS: string[] = data.approvedLabels;

// ── Greenwashing-Indikatoren (inkl. kompilierter Regex-Red-Flags) ──
const compiledRedFlags: CompiledRedFlagRule[] =
  data.greenwashingIndicators.redFlags.map((rule) => ({
    id: rule.id,
    pattern: new RegExp(rule.pattern, rule.flags),
    risk: rule.risk,
    type: rule.type,
    legalBasis: rule.legalBasis,
  }));

export const GREENWASHING_INDICATORS = {
  absoluteWords: data.greenwashingIndicators.absoluteWords,
  superlatives: data.greenwashingIndicators.superlatives,
  redFlags: compiledRedFlags,
  greenwashPhrases: data.greenwashingIndicators.greenwashPhrases,
};

export function getSourceUrl(sourceKey: string): string | undefined {
  return data.sources[sourceKey]?.url;
}

export const LEGAL_RULES_CHANGELOG = data.changelog;
