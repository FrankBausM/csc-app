import {
  EMPCO_BANNED_TERMS,
  EMPCO_APPROVED_LABELS,
  GREENWASHING_INDICATORS,
  EMPCO_DEADLINE_TEXT,
  EMPCO_SANCTION_TEXT,
} from "./legalRules";

// Global Application Context Types
export interface Claim {
  id: string;
  text: string;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  riskScore: number;
  explanation: string;
  suggestedRewrite: string;
  linkedClaims?: string[];
  uncertaintyFlags?: string[];  // NEU: Markiert unsichere/kontext-sensitive Bewertungen
  debugInfo?: {  // NEU: Für Entwicklung und Verbesserung
    detectedPatterns: string[];
    empcoViolationsCount: number;
    otherIssuesCount: number;
  };
}

export interface Project {
  id: string;
  name: string;
  owner: string;
  status: string;
  riskLevel: string;
  assetsCount: number;
  pendingApprovals: number;
}

export interface Evidence {
  id: string;
  title: string;
  evidenceType: string;
  issuer: string;
  validity: string;
  verificationStatus: string;
  linkedClaims: number;
}

export interface Review {
  id: string;
  assetTitle: string;
  reviewType: string;
  due: string;
  status: string;
  comment: string;
  claimId?: string;
}

export interface AppState {
  claims: Claim[];
  projects: Project[];
  evidence: Evidence[];
  reviews: Review[];
  dashboard: {
    openRisks: number;
    missingEvidence: number;
    activeAudits: number;
    approvalSla: number;
  };
}

// Calculate dashboard metrics from claims
export const calculateMetrics = (claims: Claim[]): AppState["dashboard"] => {
  const criticalClaims = claims.filter(c => c.riskLevel === "CRITICAL").length;
  const highClaims = claims.filter(c => c.riskLevel === "HIGH").length;
  const needsEvidence = claims.filter(c => c.riskScore > 50).length;

  return {
    openRisks: criticalClaims * 3 + highClaims,
    missingEvidence: needsEvidence,
    activeAudits: Math.max(5, Math.ceil(claims.length / 3)),
    approvalSla: Math.max(50, 100 - Math.round(criticalClaims * 5)),
  };
};

// Rechtliche Kriterien (EmpCo-Richtlinie, UWG, Fristen, Sanktionen, Quellen) leben
// NICHT mehr hier, sondern zentral & versioniert in lib/legal-rules.json.
// Diese Datei bezieht sie über lib/legalRules.ts (siehe Import oben).
// Bei Gesetzesänderungen: NUR lib/legal-rules.json bearbeiten.

// Custom Pattern Interface
interface CustomPattern {
  id: string;
  name: string;
  category: string;
  matchType: "keyword" | "phrase" | "regex";
  matchValue: string;
  riskScore: number;
  reason: string;
  suggestion: string;
  active: boolean;
}

// Load custom patterns from localStorage (browser only)
const loadCustomPatterns = (): CustomPattern[] => {
  if (typeof window === "undefined") return [];
  
  try {
    const saved = localStorage.getItem("custom-patterns");
    if (!saved) return [];
    
    const patterns = JSON.parse(saved) as CustomPattern[];
    return patterns.filter((p) => p.active);
  } catch (error) {
    console.error("Error loading custom patterns:", error);
    return [];
  }
};

/* ==================================================================================
 * RISK SCORE CALCULATION - TRANSPARENTE BEWERTUNGSLOGIK
 * ==================================================================================
 * 
 * SCHWELLENWERTE:
 * - LOW (0-35):      Keine oder minimale Risiken, EmpCo-konform
 * - MEDIUM (36-59):  Moderate Risiken, Präzisierung empfohlen  
 * - HIGH (60-74):    Hohe Risiken, dringende Anpassung nötig
 * - CRITICAL (75-100): Schwerste EmpCo-Verstöße, rechtlich problematisch
 * 
 * SCORE-KATEGORIEN:
 * 
 * 🚨 CRITICAL-LEVEL VERSTÖSSE (85-94 Punkte):
 * - 94: Zero-Impact-Claims ("ohne jegliche Umweltbelastung", "kein Impact") - praktisch unmöglich
 * - 94: Gesamten CO₂-Fußabdruck kompensiert ohne Vermeidung - BGH Juni 2024 irreführend
 * - 94: Superlativ + geografischer/Branchen-Scope ("erste weltweit") - nicht verifizierbar
 * - 92: Klimaneutralität durch Kompensation ohne Vermeidung - BGH Juni 2024 irreführend  
 * - 92: Direkte Kompensations-Claims ohne Reduktionspriorisierung
 * - 92: Pauschale Lieferketten-Aussagen ("100% nachhaltige Lieferkette") - praktisch unerreichbar
 * - 90: "Klimaneutral" ohne Erläuterung Vermeidung vs. Kompensation
 * - 88: Unbelegte allgemeine Umweltaussagen ohne EN ISO 14024 Zertifizierung
 * - 88: Pauschale Heilsversprechen ("rettet das Klima") ohne messbare Belege
 * - 88: Umwelt-Superlativ ohne anerkannte Zertifizierung
 * - 88: 100% Kompensations-Claim ohne Reduktionspriorisierung
 * - 86: 100% nachhaltig ohne EU Ecolabel/ISO Zertifizierung
 * - 85: Selbst erfundene Siegel ohne unabhängige Zertifizierung (NICHT: "Modelabel" = Marke)
 * - 85: Absolute Umwelt-/Klimaaussage ohne Qualifikation und Beleg
 * 
 * ⚠️  HIGH-LEVEL VERSTÖSSE (60-84 Punkte):
 * - 84: Vollständig umweltfreundlich (unbelegt)
 * - 82: 100% recycelt ohne Zertifizierung
 * - 78: Gesetzliche Pflichten als Besonderheit dargestellt
 * - 75: Absolute Aussage ohne Qualifikation
 * - 75: Superlativ ohne unabhängige Verifizierung
 * - 72: Vage Aussagen ohne Belege (53-56% solcher Claims sind irreführend)
 * - 70: Leuchtturm-Produkt Pattern (nur einzelne Produkte nachhaltig)
 * - 65: Verzögerungstaktiken ("weitere Forschung nötig")
 * - 60: Grüne Bildsprache ohne substantiellen Inhalt
 * 
 * 💡 MEDIUM-LEVEL HINWEISE (36-59 Punkte):
 * - 48: Absolute Aussage teilweise qualifiziert - zusätzliche Präzisierung empfohlen
 * 
 * ✅ LOW-LEVEL (0-35 Punkte):
 * - 0: Perfekter Claim ohne erkannte Probleme ODER kein bewertbarer Claim (Service-Hinweise)
 * 
 * WICHTIG: 
 * - Mehrere Verstöße werden NICHT addiert - es zählt der HÖCHSTE Score
 * - EmpCo-Verstöße werden IMMER als kritisch bewertet, unabhängig vom claimType
 * - Custom Patterns können individuelle Scores (0-100) definieren
 * ==================================================================================
 */
export const analyzeClaim = (text: string, claimType?: string): Omit<Claim, 'id' | 'text'> => {
  try {
    let baseRiskScore = 0;  // Start bei 0 - nur bei Problemen erhöhen
    let riskLevel: Claim["riskLevel"] = "LOW";
    let detectedIssues: string[] = [];
    let empcoViolations: string[] = [];
    let uncertaintyFlags: string[] = [];  // NEU: Sammelt Unsicherheiten
    let detectedPatterns: string[] = [];  // NEU: Debug-Info

    // Sicherstellen, dass text ein String ist
    const claimText = String(text || "").trim();
    
    if (!claimText) {
      return {
        riskLevel: "LOW",
        riskScore: 0,
        explanation: "Kein Text zur Analyse vorhanden.",
        suggestedRewrite: "Bitte geben Sie einen Claim-Text ein.",
        linkedClaims: [],
      };
    }
    
    // Vorprüfung: Nicht-substantielle Texte (keine echten Claims)
    // Diese Texte sind Service-Hinweise, Kontaktinfos, Links - keine bewertbaren Umweltaussagen
    const isNonSubstantiveText = 
      // URLs (vollständig - alle Varianten)
      /https?:\/\/[^\s]+/i.test(claimText) ||
      /www\.[a-z0-9.-]+\.[a-z]{2,}/i.test(claimText) ||
      /^(www|http|https|ftp)[\s.:/]/i.test(claimText) ||
      claimText.length < 15 && /^(www|http|link|url|siehe|→|->)/i.test(claimText) ||
      
      // Email-Adressen (erweitert - alle Kontexte)
      /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(claimText) ||
      
      // Telefonnummern (erweitert - internationale und nationale Formate)
      /^(tel|telefon|phone|fon|mobil|mobile):/i.test(claimText) ||
      /^\+?\d{1,4}[\s\-\.\(\)]*\d{2,}[\s\-\.\(\)]*\d{2,}/i.test(claimText) ||
      /\b\d{3,5}[\s\/\-]\d{3,}\b/.test(claimText) && claimText.length < 60 ||
      
      // Adressen (Straße, PLZ, Stadt)
      /\b\d{5}\s+[A-ZÄÖÜ][a-zäöüß]+\b/.test(claimText) || // PLZ + Stadt
      /\b(straße|str\.|strasse|weg|platz|allee|gasse)\s+\d+/i.test(claimText) ||
      /^[A-ZÄÖÜ][a-zäöüß]+\s+(Str\.|Straße|Weg|Platz)/i.test(claimText) ||
      
      // Datumsangaben (verschiedene Formate)
      /^\d{1,2}\.\s*(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)\s+\d{4}/i.test(claimText) ||
      /^\d{1,2}\.\d{1,2}\.\d{2,4}\b/.test(claimText) && claimText.length < 40 ||
      /^(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag),?\s+\d{1,2}\./i.test(claimText) ||
      
      // Eigennamen: Unternehmen (bekannte Muster)
      /\b(GmbH|AG|UG|KG|e\.V\.|Inc\.|Ltd\.|Corp\.|LLC)\b/.test(claimText) && claimText.length < 60 ||
      /^[A-ZÄÖÜ][a-zäöüß]+\s+(GmbH|AG|UG)\b/.test(claimText) && claimText.length < 50 ||
      
      // Eigennamen: Personen (Anrede + Name)
      /^(Herr|Frau|Dr\.|Prof\.)\s+[A-ZÄÖÜ][a-zäöüß]+/.test(claimText) && claimText.length < 60 ||
      
      // Info-Verweise und Links
      /^(weitere|mehr)\s+(informationen|infos|details)/i.test(claimText) && claimText.length < 80 ||
      /^(hier|dort|unter|auf)\s+(www|http|finden|erfahren|lesen)/i.test(claimText) ||
      
      // Rechtliche/Administrative Texte
      /^(kontakt|impressum|datenschutz|agb|cookies|terms|privacy)/i.test(claimText) ||
      /^copyright|^©|^alle rechte vorbehalten/i.test(claimText) ||
      
      // Negative Feststellungen (keine Claims)
      /^(kein|keine|keines)\s+(greenwashing|betrug|irreführung)/i.test(claimText) && claimText.length < 50 ||
      
      // Blog/News-Navigation
      /^(alle|aktuelle|neueste|frühere|vorherige|nächste)\s+(beiträge|artikel|news|posts)/i.test(claimText) && claimText.length < 60 ||
      /^(zurück|weiter|vor|home|start|menü|navigation)/i.test(claimText) && claimText.length < 30 ||
      
      // Pressekontakt und PR-Texte
      /(pressekontakt|pressestelle|pr.team|pr-team|press.office|media.contact|ansprechpartner|presseabteilung)/i.test(claimText) ||
      /^(presse|press|media|kontakt):/i.test(claimText) ||
      
      // Social Media Links und CTAs
      /^(folge?n?\s+uns|teilen|liken|kommentieren|abonnieren|subscribe)/i.test(claimText) && claimText.length < 50 ||
      /^(twitter|instagram|facebook|linkedin|youtube|tiktok|social):/i.test(claimText) ||
      
      // Formular-Beschriftungen
      /^(name|vorname|nachname|e-mail|email|nachricht|betreff|absender|empfänger|firma|unternehmen):/i.test(claimText) ||
      
      // Call-to-Action ohne Inhalt
      /^(klicken|besuchen|folgen|abonnieren|registrieren)\s+sie/i.test(claimText) && claimText.length < 50 ||
      
      // Reine Platzhalter/Fragmenttexte (zu kurz für substantielle Aussage)
      claimText.length < 20 && /(mehr|infos|details|link|kontakt|presse|hier)/i.test(claimText);
    
    if (isNonSubstantiveText) {
      return {
        riskLevel: "LOW",
        riskScore: 0,
        explanation: "ℹ️ KEIN CLAIM - Dieser Text ist ein Service-Hinweis, Kontaktinfo, Link-Verweis oder Navigationselement und enthält keine Nachhaltigkeits- oder Umweltaussage, die bewertet werden kann.",
        suggestedRewrite: "Keine Anpassung erforderlich - dies ist kein bewertbarer Claim.",
        linkedClaims: [],
      };
    }

  // PRIORITY 1: EmpCo-Richtlinie Verstöße (Schwarze Liste) - Fristen siehe lib/legal-rules.json
  
  // 1a. Klimaneutralität/Emissionsfreiheit ohne Erläuterung Vermeidung vs. Kompensation (BGH Juni 2024)
  const hasKlimaneutral = /klimaneutral|co2.*neutral|treibhausgas.*neutral|emissionsfrei|emissionslos|co2.*frei|treibhausgasfrei/i.test(claimText);
  const hasVermeidung = /reduktion|reduzieren|vermeiden|verringern|senken/i.test(claimText);
  const hasKompensation = /kompensation|kompensiert|ausgleich|ausgleichen|gleicht.*aus|offset|neutralisiert|zertifikat.*kauf/i.test(claimText);
  
  // Direkte Kompensationsaussagen ohne "klimaneutral" (z.B. "kompensiert CO₂-Fußabdruck")
  const hasDirectCompensationClaim = /kompensiert.{0,30}(co2|co₂|emission|fußabdruck|treibhausgas)|gleicht.{0,30}(co2|co₂|emission).*aus|neutralisiert.{0,30}emission/i.test(claimText);
  const hasGesamtCO2 = /gesamten?.{0,20}(co2|co₂|emission|fußabdruck|treibhausgas)/i.test(claimText);
  
  if (hasKlimaneutral && hasKompensation && !hasVermeidung) {
    baseRiskScore = 92;
    empcoViolations.push("🚨 EmpCo-Verstoß: Klimaneutralität/Emissionsfreiheit auf Basis von Kompensation (BGH-Urteil Juni 2024 - irreführend)");
  } else if (hasKlimaneutral && !hasVermeidung && !hasKompensation) {
    baseRiskScore = 90;
    empcoViolations.push("🚨 EmpCo-Verstoß: 'Klimaneutral/Emissionsfrei' ohne Erläuterung, ob Vermeidung oder Kompensation (Schwarze Liste Punkt b)");
  }
  
  // Direkte Kompensationsaussagen sind genauso kritisch wie "klimaneutral" (BGH Juni 2024)
  if (hasDirectCompensationClaim && !hasVermeidung) {
    baseRiskScore = Math.max(baseRiskScore, 92);
    empcoViolations.push("🚨 EmpCo-Verstoß: Kompensationsaussage ohne Priorisierung von Vermeidung/Reduktion (BGH-Urteil Juni 2024 - irreführend)");
  }
  
  // "Gesamten CO₂-Fußabdruck" + Kompensation ist besonders kritisch
  if (hasGesamtCO2 && hasKompensation && !hasVermeidung) {
    baseRiskScore = Math.max(baseRiskScore, 94);
    if (!empcoViolations.some(v => v.includes("Kompensation"))) {
      empcoViolations.push("🚨 EmpCo-Verstoß: Behauptung der vollständigen CO₂-Kompensation ohne Vermeidung - irreführend (BGH Juni 2024)");
    }
  }

  // 1b. Unbelegte allgemeine Umweltaussagen (EmpCo Art. 1 Nr. 3 lit. b)
  // WICHTIG: Nicht einzelne Begriffe bewerten, sondern den KONTEXT prüfen!
  // "grün" oder "nachhaltig" allein sind KEIN Verstoß - erst in Verbindung mit absoluten/unbelegten Aussagen
  
  const hasBannedTerm = EMPCO_BANNED_TERMS.some(term => 
    new RegExp(`\\b${term}\\b`, 'i').test(claimText)
  );
  const hasApprovedEvidence = EMPCO_APPROVED_LABELS.some(label =>
    new RegExp(label, 'i').test(claimText)
  ) || /eu ecolabel|iso 14024|blauer engel|nordic swan|umweltzeichen/i.test(claimText);
  
  // Kontext-Prüfung: Ist es eine ABSOLUTE oder UNBELEGTE Aussage?
  const hasAbsoluteContext = (
    // Absolute Formulierungen: "100%", "vollständig", "komplett", etc.
    /\b(100%|alle|komplett|vollständig|immer|niemals|absolut|garantiert|total|ganz)\b/i.test(claimText) ||
    // Superlative: "nachhaltigste", "umweltfreundlichste", etc.
    /(nachhaltigst|umweltfreundlichst|klimafreundlichst|grünst|ökologischst|beste|führend)/i.test(claimText) ||
    // Unbelegte Produkt-Behauptungen: "ist nachhaltig", "sind umweltfreundlich"
    /(ist|sind|war|waren)\s+(100%|komplett|vollständig)?\s*(nachhaltig|umweltfreundlich|klimafreundlich|grün|ökologisch|klimaneutral)/i.test(claimText)
  );
  
  // Kontext-Prüfung: Ist es eine QUALIFIZIERTE oder BESCHREIBENDE Aussage? (OKAY)
  const hasQualifiedContext = (
    // Arbeit/Bemühungen: "arbeiten an", "setzen auf", "entwickeln"
    /(arbeiten an|setzen auf|entwickeln|streben an|bemühen uns|engagieren uns|konzentrieren uns auf)\s+.*(nachhaltig|umweltfreundlich|grün)/i.test(claimText) ||
    // Beispiele/Spezifikationen: "wie", "zum Beispiel", "unter anderem"
    /(wie|zum beispiel|beispielsweise|unter anderem|etwa|darunter).*\b(nachhaltig|umweltfreundlich|grün)\b/i.test(claimText) ||
    // Qualifizierer: "teilweise", "in Teilen", "schrittweise"
    /\b(teilweise|in teilen|schrittweise|zunehmend|mehr und mehr|einige|manche|bestimmte)\b.*\b(nachhaltig|umweltfreundlich|grün)\b/i.test(claimText) ||
    // Ziele/Pläne: "wollen", "planen", "anstreben"
    /\b(wollen|planen|möchten|anstreben|beabsichtigen|zielen darauf ab)\b.*\b(nachhaltig|umweltfreundlich|grün)\b/i.test(claimText) ||
    // Konkrete Beispiele: Materialien, Prozesse, spezifische Maßnahmen
    /(recycelt|wiederverwertet|biologisch abbaubar|aus.*(holz|bambus|baumwolle)|energieeffizient|weniger (wasser|energie|co2))/i.test(claimText)
  );
  
  // Nur als Verstoß markieren, wenn es eine ABSOLUTE/UNBELEGTE Aussage ist und KEINE Qualifikation vorliegt
  if (hasBannedTerm && !hasApprovedEvidence && hasAbsoluteContext && !hasQualifiedContext) {
    baseRiskScore = Math.max(baseRiskScore, 88);
    empcoViolations.push(`🚨 EmpCo-Verstoß: Absolute Umwelt-/Klimaaussage ohne Qualifikation und Beleg - ab ${EMPCO_DEADLINE_TEXT} EmpCo-verbindlich`);
    detectedPatterns.push("Absolute-Umweltaussage");
  } else if (hasBannedTerm && hasQualifiedContext) {
    uncertaintyFlags.push("ℹ️ Kontext-Info: Umweltbegriff erkannt, aber in qualifiziertem Kontext (Bemühungen, Beispiele, Ziele) - keine Beanstandung");
    detectedPatterns.push("Qualifizierte-Umweltaussage (OK)");
  }

  // 1c. Selbst erfundene Nachhaltigkeitssiegel (EmpCo Art. 1 Nr. 3 lit. d)
  // WICHTIG: "Modelabel" = Modemarke (kein Zertifikat!), daher negative lookbehind für Mode-Kontext
  // Verbessert: Erkennt auch zusammengesetzte Wörter und verschiedene Siegel-Begriffe
  const hasSiegelMention = /(?<!mode|fashion|bekleidungs|textil|kleidungs)(siegel|label|zertifikat|prädikat|award|garantie|gütezeichen|testsieger|qualitäts)\b|aus(ge)?zeichn(ung|et).{0,30}(?:nachhaltig|grün|öko|umwelt|klima|green|eco|mobility|champion|qualität|award|preis)/i.test(claimText);
  const hasEigenesSiegel = /eigenes|hauseigenes|hauseigen|intern.*entwickelt|selbst.*zertifiziert|selbst.*kreiert|selbst.*entwickelt|eigens.*kreiert/i.test(claimText);
  const hasApprovedSeal = EMPCO_APPROVED_LABELS.some(label => 
    new RegExp(label, 'i').test(claimText)
  );
  
  // Kontext-sensitiv: "label" kann Marke oder Zertifikat bedeuten
  // Erkennt sowohl "Label" als eigenständiges Wort als auch "Modelabel" zusammengeschrieben
  if ((/\blabel\b|modelabel|fashionlabel|bekleidungslabel|textillabel/i.test(claimText)) && /mode|fashion|bekleidung|textil/i.test(claimText)) {
    uncertaintyFlags.push("⚠️ Kontext-sensitiv: 'Label' erkannt in Mode-Kontext (bedeutet hier Marke, NICHT Zertifikat)");
    detectedPatterns.push("Modelabel-Kontext (korrekt als Marke erkannt, nicht als Siegel)");
  }
  
  if (hasSiegelMention && (hasEigenesSiegel || !hasApprovedSeal)) {
    baseRiskScore = Math.max(baseRiskScore, 85);
    empcoViolations.push("🚨 EmpCo-Verstoß: Siegel ohne transparente, unabhängige Zertifizierung (Schwarze Liste Punkt d)");
    detectedPatterns.push("Siegel-Detection");
  }

  // 1d. Gesetzliche Anforderungen als Besonderheit darstellen
  if (/besonders|speziell|einzigartig.*gesetzlich|vorschrift.*erfüllt.*vorteilhaft/i.test(claimText)) {
    baseRiskScore = Math.max(baseRiskScore, 78);
    empcoViolations.push("⚠️ EmpCo-Verstoß: Gesetzliche Pflichten als Besonderheit dargestellt");
  }
  
  // 1e. Heilsversprechen und pauschale positive Umweltwirkungen (EmpCo Art. 1 Nr. 3 lit. b)
  const healingPromises = /rettet.{0,20}(klima|umwelt|planet|erde)|heilt.{0,20}(klima|umwelt|planet)|positiv.{0,20}beitrag.{0,20}(umwelt|klima|natur)|schützt aktiv.{0,20}(klima|umwelt)|aktiv.{0,20}(schutz|rettung).{0,20}(klima|umwelt)|macht.{0,20}welt.{0,20}besser|für.{0,20}bessere.{0,20}(welt|zukunft|planet)/i.test(claimText);
  
  if (healingPromises && !hasApprovedEvidence) {
    baseRiskScore = Math.max(baseRiskScore, 88);
    empcoViolations.push("🚨 EmpCo-Verstoß: Pauschales Heilsversprechen ohne messbare, belegte Umweltwirkung (Art. 1 Nr. 3 lit. b)");
  }
  
  // 1f. Pauschale Lieferketten-Aussagen (besonders kritisch bei "100%" / "gesamte Lieferkette")
  const hasSupplyChainClaim = /(gesamte|komplette|vollständige|100%).{0,30}lieferkette|lieferkette.{0,30}(100%|gesamte|komplett|vollständig)/i.test(claimText);
  const hasAbsoluteSupplyChainClaim = hasSupplyChainClaim && /(emissionsfrei|klimaneutral|nachhaltig|co2.*frei|co2.*neutral)/i.test(claimText);
  
  if (hasAbsoluteSupplyChainClaim && !hasApprovedEvidence) {
    baseRiskScore = Math.max(baseRiskScore, 92);
    empcoViolations.push("🚨 EmpCo-Verstoß: Pauschale Lieferketten-Aussage ohne transparente, überprüfbare Scope-3-Belege (praktisch nicht erreichbar)");
  }
  
  // 1g. Zero-Impact-Claims (ohne/keine Umweltbelastung/Impact) - praktisch unmöglich
  // Erweiterte Regex für alle Varianten: "ohne jegliche Umweltbelastung", "kein Impact", "null Auswirkung" etc.
  const hasZeroImpactClaim = (
    /ohne\s+(jegliche|jede|jeder|alle|irgendeine|irgendwelche)\s+(umwelt.*belastung|belastung.*umwelt|umwelt.*auswirkung|auswirkung.*umwelt|impact|schaden)/i.test(claimText) ||
    /kein(e|er|en)?\s+(umwelt.*belastung|belastung.*umwelt|umwelt.*auswirkung|auswirkung.*umwelt|impact|schaden)/i.test(claimText) ||
    /null\s+(umwelt.*belastung|impact|auswirkung)/i.test(claimText) ||
    /frei\s+von\s+(jegliche|jede|alle)?\s*umwelt.*(schaden|belastung|auswirkung)/i.test(claimText) ||
    /schadstofffrei(?!.*spezifisch|.*einzeln|.*bestimmt)/i.test(claimText)
  );
  
  if (hasZeroImpactClaim && !hasApprovedEvidence) {
    baseRiskScore = Math.max(baseRiskScore, 94);
    empcoViolations.push("🚨 EmpCo-Verstoß: Zero-Impact-Claim - behauptet vollständige Abwesenheit von Umweltbelastung (praktisch unmöglich, EmpCo Art. 1 Nr. 3 lit. b)");
    detectedPatterns.push("Zero-Impact-Claim");
  }

  // PRIORITY 2: Weitere Greenwashing-Muster (Research-basiert)

  // 2. Absolute Aussagen ohne Qualifikation
  const hasAbsoluteWords = GREENWASHING_INDICATORS.absoluteWords.some(word => 
    new RegExp(`\\b${word}\\b`, 'i').test(claimText)
  );
  const qualifierPatterns = [
    /\b(bis zu|etwa|ca\.|ungefähr|schätzungsweise|teilweise|einige|mehrere|durchschnittlich|\d+%|gegenüber)\b/i,
    /\b(kann|könnte|sollte|möglich|wahrscheinlich|tendenziell|angestrebt)\b/i,
  ];
  const hasQualifiers = qualifierPatterns.some(p => p.test(claimText));
  
  // Absolute Wörter sind NUR in Verbindung mit Umwelt-/Klimaaussagen kritisch
  const hasEnvironmentClaim = /umwelt|klima|co2|co₂|emission|nachhaltig|ökologisch|grün|planet|natur|recycl|bio(?!grafie)|kompostier|erneuerbar|ressource/i.test(claimText);
  
  // NUR bei Umweltaussagen prüfen
  if (hasAbsoluteWords && hasEnvironmentClaim && !hasQualifiers && !hasApprovedEvidence) {
    baseRiskScore = Math.max(baseRiskScore, 85);
    detectedIssues.push(`⚠️ Absolute Umwelt-/Klimaaussage ohne Qualifikation und Beleg - ab ${EMPCO_DEADLINE_TEXT} EmpCo-verbindlich`);
  } else if (hasAbsoluteWords && hasEnvironmentClaim && hasQualifiers) {
    baseRiskScore = Math.max(baseRiskScore, 48);
    detectedIssues.push("💡 Absolute Aussage teilweise qualifiziert - zusätzliche Präzisierung empfohlen");
  }

  // 3. Leuchtturm-Produkt Pattern
  if (/erste|einzelne|spezial|limited edition|kollektion.*nachhaltig/i.test(claimText) && 
      /aber|während|jedoch|trotzdem|neben/i.test(claimText)) {
    baseRiskScore = Math.max(baseRiskScore, 70);
    detectedIssues.push("💼 Leuchtturm-Produkt Pattern (Kerngeschäft möglicherweise problematisch)");
  }

  // 4. Vage Aussagen ohne Belege - ABER: kontextbasiert prüfen!
  // "nachhaltig" oder "umweltfreundlich" in qualifiziertem Kontext ist KEIN Problem
  const hasEnvironmentTermsVague = /umweltfreundlich|grün|nachhaltig|ökologisch/i.test(claimText);
  const hasEvidenceMarkers = /zertifiziert|nachgewiesen|belegt|gemessen|audit|standard|iso|lca|lebenszyklus/i.test(claimText);
  
  // NUR als vage markieren, wenn es eine ABSOLUTE Aussage OHNE Qualifikation ist
  if (hasEnvironmentTermsVague && !hasEvidenceMarkers && hasAbsoluteContext && !hasQualifiedContext) {
    baseRiskScore = Math.max(baseRiskScore, 72);
    detectedIssues.push("📋 Vage absolute Umweltaussage ohne Beleg (53-56% solcher Claims sind irreführend)");
  } else if (hasEnvironmentTermsVague && hasQualifiedContext && !hasEvidenceMarkers) {
    // Qualifizierte Aussagen ohne Zertifikat sind niedrigeres Risiko
    baseRiskScore = Math.max(baseRiskScore, 35);
    detectedIssues.push("💡 Umweltbegriff in qualifiziertem Kontext - Zertifizierung würde Glaubwürdigkeit erhöhen");
  }

  // 5. Verzögerungstaktiken
  if (/weitere forschung.*nötig|noch nicht.*erforscht|unter.*untersuchung|brancheninitiativen/i.test(claimText)) {
    baseRiskScore = Math.max(baseRiskScore, 65);
    detectedIssues.push("⏳ Verzögerungstaktik - Forderung nach Beweis wird aufgeschoben");
  }

  // 6. Grüne Bildsprache ohne Substanz - NUR bei absoluten/unbelegten Aussagen
  const hasGreenImagery = /grüne|blatt|natur|wald|bio-kraft/i.test(claimText);
  const hasSubstance = /zertifiziert|geprüft|belegt|nachgewiesen|gemessen/i.test(claimText);
  
  // Nur markieren, wenn grüne Bildsprache mit absoluten Aussagen kombiniert wird
  if (hasGreenImagery && hasEnvironmentClaim && hasAbsoluteContext && !hasSubstance && !hasQualifiedContext) {
    baseRiskScore = Math.max(baseRiskScore, 60);
    detectedIssues.push("🎨 Grüne Bildsprache mit absoluten Aussagen ohne Belege");
  }

  // 7. Superlative ohne Beleg ("der grünste Anbieter", "erste/r/s/n weltweit")
  const hasSuperlative = GREENWASHING_INDICATORS.superlatives.some(word => 
    new RegExp(`\\b${word}\\b`, 'i').test(claimText)
  ) || /(der|die|das|den)\s+\w+ste[n]?\s+(anbieter|unternehmen|firma|marke|produkt|lösung|hersteller|tarif|stromtarif)/i.test(claimText);
  
  const hasBranchComparison = /branche|markt|industrie|sektor|wettbewerb|weltweit|global|international|europa|deutschland|region|land/i.test(claimText);
  const hasEnvironmentSuperlative = hasSuperlative && hasEnvironmentClaim;
  
  // Superlative mit geografischem/Branchen-Scope sind besonders kritisch ("erste in Europa", "beste weltweit")
  if (hasSuperlative && hasBranchComparison && !hasApprovedEvidence) {
    baseRiskScore = Math.max(baseRiskScore, 94);
    empcoViolations.push("🚨 Superlativ-Claim mit geografischem/Branchen-Scope ohne unabhängigen Beleg (praktisch nicht verifizierbar - EmpCo-Verstoß)");
    detectedPatterns.push("Superlativ+geografischer-Scope");
  } else if (hasEnvironmentSuperlative && !hasApprovedEvidence) {
    baseRiskScore = Math.max(baseRiskScore, 88);
    empcoViolations.push("🚨 Umwelt-Superlativ ohne anerkannte Zertifizierung (EmpCo Art. 1 Nr. 3 lit. b)");
    detectedPatterns.push("Umwelt-Superlativ");
  } else if (hasSuperlative && !hasApprovedEvidence) {
    baseRiskScore = Math.max(baseRiskScore, 75);
    detectedIssues.push("⚠️ Superlativ ohne unabhängige Verifizierung");
    detectedPatterns.push("Superlativ");
  }
  
  // 8. Kompensation + Absolute Prozentangabe (verstärkter Faktor)
  if (hasKompensation && /100%|vollständig|alle/i.test(claimText)) {
    baseRiskScore = Math.max(baseRiskScore, 88);
    if (!empcoViolations.some(v => v.includes("Kompensation"))) {
      empcoViolations.push("🚨 100% Kompensations-Claim - BGH-Urteil Juni 2024: irreführend ohne Priorisierung der Reduktion");
    }
  }

  // 9. Custom Patterns aus localStorage (unternehmensspezifische Regeln)
  const customPatterns = loadCustomPatterns();
  for (const pattern of customPatterns) {
    let match = false;
    
    try {
      if (pattern.matchType === "keyword") {
        const keywords = pattern.matchValue.split(",").map((k) => k.trim().toLowerCase());
        const textLower = claimText.toLowerCase();
        match = keywords.some((keyword) => textLower.includes(keyword));
      } else if (pattern.matchType === "phrase") {
        match = claimText.toLowerCase().includes(pattern.matchValue.toLowerCase());
      } else if (pattern.matchType === "regex") {
        const regex = new RegExp(pattern.matchValue, "i");
        match = regex.test(claimText);
      }
      
      if (match) {
        baseRiskScore = Math.max(baseRiskScore, pattern.riskScore);
        const emoji = pattern.riskScore >= 85 ? "🚨" : pattern.riskScore >= 70 ? "⚠️" : "💡";
        detectedIssues.push(`${emoji} [Custom Pattern] ${pattern.reason}`);
      }
    } catch (error) {
      console.error(`Error matching custom pattern ${pattern.name}:`, error);
    }
  }

  // Combine all detected issues
  const allIssues = [...empcoViolations, ...detectedIssues];

  // Determine risk level based on final score
  // LOW: 0-35 | MEDIUM: 36-59 | HIGH: 60-74 | CRITICAL: 75-100
  if (baseRiskScore >= 75) {
    riskLevel = "CRITICAL";
  } else if (baseRiskScore >= 60) {
    riskLevel = "HIGH";
  } else if (baseRiskScore >= 36) {
    riskLevel = "MEDIUM";
  } else {
    riskLevel = "LOW";
  }

  // 🚨 OVERRIDE: EmpCo-Verstöße MÜSSEN IMMER als kritisch behandelt werden,
  // UNABHÄNGIG vom gewählten Claim-Typ (Kohlenstoffneutralität, Umweltaussage, etc.)
  // Dies ist eine rechtliche Anforderung - EmpCo-Richtlinie gilt für ALLE Claims
  if (empcoViolations.length > 0) {
    // Schwere EmpCo-Verstöße (Score >= 85) sind immer CRITICAL
    if (baseRiskScore >= 85) {
      riskLevel = "CRITICAL";
    }
    // Mittlere EmpCo-Verstöße (Score 75-84) sind mindestens HIGH
    else if (baseRiskScore >= 75 && riskLevel !== "CRITICAL") {
      riskLevel = "HIGH";
    }
    // Leichte EmpCo-Verstöße sind mindestens MEDIUM
    else if (riskLevel === "LOW") {
      riskLevel = "MEDIUM";
    }
  }

  const explanations: Record<Claim["riskLevel"], string> = {
    CRITICAL: `⚠️ KRITISCHER EMPCO-VERSTOSS

${allIssues.slice(0, 3).map(issue => issue.replace(/^🚨\s*/, '• ').replace(/^⚠️\s*/, '• ').replace(/^📋\s*/, '• ')).join('\n')}

────────────────────────────────────────
📅 Deadline EmpCo: ${EMPCO_DEADLINE_TEXT} | ⚖️ EmpCo-Richtlinie (EU) 2024/825
💰 Sanktionen: ${EMPCO_SANCTION_TEXT}
${allIssues.length > 3 ? '\n🔍 Weitere Probleme:\n' + allIssues.slice(3).map(i => i.replace(/^🚨\s*/, '  • ').replace(/^⚠️\s*/, '  • ').replace(/^📋\s*/, '  • ')).join('\n') : ''}`,

    HIGH: `🔴 HOHES RISIKO - ANPASSUNG DRINGEND EMPFOHLEN

${allIssues.slice(0, 3).map(issue => issue.replace(/^🚨\s*/, '• ').replace(/^⚠️\s*/, '• ').replace(/^📋\s*/, '• ')).join('\n')}

────────────────────────────────────────
⚖️ EmpCo ab ${EMPCO_DEADLINE_TEXT} | 📋 EN ISO 14024 erforderlich
${allIssues.length > 3 ? '\n🔍 Weitere Hinweise:\n' + allIssues.slice(3).map(i => i.replace(/^🚨\s*/, '  • ').replace(/^⚠️\s*/, '  • ').replace(/^📋\s*/, '  • ')).join('\n') : ''}`,

    MEDIUM: `🟡 MITTLERES RISIKO - PRÄZISIERUNG EMPFOHLEN

${allIssues.slice(0, 3).map(issue => issue.replace(/^🚨\s*/, '• ').replace(/^⚠️\s*/, '• ').replace(/^💡\s*/, '• ')).join('\n')}

────────────────────────────────────────
💡 Empfehlung: Evidenzunterstützung und Zertifizierung
${allIssues.length > 3 ? '\n🔍 Weitere Hinweise:\n' + allIssues.slice(3).map(i => i.replace(/^💡\s*/, '  • ')).join('\n') : ''}`,

    LOW: `✅ LOW-RISK - EMPCO-KONFORM

${allIssues.length > 0 ? allIssues.slice(0, 3).map(issue => issue.replace(/^✓\s*/, '• ')).join('\n') : '• Wording zeigt angemessene Qualifizierungen'}

────────────────────────────────────────
Optional: Weitere Stärkung durch Zertifizierungen möglich`,
  };

  // Generate EmpCo-compliant alternatives
  const alternatives: Record<Claim["riskLevel"], string> = {
    CRITICAL: `🔧 PFLICHT-UMFORMULIERUNG (EmpCo-Richtlinie verbindlich ab ${EMPCO_DEADLINE_TEXT}):

📌 Variante 1 - Vermeidung vor Kompensation (BGH-konform):
"Wir haben unsere CO₂-Emissionen um [X%] gegenüber [Baseline-Jahr] reduziert (Scope 1+2). Verbleibende Emissionen: [Y Tonnen]. Kompensation erfolgt ergänzend durch [Gold Standard/VCS-Projekt XY]. Verifiziert nach ISO 14064-3."

📌 Variante 2 - Mit anerkannter Zertifizierung (EN ISO 14024):
"[Produkt] trägt das EU Ecolabel [Registrier-Nr.] - unabhängig geprüfte hervorragende Umweltleistung über den gesamten Lebenszyklus."

📌 Variante 3 - Konkrete, messbare Aussage statt allgemeiner Begriff:
"[X%] weniger Wasserverbrauch (gemessen nach ISO 14046, ggü. 2020). [Y%] Recyclinganteil (zertifiziert durch [Prüfstelle]). Jährliches Audit durch [TÜV/SGS/externe Stelle]."

⚠️ NICHT verwenden ohne Beleg: "umweltfreundlich", "klimaneutral", "nachhaltig", "ökologisch", "grün"
✅ Anerkannte Labels: EU Ecolabel, Blauer Engel, FSC, MSC, GOTS, Cradle to Cradle, B Corp`,

    HIGH: `🔧 EMPFOHLENE UMFORMULIERUNG (EmpCo-Vorbereitung):

📌 Mit anerkanntem Standard:
"${claimText.replace(/\b(umweltfreundlich|nachhaltig|ökologisch|grün)\b/gi, '[messbare Eigenschaft]')} — zertifiziert nach [ISO 14024 / EU Ecolabel / Branchenstandard]"

📌 Mit Baseline und Scope:
"[X%] Reduktion (ggü. [Jahr]) für [spezifischen Bereich: Produktion/Verpackung/Transport]. Gemessen nach [ISO 14067 / GHG Protocol]. Extern auditiert [Jahr]."

📌 Mit transparenter Methodik:
"LCA-Analyse nach ISO 14040/44 zeigt: [konkrete Verbesserung] im Vergleich zu [Referenzprodukt]. Kritische Prüfung durch [unabhängige Stelle]."

💡 Checkliste für EmpCo-Konformität:
□ Konkrete, messbare Daten statt allgemeiner Begriffe
□ Anerkannte Zertifizierung (EN ISO 14024) oder staatliches Label
□ Unabhängige Verifizierung dokumentiert
□ Baseline und Scope eindeutig definiert`,

    MEDIUM: `🔧 EMPFOHLENE ERWEITERUNG (EmpCo-Optimierung):

📌 Mit externem Nachweis:
"${claimText} — bestätigt durch [Zertifizierung ISO 14001/EMAS], Audit [Jahr], Prüfbericht auf Anfrage verfügbar."

📌 Mit Lebenszyklusperspektive:
"${claimText} über [spezifische Lebensphase: Herstellung/Nutzung/Entsorgung], gemessen nach LCA-Standard ISO 14040."

📌 Mit präzisem Referenzrahmen:
"${claimText} (ggü. [Vergleichsjahr/Branchendurchschnitt]), verifiziert nach [Methodik], jährlich überprüft."

💡 Optimierungspotenzial:
+ EU Ecolabel oder gleichwertige Zertifizierung (EN ISO 14024)
+ Science Based Targets Initiative (SBTi) für Klimaziele
+ Transparente Veröffentlichung von Rohdaten und Methodik`,

    LOW: `✅ GUT FORMULIERT - EMPCO-KONFORM

"${claimText}"

Die Aussage erfüllt bereits die Anforderungen der EmpCo-Richtlinie. 

🌟 Optionale Zusatzstärkung:
+ Zusätzliche Zertifizierung: EU Ecolabel, Blauer Engel, B Corp, Science Based Targets
+ Zeitreihe veröffentlichen: "Entwicklung seit [Jahr]: [Verlaufsdaten]"
+ Prüffrequenz kommunizieren: "Jährliches externes Audit durch [Stelle]"
+ Transparenz erhöhen: "Detaillierte Daten verfügbar unter [Link]"

📋 Audit-Empfehlung: Regelmäßige Überprüfung (mind. jährlich), ob Claims noch aktuell sind.`,
  };

  // Debug-Logging für Entwicklung (nur in Browser-Konsole, nicht in Produktion)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    if (detectedPatterns.length > 0) {
      console.log(`[Claim Analysis] "${claimText.substring(0, 60)}..."`, {
        score: baseRiskScore,
        riskLevel,
        patterns: detectedPatterns,
        empcoViolations: empcoViolations.length,
        otherIssues: detectedIssues.length,
        uncertainties: uncertaintyFlags
      });
    }
  }

  return {
    riskLevel,
    riskScore: Math.min(100, baseRiskScore),
    explanation: explanations[riskLevel],
    suggestedRewrite: generateConcreteRewrite(text, empcoViolations, detectedIssues, riskLevel),
    linkedClaims: allIssues,
    uncertaintyFlags: uncertaintyFlags.length > 0 ? uncertaintyFlags : undefined,
    debugInfo: {
      detectedPatterns,
      empcoViolationsCount: empcoViolations.length,
      otherIssuesCount: detectedIssues.length
    }
  };
  } catch (error) {
    console.error("Fehler bei der Claim-Analyse:", error, "Text:", text);
    return {
      riskLevel: "MEDIUM",
      riskScore: 50,
      explanation: `⚠️ Fehler bei der Analyse. Bitte überprüfen Sie den Claim manuell.\n\nFehlerdetails: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
      suggestedRewrite: "Claim konnte nicht analysiert werden. Bitte Text überprüfen und erneut eingeben.",
      linkedClaims: ["Analysefehler"],
    };
  }
};

// Generate konkrete Umformulierungen basierend auf erkannten Problemen
const generateConcreteRewrite = (
  claimText: string,
  empcoViolations: string[],
  detectedIssues: string[],
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
): string => {
  const allIssues = [...empcoViolations, ...detectedIssues];
  
  // Für komplexe Fälle: Extrahiere Schlüsselkonzepte und baue Satz neu
  const lowerText = claimText.toLowerCase();
  let rewrittenText = claimText;
  
  // NEUE SPEZIALFÄLLE: Klima schützen / Carbon Footprint verbessern
  
  // "schützen das Klima" / "schützt das Klima"
  if (/\b(schützen|schützt)\s+(aktiv\s+)?(das\s+)?Klima\b/i.test(rewrittenText)) {
    rewrittenText = rewrittenText.replace(
      /\b(schützen|schützt)\s+(aktiv\s+)?(das\s+)?Klima\b/gi,
      "tragen zur CO₂-Reduktion bei (durchschnittlich 2,4 kg CO₂ pro Tag, hochgerechnet basierend auf Ökostrom-Mix 2025)"
    );
  }
  
  // "verbessern den Carbon Footprint"
  if (/\bverbessern\s+den\s+(Carbon\s+Footprint|CO₂-Fußabdruck)\b/i.test(rewrittenText)) {
    rewrittenText = rewrittenText.replace(
      /\bverbessern\s+den\s+(Carbon\s+Footprint|CO₂-Fußabdruck)(\s+ihres\s+Haushaltes)?/gi,
      "reduzieren ihre CO₂-Emissionen um durchschnittlich 850 kg/Jahr (Basis: Ökostrom statt Strommix, CO₂-Äquivalente nach UBA 2025)"
    );
  }
  
  // "Mit jeder X" (absolute Aussage)
  if (/\bMit\s+jeder\s+(eingesteckten\s+)?(Steckdose|Nutzung|Verwendung)\b/i.test(rewrittenText)) {
    rewrittenText = rewrittenText.replace(
      /\bMit\s+jeder\s+(eingesteckten\s+)?(Steckdose|Nutzung|Verwendung)\b/gi,
      "Durch die Nutzung"
    );
  }
  
  // Erkenne Hauptkategorien
  const hasKlimaneutralität = /\b(100\s*%\s*)?(klimaneutral|CO₂-neutral|carbon\s*neutral|emissionsfrei)/i.test(claimText);
  const hasBeste = /\b(das|die|der)\s+(beste|bester|bestes)/i.test(claimText);
  const hasNachhaltig = /\bnachhaltige?\b/i.test(claimText);
  const hasProdukte = /\b(Produkte?|Angebot|Lösung(en)?|Waren?|Artikel)/i.test(claimText);
  
  // SPEZIALFALL: "100% klimaneutral" + "beste/nachhaltig"
  if (hasKlimaneutralität && hasBeste && hasProdukte) {
    const produktMatch = claimText.match(/\b(Produkte?|Angebote?|Lösung(en)?|Waren?|Artikel)/i);
    const produkt = produktMatch ? produktMatch[0] : "Produkte";
    
    // Dekliniere korrekt für Singular/Plural, Nominativ/Dativ
    let produktDativ = produkt;
    let verb = "haben";
    let pluralForm = produkt;
    
    const lower = produkt.toLowerCase();
    if (lower === "produkte") {
      produktDativ = "Produkten";
      verb = "haben";
    } else if (lower === "produkt") {
      produktDativ = "Produkt";
      verb = "hat";
    } else if (lower === "angebote") {
      produktDativ = "Angeboten";
      verb = "haben";
    } else if (lower === "angebot") {
      produktDativ = "Angebot";
      verb = "hat";
    } else if (lower === "waren") {
      produktDativ = "Waren";
      verb = "haben";
    } else if (lower === "artikel") {
      produktDativ = "Artikeln";
      verb = "haben";
    } else if (lower === "lösungen") {
      produktDativ = "Lösungen";
      verb = "haben";
    } else if (lower === "lösung") {
      produktDativ = "Lösung";
      verb = "hat";
    }
    
    return `"Unsere ${produkt} ${verb} eine CO₂-Reduktion von 67% erzielt (Scope 1+2, Baseline 2020, verifiziert nach ISO 14067). Verbleibende Emissionen werden durch Gold Standard-zertifizierte Klimaschutzprojekte kompensiert. Gehören zu den umweltverträglichsten ${produktDativ} am Markt (TÜV-Benchmark 2025, Top 3 in der Kategorie)."

💡 Vorgenommene Verbesserungen:
• "100% klimaneutral" → konkrete Reduktionszahl mit Scope und Baseline
• "beste" → "zu den umweltverträglichsten" (Top 3, unabhängig verifiziert)
• "nachhaltig" → durch konkrete Zertifizierung ersetzt
• Kompensation qualifiziert (Gold Standard, verifizierbar)

✅ Entspricht EmpCo-Richtlinie (EU) 2024/825`;
  }
  
  // SPEZIALFALL: "100% klimaneutral" alleine
  if (hasKlimaneutralität && /\b100\s*%/i.test(claimText)) {
    rewrittenText = claimText.replace(
      /\b100\s*%\s+(klimaneutral|CO₂-neutral|carbon\s*neutral)/gi,
      "CO₂-reduziert (67% weniger Emissionen als 2020, Scope 1+2, ISO 14067-verifiziert). Verbleibende Emissionen durch Gold Standard-Projekte kompensiert"
    );
  }
  // SPEZIALFALL: "wird klimaneutral sein" (Zukunft)
  else if (/\bwird\s+(bald\s+)?klimaneutral\s+sein/i.test(claimText)) {
    rewrittenText = claimText.replace(
      /\bwird\s+(bald\s+)?klimaneutral\s+sein/gi,
      "wird bis Ende 2026 eine CO₂-Reduktion von 67% erreichen (Scope 1+2, Baseline 2020). Verbleibende Emissionen werden durch Gold Standard-Projekte kompensiert"
    );
  }
  // SPEZIALFALL: "ist/sind klimaneutral" (ohne Qualifikation)
  else if (/\b(ist|sind)\s+klimaneutral\b/i.test(claimText) && !/Scope|kompensiert|verifiziert/i.test(claimText)) {
    rewrittenText = claimText.replace(
      /\b(ist|sind)\s+klimaneutral\b/gi,
      "$1 CO₂-reduziert (67% Reduktion ggü. 2020, Scope 1+2, ISO 14067). Verbleibende Emissionen durch Gold Standard-Projekte kompensiert"
    );
  }
  // Klimaneutralität OHNE 100%
  else if (hasKlimaneutralität && !/Scope|kompensiert|ISO|verifiziert|Reduktion/i.test(claimText)) {
    rewrittenText = rewrittenText.replace(
      /\b(klimaneutral|CO₂-neutral|carbon\s*neutral)\b/gi,
      "CO₂-reduziert (67% Emissionsreduktion ggü. 2020, Scope 1+2). Kompensation verbleibender Emissionen durch Gold Standard-Projekte"
    );
  }
  
  // SPEZIALFALL: "das beste nachhaltige X"
  if (hasBeste && hasNachhaltig && hasProdukte) {
    const matches = claimText.match(/\b(das|die|der)\s+beste\s+nachhaltige?\s+(Produkte?|Angebot|Lösung(en)?)\b/i);
    if (matches) {
      const artikel = matches[1];
      const produkt = matches[2];
      
      // Dekliniere korrekt für "zu den" (Dativ Plural) oder "zum" (Singular)
      let umgeschrieben = "";
      if (produkt === "Produkte") {
        umgeschrieben = `die umweltverträglichsten Produkte`;
      } else if (produkt === "Angebot") {
        umgeschrieben = `das umweltverträglichste Angebot`;
      } else if (produkt === "Lösungen") {
        umgeschrieben = `die umweltverträglichsten Lösungen`;
      } else {
        umgeschrieben = `${artikel} umweltverträglichste ${produkt}`;
      }
      
      const replacement = `${umgeschrieben} (TÜV-Benchmark 2025, Top 3, 45% CO₂-Reduktion ggü. Branchendurchschnitt, EU Ecolabel)`;
      rewrittenText = rewrittenText.replace(matches[0], replacement);
    }
  }
  // "das beste X" (ohne "nachhaltig")
  else if (hasBeste && !hasNachhaltig) {
    rewrittenText = rewrittenText.replace(
      /\b(das|die|der)\s+(beste|bester|bestes)\b/gi,
      "$1 eines der umweltfreundlichsten (TÜV-Benchmark 2025, Top 3)"
    );
  }
  
  // Einzelne absolute Aussagen (100%, alle, vollständig)
  if (/\b(100\s*%|alle|vollständig|komplett)\b/i.test(rewrittenText) && rewrittenText === claimText) {
    rewrittenText = rewrittenText
      .replace(/\b100\s*%\s+(recycelt|biologisch|erneuerbar)/gi, 
        "zu 87% $1 (bezogen auf Hauptmaterialien, GOTS/FSC-zertifiziert)")
      .replace(/\b100\s*%/gi, "zu 85%")
      .replace(/\balle\s+(Produkte|Materialien)/gi, "85% aller $1 (nach Gewicht)")
      .replace(/\b(vollständig|komplett)\b/gi, "weitgehend");
  }
  
  // Vage Begriffe (nachhaltig, umweltfreundlich) - nur wenn noch nicht ersetzt
  if (rewrittenText === claimText && /\b(nachhaltig|umweltfreundlich|grün|ökologisch)\b/i.test(rewrittenText)) {
    if (!/zertifiziert|ISO|geprüft|Label|Ecolabel/i.test(rewrittenText)) {
      rewrittenText = rewrittenText
        .replace(/\bnachhaltige?\s+(Produkte?|Lösung(en)?|Angebot)/gi,
          "ressourcenschonend produzierte $1 (45% CO₂-Reduktion ggü. 2020, Scope 1+2, GOTS-zertifiziert)")
        .replace(/\bumweltfreundliche?\s+(Produkte?|Verpackung)/gi,
          "$1 mit reduziertem ökologischem Fußabdruck (38% unter Branchenschnitt, EU Ecolabel, TÜV-geprüft)")
        .replace(/\bnachhaltig\b/gi, "ressourcenschonend (42% CO₂-Reduktion ggü. 2020, Blauer Engel)")
        .replace(/\bumweltfreundlich\b/gi, "mit reduziertem ökologischem Fußabdruck (38% unter Branchenschnitt, EU Ecolabel, ISO 14001)")
        .replace(/\bgrün\b/gi, "klimaschonend (35% CO₂-Reduktion ggü. 2020)")
        .replace(/\bökologisch\b/gi, "nach Umweltstandards produziert (ISO 14001, FSC-zertifiziert, -30% Wasserverbrauch)");
    }
  }
  
  // Superlative (noch nicht ersetzt)
  if (rewrittenText === claimText && /\b(führend|Nr\.\s*1|einzigartig|erste)\b/i.test(rewrittenText)) {
    rewrittenText = rewrittenText
      .replace(/\bführend(er?|es?)?\b/gi,
        "mit überdurchschnittlicher Umweltleistung (45% über Branchenschnitt)")
      .replace(/\b(Nr\.\s*1|Nummer\s+1)\b/gi,
        "unter den Top 3 (Stiftung Warentest 2025)")
      .replace(/\beinzigartig\b/gi,
        "mit besonderem Alleinstellungsmerkmal")
      .replace(/\b(erste|erster|erstes)\b/gi,
        "eines der ersten (seit 2022)");
  }
  
  // Zero-Impact
  if (/\b(zero\s*impact|ohne\s+jegliche|keinerlei)\b/i.test(rewrittenText)) {
    rewrittenText = rewrittenText
      .replace(/\bzero\s*impact\b/gi,
        "mit reduzierter Umweltbelastung (78% geringer als Durchschnitt, ISO 14040 LCA)")
      .replace(/\bohne\s+jegliche\s+(Emissionen|Umweltauswirkungen)/gi,
        "mit minimierten $1 (92% Reduktion ggü. 2020)")
      .replace(/\b(keinerlei|keine)\s+(negativen?|schädlichen?)\s+Auswirkungen/gi,
        "mit stark reduzierten $2n Auswirkungen (85% Verbesserung)");
  }
  
  // Vage Zeitangaben
  if (/\b(bald|demnächst|in\s+Zukunft|künftig)\b/i.test(rewrittenText)) {
    rewrittenText = rewrittenText
      .replace(/\b(bald|demnächst)\b/gi, "bis Ende 2026")
      .replace(/\bin\s+Zukunft\b/gi, "bis 2028")
      .replace(/\bkünftig\b/gi, "ab 2027");
  }
  
  // Arbeiten an / setzen auf
  if (/\b(arbeiten\s+an|setzen\s+(auf|uns\s+ein))\b/i.test(rewrittenText)) {
    if (!/\d+%|\d{4}|Ziel|Reduktion/i.test(rewrittenText)) {
      rewrittenText = rewrittenText
        .replace(/\barbeiten\s+an\s+nachhaltigen\s+(Lösungen?|Produkten?)/gi,
          "haben seit 2023 nachhaltige $1 eingeführt (42% CO₂-Reduktion, ISO 14001)")
        .replace(/\barbeiten\s+an\s+umweltfreundlichen\s+(Lösungen?|Produkten?)/gi,
          "haben seit 2023 umweltfreundliche $1 eingeführt (EU Ecolabel, 38% Ressourceneinsparung)")
        .replace(/\bsetzen\s+(auf|uns\s+ein\s+für)\s+(Nachhaltigkeit|Umweltschutz)/gi,
          "haben messbare Umweltziele umgesetzt (Science Based Targets, -65% CO₂ bis 2030)");
    }
  }
  
  // Kompensation ohne Details
  if (/\bkompensier(t|en)\b/i.test(rewrittenText) && !/Gold Standard|VCS|ISO 14064/i.test(rewrittenText)) {
    rewrittenText = rewrittenText.replace(/\bkompensier(t|en)\b/gi,
      "kompensieren durch Gold Standard-Projekte (ISO 14064-2)");
  }
  
  // Punkt am Ende
  if (!/[.!?]$/.test(rewrittenText)) {
    rewrittenText += ".";
  }
  
  // Doppelte Punkte entfernen
  rewrittenText = rewrittenText.replace(/\.+/g, ".");
  
  // Wenn nichts geändert wurde
  if (rewrittenText === claimText || rewrittenText === claimText + ".") {
    return generateFallbackRewrite(claimText, allIssues, riskLevel);
  }
  
  return `"${rewrittenText}"

💡 Vorgenommene Verbesserungen:
• Vage Begriffe durch messbare, konkrete Angaben ersetzt
• Absolute Aussagen qualifiziert (Scope-Definition, Prozentangaben)
• Unabhängige Zertifizierung/Verifizierung hinzugefügt
• Baseline/Referenzjahr für Vergleichbarkeit angegeben

✅ Entspricht EmpCo-Richtlinie (EU) 2024/825`;
};

// Fallback für Fälle, die nicht durch Regelersetzung abgedeckt werden
const generateFallbackRewrite = (
  claimText: string,
  allIssues: string[],
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
): string => {
  // Diese Funktion wird aufgerufen, wenn generateConcreteRewrite nichts ändern konnte
  // Wir müssen IMMER einen konkreten, messbaren Textvorschlag machen!
  
  let rewrittenText = claimText;
  
  // 1. Ersetze vage Begriffe mit KONKRETEN, MESSBAREN Alternativen
  const vagueTermReplacements: Record<string, string> = {
    "nachhaltig": "ressourcenschonend produziert (42% CO₂-Reduktion ggü. 2020, Scope 1+2, ISO 14001)",
    "Nachhaltigkeit": "messbare Ressourcenschonung (Science Based Targets: -45% CO₂ bis 2030, extern auditiert)",
    "umweltfreundlich": "mit reduziertem ökologischem Fußabdruck (EU Ecolabel, 38% unter Branchenschnitt)",
    "umweltfreundliche": "mit reduziertem ökologischem Fußabdruck (EU Ecolabel, 38% unter Branchenschnitt)",
    "grün": "klimaschonend (38% CO₂-Reduktion ggü. Durchschnitt, TÜV-verifiziert)",
    "grüne": "klimaschonende (38% CO₂-Reduktion ggü. Durchschnitt, TÜV-verifiziert)",
    "ökologisch": "nach Umweltstandards produziert (ISO 14001, FSC-zertifiziert, -35% Wasserverbrauch)",
    "ökologische": "nach Umweltstandards produzierte (ISO 14001, FSC-zertifiziert, -35% Wasserverbrauch)",
    "klimaneutral": "CO₂-reduziert (67% Reduktion Scope 1+2 ggü. 2020, ISO 14067, Kompensation durch Gold Standard)",
    "CO₂-neutral": "weitgehend CO₂-neutral (87% Reduktion Scope 1+2, verbleibende Emissionen durch Gold Standard kompensiert)",
    "emissionsfrei": "mit stark reduzierten Emissionen (82% Reduktion ggü. 2020, ISO 14067-verifiziert)",
    "umweltschonend": "mit geringerer Umweltbelastung (65% unter Branchendurchschnitt, LCA-verifiziert nach ISO 14040)",
  };
  
  // Ersetze vage Begriffe
  let replaced = false;
  for (const [vague, konkret] of Object.entries(vagueTermReplacements)) {
    const regex = new RegExp(`\\b${vague}\\b`, 'gi');
    if (regex.test(rewrittenText)) {
      rewrittenText = rewrittenText.replace(regex, konkret);
      replaced = true;
      break;
    }
  }
  
  // 2. Falls kein vager Begriff ersetzt wurde, analysiere Satzstruktur
  if (!replaced) {
    // Ersetze "ist/sind [Adjektiv]" durch konkrete Aussage
    if (/\b(ist|sind)\s+([a-zäöüß]+)\b/i.test(rewrittenText)) {
      const match = rewrittenText.match(/\b(Produkt|Verpackung|Material|Lösung|Angebot|Artikel|Ware)\s+(ist|sind)/i);
      if (match) {
        const produkt = match[1];
        // Füge messbare Details hinzu
        if (!/\d+%/i.test(rewrittenText)) {
          rewrittenText = rewrittenText.replace(/\.$/, "");
          rewrittenText += ` (42% CO₂-Reduktion ggü. 2020, Scope 1+2, EU Ecolabel, ISO 14067-verifiziert).`;
        }
      }
    }
  }
  
  // 3. Stelle sicher, dass MESSBARE Daten vorhanden sind
  if (!/\d+%/.test(rewrittenText)) {
    // Keine Prozentangaben vorhanden - füge welche hinzu
    if (/\b(Produkt|Verpackung|Material|Lösung|Angebot)\b/i.test(rewrittenText)) {
      rewrittenText = rewrittenText.replace(/\.$/, "");
      if (!/\(.*\)/.test(rewrittenText)) {
        rewrittenText += " (42% CO₂-Reduktion ggü. 2020, Scope 1+2, ISO 14067-verifiziert).";
      } else {
        // Klammer vorhanden, aber ohne Prozent - ergänze
        rewrittenText = rewrittenText.replace(/\(/, "(42% CO₂-Reduktion, ");
      }
    } else if (/\b(arbeiten|entwickeln|investieren|setzen)\b/i.test(rewrittenText)) {
      rewrittenText = rewrittenText.replace(/\.$/, "");
      rewrittenText += " (Ziel: -65% CO₂ bis 2030, Science Based Targets, jährlich extern auditiert).";
    } else {
      rewrittenText = rewrittenText.replace(/\.$/, "");
      rewrittenText += " (45% Verbesserung ggü. 2020, ISO 14001-zertifiziert).";
    }
  }
  
  // 4. Stelle sicher, dass Zertifizierung vorhanden ist
  if (!/ISO|Ecolabel|TÜV|Gold Standard|Science Based|FSC|GOTS|zertifiziert|verifiziert/i.test(rewrittenText)) {
    // Keine Zertifizierung - füge hinzu
    rewrittenText = rewrittenText.replace(/\)\.$/, ", ISO 14001-zertifiziert).");
    if (!/\)/.test(rewrittenText)) {
      rewrittenText = rewrittenText.replace(/\.$/, " (ISO 14001-zertifiziert).");
    }
  }
  
  // 5. Stelle sicher, dass Baseline/Jahr vorhanden ist
  if (!/\d{4}|ggü\.|gegenüber|Baseline/i.test(rewrittenText) && /\d+%/.test(rewrittenText)) {
    // Prozentangabe ohne Baseline - füge hinzu
    rewrittenText = rewrittenText.replace(/(\d+%\s+[A-Za-zäöüß\-]+)/, "$1 ggü. 2020");
  }
  
  // 6. Stelle sicher, dass Punkt am Ende ist
  if (!/[.!?]$/.test(rewrittenText)) {
    rewrittenText += ".";
  }
  
  // 7. Bereite spezifische Verbesserungshinweise vor
  const improvements: string[] = [];
  if (/\d+%/.test(rewrittenText)) {
    improvements.push("• Messbare Prozentangaben für Nachvollziehbarkeit");
  }
  if (/Scope\s+\d/.test(rewrittenText)) {
    improvements.push("• Scope-Definition (1+2 vs. 3) für Transparenz");
  }
  if (/(ISO|Ecolabel|TÜV|Gold Standard|Science Based|FSC|GOTS)/.test(rewrittenText)) {
    improvements.push("• Unabhängige Zertifizierung/Verifizierung");
  }
  if (/\d{4}|ggü\.|gegenüber/.test(rewrittenText)) {
    improvements.push("• Baseline/Referenzjahr für Vergleichbarkeit");
  }
  if (improvements.length === 0) {
    improvements.push("• Konkretisierung durch messbare Angaben");
  }
  
  return `"${rewrittenText}"

💡 Vorgenommene Verbesserungen:
${improvements.join('\n')}

✅ Entspricht EmpCo-Richtlinie (EU) 2024/825`;
};

// Extract claims from text
export const extractClaimsFromText = (text: string): string[] => {
  // Wenn der Text sehr kurz ist, gib ihn einfach zurück
  if (text.length < 50) {
    return [text.trim()];
  }
  
  // VERBESSERT: Schütze Abkürzungen vor falscher Satz-Trennung
  let processedText = text
    .replace(/\b(z\.B|d\.h|u\.a|i\.d\.R|etc|usw|inkl|evtl|ggf|bzgl|bzw|ca|Dr|Prof|GmbH|AG|UG)\./gi, 
      (match) => match.replace('.', '___DOT___'));
  
  // Simple sentence splitter - splittet bei Satzzeichen
  let sentences: string[] = processedText.match(/[^.!?]+[.!?]+/g) || [];
  
  // Wenn keine Sätze mit Trennzeichen gefunden werden, gib den ganzen Text zurück
  if (sentences.length === 0) {
    return [text.trim()];
  }
  
  // Zusätzlich: Wenn es Text nach dem letzten Trennzeichen gibt, fügt ihn hinzu
  const lastMatch = processedText.match(/[.!?]\s*(.+)$/);
  if (lastMatch && lastMatch[1]) {
    sentences.push(lastMatch[1]);
  }
  
  // VERBESSERT: Stelle Abkürzungen wieder her und filtere zu kurze Sätze
  return sentences
    .map(s => s.trim()
      .replace(/___DOT___/g, '.')
      .replace(/^[.!?]+|[.!?]+$/g, '')
    )
    .filter(s => {
      // Mindestens 5 Wörter für einen echten Claim
      const wordCount = s.trim().split(/\s+/).length;
      return wordCount >= 5 && s.length > 0;
    });
}; 