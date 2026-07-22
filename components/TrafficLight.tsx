"use client";

import React from "react";
import { AnalyzedClaim } from "../app/AppContext";

interface TrafficLightProps {
  claims: AnalyzedClaim[];
  avgRiskScore: number;
}

export function TrafficLight({ claims, avgRiskScore }: TrafficLightProps) {
  // Bestimme Status basierend auf Durchschnittswert und 4 Risikostufen
  const criticalCount = claims.filter((c) => c.riskLevel === "CRITICAL").length;
  const highCount = claims.filter((c) => c.riskLevel === "HIGH").length;
  const mediumCount = claims.filter((c) => c.riskLevel === "MEDIUM").length;
  const lowCount = claims.filter((c) => c.riskLevel === "LOW").length;
  const totalClaims = claims.length;

  let status: "green" | "yellow" | "orange" | "red";
  let statusLabel: string;
  let statusDescription: string;

  // Logik für 4-Farben-Ampel basierend auf Score-Bereichen
  if (criticalCount > 0 || avgRiskScore >= 76) {
    status = "red";
    statusLabel = "Kritisch";
    statusDescription =
      criticalCount > 0
        ? `${criticalCount} kritische Risiken erkannt`
        : "Durchschnittlicher Risiko-Score kritisch";
  } else if (highCount > 0 || avgRiskScore >= 51) {
    status = "orange";
    statusLabel = "Hoch";
    statusDescription =
      highCount > 0
        ? `${highCount} hohe Risiken erkannt`
        : "Erhöhter Risiko-Score";
  } else if (mediumCount > 0 || avgRiskScore >= 26) {
    status = "yellow";
    statusLabel = "Mittel";
    statusDescription =
      mediumCount > 0
        ? `${mediumCount} mittlere Risiken erkannt`
        : "Moderate Risiken vorhanden";
  } else {
    status = "green";
    statusLabel = "Niedrig";
    statusDescription = lowCount > 0 
      ? `${lowCount} Claims mit niedrigem Risiko` 
      : "Alle Claims erfüllen Kriterien";
  }

  const colorMap = {
    red: { bg: "transparent", border: "#c62828", light: "#c62828" },          // Rot (CRITICAL, 76-100)
    orange: { bg: "rgba(217, 119, 6, 0.2)", border: "#d97706", light: "#d97706" },         // Dunkles Orange (HIGH, 51-75)
    yellow: { bg: "rgba(255, 193, 7, 0.2)", border: "#ffc107", light: "#ffc107" },         // Gelb (MEDIUM, 26-50)
    green: { bg: "rgba(76, 175, 80, 0.2)", border: "#4caf50", light: "#4caf50" },          // Grün (LOW, 0-25)
  };

  const colors = colorMap[status];

  return (
    <div
      style={{
        padding: "32px",
        borderRadius: "var(--radius-md, 8px)",
        backgroundColor: colors.bg,
        border: `2px solid ${colors.border}`,
        textAlign: "center",
        marginBottom: "32px",
      }}
    >
      {/* Ampeln-Lights - 4 Stufen */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          justifyContent: "center",
          marginBottom: "24px",
        }}
      >
        {/* Red Light - CRITICAL (76-100) */}
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: status === "red" ? "#c62828" : "#c6e31b",
            boxShadow:
              status === "red"
                ? "0 0 20px rgba(255, 107, 107, 0.8)"
                : "inset 0 0 10px rgba(0, 0, 0, 0.3)",
            transition: "all 0.3s ease",
          }}
        />

        {/* Orange Light - HIGH (51-75) */}
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: status === "orange" ? "#d97706" : "rgba(217, 119, 6, 0.3)",
            boxShadow:
              status === "orange"
                ? "0 0 20px rgba(217, 119, 6, 0.8)"
                : "inset 0 0 10px rgba(0, 0, 0, 0.3)",
            transition: "all 0.3s ease",
          }}
        />

        {/* Yellow Light - MEDIUM (26-50) */}
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: status === "yellow" ? "#ffc107" : "rgba(255, 193, 7, 0.3)",
            boxShadow:
              status === "yellow"
                ? "0 0 20px rgba(255, 193, 7, 0.8)"
                : "inset 0 0 10px rgba(0, 0, 0, 0.3)",
            transition: "all 0.3s ease",
          }}
        />

        {/* Green Light - LOW (0-25) */}
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: status === "green" ? "#4caf50" : "rgba(76, 175, 80, 0.3)",
            boxShadow:
              status === "green"
                ? "0 0 20px rgba(76, 175, 80, 0.8)"
                : "inset 0 0 10px rgba(0, 0, 0, 0.3)",
            transition: "all 0.3s ease",
          }}
        />
      </div>

      {/* Status Info */}
      <div style={{ marginBottom: "16px" }}>
        <h3
          style={{
            margin: "0 0 8px 0",
            fontSize: "24px",
            fontWeight: 600,
            color: colors.light,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          {statusLabel}
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            opacity: 0.9,
          }}
        >
          {statusDescription}
        </p>
      </div>

      {/* Score Display */}
      <div
        style={{
          marginTop: "16px",
          paddingTop: "16px",
          borderTop: `1px solid ${colors.border}`,
          fontSize: "13px",
          opacity: 0.8,
        }}
      >
        <span style={{ fontWeight: 600 }}>Score:</span> {avgRiskScore}/100 •{" "}
        <span style={{ fontWeight: 600 }}>{totalClaims}</span> Claims analysiert
      </div>
    </div>
  );
}
