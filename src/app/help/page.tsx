"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import HelpLayout from "@/help/layout";
import HelpPage from "@/help/page";

import DisciplineEnginePage from "@/help/pages/discipline-engine/page";
import GamificationSystemPage from "@/help/pages/gamification-system/page";
import ProgressionEconomyPage from "@/help/pages/progression-economy/page";
import RewardsBadgesPage from "@/help/pages/rewards-badges/page";
import SocialSystemPage from "@/help/pages/social-system/page";
import FailureRecoveryPage from "@/help/pages/failure-recovery/page";
import RoadmapPage from "@/help/pages/roadmap/page";

function HelpContent() {
  const searchParams = useSearchParams();
  const page = searchParams.get("page") || "home";

  switch (page) {
    case "discipline-engine":
      return <DisciplineEnginePage />;

    case "gamification-system":
      return <GamificationSystemPage />;

    case "progression-economy":
      return <ProgressionEconomyPage />;

    case "rewards-badges":
      return <RewardsBadgesPage />;

    case "social-system":
      return <SocialSystemPage />;

    case "failure-recovery":
      return <FailureRecoveryPage />;

    case "roadmap":
      return <RoadmapPage />;

    default:
      return <HelpPage />;
  }
}

export default function HelpRoute() {
  return (
    <HelpLayout>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <HelpContent />
      </Suspense>
    </HelpLayout>
  );
}