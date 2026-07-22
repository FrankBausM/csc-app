#!/usr/bin/env python3
"""Fix 2: Freigaben Dunkelgruen, Patterns Orange, Ampel Rosa"""
import os, glob

app = 'app'
comp = 'components'

if not os.path.isdir(app):
    print("FEHLER: Im Projektordner ausfuehren!")
    exit(1)

count = 0

def fix(path):
    global count
    with open(path, 'r') as f:
        orig = f.read()
    new = orig

    # Freigaben: Dunkles Blau/Gruen -> Brandbook
    new = new.replace('#16213e', '#8aab00')
    new = new.replace('#1a1a2e', '#8aab00')
    new = new.replace('#111118', '#8aab00')
    new = new.replace('#0a0a0f', '#e8f0e4')
    
    # Freigaben: Emerald/Teal Gruen -> Brandbook
    new = new.replace('#064e3b', '#4d6600')
    new = new.replace('#065f46', '#4d6600')
    new = new.replace('#047857', '#8aab00')
    new = new.replace('#059669', '#8aab00')
    new = new.replace('#10b981', '#c6e31b')
    new = new.replace('#34d399', '#c6e31b')
    new = new.replace('#166534', '#4d6600')
    new = new.replace('#15803d', '#4d6600')
    new = new.replace('#16a34a', '#8aab00')
    new = new.replace('#22c55e', '#c6e31b')
    new = new.replace('#4ade80', '#c6e31b')
    new = new.replace('#86efac', '#e8f0e4')
    new = new.replace('#bbf7d0', '#e8f0e4')
    new = new.replace('#dcfce7', '#f0f5ec')
    new = new.replace('#f0fdf4', '#f0f5ec')

    # Patterns: Orange NICHT loeschen sondern auf volle Deckung
    # Diese wurden im letzten Script versehentlich geloescht
    # Hier stellen wir sicher, dass die CustomPatterns die richtigen Farben haben
    # (Die Werte in CustomPatterns.tsx sind OK: #f97316 und #eab308)
    
    # Rosa Ampel-Box Reste entfernen
    new = new.replace('rgba(255, 107, 107, 0.2)', 'transparent')
    new = new.replace('rgba(255, 107, 107, 0.1)', 'transparent')
    new = new.replace('rgba(255,107,107,0.2)', 'transparent')
    new = new.replace('rgba(255,107,107,0.1)', 'transparent')
    
    # Rote Trennlinie -> GW Gruen
    # Suche nach hr oder border-Linien mit rot
    new = new.replace('rgba(255, 107, 107, 0.3)', '#c6e31b')
    new = new.replace('rgba(255,107,107,0.3)', '#c6e31b')

    if new != orig:
        with open(path, 'w') as f:
            f.write(new)
        count += 1
        print(f"  GEFIXT: {path}")

print("Suche problematische Farben...")
for d in [app, comp]:
    if not os.path.isdir(d):
        continue
    for root, dirs, files in os.walk(d):
        for f in files:
            if f.endswith(('.tsx', '.jsx', '.ts', '.css')):
                fix(os.path.join(root, f))

print(f"\n=== {count} Dateien geaendert. Cmd+R im Browser. ===")
