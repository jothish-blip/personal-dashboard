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
    id: "what-is-gamification-system",
    title: "What is the Gamification System?",
    teaser:
      "Understand how NexSpace turns discipline into an engaging experience.",
    readTime: "2 min",
    keywords: [
      "gamification",
      "engagement",
      "motivation",
      "system",
    ],
    nextId: "why-gamification-exists",
    content: (
      <div className="space-y-5">
        <p>
          The Gamification System exists to
          make consistency feel rewarding.
        </p>

        <p>
          Instead of forcing productivity,
          NexSpace creates behavioral loops
          that encourage discipline through
          progress, identity and momentum.
        </p>

        <p>
          The goal is not entertainment.
          The goal is sustained execution.
        </p>
      </div>
    ),
  },

  {
    id: "why-gamification-exists",
    title: "Why does gamification exist?",
    teaser:
      "Learn why motivation alone is not enough for long-term consistency.",
    readTime: "3 min",
    keywords: [
      "motivation",
      "discipline",
      "habit",
      "consistency",
    ],
    nextId: "identity-system",
    content: (
      <div className="space-y-5">
        <p>
          Most productivity systems fail
          because users lose motivation.
        </p>

        <p>
          NexSpace solves this by making
          progress visible and emotionally
          rewarding.
        </p>

        <p>
          Small wins become identity
          builders rather than temporary
          motivation spikes.
        </p>
      </div>
    ),
  },

  {
    id: "identity-system",
    title: "How does the identity system work?",
    teaser:
      "Understand how users evolve from beginner to disciplined performer.",
    readTime: "3 min",
    keywords: [
      "identity",
      "rank",
      "discipline",
      "levels",
    ],
    nextId: "levels-and-progression",
    content: (
      <div className="space-y-5">
        <p>
          NexSpace rewards who users are
          becoming, not only what they
          complete.
        </p>

        <p>
          Users gradually build an identity
          through behavior, consistency and
          recovery.
        </p>

        <p>
          Over time they progress through
          meaningful stages of discipline.
        </p>
      </div>
    ),
  },

  {
    id: "levels-and-progression",
    title: "How do levels and progression work?",
    teaser:
      "Learn how XP, points and milestones create long-term engagement.",
    readTime: "4 min",
    keywords: [
      "xp",
      "points",
      "levels",
      "progression",
    ],
    nextId: "rank-system",
    content: (
      <div className="space-y-5">
        <p>
          Levels represent accumulated
          behavioral growth.
        </p>

        <p>
          Users gain points through
          completing meaningful actions
          inside Tasks, Focus and Planner.
        </p>

        <p>
          Progression becomes harder over
          time to reinforce long-term
          discipline.
        </p>
      </div>
    ),
  },

  {
    id: "rank-system",
    title: "How does the rank system work?",
    teaser:
      "Understand how users move through behavioral ranks.",
    readTime: "3 min",
    keywords: [
      "rank",
      "beginner",
      "performer",
      "discipliner",
      "master",
    ],
    nextId: "badges-and-rewards",
    content: (
      <div className="space-y-5">
        <p>
          Ranks represent behavioral
          maturity.
        </p>

        <p>
          Users move from beginner-level
          consistency toward elite
          discipline through repeated
          execution.
        </p>

        <p>
          Higher ranks become increasingly
          difficult to maintain.
        </p>
      </div>
    ),
  },

  {
    id: "badges-and-rewards",
    title: "How do badges and rewards work?",
    teaser:
      "Learn how achievements reinforce positive behavior.",
    readTime: "2 min",
    keywords: [
      "badges",
      "rewards",
      "achievement",
      "unlock",
    ],
    nextId: null,
    content: (
      <div className="space-y-5">
        <p>
          Badges celebrate behavioral
          milestones.
        </p>

        <p>
          Rewards are designed to reinforce
          identity and consistency rather
          than temporary excitement.
        </p>

        <p>
          Long-term achievements carry more
          meaning than short-term streaks.
        </p>
      </div>
    ),
  },
];

export default function GamificationSystemPage() {
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
          (a) =>
            a.id === activeArticle.nextId
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
      behavior:
        "instant" as ScrollBehavior,
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
              setSearchQuery(
                e.target.value
              );
              setActiveArticleId(
                null
              );
            }}
            placeholder="Search articles..."
            className={`w-full rounded-full border pl-11 pr-4 py-3 outline-none text-[15px] ${
              isDarkMode
                ? "bg-transparent border-neutral-800 text-white placeholder-neutral-500"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
            }`}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {!activeArticle && (
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
                  Gamification System
                </h1>

                <p className="text-[15px] text-neutral-400 max-w-md mx-auto">
                  Choose an article to
                  explore
                </p>
              </div>
            )}

            <div className="space-y-1">
              {filteredArticles.map(
                (article) => (
                  <button
                    key={article.id}
                    onClick={() =>
                      navigateArticle(
                        article.id
                      )
                    }
                    className="w-full text-left border-b border-neutral-800 py-5 hover:bg-white/[0.02] transition"
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <h3 className="text-[17px] font-medium mb-1">
                          {
                            article.title
                          }
                        </h3>

                        <p className="text-[14px] text-neutral-400">
                          {
                            article.teaser
                          }
                        </p>
                      </div>

                      <div className="text-xs text-neutral-500 flex items-center gap-1 shrink-0">
                        <Clock
                          size={13}
                        />
                        {
                          article.readTime
                        }
                      </div>
                    </div>
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {activeArticle && (
          <div key={activeArticle.id}>
            <button
              onClick={() =>
                navigateArticle(
                  null
                )
              }
              className="flex items-center gap-1 text-sm text-neutral-400 hover:text-white mb-8"
            >
              <ChevronLeft
                size={16}
              />
              All Articles
            </button>

            <h1 className="text-3xl md:text-[34px] font-semibold tracking-tight mb-8 leading-tight">
              {
                activeArticle.title
              }
            </h1>

            <div className="prose prose-base dark:prose-invert max-w-none">
              {
                activeArticle.content
              }
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
                      {
                        nextArticle.title
                      }
                    </div>

                    <div className="text-sm text-neutral-500">
                      {
                        nextArticle.readTime
                      }{" "}
                      read
                    </div>
                  </div>

                  <ArrowRight
                    size={18}
                  />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}