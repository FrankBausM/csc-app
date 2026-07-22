#!/usr/bin/env python3
"""
Aktualisierung des Regelwerks in der CSC-App.
Korrigiert den Rechtsstatus von EmpCo und GCD in allen Dateien.
Ergaenzt neue Quellen.
Ausfuehren: python3 update_regelwerk.py
"""
import os, re

app = 'app'
comp = 'components'
lib_dir = 'lib'

if not os.path.isdir(app):
    print("FEHLER: Im Projektordner cic-vercel 3 ausfuehren!")
    exit(1)

count = 0

# ============================================================
# KORREKTUREN
# ============================================================

# Falsche Aussagen, die korrigiert werden muessen:
REPLACEMENTS = [
    # --- GCD Status korrigieren ---
    # GCD tritt NICHT am 27. September in Kraft
    (
        'Deadline: 27. September 2026',
        'Deadline EmpCo: 27. September 2026 (GCD noch nicht verabschiedet)'
    ),
    (
        'Deadline: 27.09.2026',
        'Deadline EmpCo: 27.09.2026 (GCD noch nicht verabschiedet)'
    ),
    (
        'ab Sept. 2026 EmpCo-relevant',
        'ab 27.09.2026 EmpCo-verbindlich (GCD noch in Verhandlung)'
    ),
    (
        'ab September 2026',
        'ab 27. September 2026 (EmpCo)'
    ),
    
    # GCD ist NICHT verabschiedet
    (
        'Green Claims Directive (GCD) und EmpCo-Richtlinie',
        'EmpCo-Richtlinie (verbindlich ab 27.09.2026) und Green Claims Directive (GCD, noch nicht verabschiedet)'
    ),
    
    # Klarstellung: EmpCo ist der zentrale Standard
    (
        'EmpCo-Richtlinie (verbindlich ab Sept. 2026)',
        'EmpCo-Richtlinie (verbindlich ab 27.09.2026 — bereits in deutsches Recht umgesetzt)'
    ),
    
    # --- Neue Quellen ergaenzen ---
    # Umweltbundesamt und Eagle LSP als Quellen
]

# Texte, die den GCD-Status falsch darstellen
GCD_FALSE_CLAIMS = [
    # GCD als "verbindlich" oder "in Kraft" bezeichnen
    (r'GCD.*verbindlich', 'GCD (noch nicht verabschiedet, Trilog-Verhandlungen pausiert)'),
    (r'Green Claims Directive.*in Kraft', 'Green Claims Directive (Verabschiedung noch ausstehend)'),
]


def fix_file(filepath):
    global count
    with open(filepath, 'r') as f:
        orig = f.read()
    
    new = orig
    
    # Einfache String-Ersetzungen
    for old, replacement in REPLACEMENTS:
        new = new.replace(old, replacement)
    
    # Neue Quellen-URLs ergaenzen (in Dateien die Quellenverzeichnisse haben)
    if 'REGULATORY_SOURCES' in new or 'regulatorySources' in new or 'Quellenverzeichnis' in new:
        if 'umweltbundesamt.de' not in new:
            # Umweltbundesamt-Quelle hinzufuegen
            new = new.replace(
                "'Changing Markets Foundation'",
                """'Changing Markets Foundation',
  'Umweltbundesamt Greenwashing': {
    url: 'https://www.umweltbundesamt.de/themen/staerkerer-schutz-vor-greenwashing-in-deutsches',
    label: 'Umweltbundesamt — Stärkerer Schutz vor Greenwashing in deutsches Recht'
  },
  'Eagle LSP Green Claims': {
    url: 'https://eagle-lsp.de/green-claims-directive/',
    label: 'Eagle LSP — Alles zu EmpCo & Green Claims Directive'
  }"""
            )
    
    # In Pattern-Beschreibungen den Status korrigieren
    if 'EmpCo-Richtlinie' in new and 'Green Claims Directive' in new:
        # Sicherstellen, dass der korrekte Status angegeben wird
        new = new.replace(
            'Green Claims Directive (EU)',
            'Green Claims Directive (EU) — noch nicht verabschiedet'
        )
        # Doppelte Korrekturen vermeiden
        new = new.replace(
            'noch nicht verabschiedet — noch nicht verabschiedet',
            'noch nicht verabschiedet'
        )
    
    if new != orig:
        with open(filepath, 'w') as f:
            f.write(new)
        count += 1
        print(f"  AKTUALISIERT: {filepath}")
    else:
        pass  # Keine Aenderung noetig


# Alle relevanten Dateien durchgehen
print("Aktualisiere Regelwerk-Referenzen...")
print("")

for d in [app, comp, lib_dir]:
    if not os.path.isdir(d):
        continue
    for root, dirs, files in os.walk(d):
        for f in files:
            if f.endswith(('.tsx', '.jsx', '.ts', '.js', '.css', '.md')):
                fix_file(os.path.join(root, f))

# Auch Root-Dateien pruefen
for f in os.listdir('.'):
    if f.endswith(('.md', '.js', '.ts')):
        fix_file(f)

print(f"\n=== {count} Dateien aktualisiert ===")

# ============================================================
# ZUSAMMENFASSUNG der rechtlichen Lage (fuer Referenz)
# ============================================================
summary = """
=== AKTUELLER RECHTSSTAND (Mai 2026) ===

1. EmpCo-Richtlinie (EU) 2024/825
   - Status: VERABSCHIEDET und GUELTIG
   - Enforcement: Ab 27. September 2026 EU-weit scharf geschaltet
   - Deutsche Umsetzung: 3. UWG-Aenderungsgesetz (BGBl. 2026 I Nr. 43)
     Veroeffentlicht am 19.02.2026
   - Wirkung: Zentraler Anti-Greenwashing-Standard
   - Quelle: https://eur-lex.europa.eu/eli/dir/2024/825/oj?locale=de

2. Green Claims Directive (GCD)
   - Status: NOCH NICHT VERABSCHIEDET
   - Trilog-Verhandlungen: Pausiert/abgesagt seit 2025
   - Zukunft: Ungewiss, aber weiterhin im EU-Arbeitsprogramm 2026
   - Verhaeltnis zu EmpCo: GCD waere lex specialis (spezielleres Gesetz)
   - Quelle: https://eagle-lsp.de/green-claims-directive/

3. Neue Quellen hinzugefuegt:
   - Umweltbundesamt: https://www.umweltbundesamt.de/themen/staerkerer-schutz-vor-greenwashing-in-deutsches
   - Eagle LSP: https://eagle-lsp.de/green-claims-directive/
"""
print(summary)
