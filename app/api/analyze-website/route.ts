import { NextRequest, NextResponse } from "next/server";
import { analyzeClaim, extractClaimsFromText } from "../../../lib/appContext";

export const runtime = "nodejs";

async function fetchWebsiteContent(url: string): Promise<string> {
  try {
    // Stelle sicher, dass die URL mit http/https beginnt
    const fullUrl = url.startsWith("http") ? url : `https://${url}`;

    // Verwende AbortController für Timeout-Funktion
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();

      // Extrahiere Text aus HTML
      const textContent = extractTextFromHTML(html);
      return textContent || `Warnung: Keine aussagekräftigen Inhalte auf ${fullUrl} gefunden`;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error("Fehler beim Abrufen der Website:", error);
    throw error; // Fehler nach oben werfen statt String zurückgeben
  }
}

function extractTextFromHTML(html: string): string {
  // Entferne Script- und Style-Tags
  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "");

  // Entferne HTML-Tags aber behalte Whitespace
  text = text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&");

  // Entferne extra Whitespace
  text = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  // Behalte nur Zeilen mit relevanten Keywords oder längere Zeilen
  const relevantKeywords =
    /nachhaltig|klimaneutral|co2|emission|umwelt|grün|green|sustainability|carbon|environment|eco|ecology|renewable|solar|wind|water|recycl|biolog|zertifiziert|certified|standard|audit|report|data|metric|reduktion|reduction|prozent|percent|%|ton|kg|kwh/i;

  const lines = text
    .split(/[.!?]\s+/)
    .filter(
      (line) => line.length > 20 || relevantKeywords.test(line)
    )
    .join(". ");

  // Begrenze auf die ersten 3000 Zeichen für relevante Inhalte
  return lines.substring(0, 3000).trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL erforderlich" },
        { status: 400 }
      );
    }

    const content = await fetchWebsiteContent(url);
    
    // Prüfe auf Fehler-Content vor der Analyse
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Keine analysierbaren Inhalte auf der Website gefunden" },
        { status: 400 }
      );
    }
    
    const sentences = extractClaimsFromText(content);

    const claims = sentences.map((text, i) => ({
      id: `claim-${Date.now()}-${i}`,
      text: text.trim(),
      ...analyzeClaim(text.trim()),
    }));

    return NextResponse.json({
      url: url.startsWith("http") ? url : `https://${url}`,
      title: new URL(url.startsWith("http") ? url : `https://${url}`).hostname,
      text: content,
      claims,
    });
  } catch (error) {
    console.error("API Fehler:", error);
    return NextResponse.json(
      {
        error: "Fehler bei der Website-Analyse",
        message: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500 }
    );
  }
}
