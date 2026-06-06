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
    id: "what-are-rewards-badges",
    title: "What are Rewards & Badges?",
    teaser:
      "Understand how NexSpace rewards consistency and meaningful growth.",
    readTime: "2 min",
    keywords: [
      "badges",
      "rewards",
      "achievement",
      "motivation",
    ],
    nextId: "why-rewards-exist",
    content: (
      <div className="space-y-5">
        <p>
          Rewards and badges exist to make
          progress visible.
        </p>

        <p>
          Instead of rewarding random
          activity, NexSpace rewards
          meaningful consistency,
          discipline and recovery.
        </p>

        <p>
          The goal is to reinforce identity,
          not create short-term excitement.
        </p>
      </div>
    ),
  },

  {
    id: "why-rewards-exist",
    title: "Why do rewards exist?",
    teaser:
      "Learn why behavioral reinforcement matters for discipline.",
    readTime: "3 min",
    keywords: [
      "motivation",
      "discipline",
      "habit",
      "identity",
    ],
    nextId: "badge-system",
    content: (
      <div className="space-y-5">
        <p>
          Most people stop because progress
          feels invisible.
        </p>

        <p>
          NexSpace solves this by celebrating
          meaningful milestones and
          behavioral wins.
        </p>

        <p>
          Rewards remind users that effort
          matters even before results appear.
        </p>
      </div>
    ),
  },

  {
    id: "badge-system",
    title: "How does the badge system work?",
    teaser:
      "Understand how users unlock behavioral achievements.",
    readTime: "3 min",
    keywords: [
      "badges",
      "achievement",
      "unlock",
      "discipline",
    ],
    nextId: "types-of-badges",
    content: (
      <div className="space-y-5">
        <p>
          Badges represent behavioral
          milestones.
        </p>

        <p>
          Users unlock badges by maintaining
          consistency, recovering from
          setbacks and achieving meaningful
          goals.
        </p>

        <p>
          Higher-level badges become harder
          to unlock over time.
        </p>
      </div>
    ),
  },

  {
    id: "types-of-badges",
    title: "What types of badges exist?",
    teaser:
      "Explore the different badge categories inside NexSpace.",
    readTime: "4 min",
    keywords: [
      "categories",
      "consistency",
      "focus",
      "achievement",
    ],
    nextId: "prestige-system",
    content: (
      <div className="space-y-5">
        <p>
          Badges are grouped into different
          behavioral categories.
        </p>

        <ul className="list-disc pl-5 space-y-2">
          <li>Consistency Badges</li>
          <li>Focus Badges</li>
          <li>Recovery Badges</li>
          <li>Momentum Badges</li>
          <li>Elite Achievement Badges</li>
        </ul>

        <p>
          Each badge category represents a
          different aspect of growth.
        </p>
      </div>
    ),
  },

  {
    id: "prestige-system",
    title: "How does the prestige system work?",
    teaser:
      "Learn how advanced users gain rare recognition.",
    readTime: "3 min",
    keywords: [
      "prestige",
      "elite",
      "recognition",
      "master",
    ],
    nextId: "social-flex",
    content: (
      <div className="space-y-5">
        <p>
          Prestige rewards long-term
          discipline rather than short-term
          streaks.
        </p>

        <p>
          Rare achievements are unlocked
          through exceptional behavioral
          consistency.
        </p>

        <p>
          These become difficult to maintain
          and reflect true commitment.
        </p>
      </div>
    ),
  },

  {
    id: "social-flex",
    title: "How do social rewards work?",
    teaser:
      "Understand how users showcase achievements socially.",
    readTime: "2 min",
    keywords: [
      "social",
      "share",
      "profile",
      "showcase",
    ],
    nextId: "why-rewards-matter",
    content: (
      <div className="space-y-5">
        <p>
          Users can showcase progress
          through profiles, ranks and badge
          collections.
        </p>

        <p>
          Social proof encourages
          accountability and consistency.
        </p>

        <p>
          The goal is inspiration, not
          unhealthy competition.
        </p>
      </div>
    ),
  },

  {
    id: "why-rewards-matter",
    title: "Why do rewards matter?",
    teaser:
      "Understand why visible progress increases consistency.",
    readTime: "2 min",
    keywords: [
      "motivation",
      "growth",
      "consistency",
      "behavior",
    ],
    nextId: null,
    content: (
      <div className="space-y-5">
        <p>
          Rewards make invisible effort
          visible.
        </p>

        <p>
          They help users feel momentum even
          during difficult periods.
        </p>

        <p>
          The objective is not addiction.
          The objective is long-term
          behavioral growth.
        </p>
      </div>
    ),
  },
];

export default function RewardsBadgesPage() {
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
                  alt="NexSpace"
                  width={54}
                  height={54}
                  className="mx-auto rounded-2xl mb-5"
                />

                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-2">
                  Help Center
                </p>

                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
                  Rewards & Badges
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

                      <p
                        className={`text-[14px] ${
                          isDarkMode
                            ? "text-neutral-400"
                            : "text-gray-500"
                        }`}
                      >
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
          <div
            key={activeArticle.id}
            className="animate-in fade-in duration-200"
          >
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
                    navigateArticle(
                      nextArticle.id
                    )
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