// Zentrale Sammlung aller regulatorischen Quellen und Zertifizierungen
//
// Die eigentlichen Daten leben jetzt versioniert in lib/legal-rules.json und
// werden über lib/legalRules.ts geladen. Diese Datei re-exportiert sie nur,
// damit bestehende Importe (`from "../lib/regulatorySources"`) unverändert
// weiterfunktionieren. Neue Quellen bitte in lib/legal-rules.json ergänzen,
// nicht hier.
export type { RegulatorySource } from "./legalRules";
export { REGULATORY_SOURCES } from "./legalRules";


export function linkifyRegulatorySources(text: string): string {
  return text;
}
