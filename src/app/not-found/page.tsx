"use client";

import Link from "next/link";
import { SearchX, ArrowLeft, Home, Grid, BookOpen, Calendar } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center space-y-8">
        
        {/* ICON */}
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-red-100 rounded-full blur-3xl opacity-30 animate-pulse" />
          <div className="relative bg-white border border-slate-100 p-8 rounded-[2rem] shadow-lg">
            <SearchX size={56} className="text-red-500 mx-auto" />
          </div>
        </div>

        {/* TEXT */}
        <div className="space-y-3">
          <h1 className="text-5xl font-black text-slate-900">404</h1>
          <h2 className="text-lg font-bold text-slate-800 uppercase tracking-widest">
            Route Not Found
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto">
            The requested route does not exist or has been moved.  
            You can navigate back or continue to another module.
          </p>
        </div>

        {/* PRIMARY ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button 
            onClick={() => window.history.back()}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition"
          >
            <ArrowLeft size={16} /> Go Back
          </button>

          <Link 
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-black transition shadow-md"
          >
            <Home size={16} /> Dashboard
          </Link>
        </div>

        {/* SMART NAVIGATION (VERY IMPORTANT UX) */}
        <div className="pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">
            Quick Navigation
          </p>

          <div className="grid grid-cols-3 gap-3">
            <Link href="/matrix" className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-semibold flex flex-col items-center gap-1">
              <Grid size={16} /> Matrix
            </Link>

            <Link href="/diary" className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-semibold flex flex-col items-center gap-1">
              <BookOpen size={16} /> Diary
            </Link>

            <Link href="/calender-event" className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-semibold flex flex-col items-center gap-1">
              <Calendar size={16} /> Planner
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}