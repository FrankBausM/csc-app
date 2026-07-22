"use client";

import { useState, useCallback, useRef } from "react";
import { analyzeClaim } from "../../lib/appContext";
import { Button } from "../../components/ui";

interface Asset {
  id: string;
  type: "url";
  url: string;
  assetType: string;
  status: "pending" | "analyzing" | "done" | "error";
  result: {
    total: number;
    critical: number;
    high: number;
    claims: any[];
  } | null;
  error: string | null;
}

const ASSET_TYPES = [
  { value: "website", label: "Website" },
  { value: "press", label: "Pressemitteilung" },
  { value: "report", label: "Report / Whitepaper" },
  { value: "social", label: "Social Media Post" },
  { value: "ad", label: "Werbeanzeige" },
];

const STATUS = {
  pending: { label: "Wartend", color: "text-[#3d4f38]", icon: "⏳" },
  analyzing: { label: "Analysiert...", color: "text-yellow-400", icon: "🔄" },
  done: { label: "Abgeschlossen", color: "text-green-400", icon: "✓" },
  error: { label: "Fehler", color: "text-red-400", icon: "✕" },
};

interface AssetQueueItemProps {
  asset: Asset;
  index: number;
  onRemove: (index: number) => void;
  onViewResults: (index: number) => void;
}

function AssetQueueItem({ asset, index, onRemove, onViewResults }: AssetQueueItemProps) {
  const status = STATUS[asset.status] || STATUS.pending;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "12px",
        borderRadius: "var(--radius-sm)",
        border: `1px solid ${
          asset.status === "done"
            ? "#4caf50"
            : asset.status === "error"
            ? "#c62828"
            : asset.status === "analyzing"
            ? "#ffc107"
            : "var(--border-medium)"
        }`,
        backgroundColor:
          asset.status === "done"
            ? "rgba(76, 175, 80, 0.05)"
            : asset.status === "error"
            ? "transparent"
            : asset.status === "analyzing"
            ? "rgba(255, 193, 7, 0.05)"
            : "var(--bg-secondary)",
        transition: "all 0.2s",
      }}
    >
      <span style={{ fontSize: "18px" }}>{status.icon}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              color: "var(--text-primary)",
              fontSize: "14px",
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {asset.type === "url" ? asset.url : `Text ${index + 1}`}
          </span>
          <span
            style={{
              fontSize: "11px",
              backgroundColor: "var(--bg-tertiary)",
              color: "var(--text-secondary)",
              padding: "2px 8px",
              borderRadius: "4px",
              flexShrink: 0,
            }}
          >
            {ASSET_TYPES.find((t) => t.value === asset.assetType)?.label || asset.assetType}
          </span>
        </div>

        {asset.status === "done" && asset.result && (
          <div style={{ display: "flex", gap: "12px", marginTop: "4px", fontSize: "12px" }}>
            {asset.result.critical > 0 && (
              <span style={{ color: "#c62828" }}>{asset.result.critical} kritisch</span>
            )}
            {asset.result.high > 0 && (
              <span style={{ color: "#d97706" }}>{asset.result.high} hoch</span>
            )}
            {asset.result.total > 0 && (
              <span style={{ color: "var(--text-secondary)" }}>{asset.result.total} Claims</span>
            )}
            {asset.result.total === 0 && (
              <span style={{ color: "#4caf50" }}>Keine Beanstandungen</span>
            )}
          </div>
        )}

        {asset.status === "error" && (
          <span style={{ fontSize: "12px", color: "#c62828" }}>{asset.error}</span>
        )}
      </div>

      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        {asset.status === "done" && (
          <button
            onClick={() => onViewResults(index)}
            style={{
              color: "var(--color-accent)",
              fontSize: "13px",
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Details →
          </button>
        )}
        {asset.status !== "analyzing" && (
          <button
            onClick={() => onRemove(index)}
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
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

interface BatchSummaryProps {
  assets: Asset[];
}

function BatchSummary({ assets }: BatchSummaryProps) {
  const completed = assets.filter((a) => a.status === "done");
  const totalClaims = completed.reduce((sum, a) => sum + (a.result?.total || 0), 0);
  const criticalClaims = completed.reduce((sum, a) => sum + (a.result?.critical || 0), 0);
  const highClaims = completed.reduce((sum, a) => sum + (a.result?.high || 0), 0);

  if (completed.length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "12px",
        marginBottom: "24px",
      }}
    >
      {[
        { label: "Geprüft", value: `${completed.length}/${assets.length}`, color: "var(--text-primary)" },
        { label: "Claims gesamt", value: totalClaims.toString(), color: "#3b82f6" },
        { label: "Kritisch", value: criticalClaims.toString(), color: "#c62828" },
        { label: "Hoch", value: highClaims.toString(), color: "#d97706" },
      ].map((stat, index) => (
        <div
          key={index}
          style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-medium)",
            borderRadius: "var(--radius-sm)",
            padding: "12px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "20px", fontWeight: 700, color: stat.color }}>{stat.value}</div>
          <div
            style={{
              fontSize: "11px",
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              marginTop: "4px",
            }}
          >
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MultiAssetAnalyzer() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [selectedAssetType, setSelectedAssetType] = useState("website");
  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef(false);

  const addUrls = useCallback(() => {
    const urls = urlInput
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u && (u.startsWith("http") || u.startsWith("www.")));

    if (urls.length === 0) return;

    const newAssets: Asset[] = urls.map((url) => ({
      id: `asset-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: "url",
      url: url.startsWith("www.") ? `https://${url}` : url,
      assetType: selectedAssetType,
      status: "pending",
      result: null,
      error: null,
    }));

    setAssets((prev) => [...prev, ...newAssets]);
    setUrlInput("");
  }, [urlInput, selectedAssetType]);

  const runBatchAnalysis = useCallback(async () => {
    setIsRunning(true);
    abortRef.current = false;

    for (let i = 0; i < assets.length; i++) {
      if (abortRef.current) break;
      if (assets[i].status !== "pending") continue;

      setAssets((prev) =>
        prev.map((a, idx) => (idx === i ? { ...a, status: "analyzing" as const } : a))
      );

      try {
        const response = await fetch("/api/analyze-website", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: assets[i].url,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        setAssets((prev) =>
          prev.map((a, idx) =>
            idx === i
              ? {
                  ...a,
                  status: "done" as const,
                  result: {
                    total: data.claims?.length || 0,
                    critical: data.claims?.filter((c: any) => c.riskLevel === "CRITICAL").length || 0,
                    high: data.claims?.filter((c: any) => c.riskLevel === "HIGH").length || 0,
                    claims: data.claims || [],
                  },
                }
              : a
          )
        );
      } catch (err: any) {
        setAssets((prev) =>
          prev.map((a, idx) =>
            idx === i
              ? {
                  ...a,
                  status: "error" as const,
                  error: err.message,
                }
              : a
          )
        );
      }

      await new Promise((r) => setTimeout(r, 500));
    }

    setIsRunning(false);
  }, [assets]);

  const stopAnalysis = () => {
    abortRef.current = true;
  };

  const removeAsset = (index: number) => {
    setAssets((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setAssets([]);
    setIsRunning(false);
    abortRef.current = true;
  };

  const viewResults = (index: number) => {
    const asset = assets[index];
    if (asset?.result?.claims) {
      window.dispatchEvent(
        new CustomEvent("show-batch-results", {
          detail: { asset, claims: asset.result.claims },
        })
      );
    }
  };

  const pendingCount = assets.filter((a) => a.status === "pending").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div
        style={{
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-medium)",
          borderRadius: "var(--radius-md)",
          padding: "24px",
        }}
      >
        <h3
          style={{
            color: "var(--color-accent)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "8px",
          }}
        >
          Multi-Asset-Prüfung
        </h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "16px" }}>
          Mehrere URLs gleichzeitig analysieren. Geben Sie URLs kommagetrennt oder zeilenweise ein.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <textarea
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder={
              "https://example.com/sustainability\nhttps://company.de/nachhaltigkeit\nhttps://example.com/products"
            }
            style={{
              width: "100%",
              minHeight: "120px",
              backgroundColor: "#ffffff",
              border: "1px solid var(--color-accent)",
              borderRadius: "var(--radius-sm)",
              padding: "16px",
              color: "#4d6600",
              fontSize: "14px",
              fontFamily: "monospace",
              resize: "vertical",
            }}
          />

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <select
              value={selectedAssetType}
              onChange={(e) => setSelectedAssetType(e.target.value)}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid var(--border-medium)",
                color: "#4d6600",
                borderRadius: "var(--radius-sm)",
                padding: "8px 12px",
                fontSize: "14px",
              }}
            >
              {ASSET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            <Button
              onClick={addUrls}
              disabled={!urlInput.trim()}
              style={{
                opacity: !urlInput.trim() ? 0.4 : 1,
              }}
            >
              + Zur Queue hinzufügen
            </Button>

            <div style={{ flex: 1 }}></div>

            {assets.length > 0 && !isRunning && (
              <Button
                onClick={runBatchAnalysis}
                disabled={pendingCount === 0}
                style={{
                  backgroundColor: "var(--color-accent)",
                  color: "#000",
                  opacity: pendingCount === 0 ? 0.4 : 1,
                }}
              >
                🚀 {pendingCount} Assets analysieren
              </Button>
            )}

            {isRunning && (
              <Button
                onClick={stopAnalysis}
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#c62828",
                }}
              >
                ⏹ Stoppen
              </Button>
            )}
          </div>
        </div>
      </div>

      {assets.length > 0 && (
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
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h3
              style={{
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: "14px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Analyse-Queue ({assets.length} Assets)
            </h3>
            <button
              onClick={clearAll}
              style={{
                color: "var(--text-secondary)",
                fontSize: "13px",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#c62828")}
              onMouseOut={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            >
              Alle entfernen
            </button>
          </div>

          <BatchSummary assets={assets} />

          {isRunning && (
            <div
              style={{
                width: "100%",
                backgroundColor: "var(--bg-primary)",
                borderRadius: "999px",
                height: "8px",
                marginBottom: "16px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  backgroundColor: "var(--color-accent)",
                  height: "8px",
                  borderRadius: "999px",
                  transition: "width 0.5s",
                  width: `${
                    (assets.filter((a) => a.status !== "pending").length / assets.length) * 100
                  }%`,
                }}
              />
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {assets.map((asset, i) => (
              <AssetQueueItem
                key={asset.id}
                asset={asset}
                index={i}
                onRemove={removeAsset}
                onViewResults={viewResults}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
