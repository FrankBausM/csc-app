# Lern- und Verbesserungssystem für Greenwashing-Analyse

## Problem-Diagnose für aktuellen Claim

**Claim:** "Damit ist GreenGlow das erste Modelabel weltweit, das Mode ohne jegliche Umweltbelastung anbietet"

### Was SOLLTE erkannt werden:
1. ✅ **Zero-Impact-Claim** (Score 94): "ohne jegliche Umweltbelastung"
2. ✅ **Superlativ + geografischer Scope** (Score 94): "erste Modelabel weltweit"
3. ✅ **KEIN Siegel-Problem**: "Modelabel" = Modemarke, nicht Zertifikat

### Technische Analyse zeigt:
- Patterns funktionieren KORREKT
- Beide Hauptprobleme werden erkannt
- Score sollte 94 (CRITICAL) sein

### Mögliche Ursachen für "falsche Bewertung":
1. **Incomplete Explanation**: Nicht alle erkannten Probleme werden in der Erklärung aufgelistet
2. **Explanation Order**: Zero-Impact überschreibt Superlativ-Message
3. **UI-Display**: Frontend zeigt nur erstes Problem
4. **Multiple Issues nicht kombiniert**: Code zeigt nicht beide Verstöße gleichzeitig

---

## 🎯 Strategien für kontinuierliches Lernen

### 1. USER FEEDBACK SYSTEM (Kurzfristig umsetzbar)

#### A. Feedback-Interface
```typescript
interface ClaimFeedback {
  claimId: string;
  claimText: string;
  systemScore: number;
  systemRiskLevel: string;
  detectedIssues: string[];
  
  // User Feedback
  feedbackType: "correct" | "incorrect" | "partially_correct";
  userScore?: number;  // Was sollte der Score sein?
  userRiskLevel?: string;
  missedIssues?: string[];  // Was wurde übersehen?
  falsePositives?: string[];  // Was wurde fälschlich erkannt?
  comment?: string;
  
  timestamp: Date;
  userId?: string;
}
```

#### B. Feedback-Sammlung in UI
- Nach jeder Claim-Analyse: "War diese Bewertung korrekt?" ✓ / ✗
- Bei ✗: Detailliertes Feedback-Formular
- Bei ✓: Einfaches Thumbs-up logging

#### C. Feedback-Dashboard (Reports-Seite)
```
📊 Modell-Performance
- Genauigkeit: 87% (234/268 Claims korrekt bewertet)
- Häufigste Fehler:
  1. Modelabel-Kontext (12 false positives)
  2. Qualifizierte absolute Aussagen (8 false positives)
  3. Branchenspezifische Begriffe (5 false negatives)
```

---

### 2. CONFIDENCE SCORING (Mittelfristig)

#### Unsicherheit explizit machen
```typescript
interface AnalysisResult {
  riskScore: number;
  confidence: number;  // 0-100%
  uncertaintyReasons: string[];
}

// Beispiel: Niedrige Confidence bei:
- Grenzfällen (Score 34-36, 59-61, 74-76)
- Widersprüchlichen Signalen (Claim + Zertifizierung erwähnt)
- Kontextabhängigen Begriffen ("Label", "Siegel" in Mode-Kontext)
```

#### UI-Markierung
```
🟡 MEDIUM (Score 48) - Confidence: 65%
⚠️  Unsicher: "Label" kann Marke oder Zertifikat bedeuten
→ Bitte manuell überprüfen
```

---

### 3. PATTERN ANALYTICS & REFINEMENT (Laufend)

#### A. Pattern-Performance-Tracking
```typescript
interface PatternStats {
  patternId: string;
  patternName: string;
  triggeredCount: number;
  truePositives: number;  // Via User-Feedback
  falsePositives: number;
  precision: number;  // TP / (TP + FP)
  avgConfidence: number;
}
```

#### B. Auto-Refinement
```typescript
// Wenn Pattern "Siegel-Detection" zu viele False Positives hat:
// → Automatisch Confidence reduzieren
// → Flag für manuelle Review
// → Vorschlag für Regex-Anpassung

if (pattern.falsePositives > 10 && pattern.precision < 0.7) {
  pattern.confidence = 0.6;
  pattern.needsReview = true;
  suggestRefinement(pattern);
}
```

---

### 4. DOMAIN-SPECIFIC LEARNING (Branchenkontext)

#### Branchenspezifische Whitelist/Blacklist
```typescript
interface IndustryContext {
  industry: "fashion" | "energy" | "food" | "transport";
  
  // Mode-Industrie
  fashion: {
    termMeanings: {
      "label": "Marke (NICHT Zertifikat)",
      "kollektion": "Produktreihe (neutral)",
      "sustainable fashion": "häufig Greenwashing"
    },
    
    approvedCertifications: [
      "GOTS", "Fairtrade Textil", "Bluesign", "Oeko-Tex Standard 100"
    ],
    
    highRiskPhrases: [
      "eco collection", "conscious line", "green fashion"
    ]
  }
}
```

---

### 5. MACHINE LEARNING INTEGRATION (Langfristig)

#### Phase 1: Datensammlung
- Alle analysierten Claims speichern
- User-Feedback sammeln (min. 500-1000 gelabelte Examples)
- Export für Training: CSV mit [Text, TrueScore, TrueRiskLevel, Issues]

#### Phase 2: Hybrid-Modell
```
┌─────────────────────────────────────┐
│  Aktuelles Regelbasiertes System    │
│  (Transparenz, Nachvollziehbarkeit) │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  ML-Modell (Confidence Prediction)  │
│  → Gibt Confidence-Score aus        │
│  → Erkennt grenzwertige Fälle       │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  Kombinierte Ausgabe:               │
│  - Score (Regel-basiert)            │
│  - Confidence (ML-basiert)          │
│  - Erklärung (Regel-basiert)        │
└─────────────────────────────────────┘
```

#### Vorteile Hybrid-Ansatz:
✅ Transparenz bleibt erhalten (Regelwerk)
✅ ML verbessert Grenzfall-Erkennung
✅ Keine "Black Box" für rechtliche Compliance
✅ Continuous Learning möglich

---

### 6. A/B TESTING FÜR SCHWELLENWERTE

#### Experiment-Framework
```typescript
interface Experiment {
  id: string;
  name: string;
  variants: {
    control: { threshold: 35 },  // Aktuell
    variantA: { threshold: 40 },  // Test: Strengere Bewertung
  };
  
  metrics: {
    userAgreementRate: number;  // % User stimmen zu
    falsePositiveRate: number;
    falseNegativeRate: number;
  };
}
```

#### Beispiel: Zero-Impact Score-Optimierung
```
Experiment: "Zero-Impact Score Calibration"
- Control: Score 94
- Variant A: Score 96
- Variant B: Score 92

Metric: User Agreement Rate
→ Wähle Variante mit höchster Agreement Rate
```

---

### 7. KONTINUIERLICHE VALIDIERUNG

#### A. Benchmark-Test-Suite
```typescript
// test/benchmark-claims.ts
const BENCHMARK_CLAIMS = [
  {
    text: "Damit ist GreenGlow das erste Modelabel weltweit, das Mode ohne jegliche Umweltbelastung anbietet",
    expectedScore: 94,
    expectedRiskLevel: "CRITICAL",
    expectedIssues: [
      "Zero-Impact-Claim",
      "Superlativ + geografischer Scope"
    ],
    mustNotDetect: ["Siegel-Problem"]  // ← Wichtig!
  },
  // ... 50-100 weitere Test-Claims
];
```

#### B. Automatische Regression-Tests
```bash
npm run test:claims
# → Prüft ob alle Benchmark-Claims korrekt bewertet werden
# → Bei Änderungen am Code: sofort sehen ob etwas "kaputt" geht
```

---

## 🚀 Umsetzungsplan

### Phase 1 (Sofort - 1 Woche)
- [x] Benchmark-Test-Suite erstellen
- [ ] Feedback-Button in Claim-Detail-View
- [ ] Feedback-Storage in localStorage
- [ ] Feedback-Export-Funktion (CSV)

### Phase 2 (2-4 Wochen)
- [ ] Confidence-Scoring implementieren
- [ ] Grenzfall-Markierung in UI
- [ ] Pattern-Analytics-Dashboard
- [ ] User-Feedback-Auswertung

### Phase 3 (2-3 Monate)
- [ ] Branchenspezifische Kontexte
- [ ] A/B-Testing-Framework
- [ ] 1000+ Claims mit Feedback sammeln
- [ ] Erste ML-Experimente (Confidence-Prediction)

### Phase 4 (6+ Monate)
- [ ] Hybrid-Modell (Regeln + ML)
- [ ] Automatisches Pattern-Refinement
- [ ] Multi-Language-Support
- [ ] Echtzeit-Updates aus neuer Rechtsprechung

---

## 📋 Nächste Schritte für aktuelles Problem

### Debugging-Checkliste:
1. ✅ Patterns funktionieren (Test-Script bestätigt)
2. ❓ Werden BEIDE Issues in `empcoViolations` array aufgenommen?
3. ❓ Wird `empcoViolations.join('\n')` korrekt in Explanation eingefügt?
4. ❓ Zeigt UI alle Issues oder nur das erste?

### Fix-Vorschläge:
```typescript
// In analyzeClaim(): Sicherstellen dass ALLE Issues geloggt werden
console.log('[DEBUG] Detected Issues:', allIssues);
console.log('[DEBUG] Final Score:', baseRiskScore);
console.log('[DEBUG] Risk Level:', riskLevel);

// In UI: Alle Issues als Liste anzeigen
{claim.linkedClaims?.map((issue, idx) => (
  <li key={idx} className="text-sm">{issue}</li>
))}
```

### Verbesserung: Confidence-Flag hinzufügen
```typescript
// Bei Kontext-sensitiven Begriffen:
if (hasSiegelMention && claimText.includes('mode')) {
  uncertaintyReasons.push("⚠️ Kontext-sensitiv: 'Label' kann Marke oder Zertifikat bedeuten");
  confidence = Math.min(confidence, 0.75);
}
```
