"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "@/theme/ThemeProvider";
import {
  BrainCircuit,
  TrendingUp,
  Trophy,
  Users,
  ShieldAlert,
  Route,
  Shield,
  Search,
  ArrowRight
} from "lucide-react";

// ==========================================
// DATA STRUCTURE
// ==========================================

const helpArticles = [
  { 
    title: "Gamification System", 
    desc: "Core philosophy, progression design, and identity system.", 
    href: "/help?page=gamification-system", 
    icon: Shield 
  },
  { 
    title: "Discipline Engine", 
    desc: "Discipline score, consistency, momentum and behavioral intelligence.", 
    href: "/help?page=discipline-engine", 
    icon: BrainCircuit 
  },
  { 
    title: "Progression Economy", 
    desc: "XP, points, levels, protection points, and rank ceilings.", 
    href: "/help?page=progression-economy", 
    icon: TrendingUp 
  },
  { 
    title: "Rewards & Badges", 
    desc: "Achievements, cosmetic rewards and social prestige.", 
    href: "/help?page=rewards-badges", 
    icon: Trophy 
  },
  { 
    title: "Social System", 
    desc: "Discipline profiles, social flex, and accountability.", 
    href: "/help?page=social-system", 
    icon: Users 
  },
  { 
    title: "Failure & Recovery", 
    desc: "Streak breaks, punishment logic and comeback loops.", 
    href: "/help?page=failure-recovery", 
    icon: ShieldAlert 
  },
  { 
    title: "Roadmap & Architecture", 
    desc: "Build phases, implementation priority, and future features.", 
    href: "/help?page=roadmap", 
    icon: Route 
  },
];

// Identify top articles for the featured horizontal scroll
const featuredTitles = ["Discipline Engine", "Gamification System", "Progression Economy"];
const featuredArticles = helpArticles.filter(article => featuredTitles.includes(article.title));

function HelpPageContent() {
  const { isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  // Real-time filtering logic
  const filteredArticles = helpArticles.filter((article) => 
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reusable Card Component to keep layout DRY
  const ArticleCard = ({ article, className = "" }: { article: any, className?: string }) => {
    const Icon = article.icon;
    return (
      <Link
        href={article.href}
        className={`group rounded-2xl border p-5 md:p-6 flex flex-col h-full transition-all duration-200 active:scale-[0.98] ${
          isDarkMode 
            ? "border-zinc-800 bg-[#0a0a0a] hover:border-zinc-600 hover:bg-[#111]" 
            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
        } ${className}`}
      >
        <div className="flex justify-between items-start mb-6">
          <div className={`p-2.5 md:p-3 rounded-xl border transition-colors ${
            isDarkMode ? "bg-[#1a1a1a] border-zinc-800 text-zinc-300 group-hover:text-white" : "bg-gray-50 border-gray-200 text-gray-600 group-hover:text-black"
          }`}>
            <Icon size={20} />
          </div>

          <ArrowRight
            size={18}
            className={`mt-0.5 transition-all duration-200 ${
              isDarkMode ? "text-zinc-700 group-hover:text-zinc-400 group-hover:translate-x-1" : "text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1"
            }`}
          />
        </div>

        <h3 className={`text-lg font-semibold mb-2 tracking-tight ${isDarkMode ? "text-zinc-100" : "text-gray-900"}`}>
          {article.title}
        </h3>

        <p className={`text-sm leading-relaxed flex-1 ${isDarkMode ? "text-zinc-400" : "text-gray-500"}`}>
          {article.desc}
        </p>
      </Link>
    );
  };

  return (
    <div className="max-w-5xl mx-auto pb-28 md:pb-24 px-4 sm:px-6 lg:px-8 selection:bg-blue-500/30 overflow-hidden">
      
      {/* ================= HERO SECTION ================= */}
      <header className="pt-10 pb-10 md:pt-16 md:pb-12 flex flex-col items-center text-center">
        
        {/* Brand Logo & Title */}
        <div className="flex flex-col items-center gap-5 mb-8">
          <div className={`p-1 rounded-2xl border shadow-sm ${isDarkMode ? "bg-black border-zinc-800" : "bg-white border-gray-200"}`}>
            <Image 
              src="/favicon.ico" 
              alt="NexSpace Logo"
              width={48} 
              height={48} 
              className="w-10 h-10 md:w-12 md:h-12 rounded-xl"
              unoptimized 
            />
          </div>
          <div>
            <h1 className={`text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              NexSpace Help Center
            </h1>
            <p className={`text-base md:text-lg max-w-md md:max-w-xl mx-auto ${isDarkMode ? "text-zinc-400" : "text-gray-500"}`}>
              Explore systems, mechanics, discipline intelligence, and platform architecture.
            </p>
          </div>
        </div>

        {/* Functional Search Bar */}
        <div className="w-full max-w-2xl mx-auto mb-8 relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className={isDarkMode ? "text-zinc-500" : "text-gray-400"} />
          </div>
          <input 
            type="text" 
            placeholder="Search systems..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className={`w-full pl-11 pr-4 py-3 md:py-4 rounded-full border outline-none transition-all duration-200 ${
              isDarkMode 
                ? "bg-[#111] border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-600 focus:bg-[#1a1a1a]" 
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:shadow-sm"
            }`}
          />
        </div>

        {/* Subtle Principle Pill */}
        <div className={`inline-flex items-center px-4 py-1.5 rounded-full border text-[11px] font-semibold whitespace-nowrap tracking-widest uppercase transition-colors ${
          isDarkMode ? "bg-zinc-900/50 border-zinc-800 text-zinc-500" : "bg-gray-50 border-gray-200 text-gray-500"
        }`}>
          Hard to Open <span className="mx-2 opacity-50">•</span> Harder to Break
        </div>
      </header>

      {/* ================= CONTENT SECTION ================= */}
      <div className="space-y-8">
        
        {/* Empty State */}
        {filteredArticles.length === 0 && (
          <div className={`text-center py-12 md:py-20 rounded-3xl border ${isDarkMode ? "border-zinc-800 bg-[#111]" : "border-gray-200 bg-gray-50"}`}>
            <p className={`text-lg ${isDarkMode ? "text-zinc-500" : "text-gray-500"}`}>
              No systems found for "{searchQuery}"
            </p>
            <button 
              onClick={() => setSearchQuery("")}
              className={`mt-4 text-sm font-medium hover:underline active:scale-[0.98] ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
            >
              Clear search
            </button>
          </div>
        )}

        {/* Default View (No Search) */}
        {searchQuery === "" && filteredArticles.length > 0 && (
          <>
            {/* Featured Systems - Horizontal Scroll for Mobile Discoverability */}
            <div className="mb-10 lg:hidden">
              <h2 className={`text-xs font-semibold uppercase tracking-wider mb-4 px-1 ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>
                Most Used
              </h2>
              {/* Full bleed scroll container on mobile */}
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {featuredArticles.map((article) => (
                  <div key={article.title} className="snap-start shrink-0 w-[260px] sm:w-[280px]">
                    <ArticleCard article={article} />
                  </div>
                ))}
              </div>
            </div>

            {/* Main Grid Title (Only show if we showed the featured section above) */}
            <h2 className={`hidden lg:block text-xs font-semibold uppercase tracking-wider mb-4 px-1 ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>
              All Systems
            </h2>
            <h2 className={`lg:hidden text-xs font-semibold uppercase tracking-wider mb-4 px-1 mt-6 ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>
              All Systems
            </h2>
          </>
        )}

        {/* Full Category Grid */}
        {filteredArticles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {filteredArticles.map((article) => (
              <ArticleCard key={article.title} article={article} />
            ))}
          </div>
        )}
        
      </div>
    </div>
  );
}

export default function HelpPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <HelpPageContent />
    </Suspense>
  );
}