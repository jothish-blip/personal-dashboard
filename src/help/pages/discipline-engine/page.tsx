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
    id: "what-is-discipline-engine",
    title: "What is the Discipline Engine?",
    teaser:
      "Learn how Nextask tracks consistency and behavioral growth.",
    readTime: "2 min",
    keywords: [
      "discipline",
      "identity",
      "consistency",
    ],
    nextId: "how-calculated",
    content: (
      <div className="space-y-5">
        <p>
          The Discipline Engine measures who
          you are becoming over time.
        </p>

        <p>
          Instead of rewarding short bursts
          of productivity, it focuses on
          consistency, recovery, and
          execution quality.
        </p>
      </div>
    ),
  },

  {
    id: "how-calculated",
    title: "How is discipline calculated?",
    teaser:
      "Understand how Tasks, Focus, Planner and Diary contribute.",
    readTime: "3 min",
    keywords: [
      "score",
      "focus",
      "tasks",
      "planner",
    ],
    nextId: null,
    content: (
      <div className="space-y-5">
        <p>
          Discipline score combines behavior
          across the five modules.
        </p>

        <p>
          Recent actions matter more than
          old achievements.
        </p>
      </div>
    ),
  },
];

export default function DisciplineEnginePage() {
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
      className={`min-h-screen px-5 md:px-8 pb-20 pt-8 transition-colors ${
        isDarkMode
          ? "bg-[#111111] text-white"
          : "bg-[#F9FAFB] text-gray-900"
      }`}
    >
      {/* Sticky Search */}
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
            className={`w-full rounded-full border pl-11 pr-4 py-3 outline-none transition-all text-[15px] ${
              isDarkMode
                ? "bg-transparent border-neutral-800 text-white placeholder-neutral-500 focus:border-neutral-600"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-400"
            }`}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* ARTICLE LIST */}
        {!activeArticle && (
          <div className="animate-in fade-in duration-200">
            {/* Header */}
            {!searchQuery && (
              <div className="text-center mb-10">
                <Image
                  src="/favicon.ico"
                  alt="Nextask"
                  width={54}
                  height={54}
                  className="mx-auto rounded-2xl mb-5"
                />

                <p
                  className={`text-[11px] uppercase tracking-[0.2em] mb-2 ${
                    isDarkMode
                      ? "text-neutral-500"
                      : "text-gray-500"
                  }`}
                >
                  Help Center
                </p>

                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
                  Discipline Engine
                </h1>

                <p
                  className={`max-w-md mx-auto text-[15px] ${
                    isDarkMode
                      ? "text-neutral-400"
                      : "text-gray-500"
                  }`}
                >
                  Choose an article to
                  explore
                </p>
              </div>
            )}

            {/* Articles */}
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
                    className={`w-full text-left border-b py-5 transition-colors ${
                      isDarkMode
                        ? "border-neutral-800 hover:bg-white/[0.02]"
                        : "border-gray-200 hover:bg-black/[0.02]"
                    }`}
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <h3 className="text-[17px] font-medium mb-1">
                          {
                            article.title
                          }
                        </h3>

                        <p
                          className={`text-[14px] leading-relaxed ${
                            isDarkMode
                              ? "text-neutral-400"
                              : "text-gray-500"
                          }`}
                        >
                          {
                            article.teaser
                          }
                        </p>
                      </div>

                      <div
                        className={`shrink-0 flex items-center gap-1 text-xs ${
                          isDarkMode
                            ? "text-neutral-500"
                            : "text-gray-400"
                        }`}
                      >
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

        {/* ARTICLE VIEW */}
        {activeArticle && (
          <div
            key={activeArticle.id}
            className="animate-in fade-in duration-200"
          >
            <button
              onClick={() =>
                navigateArticle(
                  null
                )
              }
              className={`flex items-center gap-1 text-sm mb-8 ${
                isDarkMode
                  ? "text-neutral-400 hover:text-white"
                  : "text-gray-500 hover:text-gray-900"
              }`}
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