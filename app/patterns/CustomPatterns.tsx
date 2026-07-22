"use client";

import { useState, useEffect } from "react";
import { Button } from "../../components/ui";

interface Pattern {
  id: string;
  name: string;
  category: string;
  matchType: "keyword" | "phrase" | "regex";
  matchValue: string;
  riskScore: number;
  reason: string;
  suggestion: string;
  active: boolean;
  examples?: string;
  createdAt: string;
  updatedAt: string;
}

const PATTERN_CATEGORIES = [
  { value: "red_flag", label: "🚩 Red Flag", description: "Formulierung sofort beanstanden" },
  { value: "warning", label: "⚠️ Warnung", description: "Prüfung erforderlich" },
  { value: "forbidden_word", label: "🚫 Verbotenes Wort", description: "Darf nie verwendet werden" },
  { value: "required_context", label: "📎 Kontext-Pflicht", description: "Nur mit Beleg/Fußnote erlaubt" },
  { value: "style_rule", label: "✏️ Stilregel", description: "Interne Kommunikationsrichtlinie" },
];

const RISK_LEVELS = [
  { value: 95, label: "Kritisch (+95)", color: "#ef4444" },
  { value: 85, label: "Hoch (+85)", color: "#f97316" },
  { value: 70, label: "Mittel (+70)", color: "#eab308" },
  { value: 50, label: "Niedrig (+50)", color: "#c6e31b" },
];

interface PatternEditorProps {
  pattern: Pattern | null;
  onSave: (pattern: Pattern) => void;
  onCancel: () => void;
}

function PatternEditor({ pattern, onSave, onCancel }: PatternEditorProps) {
  const isEditing = !!pattern?.id;

  const [form, setForm] = useState({
    name: pattern?.name || "",
    category: pattern?.category || "red_flag",
    matchType: (pattern?.matchType || "keyword") as "keyword" | "phrase" | "regex",
    matchValue: pattern?.matchValue || "",
    riskScore: pattern?.riskScore || 85,
    reason: pattern?.reason || "",
    suggestion: pattern?.suggestion || "",
    active: pattern?.active ?? true,
    examples: pattern?.examples || "",
  });

  const [testText, setTestText] = useState("");
  const [testResult, setTestResult] = useState<{
    found: boolean;
    matches: string[];
    message: string;
  } | null>(null);

  const handleTest = () => {
    if (!testText || !form.matchValue) return;

    try {
      let matches: string[] = [];
      if (form.matchType === "keyword") {
        const keywords = form.matchValue.split(",").map((k) => k.trim().toLowerCase());
        const words = testText.toLowerCase();
        matches = keywords.filter((k) => words.includes(k));
      } else if (form.matchType === "regex") {
        const regex = new RegExp(form.matchValue, "gi");
        let match;
        while ((match = regex.exec(testText)) !== null) {
          matches.push(match[0]);
        }
      } else if (form.matchType === "phrase") {
        if (testText.toLowerCase().includes(form.matchValue.toLowerCase())) {
          matches.push(form.matchValue);
        }
      }

      setTestResult({
        found: matches.length > 0,
        matches,
        message:
          matches.length > 0
            ? `${matches.length} Treffer: "${matches.join('", "')}"`
            : "Kein Treffer im Testtext.",
      });
    } catch (err: any) {
      setTestResult({ found: false, matches: [], message: `Fehler: ${err.message}` });
    }
  };

  const handleSave = () => {
    if (!form.name || !form.matchValue) return;

    onSave({
      ...form,
      id: pattern?.id || `custom-${Date.now()}`,
      createdAt: pattern?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Pattern);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "16px",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-medium)",
          borderRadius: "var(--radius-lg)",
          width: "100%",
          maxWidth: "700px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ padding: "24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <h2 style={{ color: "var(--text-primary)", fontSize: "18px", fontWeight: 700 }}>
              {isEditing ? "Pattern bearbeiten" : "Neues Pattern erstellen"}
            </h2>
            <button
              onClick={onCancel}
              style={{
                color: "var(--text-secondary)",
                fontSize: "20px",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Name */}
            <div>
              <label
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Pattern-Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder='z.B. "Klimaneutral ohne Fußnote"'
                style={{
                  width: "100%",
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border-medium)",
                  borderRadius: "var(--radius-sm)",
                  padding: "10px 16px",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                }}
              />
            </div>

            {/* Kategorie + Risiko */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Kategorie
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  style={{
                    width: "100%",
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-medium)",
                    borderRadius: "var(--radius-sm)",
                    padding: "10px 16px",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                  }}
                >
                  {PATTERN_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Risiko-Score
                </label>
                <select
                  value={form.riskScore}
                  onChange={(e) => setForm((f) => ({ ...f, riskScore: parseInt(e.target.value) }))}
                  style={{
                    width: "100%",
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-medium)",
                    borderRadius: "var(--radius-sm)",
                    padding: "10px 16px",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                  }}
                >
                  {RISK_LEVELS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Match-Typ */}
            <div>
              <label
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Erkennungsmethode
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {[
                  { value: "keyword", label: "Stichwörter", desc: "Kommagetrennte Wörter" },
                  { value: "phrase", label: "Phrase", desc: "Exakte Wortfolge" },
                  { value: "regex", label: "Regex", desc: "Regulärer Ausdruck" },
                ].map((mt) => (
                  <button
                    key={mt.value}
                    onClick={() => setForm((f) => ({ ...f, matchType: mt.value as any }))}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "13px",
                      transition: "all 0.2s",
                      backgroundColor:
                        form.matchType === mt.value
                          ? "rgba(198,227,27,0.2)"
                          : "var(--bg-secondary)",
                      border:
                        form.matchType === mt.value
                          ? "1px solid rgba(198,227,27,0.5)"
                          : "1px solid var(--border-medium)",
                      color: form.matchType === mt.value ? "var(--color-accent)" : "var(--text-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{mt.label}</div>
                    <div style={{ fontSize: "11px", opacity: 0.7 }}>{mt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Match-Wert */}
            <div>
              <label
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                {form.matchType === "keyword"
                  ? "Stichwörter (kommagetrennt) *"
                  : form.matchType === "phrase"
                  ? "Exakte Phrase *"
                  : "Regulärer Ausdruck *"}
              </label>
              <input
                type="text"
                value={form.matchValue}
                onChange={(e) => setForm((f) => ({ ...f, matchValue: e.target.value }))}
                placeholder={
                  form.matchType === "keyword"
                    ? "klimaneutral, CO2-neutral, emissionsfrei"
                    : form.matchType === "phrase"
                    ? "vollständig klimaneutral"
                    : "\\b(klimaneutral|CO2-neutral)\\b"
                }
                style={{
                  width: "100%",
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border-medium)",
                  borderRadius: "var(--radius-sm)",
                  padding: "10px 16px",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  fontFamily: "monospace",
                }}
              />
            </div>

            {/* Begründung */}
            <div>
              <label
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Begründung / Anweisung
              </label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="Warum ist diese Formulierung problematisch? Welche Regel wird verletzt?"
                style={{
                  width: "100%",
                  minHeight: "80px",
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border-medium)",
                  borderRadius: "var(--radius-sm)",
                  padding: "10px 16px",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Vorgeschlagene Alternative */}
            <div>
              <label
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Vorgeschlagene Alternative (optional)
              </label>
              <input
                type="text"
                value={form.suggestion}
                onChange={(e) => setForm((f) => ({ ...f, suggestion: e.target.value }))}
                placeholder='z.B. "CO₂-Emissionen um X% reduziert (verifiziert durch [Stelle])"'
                style={{
                  width: "100%",
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border-medium)",
                  borderRadius: "var(--radius-sm)",
                  padding: "10px 16px",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                }}
              />
            </div>

            {/* Test-Bereich */}
            <div
              style={{
                borderTop: "1px solid var(--border-medium)",
                paddingTop: "16px",
              }}
            >
              <label
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Pattern testen
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  value={testText}
                  onChange={(e) => {
                    setTestText(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="Testtext eingeben..."
                  style={{
                    flex: 1,
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-medium)",
                    borderRadius: "var(--radius-sm)",
                    padding: "8px 12px",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                  }}
                />
                <Button onClick={handleTest} disabled={!testText || !form.matchValue}>
                  Testen
                </Button>
              </div>
              {testResult && (
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "13px",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: testResult.found
                      ? "rgba(76, 175, 80, 0.2)"
                      : "var(--bg-secondary)",
                    color: testResult.found ? "#4caf50" : "var(--text-secondary)",
                  }}
                >
                  {testResult.message}
                </div>
              )}
            </div>

            {/* Aktiv-Toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                style={{
                  width: "48px",
                  height: "24px",
                  borderRadius: "999px",
                  backgroundColor: form.active ? "var(--color-accent)" : "var(--border-medium)",
                  border: "none",
                  position: "relative",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    width: "20px",
                    height: "20px",
                    backgroundColor: "#fff",
                    borderRadius: "50%",
                    top: "2px",
                    left: form.active ? "26px" : "2px",
                    transition: "left 0.2s",
                  }}
                />
              </button>
              <span style={{ color: "var(--text-primary)", fontSize: "14px" }}>
                Pattern ist {form.active ? "aktiv" : "deaktiviert"}
              </span>
            </div>
          </div>

          {/* Speichern / Abbrechen */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "24px",
              paddingTop: "16px",
              borderTop: "1px solid var(--border-medium)",
            }}
          >
            <Button
              onClick={handleSave}
              disabled={!form.name || !form.matchValue}
              style={{
                flex: 1,
                backgroundColor: "var(--color-accent)",
                color: "#000",
                opacity: !form.name || !form.matchValue ? 0.4 : 1,
              }}
            >
              {isEditing ? "Änderungen speichern" : "Pattern erstellen"}
            </Button>
            <Button
              onClick={onCancel}
              style={{
                padding: "0 24px",
                border: "1px solid var(--border-medium)",
                backgroundColor: "transparent",
                color: "var(--text-primary)",
              }}
            >
              Abbrechen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PatternCardProps {
  pattern: Pattern;
  onEdit: (pattern: Pattern) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

function PatternCard({ pattern, onEdit, onDelete, onToggle }: PatternCardProps) {
  const category = PATTERN_CATEGORIES.find((c) => c.value === pattern.category);
  const riskLevel = RISK_LEVELS.find((r) => r.value === pattern.riskScore) || RISK_LEVELS[1];

  return (
    <div
      style={{
        border: `1px solid ${pattern.active ? "var(--border-medium)" : "var(--border-light)"}`,
        borderRadius: "var(--radius-sm)",
        padding: "16px",
        backgroundColor: pattern.active ? "var(--bg-secondary)" : "rgba(0,0,0,0.2)",
        opacity: pattern.active ? 1 : 0.5,
        transition: "all 0.2s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "14px" }}>{category?.label.split(" ")[0]}</span>
            <span
              style={{
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              {pattern.name}
            </span>
            <span
              style={{
                fontSize: "11px",
                padding: "2px 8px",
                borderRadius: "4px",
                fontWeight: 700,
                backgroundColor: riskLevel.color + "30",
                color: riskLevel.color,
              }}
            >
              +{pattern.riskScore}
            </span>
          </div>

          <div
            style={{
              color: "var(--text-secondary)",
              fontSize: "12px",
              fontFamily: "monospace",
              marginTop: "4px",
              backgroundColor: "var(--bg-primary)",
              display: "inline-block",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
          >
            {pattern.matchType === "keyword" ? "🔤" : pattern.matchType === "regex" ? "⚙️" : "📝"}{" "}
            {pattern.matchValue.length > 60
              ? pattern.matchValue.slice(0, 60) + "..."
              : pattern.matchValue}
          </div>

          {pattern.reason && (
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "12px",
                marginTop: "8px",
              }}
            >
              {pattern.reason}
            </p>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "16px" }}>
          <button
            onClick={() => onToggle(pattern.id)}
            style={{
              width: "40px",
              height: "20px",
              borderRadius: "999px",
              backgroundColor: pattern.active ? "var(--color-accent)" : "var(--border-medium)",
              border: "none",
              position: "relative",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
          >
            <span
              style={{
                position: "absolute",
                width: "16px",
                height: "16px",
                backgroundColor: "#fff",
                borderRadius: "50%",
                top: "2px",
                left: pattern.active ? "22px" : "2px",
                transition: "left 0.2s",
              }}
            />
          </button>
          <button
            onClick={() => onEdit(pattern)}
            style={{
              color: "var(--text-secondary)",
              fontSize: "14px",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "var(--color-accent)")}
            onMouseOut={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(pattern.id)}
            style={{
              color: "var(--text-secondary)",
              fontSize: "14px",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "#c62828")}
            onMouseOut={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CustomPatterns() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPattern, setEditingPattern] = useState<Pattern | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const saved = localStorage.getItem("custom-patterns");
    if (saved) {
      try {
        setPatterns(JSON.parse(saved));
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    if (patterns.length > 0) {
      localStorage.setItem("custom-patterns", JSON.stringify(patterns));
    }
  }, [patterns]);

  const handleSave = (pattern: Pattern) => {
    setPatterns((prev) => {
      const exists = prev.findIndex((p) => p.id === pattern.id);
      if (exists >= 0) {
        const updated = [...prev];
        updated[exists] = pattern;
        return updated;
      }
      return [...prev, pattern];
    });
    setEditorOpen(false);
    setEditingPattern(null);
  };

  const handleEdit = (pattern: Pattern) => {
    setEditingPattern(pattern);
    setEditorOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Pattern wirklich löschen?")) {
      setPatterns((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleToggle = (id: string) => {
    setPatterns((prev) => prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));
  };

  const handleExport = () => {
    const data = JSON.stringify(patterns, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `custom-patterns-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string);
        if (Array.isArray(imported)) {
          setPatterns((prev) => [
            ...prev,
            ...imported.map((p) => ({
              ...p,
              id: `imported-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            })),
          ]);
        }
      } catch {
        alert("Ungültige JSON-Datei.");
      }
    };
    reader.readAsText(file);
  };

  const filtered = filter === "all" ? patterns : patterns.filter((p) => p.category === filter);
  const activeCount = patterns.filter((p) => p.active).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-medium)",
          borderRadius: "var(--radius-md)",
          padding: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "16px",
          }}
        >
          <div>
            <h3
              style={{
                color: "var(--color-accent)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              Eigene Pattern-Regeln
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "6px" }}>
              Definieren Sie unternehmensspezifische Kommunikationsregeln und Red Flags. Diese
              werden zusätzlich zu den eingebauten Patterns bei jeder Analyse berücksichtigt.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingPattern(null);
              setEditorOpen(true);
            }}
            style={{
              backgroundColor: "var(--color-accent)",
              color: "#000",
            }}
          >
            + Neues Pattern
          </Button>
        </div>

        <div style={{ display: "flex", gap: "16px", fontSize: "14px" }}>
          <span style={{ color: "var(--text-secondary)" }}>{patterns.length} Patterns gesamt</span>
          <span style={{ color: "var(--color-accent)" }}>{activeCount} aktiv</span>
          <span style={{ color: "var(--text-tertiary)" }}>
            {patterns.length - activeCount} deaktiviert
          </span>
        </div>
      </div>

      {/* Filter + Aktionen */}
      {patterns.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => setFilter("all")}
              style={{
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "12px",
                transition: "all 0.2s",
                backgroundColor:
                  filter === "all" ? "rgba(198,227,27,0.2)" : "var(--bg-secondary)",
                border:
                  filter === "all"
                    ? "1px solid rgba(198,227,27,0.3)"
                    : "1px solid var(--border-medium)",
                color: filter === "all" ? "var(--color-accent)" : "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              Alle ({patterns.length})
            </button>
            {PATTERN_CATEGORIES.map((c) => {
              const count = patterns.filter((p) => p.category === c.value).length;
              if (count === 0) return null;
              return (
                <button
                  key={c.value}
                  onClick={() => setFilter(c.value)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "12px",
                    transition: "all 0.2s",
                    backgroundColor:
                      filter === c.value ? "rgba(198,227,27,0.2)" : "var(--bg-secondary)",
                    border:
                      filter === c.value
                        ? "1px solid rgba(198,227,27,0.3)"
                        : "1px solid var(--border-medium)",
                    color: filter === c.value ? "var(--color-accent)" : "var(--text-secondary)",
                    cursor: "pointer",
                  }}
                >
                  {c.label.split(" ")[0]} ({count})
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleExport}
              style={{
                color: "var(--text-secondary)",
                fontSize: "12px",
                border: "1px solid var(--border-medium)",
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                background: "none",
                cursor: "pointer",
              }}
            >
              📤 Export
            </button>
            <label
              style={{
                color: "var(--text-secondary)",
                fontSize: "12px",
                border: "1px solid var(--border-medium)",
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                background: "none",
              }}
            >
              📥 Import
              <input type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
            </label>
          </div>
        </div>
      )}

      {/* Pattern-Liste */}
      {filtered.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.map((p) => (
            <PatternCard
              key={p.id}
              pattern={p}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      ) : patterns.length === 0 ? (
        <div
          style={{
            backgroundColor: "rgba(0,0,0,0.3)",
            border: "1px dashed var(--border-light)",
            borderRadius: "var(--radius-md)",
            padding: "48px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "var(--text-secondary)", fontSize: "16px", marginBottom: "8px" }}>
            Noch keine eigenen Patterns
          </p>
          <p style={{ color: "var(--text-tertiary)", fontSize: "14px", marginBottom: "16px" }}>
            Erstellen Sie Ihr erstes Pattern, um unternehmensspezifische Regeln in der Analyse zu
            berücksichtigen.
          </p>
          <Button
            onClick={() => {
              setEditingPattern(null);
              setEditorOpen(true);
            }}
            style={{
              backgroundColor: "rgba(198,227,27,0.2)",
              color: "var(--color-accent)",
              border: "1px solid rgba(198,227,27,0.3)",
            }}
          >
            + Erstes Pattern erstellen
          </Button>
        </div>
      ) : (
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", textAlign: "center", padding: "32px 0" }}>
          Keine Patterns in dieser Kategorie.
        </p>
      )}

      {/* Editor Modal */}
      {editorOpen && (
        <PatternEditor
          pattern={editingPattern}
          onSave={handleSave}
          onCancel={() => {
            setEditorOpen(false);
            setEditingPattern(null);
          }}
        />
      )}
    </div>
  );
}
