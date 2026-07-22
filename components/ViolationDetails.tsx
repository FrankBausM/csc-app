"use client";

import React, { useState } from "react";
import { RuleViolation } from "../app/AppContext";

interface ViolationDetailsProps {
  violations?: RuleViolation[];
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

export function ViolationDetails({ violations, riskLevel }: ViolationDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!violations || violations.length === 0) {
    return null;
  }

  const severityColor = {
    CRITICAL: "#d32f2f",
    HIGH: "#f57c00",
    MEDIUM: "#fbc02d",
    LOW: "#388e3c",
  };

  return (
    <div style={{ marginTop: "12px" }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          background: "none",
          border: "none",
          color: severityColor[riskLevel],
          cursor: "pointer",
          fontSize: "12px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          padding: "8px 0",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          transition: "all 0.2s ease",
        }}
      >
        <span style={{ fontSize: "14px" }}>
          {isExpanded ? "▼" : "▶"}
        </span>
        Regelbrüche anzeigen ({violations.length})
      </button>

      {isExpanded && (
        <div
          style={{
            marginTop: "12px",
            padding: "16px",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderLeft: `3px solid ${severityColor[riskLevel]}`,
            borderRadius: "4px",
          }}
        >
          {violations.map((violation, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: idx < violations.length - 1 ? "12px" : 0,
                paddingBottom: idx < violations.length - 1 ? "12px" : 0,
                borderBottom:
                  idx < violations.length - 1
                    ? "1px solid rgba(255, 255, 255, 0.1)"
                    : "none",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: severityColor[riskLevel],
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {violation.rule}
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted, rgba(255, 255, 255, 0.6))",
                  marginBottom: "6px",
                  fontWeight: 500,
                }}
              >
                Quelle: <span style={{ color: "var(--color-accent, #c6e31b)" }}>{violation.source}</span>
              </div>

              <div
                style={{
                  fontSize: "13px",
                  lineHeight: 1.5,
                  marginBottom: violation.recommendation ? "8px" : 0,
                }}
              >
                {violation.description}
              </div>

              {violation.recommendation && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--color-accent, #c6e31b)",
                    fontStyle: "italic",
                    paddingTop: "8px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <strong>Empfehlung:</strong> {violation.recommendation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
