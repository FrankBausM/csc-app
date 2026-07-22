"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "cic-analyzed-claims";
const PROJECTS_STORAGE_KEY = "cic-fulltext-projects";

export interface RuleViolation {
  rule: string;
  source: string;
  description: string;
  recommendation?: string;
}

export interface FulltextProject {
  id: string;
  title: string;
  fullText: string;
  timestamp: Date;
  claimCount: number;
  highestRiskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  highestRiskScore: number;
}

export interface AnalyzedClaim {
  id: string;
  text: string;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  riskScore: number;
  explanation: string;
  suggestedRewrite: string;
  violations?: RuleViolation[];
  source: "manual" | "url" | "fulltext";
  sourceUrl?: string;
  projectId?: string; // Verknüpfung zu FulltextProject
  timestamp: Date;
  textPosition?: number; // Position im Originaltext (0-basiert) - wichtig für Timeline-Sortierung
  // Feedback & Korrektur-Felder
  isManuallyOverridden?: boolean;
  originalRiskScore?: number;
  originalRiskLevel?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  userCorrectedScore?: number;
  userCorrectedLevel?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  feedbackReason?: string;
  feedbackTimestamp?: Date;
  // NEU: Unsicherheits-Markierung & Debug-Info
  uncertaintyFlags?: string[];
  debugInfo?: {
    detectedPatterns: string[];
    empcoViolationsCount: number;
    otherIssuesCount: number;
  };
}

interface AppContextType {
  analyzedClaims: AnalyzedClaim[];
  fulltextProjects: FulltextProject[];
  selectedClaim: AnalyzedClaim | null;
  addClaim: (claim: Omit<AnalyzedClaim, "id" | "timestamp">) => void;
  removeClaim: (claimId: string) => void;
  updateClaim: (claimId: string, updates: Partial<AnalyzedClaim>) => void;
  overrideClaimRisk: (claimId: string, newScore: number, newLevel: AnalyzedClaim["riskLevel"], reason: string) => void;
  setSelectedClaim: (claim: AnalyzedClaim | null) => void;
  getCriticalClaims: () => AnalyzedClaim[];
  getHighRiskClaims: () => AnalyzedClaim[];
  getMediumRiskClaims: () => AnalyzedClaim[];
  getLowRiskClaims: () => AnalyzedClaim[];
  getTotalScore: () => number;
  getApprovalRate: () => number;
  clearClaims: () => void;
  getFeedbackData: () => any[];
  addFulltextProject: (title: string, fullText: string, claims: Omit<AnalyzedClaim, "id" | "timestamp">[]) => string;
  getProjectClaims: (projectId: string) => AnalyzedClaim[];
  removeProject: (projectId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Initial state - immer leeres Array, dann aus localStorage laden
  const [analyzedClaims, setAnalyzedClaims] = useState<AnalyzedClaim[]>([]);
  const [fulltextProjects, setFulltextProjects] = useState<FulltextProject[]>([]);
  const [selectedClaim, setSelectedClaimState] = useState<AnalyzedClaim | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Claims aus localStorage laden (nur auf Client nach Hydration)
  useEffect(() => {
    if (typeof window !== "undefined" && !isHydrated) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Date-Objekte wiederherstellen
          const restoredClaims = parsed.map((claim: any) => ({
            ...claim,
            timestamp: claim.timestamp ? new Date(claim.timestamp) : new Date(),
            feedbackTimestamp: claim.feedbackTimestamp ? new Date(claim.feedbackTimestamp) : undefined,
          }));
          setAnalyzedClaims(restoredClaims);
        }

        // Projekte laden
        const projectsStored = localStorage.getItem(PROJECTS_STORAGE_KEY);
        if (projectsStored) {
          const parsedProjects = JSON.parse(projectsStored);
          const restoredProjects = parsedProjects.map((project: any) => ({
            ...project,
            timestamp: project.timestamp ? new Date(project.timestamp) : new Date(),
          }));
          setFulltextProjects(restoredProjects);
        }
      } catch (error) {
        console.error("Fehler beim Laden der Claims/Projekte aus localStorage:", error);
        // Bei Fehler localStorage leeren, um zukünftige Fehler zu vermeiden
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(PROJECTS_STORAGE_KEY);
      }
      setIsHydrated(true);
    }
  }, [isHydrated]);

  // Claims in localStorage speichern bei jeder Änderung (nur nach Hydration)
  useEffect(() => {
    if (typeof window !== "undefined" && isHydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(analyzedClaims));
      } catch (error) {
        console.error("Fehler beim Speichern der Claims in localStorage:", error);
      }
    }
  }, [analyzedClaims, isHydrated]);

  // Projekte in localStorage speichern bei jeder Änderung (nur nach Hydration)
  useEffect(() => {
    if (typeof window !== "undefined" && isHydrated) {
      try {
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(fulltextProjects));
      } catch (error) {
        console.error("Fehler beim Speichern der Projekte in localStorage:", error);
      }
    }
  }, [fulltextProjects, isHydrated]);

  const addClaim = useCallback(
    (claim: Omit<AnalyzedClaim, "id" | "timestamp">) => {
      // Deduplizierung: Prüfe ob identischer Claim bereits existiert
      setAnalyzedClaims((prev) => {
        const isDuplicate = prev.some(
          existing => existing.text.trim().toLowerCase() === claim.text.trim().toLowerCase()
        );
        
        if (isDuplicate) {
          console.warn("Duplikat erkannt - Claim wird nicht hinzugefügt:", claim.text);
          return prev; // Keine Änderung
        }
        
        const newClaim: AnalyzedClaim = {
          ...claim,
          id: `claim-${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
        };
        console.log("Claim hinzugefügt:", newClaim);
        return [newClaim, ...prev];
      });
    },
    []
  );

  const removeClaim = useCallback((claimId: string) => {
    setAnalyzedClaims((prev) => prev.filter((c) => c.id !== claimId));
    console.log("Claim entfernt:", claimId);
  }, []);

  const updateClaim = useCallback((claimId: string, updates: Partial<AnalyzedClaim>) => {
    setAnalyzedClaims((prev) =>
      prev.map((claim) =>
        claim.id === claimId ? { ...claim, ...updates } : claim
      )
    );
    console.log("Claim aktualisiert:", claimId, updates);
  }, []);

  const overrideClaimRisk = useCallback((
    claimId: string,
    newScore: number,
    newLevel: AnalyzedClaim["riskLevel"],
    reason: string
  ) => {
    setAnalyzedClaims((prev) =>
      prev.map((claim) => {
        if (claim.id === claimId) {
          return {
            ...claim,
            originalRiskScore: claim.isManuallyOverridden ? claim.originalRiskScore : claim.riskScore,
            originalRiskLevel: claim.isManuallyOverridden ? claim.originalRiskLevel : claim.riskLevel,
            riskScore: newScore,
            riskLevel: newLevel,
            userCorrectedScore: newScore,
            userCorrectedLevel: newLevel,
            feedbackReason: reason,
            feedbackTimestamp: new Date(),
            isManuallyOverridden: true,
          };
        }
        return claim;
      })
    );
    console.log("Claim-Risiko überschrieben:", claimId, { newScore, newLevel, reason });
  }, []);

  const getFeedbackData = useCallback(() => {
    return analyzedClaims
      .filter((claim) => claim.isManuallyOverridden)
      .map((claim) => ({
        claimId: claim.id,
        claimText: claim.text,
        originalScore: claim.originalRiskScore,
        originalLevel: claim.originalRiskLevel,
        correctedScore: claim.userCorrectedScore,
        correctedLevel: claim.userCorrectedLevel,
        reason: claim.feedbackReason,
        timestamp: claim.feedbackTimestamp,
      }));
  }, [analyzedClaims]);

  const getCriticalClaims = useCallback(
    () => analyzedClaims.filter((c) => c.riskLevel === "CRITICAL"),
    [analyzedClaims]
  );

  const getHighRiskClaims = useCallback(
    () => analyzedClaims.filter((c) => c.riskLevel === "HIGH"),
    [analyzedClaims]
  );

  const getMediumRiskClaims = useCallback(
    () => analyzedClaims.filter((c) => c.riskLevel === "MEDIUM"),
    [analyzedClaims]
  );

  const getLowRiskClaims = useCallback(
    () => analyzedClaims.filter((c) => c.riskLevel === "LOW"),
    [analyzedClaims]
  );

  const getTotalScore = useCallback(() => {
    const total = analyzedClaims.reduce((sum, c) => sum + c.riskScore, 0);
    return analyzedClaims.length > 0
      ? Math.round(total / analyzedClaims.length)
      : 0;
  }, [analyzedClaims]);

  const getApprovalRate = useCallback(() => {
    if (analyzedClaims.length === 0) return 0;
    const approvable = analyzedClaims.filter((c) => c.riskLevel === "LOW" || c.riskLevel === "MEDIUM").length;
    return Math.round((approvable / analyzedClaims.length) * 100);
  }, [analyzedClaims]);

  const addFulltextProject = useCallback(
    (title: string, fullText: string, claims: Omit<AnalyzedClaim, "id" | "timestamp">[]): string => {
      const projectId = `project-${Date.now()}-${Math.random()}`;
      
      // Projekt erstellen
      const newProject: FulltextProject = {
        id: projectId,
        title,
        fullText,
        timestamp: new Date(),
        claimCount: claims.length,
        highestRiskLevel: claims.length > 0 
          ? claims.reduce((max, claim) => {
              const levels = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
              return levels[claim.riskLevel] > levels[max] ? claim.riskLevel : max;
            }, "LOW" as AnalyzedClaim["riskLevel"])
          : "LOW",
        highestRiskScore: claims.length > 0
          ? Math.max(...claims.map(c => c.riskScore))
          : 0,
      };

      setFulltextProjects((prev) => [newProject, ...prev]); // Neuestes zuerst

      // Claims mit projectId und textPosition hinzufügen
      claims.forEach((claim, index) => {
        const newClaim: AnalyzedClaim = {
          ...claim,
          id: `claim-${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
          projectId,
          source: "fulltext",
          textPosition: index, // Position im Originaltext speichern
        };
        setAnalyzedClaims((prev) => [newClaim, ...prev]);
      });

      console.log("Volltext-Projekt erstellt:", projectId, title);
      return projectId;
    },
    []
  );

  const getProjectClaims = useCallback(
    (projectId: string) => {
      return analyzedClaims.filter((c) => c.projectId === projectId);
    },
    [analyzedClaims]
  );

  const removeProject = useCallback((projectId: string) => {
    // Projekt entfernen
    setFulltextProjects((prev) => prev.filter((p) => p.id !== projectId));
    // Zugehörige Claims entfernen
    setAnalyzedClaims((prev) => prev.filter((c) => c.projectId !== projectId));
    console.log("Projekt gelöscht:", projectId);
  }, []);

  const clearClaims = useCallback(() => {
    setAnalyzedClaims([]);
  }, []);

  const setSelectedClaim = useCallback((claim: AnalyzedClaim | null) => {
    setSelectedClaimState(claim);
  }, []);

  const value: AppContextType = {
    analyzedClaims,
    fulltextProjects,
    selectedClaim,
    addClaim,
    removeClaim,
    updateClaim,
    overrideClaimRisk,
    setSelectedClaim,
    getCriticalClaims,
    getHighRiskClaims,
    getMediumRiskClaims,
    getLowRiskClaims,
    getTotalScore,
    getApprovalRate,
    clearClaims,
    getFeedbackData,
    addFulltextProject,
    getProjectClaims,
    removeProject,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext muss innerhalb von AppProvider verwendet werden");
  }
  return context;
}
