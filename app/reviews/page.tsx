"use client";

import { SectionTitle } from "../../components/ui";
import { useAppContext } from "../AppContext";
import ApprovalWorkflow from "./ApprovalWorkflow";

export default function ReviewsPage() {
  const appContext = useAppContext();

  // Gruppiere Reviews nach Projekten
  const projectReviews = appContext.fulltextProjects.map(project => {
    const projectClaims = appContext.getProjectClaims(project.id);
    const criticalClaims = projectClaims.filter(c => c.riskLevel === "CRITICAL");
    const highClaims = projectClaims.filter(c => c.riskLevel === "HIGH");

    const reviews = [
      ...criticalClaims.map((claim, i) => ({
        id: `${project.id}_c_${i}`,
        claimId: claim.id,
        claim: claim,
        reviewType: "LEGAL REVIEW",
        status: "PENDING",
      })),
      ...highClaims.map((claim, i) => ({
        id: `${project.id}_h_${i}`,
        claimId: claim.id,
        claim: claim,
        reviewType: "ESG REVIEW",
        status: "PENDING",
      })),
    ];

    return {
      project,
      reviews,
      criticalCount: criticalClaims.length,
      highCount: highClaims.length,
    };
  }).filter(pr => pr.reviews.length > 0);

  // Standalone Claims Reviews
  const standaloneCliams = appContext.analyzedClaims.filter(c => !c.projectId);
  const standaloneCritical = standaloneCliams.filter(c => c.riskLevel === "CRITICAL");
  const standaloneHigh = standaloneCliams.filter(c => c.riskLevel === "HIGH");
  
  const standaloneReviews = [
    ...standaloneCritical.map((claim, i) => ({
      id: `standalone_c_${i}`,
      claimId: claim.id,
      claim: claim,
      reviewType: "LEGAL REVIEW",
      status: "PENDING",
    })),
    ...standaloneHigh.map((claim, i) => ({
      id: `standalone_h_${i}`,
      claimId: claim.id,
      claim: claim,
      reviewType: "ESG REVIEW",
      status: "PENDING",
    })),
  ];

  const allReviews = [...projectReviews.flatMap(pr => pr.reviews), ...standaloneReviews];
  const pendingCount = allReviews.filter(r => r.status === "PENDING").length;
  const changesCount = allReviews.filter(r => r.status === "CHANGES_REQUESTED").length;
  const approvedCount = allReviews.filter(r => r.status === "APPROVED").length;

  if (allReviews.length === 0) {
    return (
      <main>
        <section style={{ padding: "40px 0" }}>
          <SectionTitle eyebrow="Freigaben" title="Review- & Freigabe-Queue" />
          <div className="panel" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            <p>Noch keine Reviews ausstehend. Analysieren Sie Texte oder URLs, um automatisches Review-Feedback zu erhalten.</p>
          </div>
        </section>
      </main>
    );
  }

  // Bereite Reviews für ApprovalWorkflow vor
  const reviewsForWorkflow = allReviews.map(r => ({
    id: r.id,
    text: r.claim.text,
    claimText: r.claim.text,
    riskScore: r.claim.riskScore,
    score: r.claim.riskScore,
    analysis: r.claim.explanation,
    suggestedRewrite: r.claim.suggestedRewrite,
    source: r.claim.sourceUrl || "Manuelle Eingabe",
    type: r.reviewType,
    status: r.status.toLowerCase().replace('_', '_'),
    comments: [],
  }));

  return (
    <main>
      <section style={{ padding: "40px 0" }}>
        <SectionTitle eyebrow="Freigaben" title="Review- & Freigabe-Queue" />

        {/* Neuer erweiterter Freigabe-Workflow mit Kommentaren, Benachrichtigungen und erweitertem Status-Tracking */}
        <ApprovalWorkflow reviews={reviewsForWorkflow} />
      </section>
    </main>
  );
}
