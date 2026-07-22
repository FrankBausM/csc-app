import { NextResponse } from "next/server";
import { analyzeClaim } from "../../../lib/appContext";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text ist erforderlich." },
        { status: 400 }
      );
    }

    // Text in Sätze aufteilen
    const sentences = text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15);

    const findings = sentences.map((sentence) => {
      const analysis = analyzeClaim(sentence);

      return {
        text: sentence,
        riskLevel: analysis.riskLevel,
        riskScore: analysis.riskScore,
        explanation: analysis.explanation,
        suggestedRewrite: analysis.suggestedRewrite,
        issues: analysis.linkedClaims || [],
      };
    });

    return NextResponse.json({
      findings,
      summary: {
        total: findings.length,
        critical: findings.filter((f) => f.riskLevel === "CRITICAL").length,
        high: findings.filter((f) => f.riskLevel === "HIGH").length,
        medium: findings.filter((f) => f.riskLevel === "MEDIUM").length,
        low: findings.filter((f) => f.riskLevel === "LOW").length,
      },
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Analyze fulltext error:", error);
    return NextResponse.json(
      { error: "Analyse fehlgeschlagen." },
      { status: 500 }
    );
  }
}
