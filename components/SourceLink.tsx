"use client";

import React from "react";
import { REGULATORY_SOURCES } from "../lib/regulatorySources";

interface SourceLinkProps {
  sourceKey: string;
  children?: React.ReactNode;
}

export function SourceLink({ sourceKey, children }: SourceLinkProps) {
  const source = REGULATORY_SOURCES[sourceKey];
  
  if (!source) {
    return <span>{children || sourceKey}</span>;
  }

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      title={source.label}
      style={{
        color: "var(--color-accent)",
        textDecoration: "underline",
        textDecorationStyle: "dotted",
        textUnderlineOffset: "3px",
        transition: "opacity 0.2s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
    >
      {children || sourceKey} ↗
    </a>
  );
}

// Komponente für automatisch verlinkten Text
interface LinkedTextProps {
  text: string;
}

export function LinkedRegulatoryText({ text }: LinkedTextProps) {
  // Auto-Linking mit React-Komponenten statt HTML-String
  const linkPatterns = [
    { key: 'EmpCo-Richtlinie (EU) 2024/825', sourceKey: 'EmpCo-Richtlinie' },
    { key: 'BGBl. 2026 I Nr. 43', sourceKey: 'BGBl. 2026 I Nr. 43' },
    { key: 'EN ISO 14024', sourceKey: 'EN ISO 14024' },
    { key: 'ISO 14024', sourceKey: 'ISO 14024' },
    { key: 'ISO 14064-3', sourceKey: 'ISO 14064-3' },
    { key: 'ISO 14064', sourceKey: 'ISO 14064' },
    { key: 'ISO 14067', sourceKey: 'ISO 14067' },
    { key: 'ISO 14046', sourceKey: 'ISO 14046' },
    { key: 'ISO 14040', sourceKey: 'ISO 14040' },
    { key: 'ISO 14044', sourceKey: 'ISO 14044' },
    { key: 'ISO 14001', sourceKey: 'ISO 14001' },
    { key: 'EU Ecolabel', sourceKey: 'EU Ecolabel' },
    { key: 'Blauer Engel', sourceKey: 'Blauer Engel' },
    { key: 'Science Based Targets', sourceKey: 'Science Based Targets' },
    { key: 'B Corp', sourceKey: 'B Corp' },
    { key: 'FSC', sourceKey: 'FSC' },
    { key: 'MSC', sourceKey: 'MSC' },
    { key: 'GOTS', sourceKey: 'GOTS' },
    { key: 'Cradle to Cradle', sourceKey: 'Cradle to Cradle' },
    { key: 'Gold Standard', sourceKey: 'Gold Standard' },
    { key: 'VCS', sourceKey: 'VCS' },
    { key: 'GHG Protocol', sourceKey: 'GHG Protocol' },
    { key: 'SBTi', sourceKey: 'SBTi' },
  ];

  let processedText: React.ReactNode[] = [text];

  // Sortiere nach Länge (längste zuerst) für spezifischere Matches
  const sortedPatterns = linkPatterns.sort((a, b) => b.key.length - a.key.length);

  for (const pattern of sortedPatterns) {
    const newProcessedText: React.ReactNode[] = [];
    
    for (const segment of processedText) {
      if (typeof segment === 'string') {
        const parts = segment.split(new RegExp(`(\\b${pattern.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b)`, 'gi'));
        
        for (let i = 0; i < parts.length; i++) {
          if (parts[i].toLowerCase() === pattern.key.toLowerCase()) {
            newProcessedText.push(
              <SourceLink key={`${pattern.key}-${i}`} sourceKey={pattern.sourceKey}>
                {parts[i]}
              </SourceLink>
            );
          } else if (parts[i]) {
            newProcessedText.push(parts[i]);
          }
        }
      } else {
        newProcessedText.push(segment);
      }
    }
    
    processedText = newProcessedText;
  }

  return <>{processedText}</>;
}
