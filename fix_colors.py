#!/usr/bin/env python3
"""
Fix alle inline Farbcodes in den React-Komponenten.
Ausfuehren: python3 fix_colors.py
"""
import os, re

app_dir = 'app'
components_dir = 'components'

if not os.path.isdir(app_dir):
    print("FEHLER: Bitte im Projektordner cic-vercel 3 ausfuehren!")
    exit(1)

fixes_total = 0

def fix_file(filepath):
    global fixes_total
    with open(filepath, 'r') as f:
        original = f.read()
    
    content = original
    
    # === ROSA AMPEL-BOX: Hintergrund + Border transparent ===
    # rgba(255, 107, 107, 0.2) -> transparent (Box-Hintergrund)
    content = content.replace('rgba(255, 107, 107, 0.2)', 'transparent')
    content = content.replace('rgba(255, 107, 107, 0.1)', 'transparent')
    content = content.replace('rgba(255, 107, 107, 0.05)', 'transparent')
    content = content.replace('rgba(255,107,107,0.2)', 'transparent')
    content = content.replace('rgba(255,107,107,0.1)', 'transparent')
    content = content.replace('rgba(255,107,107,0.3)', 'transparent')
    
    # Border um Ampel-Box entfernen
    content = content.replace('1px solid rgba(255, 107, 107, 0.3)', 'none')
    content = content.replace('1px solid rgba(255, 107, 107, 0.4)', 'none')
    content = content.replace('1px solid rgba(255,107,107,0.3)', 'none')
    content = content.replace('border: "1px solid rgba(255, 107, 107, 0.3)"', 'border: "none"')
    
    # === ROTES LICHT: #ff6b6b -> #c62828 (kraeftiges Rot) ===
    content = content.replace('#ff6b6b', '#c62828')
    content = content.replace('#FF6B6B', '#c62828')
    
    # === ROTE TRENNLINIE -> GW Gruen ===
    # Die Linie unter "2 kritische Risiken" - rot zu gruen
    content = content.replace('rgba(255, 107, 107, 0.08)', 'transparent')
    content = re.sub(
        r'background:\s*["\']rgba\(255,\s*107,\s*107[^"\']*["\']',
        'background: "transparent"',
        content
    )
    
    # === ORANGE in Patterns: 100% Deckung + weisse Schrift ===
    # Orange Farben kraeftiger machen
    content = content.replace('rgba(249, 115, 22, 0.15)', '#f97316')
    content = content.replace('rgba(249, 115, 22, 0.2)', '#f97316')
    content = content.replace('rgba(249, 115, 22, 0.1)', '#f97316')
    content = content.replace('rgba(234, 88, 12, 0.15)', '#ea580c')
    content = content.replace('rgba(234, 88, 12, 0.2)', '#ea580c')
    
    # === FREIGABEN: Fremdes Dunkelgruen -> Brandbook-Farben ===
    # Die Review-Seite verwendet evtl. andere Gruentoene
    # Typische nicht-Brandbook Gruentoene ersetzen
    content = content.replace('#064e3b', '#4d6600')  # Emerald -> GW Tief
    content = content.replace('#065f46', '#4d6600')
    content = content.replace('#047857', '#8aab00')  # -> GW Dunkel
    content = content.replace('#059669', '#8aab00')
    content = content.replace('#10b981', '#c6e31b')  # -> GW Gruen
    content = content.replace('#34d399', '#c6e31b')
    content = content.replace('#6ee7b7', '#c6e31b')
    content = content.replace('#a7f3d0', '#e8f0e4')
    content = content.replace('#d1fae5', '#e8f0e4')
    content = content.replace('#ecfdf5', '#f0f5ec')
    
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        count = sum(1 for a, b in zip(original, content) if a != b)
        fixes_total += 1
        print(f"  GEFIXT: {filepath}")
    else:
        print(f"  OK: {filepath} (keine Aenderungen noetig)")

# Alle .tsx und .jsx Dateien durchgehen
print("Suche und fixe Farbcodes...")
print("")

for root, dirs, files in os.walk(app_dir):
    for f in files:
        if f.endswith(('.tsx', '.jsx', '.ts')):
            fix_file(os.path.join(root, f))

if os.path.isdir(components_dir):
    for root, dirs, files in os.walk(components_dir):
        for f in files:
            if f.endswith(('.tsx', '.jsx', '.ts')):
                fix_file(os.path.join(root, f))

print("")
print(f"=== FERTIG: {fixes_total} Dateien geaendert ===")
print("Im Browser Cmd+R druecken.")
