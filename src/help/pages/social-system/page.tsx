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
    id: "what-is-social-system",
    title: "What is the Social System?",
    teaser:
      "Understand how NexSpace builds accountability through identity and social visibility.",
    readTime: "2 min",
    keywords: [
      "social",
      "system",
      "discipline",
      "identity",
    ],
    nextId: "why-social-accountability-matters",
    content: (
      <div className="space-y-5">
        <p>
          The Social System transforms
          discipline into a visible identity.
        </p>

        <p>
          Instead of users working alone,
          NexSpace helps them build
          accountability through social
          proof, profiles and consistency.
        </p>

        <p>
          The goal is not comparison.
          The goal is sustainable growth.
        </p>
      </div>
    ),
  },

  {
    id: "why-social-accountability-matters",
    title: "Why does social accountability matter?",
    teaser:
      "Learn why visible progress improves long-term consistency.",
    readTime: "3 min",
    keywords: [
      "accountability",
      "consistency",
      "motivation",
    ],
    nextId: "discipline-profile",
    content: (
      <div className="space-y-5">
        <p>
          Most people quit because progress
          stays invisible.
        </p>

        <p>
          Social accountability increases
          consistency by making behavioral
          effort visible.
        </p>

        <p>
          Seeing progress encourages users
          to maintain discipline longer.
        </p>
      </div>
    ),
  },

  {
    id: "discipline-profile",
    title: "How do discipline profiles work?",
    teaser:
      "Understand how users showcase identity and behavioral growth.",
    readTime: "3 min",
    keywords: [
      "profile",
      "identity",
      "discipline",
      "rank",
    ],
    nextId: "verification-system",
    content: (
      <div className="space-y-5">
        <p>
          Every user builds a Discipline
          Profile.
        </p>

        <p>
          Profiles display progress,
          consistency, rank and meaningful
          achievements.
        </p>

        <p>
          The profile becomes a reflection
          of behavioral identity.
        </p>
      </div>
    ),
  },

  {
    id: "verification-system",
    title: "How does verification work?",
    teaser:
      "Learn how trust and credibility are built inside NexSpace.",
    readTime: "3 min",
    keywords: [
      "verification",
      "trust",
      "credibility",
      "badge",
    ],
    nextId: "social-flex",
    content: (
      <div className="space-y-5">
        <p>
          Verification reflects consistency
          and authentic effort.
        </p>

        <p>
          Users can earn credibility through
          long-term execution and meaningful
          participation.
        </p>

        <p>
          Higher trust signals become harder
          to earn.
        </p>
      </div>
    ),
  },

  {
    id: "social-flex",
    title: "How does social flex work?",
    teaser:
      "Understand how users showcase discipline achievements.",
    readTime: "2 min",
    keywords: [
      "social",
      "flex",
      "share",
      "showcase",
    ],
    nextId: "leaderboards",
    content: (
      <div className="space-y-5">
        <p>
          Users can showcase milestones,
          ranks and achievements.
        </p>

        <p>
          Social flex exists to inspire
          consistency rather than unhealthy
          comparison.
        </p>

        <p>
          Recognition should feel earned.
        </p>
      </div>
    ),
  },

  {
    id: "leaderboards",
    title: "How do leaderboards work?",
    teaser:
      "Learn how competitive accountability can improve consistency.",
    readTime: "3 min",
    keywords: [
      "leaderboard",
      "competition",
      "rank",
      "score",
    ],
    nextId: "accountability-circles",
    content: (
      <div className="space-y-5">
        <p>
          Leaderboards highlight consistent
          behavioral effort.
        </p>

        <p>
          Rankings prioritize discipline,
          recovery and meaningful execution.
        </p>

        <p>
          Short-term activity alone is never
          enough to dominate.
        </p>
      </div>
    ),
  },

  {
    id: "accountability-circles",
    title: "What are accountability circles?",
    teaser:
      "Understand how small social groups improve discipline.",
    readTime: "3 min",
    keywords: [
      "group",
      "circle",
      "accountability",
      "community",
    ],
    nextId: "privacy-system",
    content: (
      <div className="space-y-5">
        <p>
          Accountability circles are trusted
          groups where users support one
          another.
        </p>

        <p>
          Members help maintain consistency
          through encouragement and
          visibility.
        </p>

        <p>
          Smaller groups improve long-term
          retention.
        </p>
      </div>
    ),
  },

  {
    id: "privacy-system",
    title: "How does privacy work?",
    teaser:
      "Learn how users stay in control of what is visible.",
    readTime: "2 min",
    keywords: [
      "privacy",
      "visibility",
      "control",
      "settings",
    ],
    nextId: null,
    content: (
      <div className="space-y-5">
        <p>
          Privacy is controlled by the user.
        </p>

        <p>
          Users decide which achievements,
          metrics and activity become
          visible.
        </p>

        <p>
          Social participation should feel
          safe and intentional.
        </p>
      </div>
    ),
  },
];

export default function SocialSystemPage() {
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
    <div className={`min-h-screen px-5 md:px-8 pb-20 pt-8 ${
      isDarkMode
        ? "bg-[#111111] text-white"
        : "bg-[#F9FAFB] text-gray-900"
    }`}>
      <div className={`sticky top-0 z-20 py-4 backdrop-blur-xl ${
        isDarkMode
          ? "bg-[#111111]/90"
          : "bg-[#F9FAFB]/90"
      }`}>
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
                  alt="NexSpace"
                  width={54}
                  height={54}
                  className="mx-auto rounded-2xl mb-5"
                />

                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-2">
                  Help Center
                </p>

                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
                  Social System
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