"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { useTheme } from "@/theme/ThemeProvider";
import {
  ChevronLeft,
  ArrowRight,
  Clock,
  Search,
} from "lucide-react";

type Article = {
  id: string;
  title: string;
  teaser: string;
  readTime: string;
  keywords: string[];
  content: React.ReactNode;
  nextId?: string | null;
};

const ARTICLES: Article[] = [
  {
    id: "roadmap-overview",
    title: "What is the Nextask Roadmap?",
    teaser:
      "Understand how Nextask evolves from productivity app to discipline platform.",
    readTime: "2 min",
    keywords: [
      "roadmap",
      "vision",
      "growth",
      "future",
    ],
    nextId: "phase-1-foundation",
    content: (
      <div className="space-y-5">
        <p>
          The Nextask roadmap defines how
          the platform evolves over time.
        </p>

        <p>
          The goal is not to ship random
          features. The goal is to build
          a long-term discipline operating
          system.
        </p>

        <p>
          Every phase exists to strengthen
          behavioral consistency and user
          identity.
        </p>
      </div>
    ),
  },

  {
    id: "phase-1-foundation",
    title: "Phase 1 — Foundation",
    teaser:
      "Building the core behavioral system and execution engine.",
    readTime: "3 min",
    keywords: [
      "phase 1",
      "foundation",
      "tasks",
      "focus",
    ],
    nextId: "phase-2-gamification",
    content: (
      <div className="space-y-5">
        <p>
          Phase 1 focuses on building
          the behavioral foundation.
        </p>

        <ul className="list-disc pl-5 space-y-2">
          <li>Tasks System</li>
          <li>Focus Engine</li>
          <li>Planner</li>
          <li>Diary</li>
          <li>Workspace</li>
        </ul>

        <p>
          The goal is to establish daily
          execution and consistency.
        </p>
      </div>
    ),
  },

  {
    id: "phase-2-gamification",
    title: "Phase 2 — Gamification System",
    teaser:
      "Turning discipline into an engaging behavioral experience.",
    readTime: "3 min",
    keywords: [
      "phase 2",
      "gamification",
      "xp",
      "levels",
    ],
    nextId: "phase-3-social",
    content: (
      <div className="space-y-5">
        <p>
          Phase 2 introduces progression
          and engagement systems.
        </p>

        <ul className="list-disc pl-5 space-y-2">
          <li>XP & Points</li>
          <li>Ranks</li>
          <li>Badges</li>
          <li>Behavior Tracking</li>
          <li>Recovery System</li>
        </ul>

        <p>
          The objective is to reinforce
          consistency through meaningful
          progression.
        </p>
      </div>
    ),
  },

  {
    id: "phase-3-social",
    title: "Phase 3 — Social Layer",
    teaser:
      "Building accountability and identity systems.",
    readTime: "3 min",
    keywords: [
      "phase 3",
      "social",
      "profiles",
      "community",
    ],
    nextId: "phase-4-intelligence",
    content: (
      <div className="space-y-5">
        <p>
          Phase 3 introduces social
          accountability.
        </p>

        <ul className="list-disc pl-5 space-y-2">
          <li>Discipline Profiles</li>
          <li>Verification</li>
          <li>Social Flex</li>
          <li>Accountability Circles</li>
          <li>Leaderboards</li>
        </ul>

        <p>
          This phase strengthens identity
          and long-term retention.
        </p>
      </div>
    ),
  },

  {
    id: "phase-4-intelligence",
    title: "Phase 4 — Intelligence Layer",
    teaser:
      "Helping users understand themselves better.",
    readTime: "4 min",
    keywords: [
      "phase 4",
      "ai",
      "intelligence",
      "insights",
    ],
    nextId: "phase-5-ecosystem",
    content: (
      <div className="space-y-5">
        <p>
          Phase 4 introduces behavioral
          intelligence.
        </p>

        <ul className="list-disc pl-5 space-y-2">
          <li>Behavior Analytics</li>
          <li>Consistency Insights</li>
          <li>AI Recommendations</li>
          <li>Pattern Recognition</li>
        </ul>

        <p>
          The system becomes more aware
          of user behavior over time.
        </p>
      </div>
    ),
  },

  {
    id: "phase-5-ecosystem",
    title: "Phase 5 — Nextask Ecosystem",
    teaser:
      "Transforming Nextask into a full discipline platform.",
    readTime: "3 min",
    keywords: [
      "phase 5",
      "ecosystem",
      "platform",
      "future",
    ],
    nextId: null,
    content: (
      <div className="space-y-5">
        <p>
          The final phase expands
          Nextask into a larger ecosystem.
        </p>

        <p>
          Users move beyond productivity
          into identity, accountability,
          growth and behavioral mastery.
        </p>

        <p>
          The goal is to become the
          world's strongest discipline
          platform.
        </p>
      </div>
    ),
  },
];

export default function RoadmapPage() {
  const { isDarkMode } = useTheme();

  const [activeArticleId, setActiveArticleId] =
    useState<string | null>(null);

  const [searchQuery, setSearchQuery] =
    useState("");

  const searchRef =
    useRef<HTMLInputElement>(null);

  const activeArticle =
    activeArticleId
      ? ARTICLES.find(
          (a) => a.id === activeArticleId
        ) ?? null
      : null;

  const nextArticle =
    activeArticle?.nextId
      ? ARTICLES.find(
          (a) => a.id === activeArticle.nextId
        ) ?? null
      : null;

  const filteredArticles =
    ARTICLES.filter((article) => {
      const query =
        searchQuery.toLowerCase();

      return (
        article.title
          .toLowerCase()
          .includes(query) ||
        article.teaser
          .toLowerCase()
          .includes(query) ||
        article.keywords.some((k) =>
          k.includes(query)
        )
      );
    });

  const navigateArticle = (
    id: string | null
  ) => {
    const container =
      document.getElementById(
        "help-scroll-container"
      );

    container?.scrollTo({
      top: 0,
    });

    requestAnimationFrame(() => {
      setActiveArticleId(id);

      if (!id) {
        requestAnimationFrame(() => {
          searchRef.current?.focus();
        });
      }
    });
  };

  return (
    <div
      className={`min-h-screen px-5 md:px-8 pb-20 pt-8 ${
        isDarkMode
          ? "bg-[#111111] text-white"
          : "bg-[#F9FAFB] text-gray-900"
      }`}
    >
      {/* Search */}
      <div
        className={`sticky top-0 z-20 py-4 backdrop-blur-xl ${
          isDarkMode
            ? "bg-[#111111]/90"
            : "bg-[#F9FAFB]/90"
        }`}
      >
        <div className="max-w-2xl mx-auto relative">
          <Search
            size={16}
            className={`absolute left-4 top-1/2 -translate-y-1/2 ${
              isDarkMode
                ? "text-neutral-500"
                : "text-gray-400"
            }`}
          />

          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setActiveArticleId(null);
            }}
            placeholder="Search articles..."
            className={`w-full rounded-full border pl-11 pr-4 py-3 outline-none transition-all text-[15px] ${
              isDarkMode
                ? "bg-transparent border-neutral-800 focus:border-neutral-600 text-white placeholder-neutral-500"
                : "bg-white border-gray-300 focus:border-gray-400 text-gray-900 placeholder-gray-400"
            }`}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {!activeArticle ? (
          <div>
            {!searchQuery && (
              <div className="text-center mb-10">
                <Image
                  src="/favicon.ico"
                  alt="Nextask"
                  width={54}
                  height={54}
                  className="mx-auto rounded-2xl mb-5"
                />

                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-2">
                  Help Center
                </p>

                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
                  Roadmap
                </h1>

                <p className="text-[15px] text-neutral-400 max-w-md mx-auto">
                  Choose an article to explore
                </p>
              </div>
            )}

            <div className="space-y-1">
              {filteredArticles.map((article) => (
                <button
                  key={article.id}
                  onClick={() =>
                    navigateArticle(article.id)
                  }
                  className={`w-full text-left border-b py-5 transition ${
                    isDarkMode
                      ? "border-neutral-800 hover:bg-white/[0.02]"
                      : "border-gray-200 hover:bg-black/[0.02]"
                  }`}
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <h3 className="text-[17px] font-medium mb-1">
                        {article.title}
                      </h3>

                      <p className={`text-[14px] ${
                        isDarkMode
                          ? "text-neutral-400"
                          : "text-gray-500"
                      }`}>
                        {article.teaser}
                      </p>
                    </div>

                    <div className="text-xs text-neutral-500 flex items-center gap-1 shrink-0">
                      <Clock size={13} />
                      {article.readTime}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div key={activeArticle.id}>
            <button
              onClick={() =>
                navigateArticle(null)
              }
              className="flex items-center gap-1 text-sm text-neutral-400 hover:text-white mb-8"
            >
              <ChevronLeft size={16} />
              All Articles
            </button>

            <h1 className="text-3xl md:text-[34px] font-semibold tracking-tight mb-8 leading-tight">
              {activeArticle.title}
            </h1>

            <div className="prose prose-base dark:prose-invert max-w-none">
              {activeArticle.content}
            </div>

            {nextArticle && (
              <div className="mt-12 pt-6 border-t border-neutral-800">
                <p className="text-xs uppercase tracking-wider mb-3 text-neutral-500">
                  Next Article
                </p>

                <button
                  onClick={() =>
                    navigateArticle(nextArticle.id)
                  }
                  className="w-full flex items-center justify-between text-left"
                >
                  <div>
                    <div className="font-medium text-lg">
                      {nextArticle.title}
                    </div>

                    <div className="text-sm text-neutral-500">
                      {nextArticle.readTime} read
                    </div>
                  </div>

                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}