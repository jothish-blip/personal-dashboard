"use client";

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

export default function HelpRoute() {
  const searchParams = useSearchParams();

  const page =
    searchParams.get("page") || "home";

  const renderPage = () => {
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
  };

  return (
    <HelpLayout>
      {renderPage()}
    </HelpLayout>
  );
}