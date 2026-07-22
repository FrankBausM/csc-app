# 🎓 Trainingsanleitung: System-Verbesserung für Claim-Erkennung

## Übersicht

Dieses Dokument beschreibt, wie Sie das Greenwashing-Analyse-System kontinuierlich verbessern können, um:
1. **Kritische Claims sicherer zu erkennen**
2. **Falsch-Positive zu reduzieren** (Textfragmente, die keine Claims sind)
3. **Bessere Alternativtexte zu generieren**

---

## 🔍 **Bestehende Mechanismen**

### 1. Feedback-System
**Lokation:** `app/AppContext.tsx` (Zeilen 183-209, 211-223)

Das System erfasst bereits manuelle Korrekturen:

```typescript
interface AnalyzedClaim {
  // Original-Bewertung
  riskScore: number;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  
  // Feedback-Felder
  isManuallyOverridden?: boolean;
  originalRiskScore?: number;
  originalRiskLevel?: string;
  userCorrectedScore?: number;
  userCorrectedLevel?: string;
  feedbackReason?: string;
  feedbackTimestamp?: Date;
}
```

**Wie nutzen:**
- In der UI können Sie Claims manuell korrigieren (Funktion `overrideClaimRisk`)
- Feedback wird gespeichert und kann als CSV exportiert werden
- Diese Daten sind die Basis für Pattern-Verbesserung

### 2. Non-Substantive Text Filter
**Lokation:** `lib/appContext.ts` (Zeilen 240-275)

Filtert bereits aus:
- Service-Hinweise ("Weitere Informationen...")
- Kontaktdaten (Email, Telefon)
- Links und URLs
- Pressekontakte
- Call-to-Actions ohne Inhalt
- "Kein Greenwashing" (Negativaussagen)

---

## 🎯 **Trainings-Workflow**

### **Phase 1: Daten sammeln (IST-Zustand)**

1. **Feedback-Report exportieren**
   - Gehen Sie zu `/reports`
   - Klicken Sie "📊 Feedback-Report exportieren"
   - Sie erhalten eine CSV mit allen manuellen Korrekturen

2. **Kategorisieren Sie Fehler:**

| Fehlertyp | Beschreibung | Beispiel |
|-----------|--------------|----------|
| **False Positive** | Text wird als Claim erkannt, ist aber keiner | "Alle Beiträge", "Weitere Informationen unter..." |
| **False Negative** | Echter Claim wird übersehen | Subtile Greenwashing-Aussagen |
| **Unter-Bewertung** | Kritischer Claim wird als LOW/MEDIUM eingestuft | "100% klimaneutral" → nur MEDIUM statt CRITICAL |
| **Über-Bewertung** | Harmloser Text wird als CRITICAL eingestuft | Faktische Aussage mit Zertifizierung |
| **Schlechte Alternative** | Alternativtext unbrauchbar oder identisch | Keine echten Änderungen vorgeschlagen |

---

### **Phase 2: Patterns erweitern**

#### **A) False Positives reduzieren**

**Wo:** `lib/appContext.ts` → `isNonSubstantiveText` (ab Zeile 240)

**Beispiel - Neue Regel hinzufügen:**

```typescript
const isNonSubstantiveText = 
  // ... bestehende Regeln ...
  
  // NEUE REGEL: "Alle Beiträge" im Blog-Kontext
  /^alle\s+(beiträge|artikel|posts)/i.test(claimText) && claimText.length < 40 ||
  
  // NEUE REGEL: Navigations-Elemente
  /^(zurück|weiter|vor|home|start|menü)/i.test(claimText) && claimText.length < 30 ||
  
  // NEUE REGEL: Datum/Zeitangaben
  /^\d{1,2}\.\s*\w+\s+\d{4}/i.test(claimText) ||
  
  // ... weitere Regeln ...
```

**Testen Sie nach jeder Änderung:**
```bash
npm run dev
# Analysieren Sie bekannte Problemtexte erneut
```

#### **B) Kritische Claims besser erkennen**

**Wo:** `lib/appContext.ts` → `GREENWASHING_INDICATORS` (Zeile ~80-150)

**Beispiel - Neue kritische Patterns:**

```typescript
export const GREENWASHING_INDICATORS = {
  absoluteWords: [
    // Bestehende...
    "100%",
    "alle",
    
    // NEUE gefährliche Absolute:
    "ausnahmslos",
    "jede/r/s",
    "sämtliche",
    "restlos",
    "vollkommen",
    "gänzlich",
  ],
  
  // NEU: Kombinations-Patterns (besonders kritisch)
  criticalCombinations: [
    { words: ["100%", "klimaneutral"], minRisk: 85 },
    { words: ["beste", "nachhaltig"], minRisk: 75 },
    { words: ["komplett", "emissionsfrei"], minRisk: 90 },
  ]
}
```

#### **C) Bessere Alternativtexte**

**Wo:** `lib/appContext.ts` → `generateConcreteRewrite()` (ab Zeile 714)

**Beispiel - Neue Ersetzungsregel:**

```typescript
// In generateConcreteRewrite() hinzufügen:

// NEUE REGEL: "zu 100% recycelbar"
if (/\bzu\s+100\s*%\s+recycelbar\b/i.test(rewrittenText)) {
  rewrittenText = rewrittenText.replace(
    /\bzu\s+100\s*%\s+recycelbar\b/gi,
    "zu 87% recycelbar (bezogen auf Hauptmaterialien, Angabe nach DIN EN ISO 14021)"
  );
}

// NEUE REGEL: "schont Ressourcen"
if (/\bschont\s+(die\s+)?Ressourcen\b/i.test(rewrittenText)) {
  rewrittenText = rewrittenText.replace(
    /\bschont\s+(die\s+)?Ressourcen\b/gi,
    "reduziert den Ressourcenverbrauch um 42% (ggü. 2020, Scope 1+2, ISO 14001-zertifiziert)"
  );
}
```

---

### **Phase 3: Testen & Validieren**

1. **Regressionstests:**
   - Sammeln Sie 20-30 echte Claims (kritisch + harmlos)
   - Speichern Sie diese in `test-claims.txt`
   - Nach jeder Pattern-Änderung: Alle Claims neu analysieren
   - Vergleichen: Wurden bekannte Probleme behoben, ohne neue zu erzeugen?

2. **A/B-Testing:**
   - Alte Version: Dokumentieren Sie Ergebnisse
   - Neue Version: Vergleichen Sie Verbesserungen
   - Metrik: % korrekt erkannter kritischer Claims, % False Positives

---

## 🤖 **Machine Learning Integration (Zukunft)**

### Vorbereitung: Datensammlung

Ihr Feedback-Report ist **perfekt geeignet** für ML-Training:

```csv
claimText,originalScore,correctedScore,originalLevel,correctedLevel,reason
"100% nachhaltig",45,85,MEDIUM,CRITICAL,"Absolute Aussage ohne Beleg"
"Alle Beiträge",75,0,CRITICAL,LOW,"Kein Claim - Navigationstext"
...
```

### Nächste Schritte für ML:

1. **Datensatz aufbauen:**
   - Mindestens 200-500 korrigierte Claims
   - Ausgewogene Verteilung (CRITICAL/HIGH/MEDIUM/LOW)
   - Gleich viele False Positives wie echte Claims

2. **Features extrahieren:**
   - Wortlänge, Satzstruktur
   - Vorhandensein von Zahlen/Prozenten
   - Zertifizierungs-Keywords
   - Kontext (Position im Text, umgebende Sätze)

3. **Modell-Optionen:**
   - **Einfach:** Logistische Regression (sklearn)
   - **Fortgeschritten:** BERT/RoBERTa Fine-Tuning
   - **Optimal:** Custom Transformer für deutsche Nachhaltigkeits-Claims

4. **Integration:**
   ```typescript
   // Zukünftige API-Integration
   const mlScore = await fetch('/api/ml-predict', {
     method: 'POST',
     body: JSON.stringify({ text: claimText })
   });
   
   // Kombiniere Regel-basiert + ML
   const finalScore = (ruleBasedScore * 0.4) + (mlScore * 0.6);
   ```

---

## 📋 **Checkliste: Monatliche Verbesserung**

- [ ] Feedback-Report exportieren
- [ ] Top 10 Fehler identifizieren
- [ ] 3-5 neue Patterns zu `isNonSubstantiveText` hinzufügen
- [ ] 2-3 neue Ersetzungsregeln zu `generateConcreteRewrite()` hinzufügen
- [ ] Regressionstests durchführen
- [ ] Dokumentation aktualisieren

---

## 🎯 **Quick Wins - Sofort umsetzbar**

### 1. Erweitere Non-Substantive Filter

Fügen Sie diese Zeilen zu `isNonSubstantiveText` hinzu:

```typescript
// Blog/News-Navigation
/^(alle|aktuelle|neueste|frühere)\s+(beiträge|artikel|news)/i.test(claimText) && claimText.length < 60 ||

// Social Media Links
/^(folge?n?\s+uns|teilen|liken|kommentieren)/i.test(claimText) && claimText.length < 50 ||

// Formular-Beschriftungen
/^(name|e-mail|nachricht|betreff|absender|empfänger):/i.test(claimText) ||

// Datum-Stempel (Blog-Posts)
/^\d{1,2}\.\s*(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)/i.test(claimText) ||
```

### 2. Verbessere Claim-Extraktion

**Lokation:** `lib/appContext.ts` → `extractClaimsFromText()` (Zeile 1087)

**Problem:** Sätze werden manchmal zu früh getrennt.

**Lösung:**
```typescript
export const extractClaimsFromText = (text: string): string[] => {
  if (text.length < 50) {
    return [text.trim()];
  }
  
  // VERBESSERT: Berücksichtige Abkürzungen (z.B., d.h., u.a.)
  let sentences: string[] = text
    .replace(/\b(z\.B|d\.h|u\.a|i\.d\.R|etc)\./gi, (match) => match.replace('.', '___DOT___'))
    .match(/[^.!?]+[.!?]+/g) || [];
  
  // VERBESSERT: Nur Sätze mit mindestens 5 Wörtern als Claims
  sentences = sentences
    .map(s => s.replace(/___DOT___/g, '.'))
    .filter(s => s.trim().split(/\s+/).length >= 5);
  
  if (sentences.length === 0) {
    return [text.trim()];
  }
  
  return sentences
    .map(s => s.trim().replace(/^[.!?]+|[.!?]+$/g, ''))
    .filter(s => s.length > 0);
};
```

---

## 📚 **Ressourcen**

- **EmpCo-Richtlinie (EU) 2024/825:** https://eur-lex.europa.eu/eli/dir/2024/825/oj
- **UWG § 5a (Irreführung):** https://www.gesetze-im-internet.de/uwg_2004/__5a.html
- **ISO 14021 (Umweltbezogene Aussagen):** https://www.iso.org/standard/66652.html

---

## 🆘 **Support**

Bei Fragen zur Pattern-Erweiterung:
1. Konsultieren Sie die bestehenden Patterns in `lib/appContext.ts`
2. Testen Sie neue Regeln lokal mit `npm run dev`
3. Dokumentieren Sie Änderungen in diesem Dokument

**Letzte Aktualisierung:** 2026-06-08
