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
    id: "what-is-failure-system",
    title: "What is the Failure & Recovery System?",
    teaser:
      "Understand how Nextask handles failure without breaking momentum.",
    readTime: "2 min",
    keywords: [
      "failure",
      "recovery",
      "streak",
      "discipline",
    ],
    nextId: "what-happens-when-user-fails",
    content: (
      <div className="space-y-5">
        <p>
          Failure in Nextask is not treated as punishment.
          It is treated as behavioral feedback.
        </p>

        <p>
          The system exists to prevent users from
          completely abandoning consistency after
          one bad day.
        </p>

        <p>
          Instead of instantly destroying progress,
          Nextask measures recovery ability and
          comeback strength.
        </p>
      </div>
    ),
  },

  {
    id: "what-happens-when-user-fails",
    title: "What happens when a user fails?",
    teaser:
      "Learn how missed tasks affect discipline, momentum and XP.",
    readTime: "3 min",
    keywords: [
      "miss",
      "tasks",
      "discipline",
      "xp",
      "momentum",
    ],
    nextId: "recovery-mode",
    content: (
      <div className="space-y-5">
        <p>
          Missing a day does not instantly destroy
          user progress.
        </p>

        <p>
          Instead, the system gradually reduces:
        </p>

        <ul className="list-disc pl-5 space-y-2">
          <li>Momentum</li>
          <li>Consistency score</li>
          <li>Protection points</li>
        </ul>

        <p>
          Severe penalties only happen when failure
          becomes repeated behavior.
        </p>
      </div>
    ),
  },

  {
    id: "recovery-mode",
    title: "How does Recovery Mode work?",
    teaser:
      "Understand how users rebuild discipline after failure.",
    readTime: "3 min",
    keywords: [
      "recovery",
      "comeback",
      "discipline",
      "streak",
    ],
    nextId: "protection-points",
    content: (
      <div className="space-y-5">
        <p>
          Recovery Mode activates after a behavioral
          drop.
        </p>

        <p>
          Instead of forcing perfection, Nextask
          prioritizes rebuilding consistency through
          small wins.
        </p>

        <p>
          Users earn momentum again by completing
          core activities consistently.
        </p>
      </div>
    ),
  },

  {
    id: "protection-points",
    title: "What are Protection Points?",
    teaser:
      "Learn how streaks are protected from complete collapse.",
    readTime: "2 min",
    keywords: [
      "protection",
      "points",
      "streak",
      "xp",
    ],
    nextId: null,
    content: (
      <div className="space-y-5">
        <p>
          Protection Points act as behavioral safety
          nets.
        </p>

        <p>
          They prevent users from losing everything
          after one bad day.
        </p>

        <p>
          These points are earned through long-term
          consistency and can soften failures during
          difficult periods.
        </p>
      </div>
    ),
  },
];

export default function FailureRecoveryPage() {
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
                  alt="Nextask"
                  width={54}
                  height={54}
                  className="mx-auto rounded-2xl mb-5"
                />

                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-2">
                  Help Center
                </p>

                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
                  Failure & Recovery
                </h1>

                <p className="text-[15px] text-neutral-400 max-w-md mx-auto">
                  Choose an article to explore
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