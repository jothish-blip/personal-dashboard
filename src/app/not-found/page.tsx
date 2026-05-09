"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchX, ArrowLeft, Home, Grid, BookOpen, Calendar } from "lucide-react";

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 transition-colors duration-300 bg-[#F9FAFB] dark:bg-[#050505]">
      <div className="max-w-lg w-full text-center space-y-8">
        
        {/* ICON */}
        <div className="relative inline-block">
          <div className="absolute inset-0 rounded-full blur-3xl opacity-30 animate-pulse bg-red-100 dark:bg-red-900/50" />
          <div className="relative p-8 rounded-[2rem] shadow-lg border transition-colors bg-white border-slate-100 dark:bg-[#111111] dark:border-gray-800">
            <SearchX size={56} className="text-red-500 mx-auto" />
          </div>
        </div>

        {/* TEXT */}
        <div className="space-y-3">
          <h1 className="text-5xl font-black text-slate-900 dark:text-white">404</h1>
          <h2 className="text-lg font-bold uppercase tracking-widest text-slate-800 dark:text-gray-300">
            Route Not Found
          </h2>
          <p className="text-sm leading-relaxed max-w-sm mx-auto text-slate-500 dark:text-gray-400">
            We couldn't find the page you're looking for. It may have been removed or moved. 
            You can navigate back or continue to another module.
          </p>
        </div>

        {/* HELPFUL TIP / WARM WARNING */}
        <div className="flex items-start gap-2 justify-center max-w-sm mx-auto rounded-xl px-4 py-3 border bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-300">
          <span className="text-base">💡</span>
          <p className="text-xs leading-relaxed text-left">
            If the previous page doesn’t load after going back, please refresh once.
            We’re still warming things up behind the scenes.
          </p>
        </div>

        {/* PRIMARY ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button 
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.replace("/");
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 font-semibold rounded-xl transition-all active:scale-95 border bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-[#111111] dark:border-gray-800 dark:text-gray-300 dark:hover:bg-[#1a1a1a]"
          >
            <ArrowLeft size={16} /> Go Back
          </button>

          {/* 🔥 FIXED DASHBOARD BUTTON: Hex colors bypass the global.css bg-white override */}
          <Link 
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 font-semibold rounded-xl transition-all active:scale-95 shadow-md bg-slate-900 text-white hover:bg-black dark:bg-[#ffffff] dark:text-[#000000] dark:hover:bg-[#e5e7eb]"
          >
            <Home size={16} /> Dashboard
          </Link>
        </div>

        {/* SMART NAVIGATION (VERY IMPORTANT UX) */}
        <div className="pt-6 border-t transition-colors border-slate-200 dark:border-gray-800">
          <p className="text-xs uppercase tracking-widest mb-3 text-slate-400 dark:text-gray-500">
            Quick Navigation
          </p>

          <div className="grid grid-cols-3 gap-3">
            <Link 
              href="/matrix" 
              className="p-3 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-colors border bg-white border-slate-200 hover:bg-slate-50 text-slate-700 dark:bg-[#111111] dark:border-gray-800 dark:hover:bg-[#1a1a1a] dark:text-gray-300"
            >
              <Grid size={16} className="text-gray-500 dark:text-gray-400" /> Matrix
            </Link>

            <Link 
              href="/diary" 
              className="p-3 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-colors border bg-white border-slate-200 hover:bg-slate-50 text-slate-700 dark:bg-[#111111] dark:border-gray-800 dark:hover:bg-[#1a1a1a] dark:text-gray-300"
            >
              <BookOpen size={16} className="text-gray-500 dark:text-gray-400" /> Diary
            </Link>

            <Link 
              href="/calender-event" 
              className="p-3 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-colors border bg-white border-slate-200 hover:bg-slate-50 text-slate-700 dark:bg-[#111111] dark:border-gray-800 dark:hover:bg-[#1a1a1a] dark:text-gray-300"
            >
              <Calendar size={16} className="text-gray-500 dark:text-gray-400" /> Planner
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}