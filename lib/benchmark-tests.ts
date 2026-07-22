/**
 * BENCHMARK TEST SUITE - Greenwashing Detection
 * 
 * Diese Datei enthält Test-Claims mit erwarteten Bewertungen.
 * Nutze diese für:
 * - Regression-Testing (prüfen ob Code-Änderungen Bewertungen ändern)
 * - Performance-Validierung (Accuracy, Precision, Recall)
 * - Training-Daten für ML-Modelle
 */

export interface BenchmarkClaim {
  id: string;
  text: string;
  expectedScore: number;
  expectedRiskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  expectedIssues: string[];  // Welche Probleme MÜSSEN erkannt werden
  mustNotDetect?: string[];  // Was darf NICHT als Problem erkannt werden
  category: string;
  notes?: string;
}

export const BENCHMARK_CLAIMS: BenchmarkClaim[] = [
  // ===== KRITISCHE FÄLLE (User-Reported) =====
  {
    id: "modelabel-zero-impact",
    text: "Damit ist GreenGlow das erste Modelabel weltweit, das Mode ohne jegliche Umweltbelastung anbietet",
    expectedScore: 94,
    expectedRiskLevel: "CRITICAL",
    expectedIssues: [
      "Zero-Impact-Claim",
      "Superlativ+geografischer-Scope"
    ],
    mustNotDetect: [
      "Siegel-Problem"  // "Modelabel" = Marke, NICHT Zertifikat!
    ],
    category: "Zero-Impact + Superlativ",
    notes: "User reported: 'Modelabel bedeutet Marke, nicht Siegel. Ohne jegliche Umweltbelastung wurde übersehen'"
  },

  // ===== ZERO-IMPACT CLAIMS =====
  {
    id: "zero-impact-1",
    text: "Unser Produkt hat keinerlei Umweltauswirkungen",
    expectedScore: 94,
    expectedRiskLevel: "CRITICAL",
    expectedIssues: ["Zero-Impact-Claim"],
    category: "Zero-Impact"
  },
  {
    id: "zero-impact-2",
    text: "Null Emissionen, null Impact auf die Umwelt",
    expectedScore: 94,
    expectedRiskLevel: "CRITICAL",
    expectedIssues: ["Zero-Impact-Claim"],
    category: "Zero-Impact"
  },
  {
    id: "zero-impact-3",
    text: "Frei von jeglicher Umweltbelastung",
    expectedScore: 94,
    expectedRiskLevel: "CRITICAL",
    expectedIssues: ["Zero-Impact-Claim"],
    category: "Zero-Impact"
  },

  // ===== SUPERLATIVE MIT GEOGRAFISCHEM SCOPE =====
  {
    id: "superlativ-weltweit-1",
    text: "Das grünste Unternehmen weltweit",
    expectedScore: 94,
    expectedRiskLevel: "CRITICAL",
    expectedIssues: ["Superlativ+geografischer-Scope"],
    category: "Superlativ"
  },
  {
    id: "superlativ-europa-1",
    text: "Erste klimaneutrale Airline in Europa",
    expectedScore: 94,
    expectedRiskLevel: "CRITICAL",
    expectedIssues: ["Superlativ+geografischer-Scope"],
    category: "Superlativ"
  },
  {
    id: "superlativ-deutschland-1",
    text: "Nachhaltigster Stromtarif in Deutschland",
    expectedScore: 94,
    expectedRiskLevel: "CRITICAL",
    expectedIssues: ["Superlativ+geografischer-Scope"],
    category: "Superlativ"
  },

  // ===== KLIMANEUTRALITÄT OHNE VERMEIDUNG =====
  {
    id: "klimaneutral-kompensation-1",
    text: "100% klimaneutral durch Kompensation",
    expectedScore: 92,
    expectedRiskLevel: "CRITICAL",
    expectedIssues: ["Klimaneutralität", "Kompensation"],
    category: "Klimaneutralität"
  },
  {
    id: "klimaneutral-ohne-erklaerung-1",
    text: "Klimaneutrale Produktion seit 2024",
    expectedScore: 90,
    expectedRiskLevel: "CRITICAL",
    expectedIssues: ["Klimaneutralität"],
    category: "Klimaneutralität"
  },
  {
    id: "klimaneutral-mit-reduktion-1",
    text: "42% CO₂-Reduktion seit 2020 (Scope 1+2). Verbleibende Emissionen werden durch Gold Standard-Projekte kompensiert.",
    expectedScore: 0,
    expectedRiskLevel: "LOW",
    expectedIssues: [],
    category: "Klimaneutralität (korrekt)",
    notes: "Korrekte Formulierung: Reduktion ZUERST erwähnt"
  },

  // ===== MODELABEL-KONTEXT (KEIN SIEGEL!) =====
  {
    id: "modelabel-korrekt-1",
    text: "GreenGlow ist ein nachhaltiges Modelabel aus Berlin",
    expectedScore: 88,  // Wegen "nachhaltig" ohne Beleg
    expectedRiskLevel: "CRITICAL",
    expectedIssues: ["Allgemeine Umweltaussage"],
    mustNotDetect: ["Siegel"],
    category: "Modelabel-Kontext",
    notes: "'Modelabel' = Marke, NICHT Zertifikat"
  },
  {
    id: "modelabel-zertifiziert-1",
    text: "Fair Fashion Label mit GOTS-Zertifizierung",
    expectedScore: 0,
    expectedRiskLevel: "LOW",
    expectedIssues: [],
    mustNotDetect: ["Siegel"],
    category: "Modelabel-Kontext (mit Zertifikat)",
    notes: "'Fashion Label' + GOTS = OK, kein Problem"
  },

  // ===== UNBELEGTE SIEGEL (ECHTE PROBLEME) =====
  {
    id: "eigenes-siegel-1",
    text: "Trägt unser hauseigenes Nachhaltigkeitssiegel",
    expectedScore: 85,
    expectedRiskLevel: "CRITICAL",
    expectedIssues: ["Siegel"],
    category: "Unbelegte Siegel"
  },
  {
    id: "siegel-ohne-kontext-1",
    text: "Ausgezeichnet mit dem Green Excellence Label",
    expectedScore: 85,
    expectedRiskLevel: "CRITICAL",
    expectedIssues: ["Siegel"],
    category: "Unbelegte Siegel",
    notes: "Kein anerkanntes Label (nicht in EMPCO_APPROVED_LABELS)"
  },

  // ===== ABSOLUTE AUSSAGEN =====
  {
    id: "absolut-ohne-quali-1",
    text: "Alle unsere Produkte sind klimaneutral",
    expectedScore: 90,  // Klimaneutral ohne Erklärung
    expectedRiskLevel: "CRITICAL",
    expectedIssues: ["Klimaneutralität", "Absolute Aussage"],
    category: "Absolute Aussagen"
  },
  {
    id: "absolut-mit-quali-1",
    text: "Durchschnittlich 67% weniger CO₂ (ggü. 2020, Scope 1+2)",
    expectedScore: 0,
    expectedRiskLevel: "LOW",
    expectedIssues: [],
    category: "Absolute Aussagen (qualifiziert)",
    notes: "Korrekt: Prozentangabe, Baseline, Scope definiert"
  },

  // ===== VAGE AUSSAGEN =====
  {
    id: "vage-1",
    text: "Umweltfreundliche Verpackung",
    expectedScore: 88,
    expectedRiskLevel: "CRITICAL",
    expectedIssues: ["Allgemeine Umweltaussage"],
    category: "Vage Aussagen"
  },
  {
    id: "vage-mit-beleg-1",
    text: "Umweltfreundliche Verpackung nach ISO 14024 (EU Ecolabel)",
    expectedScore: 0,
    expectedRiskLevel: "LOW",
    expectedIssues: [],
    category: "Vage Aussagen (mit Beleg)",
    notes: "Korrekt: EN ISO 14024 erwähnt"
  },

  // ===== GRENZFÄLLE (MEDIUM) =====
  {
    id: "grenzfall-1",
    text: "Nachhaltige Materialien aus kontrolliertem Anbau, auditiert durch externe Stelle 2025",
    expectedScore: 48,
    expectedRiskLevel: "MEDIUM",
    expectedIssues: ["Vage Aussage"],
    category: "Grenzfälle",
    notes: "Hat Audit, aber kein anerkanntes Label"
  },

  // ===== SERVICE-HINWEISE (KEIN CLAIM) =====
  {
    id: "service-1",
    text: "Weitere Informationen unter www.example.com",
    expectedScore: 0,
    expectedRiskLevel: "LOW",
    expectedIssues: [],
    category: "Service-Hinweise",
    notes: "Kein bewertbarer Claim"
  },
  {
    id: "service-2",
    text: "Kontakt: info@example.com",
    expectedScore: 0,
    expectedRiskLevel: "LOW",
    expectedIssues: [],
    category: "Service-Hinweise"
  }
];

/**
 * Test-Runner-Funktion
 * Nutze diese um alle Benchmark-Claims zu testen
 */
export const runBenchmarkTests = (analyzeClaim: Function) => {
  const results = {
    total: BENCHMARK_CLAIMS.length,
    passed: 0,
    failed: 0,
    details: [] as any[]
  };

  BENCHMARK_CLAIMS.forEach(benchmark => {
    const result = analyzeClaim(benchmark.text);
    
    const scoreMatch = result.riskScore === benchmark.expectedScore;
    const levelMatch = result.riskLevel === benchmark.expectedRiskLevel;
    
    // Check if expected issues are detected
    const issuesMatch = benchmark.expectedIssues.every(expectedIssue => 
      result.debugInfo?.detectedPatterns?.some((p: string) => p.includes(expectedIssue))
    );
    
    // Check if mustNotDetect issues are NOT present
    const noFalsePositives = benchmark.mustNotDetect 
      ? benchmark.mustNotDetect.every(forbidden => 
          !result.debugInfo?.detectedPatterns?.some((p: string) => p.includes(forbidden))
        )
      : true;
    
    const passed = scoreMatch && levelMatch && issuesMatch && noFalsePositives;
    
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
      results.details.push({
        id: benchmark.id,
        text: benchmark.text.substring(0, 60) + "...",
        expected: {
          score: benchmark.expectedScore,
          level: benchmark.expectedRiskLevel,
          issues: benchmark.expectedIssues
        },
        actual: {
          score: result.riskScore,
          level: result.riskLevel,
          patterns: result.debugInfo?.detectedPatterns
        },
        scoreMatch,
        levelMatch,
        issuesMatch,
        noFalsePositives
      });
    }
  });

  return results;
};

/**
 * Exportiere Test-Daten für ML-Training
 */
export const exportTrainingData = () => {
  return BENCHMARK_CLAIMS.map(claim => ({
    text: claim.text,
    label_score: claim.expectedScore,
    label_risk_level: claim.expectedRiskLevel,
    label_issues: claim.expectedIssues.join("|"),
    category: claim.category,
    notes: claim.notes || ""
  }));
};
