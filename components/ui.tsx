import React from "react";

export function MetricCard({ value, label, hint }: { value: string; label: string; hint?: string }) {
  return (
    <div className="panel">
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
      {hint && <div className="metric-hint">{hint}</div>}
    </div>
  );
}

export function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div className="eyebrow">{eyebrow}</div>
      <h2 style={{ marginTop: 8, fontSize: 28, fontWeight: 500, textTransform: "uppercase", letterSpacing: "-0.02em" }}>{title}</h2>
    </div>
  );
}

export function Pill({ children }: { children: React.ReactNode }) {
  return <span className="pill">{children}</span>;
}

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: "var(--color-accent)",
      color: "var(--bg-primary)",
      fontWeight: 600,
    },
    secondary: {
      backgroundColor: "transparent",
      border: "1px solid var(--border-medium)",
      color: "var(--text-primary)",
    },
    danger: {
      backgroundColor: "var(--color-risk-critical)",
      color: "var(--text-primary)",
      fontWeight: 600,
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "12px 24px",
        borderRadius: "var(--radius-sm)",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: "12px",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        transition: "all 0.2s ease",
        opacity: disabled ? 0.5 : 1,
        ...styles[variant],
      }}
    >
      {children}
    </button>
  );
}

export function TextInput({
  label,
  placeholder,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  multiline?: boolean;
}) {
  const commonStyles: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "var(--radius-sm)",
    border: "2px solid var(--color-accent)",
    backgroundColor: "#ffffff",
    color: "#4d6600",
    fontSize: "14px",
    fontFamily: "inherit",
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", marginBottom: 8, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)" }}>
        {label}
      </label>
      {multiline ? (
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={{ ...commonStyles, minHeight: "120px", resize: "vertical" }}
        />
      ) : (
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={commonStyles}
        />
      )}
    </div>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", marginBottom: 8, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)" }}>
        {label}
      </label>
      <select
        value={value}
        onChange={onChange}
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: "var(--radius-sm)",
          border: "2px solid var(--color-accent)",
          backgroundColor: "#ffffff",
          color: "#4d6600",
          fontSize: "14px",
          fontFamily: "inherit",
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ backgroundColor: "#ffffff", color: "#4d6600" }}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
