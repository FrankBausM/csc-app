#!/usr/bin/env python3
"""
Grüne Welle Design Fix
Dieses Script fixet das komplette Design der CSC-App.
Einfach ausführen: python3 fix_design.py
"""
import os

# Projektverzeichnis automatisch erkennen
app_dir = None
for candidate in [
    'app',
    os.path.expanduser('~/Documents/Projekt Greenwashing Finder/cic-vercel 3/app'),
]:
    if os.path.isdir(candidate):
        app_dir = candidate
        break

if not app_dir:
    print("FEHLER: app-Ordner nicht gefunden. Bitte Script im Projektordner ausfuehren.")
    print("Tipp: cd \"/Users/frank/Documents/Projekt Greenwashing Finder/cic-vercel 3\"")
    exit(1)

print(f"App-Ordner gefunden: {app_dir}")

# === 1. GLOBALS.CSS: Alte Overrides entfernen ===
globals_path = os.path.join(app_dir, 'globals.css')
if os.path.exists(globals_path):
    with open(globals_path, 'r') as f:
        lines = f.readlines()
    
    # Finde wo die alten Overrides anfangen
    cut_line = len(lines)
    for i, line in enumerate(lines):
        if 'BRANDBOOK' in line or 'GRÜNE WELLE' in line or 'GRUNE WELLE' in line:
            cut_line = i
            break
    
    if cut_line < len(lines):
        with open(globals_path, 'w') as f:
            f.writelines(lines[:cut_line])
        print(f"globals.css: {len(lines) - cut_line} Zeilen alte Overrides entfernt.")
    else:
        print("globals.css: Keine alten Overrides gefunden.")
else:
    print("WARNUNG: globals.css nicht gefunden!")

# === 2. BRANDBOOK-THEME.CSS erstellen ===
theme_path = os.path.join(app_dir, 'brandbook-theme.css')
theme_css = """/* GRÜNE WELLE BRANDBOOK THEME - FINAL v8 */
@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,300;0,6..12,400;0,6..12,600;0,6..12,700;0,6..12,800;1,6..12,400&display=swap');

:root {
  color-scheme: light !important;
  --color-accent: #c6e31b !important;
  --color-accent-muted: #8aab00 !important;
  --color-accent-dark: #4d6600 !important;
  --bg-primary: #e8f0e4 !important;
  --bg-secondary: #dce6d6 !important;
  --bg-panel: #8aab00 !important;
  --bg-panel-hover: #7a9a00 !important;
  --bg-topbar: #3d4f38 !important;
  --bg-elevated: #8aab00 !important;
  --text-primary: #1e2a1a !important;
  --text-secondary: #3d4f38 !important;
  --text-muted: #3d4f38 !important;
  --border-subtle: #c6d4be !important;
  --border-medium: #4d6600 !important;
  --color-interactive: #4d6600 !important;
  --color-interactive-hover: #8aab00 !important;
}

html, body {
  font-family: 'Nunito Sans', 'Calibri', sans-serif !important;
  background: #e8f0e4 !important;
  color: #1e2a1a !important;
  -webkit-font-smoothing: antialiased;
  line-height: 1.7;
}

/* KEINE VERSALIEN */
* { text-transform: none !important; }

/* VOLLE BREITE */
main, main > div, main > section, .container, [class*="wrapper"] {
  max-width: 100% !important;
  width: 100% !important;
  padding-left: clamp(24px, 4vw, 64px) !important;
  padding-right: clamp(24px, 4vw, 64px) !important;
  margin: 0 !important;
}

/* HEADER */
.topbar, header.topbar {
  background: #3d4f38 !important;
  border-bottom: 3px solid #c6e31b !important;
  width: 100vw !important;
  max-width: 100vw !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 0 clamp(24px, 4vw, 64px) !important;
  margin-left: calc(-1 * clamp(24px, 4vw, 64px)) !important;
  box-sizing: border-box !important;
}
.topbar .brand, .topbar .logo {
  color: #fff !important;
  flex-shrink: 0 !important;
  margin-right: auto !important;
  padding: 10px 20px 10px 0 !important;
}
.topbar .brand *, .topbar .logo * { color: #fff !important; }
.nav, nav.nav {
  display: flex !important;
  gap: 6px !important;
  margin-left: auto !important;
  flex-shrink: 0 !important;
}
.nav a, nav a {
  color: rgba(255,255,255,0.9) !important;
  font-weight: 600 !important;
  font-size: 0.8rem !important;
  padding: 8px 14px !important;
  white-space: nowrap !important;
}
.nav a:hover, nav a:hover { color: #c6e31b !important; }

/* UEBERSCHRIFTEN */
h1 { color: #1e2a1a !important; font-weight: 800 !important; }
h2 { color: #3d4f38 !important; font-weight: 700 !important; }
h3, h4, h5, h6 { color: #3d4f38 !important; font-weight: 700 !important; }
p, li, dd, dt { color: #1e2a1a !important; }

/* KAESTEN: #8aab00, WEISSE Schrift */
[class*="card"], [class*="panel"], [class*="box"] {
  background: #8aab00 !important;
  color: #fff !important;
  border: 1.5px solid #4d6600 !important;
  border-radius: 12px !important;
  box-shadow: 0 2px 10px rgba(30,42,26,0.1) !important;
}
[class*="card"] *, [class*="panel"] *, [class*="box"] * { color: #fff !important; }

/* BUTTONS: #c6e31b, Schrift #4d6600 */
button, [role="button"] {
  background: #c6e31b !important;
  color: #4d6600 !important;
  border: 1.5px solid #4d6600 !important;
  font-weight: 700 !important;
  border-radius: 8px !important;
  font-family: 'Nunito Sans', sans-serif !important;
}
button *, [role="button"] * { color: #4d6600 !important; }
button:hover, [role="button"]:hover { background: #dff04e !important; }

/* BEDIENUNGSANLEITUNG */
[class*="accordion"], [class*="collapsible"], details, summary {
  background: #c6e31b !important;
  color: #1e2a1a !important;
  font-weight: 700 !important;
  border: 1.5px solid #4d6600 !important;
  border-radius: 10px !important;
}
[class*="accordion"] *, [class*="collapsible"] *, details *, summary * { color: #1e2a1a !important; }

/* NEU BADGE: AUSBLENDEN */
[class*="badge"], [class*="tag"], [class*="chip"] { display: none !important; }

/* DACHZEILE */
[class*="snum"], [class*="overline"], [class*="eyebrow"] {
  color: #8aab00 !important;
  font-weight: 800 !important;
  letter-spacing: 0.12em !important;
}

/* ANALYSE-DASHBOARD: Einheitlicher Hintergrund */
[class*="dashboard"], [class*="overview"], [class*="summary-card"],
[class*="score-section"], [class*="risk-overview"] {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

/* AMPEL: Rosa Box transparent */
[style*="border-color: var(--color-risk-critical)"] {
  border-color: transparent !important;
  background-color: transparent !important;
  box-shadow: none !important;
}

/* STATISTIK-KACHELN */
[class*="stat"], [class*="metric"], [class*="kpi"] {
  background: #4d6600 !important;
  color: #fff !important;
  border: 1.5px solid #c6e31b !important;
  border-radius: 12px !important;
}
[class*="stat"] *, [class*="metric"] *, [class*="kpi"] * { color: #fff !important; }

/* RISIKO-BADGES: Einheitlich mit weissem Rahmen */
[class*="kritisch"], [class*="critical"], [class*="KRITISCH"] {
  background: #c62828 !important; color: #fff !important;
  border: 2px solid #fff !important; font-weight: 800 !important;
  border-radius: 6px !important; padding: 4px 14px !important;
}
[class*="kritisch"] *, [class*="critical"] * { color: #fff !important; }

[class*="hoch"], [class*="high"], [class*="HOCH"] {
  background: #e65100 !important; color: #fff !important;
  border: 2px solid #fff !important; font-weight: 800 !important;
  border-radius: 6px !important; padding: 4px 14px !important;
}
[class*="hoch"] *, [class*="high"] * { color: #fff !important; }

[class*="mittel"], [class*="medium"], [class*="MITTEL"] {
  background: #f9a825 !important; color: #fff !important;
  border: 2px solid #fff !important; font-weight: 800 !important;
  border-radius: 6px !important; padding: 4px 14px !important;
}
[class*="mittel"] *, [class*="medium"] * { color: #fff !important; }

[class*="niedrig"], [class*="low"], [class*="NIEDRIG"] {
  background: #2e7d32 !important; color: #fff !important;
  border: 2px solid #fff !important; font-weight: 800 !important;
  border-radius: 6px !important; padding: 4px 14px !important;
}
[class*="niedrig"] *, [class*="low"] * { color: #fff !important; }

/* FREIGABEN: Brandbook-Farben */
[class*="review"], [class*="approval"], [class*="status"] {
  background: #8aab00 !important; color: #fff !important;
  border: 1.5px solid #4d6600 !important; border-radius: 8px !important;
}
[class*="review"] *, [class*="approval"] * { color: #fff !important; }
select { background: #fff !important; color: #1e2a1a !important; border: 2px solid #c6d4be !important; }
select * { color: #1e2a1a !important; }

/* PATTERNS: 100% Deckung, weisse Schrift */
[class*="pattern"], [class*="rule"], [class*="flag"] {
  background: #4d6600 !important; color: #fff !important;
  border: 1.5px solid #c6e31b !important; border-radius: 8px !important;
}
[class*="pattern"] *, [class*="rule"] *, [class*="flag"] * { color: #fff !important; }
[class*="pattern"] span, [class*="rule"] span {
  background: #8aab00 !important; color: #fff !important;
  border: 1px solid #c6e31b !important; border-radius: 4px !important;
  padding: 2px 8px !important; opacity: 1 !important;
}

/* FORMULAR */
input, textarea, select {
  background: #fff !important; border: 2px solid #a8b8a0 !important;
  color: #1e2a1a !important; border-radius: 8px !important;
}
input *, textarea * { color: #1e2a1a !important; }
input:focus, textarea:focus, select:focus {
  border-color: #c6e31b !important;
  box-shadow: 0 0 0 3px rgba(198,227,27,0.25) !important;
}
input::placeholder, textarea::placeholder { color: #7a9070 !important; }

/* TABELLEN */
th { background: #3d4f38 !important; color: #fff !important; font-weight: 700 !important; padding: 14px 16px !important; }
th * { color: #fff !important; }
td { padding: 14px 16px !important; border-bottom: 1px solid #c6d4be !important; color: #1e2a1a !important; }
td * { color: #1e2a1a !important; }

/* FOOTER */
footer, [class*="footer"] {
  background: #3d4f38 !important;
  border-top: 3px solid #c6e31b !important;
  width: 100% !important;
}
footer * { color: rgba(255,255,255,0.85) !important; }
footer a, footer a * { color: #c6e31b !important; }

/* LINKS */
a { color: #4d6600 !important; font-weight: 600; text-decoration: none; }
a:hover { color: #8aab00 !important; text-decoration: underline; }
.nav a { color: rgba(255,255,255,0.9) !important; }
.nav a:hover { color: #c6e31b !important; }

/* HR: Gruen statt Rosa */
hr { border: none !important; height: 2px !important; background: linear-gradient(90deg, #c6e31b 40%, transparent) !important; }

::selection { background: rgba(198,227,27,0.35); color: #1e2a1a; }
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: #e8f0e4; }
::-webkit-scrollbar-thumb { background: #8aab00; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #c6e31b; }
"""

with open(theme_path, 'w') as f:
    f.write(theme_css)
print(f"brandbook-theme.css erstellt: {theme_path}")

# === 3. LAYOUT.TSX: Import sicherstellen ===
layout_path = os.path.join(app_dir, 'layout.tsx')
if os.path.exists(layout_path):
    with open(layout_path, 'r') as f:
        content = f.read()
    
    if 'brandbook-theme' not in content:
        # Import als zweite Zeile einfuegen (nach dem ersten Import)
        lines = content.split('\n')
        insert_pos = 0
        for i, line in enumerate(lines):
            if line.strip().startswith('import'):
                insert_pos = i + 1
                break
        lines.insert(insert_pos, "import './brandbook-theme.css';")
        with open(layout_path, 'w') as f:
            f.write('\n'.join(lines))
        print("layout.tsx: Import hinzugefuegt!")
    else:
        print("layout.tsx: Import existiert bereits.")
else:
    print("WARNUNG: layout.tsx nicht gefunden!")

print("")
print("=== FERTIG! ===")
print("Die App wird automatisch neu geladen.")
print("Falls nicht: Im Browser Cmd+R druecken.")
