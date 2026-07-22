// Test-Script für Claim-Analyse
// Claim: "Damit ist GreenGlow das erste Modelabel weltweit, das Mode ohne jegliche Umweltbelastung anbietet"

const claimText = "Damit ist GreenGlow das erste Modelabel weltweit, das Mode ohne jegliche Umweltbelastung anbietet";

console.log("=== CLAIM ANALYSE ===");
console.log("Text:", claimText);
console.log("\n");

// 1. Siegel-Detection Test
const siegelRegex = /(?<!mode|fashion|bekleidungs|textil|kleidungs)(\bsiegel\b|\blabel\b|\bzertifikat\b)|auszeichnung.*nachhaltig/i;
const siegelMatch = siegelRegex.test(claimText);
console.log("1. Siegel-Detection (sollte FALSE sein):");
console.log("   Pattern: /(?<!mode|fashion|bekleidungs|textil|kleidungs)(\\bsiegel\\b|\\blabel\\b|\\bzertifikat\\b)/i");
console.log("   Match:", siegelMatch);
console.log("   Problem: 'Modelabel' sollte NICHT als Siegel erkannt werden");
console.log("\n");

// 2. Zero-Impact-Detection Test
const zeroImpactRegex = /ohne\s+(jegliche|jede|jeder|alle|irgendeine|irgendwelche)\s+(umwelt.*belastung|belastung.*umwelt|umwelt.*auswirkung|auswirkung.*umwelt|impact|schaden)/i;
const zeroImpactMatch = zeroImpactRegex.test(claimText);
console.log("2. Zero-Impact-Detection (sollte TRUE sein):");
console.log("   Pattern: /ohne\\s+(jegliche|...)\\s+(umwelt.*belastung|...)/i");
console.log("   Match:", zeroImpactMatch);
console.log("   Erkannt: 'ohne jegliche Umweltbelastung'");
console.log("   Score: 94 (praktisch unmöglich)");
console.log("\n");

// 3. Superlativ-Detection Test
const superlatives = ["erste", "erster", "erstes", "ersten"];
const hasSuperlative = superlatives.some(word => 
  new RegExp(`\\b${word}\\b`, 'i').test(claimText)
);
console.log("3. Superlativ-Detection (sollte TRUE sein):");
console.log("   Superlativ gefunden:", hasSuperlative ? "JA ('erste')" : "NEIN");

const hasBranchComparison = /branche|markt|industrie|sektor|wettbewerb|weltweit|global|international|europa|deutschland|region|land/i.test(claimText);
console.log("   Geografischer/Branchen-Scope:", hasBranchComparison ? "JA ('weltweit')" : "NEIN");

if (hasSuperlative && hasBranchComparison) {
  console.log("   ✓ ERKANNT: Superlativ + geografischer Scope");
  console.log("   Score: 94 (nicht verifizierbar)");
}
console.log("\n");

// 4. Detaillierter Regex-Test für "Modelabel"
console.log("4. DETAILLIERTE ANALYSE: Warum wird 'Modelabel' erkannt?");
console.log("   Text enthält 'Modelabel': ja");

// Test verschiedene Varianten
const testWords = [
  "Modelabel",
  "Model Label", 
  "Modelabel,",
  "label",
  "Label"
];

console.log("\n   Teste Wort-für-Wort:");
testWords.forEach(word => {
  const labelRegex = /\blabel\b/i;
  const match = labelRegex.test(word);
  console.log(`   - "${word}": ${match ? "MATCHED" : "nicht matched"}`);
});

console.log("\n   Teste mit negative lookbehind:");
testWords.forEach(word => {
  const match = siegelRegex.test(word);
  console.log(`   - "${word}": ${match ? "MATCHED (Problem!)" : "nicht matched (OK)"}`);
});

console.log("\n");
console.log("=== ERWARTETE BEWERTUNG ===");
console.log("Score: 94 (höchster Wert)");
console.log("Risiko: CRITICAL");
console.log("\nErkannte Probleme:");
console.log("1. 🚨 Zero-Impact-Claim: 'ohne jegliche Umweltbelastung' (Score 94)");
console.log("2. 🚨 Superlativ + weltweit: 'erste Modelabel weltweit' (Score 94)");
console.log("3. ❌ KEIN Siegel-Problem: 'Modelabel' = Marke, nicht Zertifikat");
