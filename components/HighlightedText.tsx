'use client';

interface HighlightedTextProps {
  text: string;
}

export function HighlightedText({ text }: HighlightedTextProps) {
  const criticalWords = [
    '100%', 'alle', 'komplett', 'vollständig', 'immer', 
    'niemals', 'jedes', 'keine', 'absolut', 'garantiert'
  ];

  const patterns = criticalWords.map(word => word.replace(/%/g, '\\%')).join('|');
  const regex = new RegExp(`\\b(${patterns})\\b`, 'gi');

  const parts = text.split(regex);

  return (
    <div style={{ lineHeight: '1.6' }}>
      {parts.map((part, index) => {
        if (!part) return null;
        const isCritical = regex.test(part);
        if (isCritical) {
          return (
            <span
              key={index}
              style={{
                backgroundColor: 'rgba(224, 85, 85, 0.3)',
                color: '#c62828',
                fontWeight: 'bold',
                padding: '2px 4px',
                borderRadius: '3px'
              }}
            >
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
}

interface RiskBadgeProps {
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export function RiskBadge({ level }: RiskBadgeProps) {
  const config = {
    CRITICAL: { bg: 'rgba(224, 85, 85, 0.15)', color: '#c62828', emoji: '🔴', label: 'KRITISCH' },
    HIGH: { bg: 'rgba(217, 119, 6, 0.15)', color: '#d97706', emoji: '🟠', label: 'HOCH' },
    MEDIUM: { bg: 'rgba(255, 193, 7, 0.15)', color: '#ffc107', emoji: '🟡', label: 'MITTEL' },
    LOW: { bg: 'rgba(76, 175, 80, 0.15)', color: '#4caf50', emoji: '🟢', label: 'NIEDRIG' }
  };

  const style = config[level];

  return (
    <span
      style={{
        display: 'inline-block',
        backgroundColor: style.bg,
        color: style.color,
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        border: `1px solid ${style.color}`
      }}
    >
      {style.emoji} {style.label}
    </span>
  );
}
