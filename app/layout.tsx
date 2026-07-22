import './brandbook-theme.css';
import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { AppProvider } from "./AppContext";

const APP_NAME = "Credible Sustainability Communication";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Glaubwürdige Nachhaltigkeitskommunikation — Workflow-Plattform für Claim-Prüfung, Evidenz-Management und Freigaben"
};

const nav = [
  { href: "/", label: "Überblick" },
  { href: "/projects", label: "Projekte" },
  { href: "/asset-review", label: "Asset-Prüfung" },
  { href: "/evidence", label: "Evidenz-Hub" },
  { href: "/reviews", label: "Freigaben" },
  { href: "/reports", label: "Berichte" },
  { href: "/patterns", label: "Patterns" }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <AppProvider>
          <div className="container">
            <header className="topbar">
              <div className="brand">
                <Link href="/" style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/gw-logo.png"
                    alt="Grüne Welle Kommunikation"
                    className="brand-logo"
                  />
                  <div className="brand-text">
                    <div className="brand-title">Credible Sustainability</div>
                    <div className="brand-subtitle">Communication</div>
                  </div>
                </Link>
              </div>
              <nav className="nav">
                {nav.map((item) => (
                  <Link key={item.href} href={item.href}>{item.label}</Link>
                ))}
              </nav>
            </header>
            {children}
            <footer className="footer">
              <div>Credible Sustainability Communication</div>
              <div style={{ marginTop: 8, opacity: 0.6 }}>Powered by Grüne Welle Kommunikation</div>
            </footer>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
