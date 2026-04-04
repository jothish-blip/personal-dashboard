"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { 
  Lock, 
  Settings, 
  Code2, 
  CalendarDays, 
  CheckSquare, 
  ArrowRight,
  ShieldAlert,
  BrainCircuit,
  BookOpen,
  Sparkles
} from "lucide-react";

export default function FinanceLockedPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 flex flex-col font-sans selection:bg-orange-200">
      {/* Navigation */}
      <Navbar 
        meta={{ 
          currentMonth: "2026-04", 
          isFocus: false, 
          theme: 'light', 
          lockedDates: [], 
          rollbackUsedDates: [] 
        }}
        setMonthYear={() => {}} 
        exportData={() => {}} 
        importData={() => {}}
      />

      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="max-w-4xl w-full text-center space-y-12 mt-8 md:mt-0">
          
          {/* 1. STATUS INDICATOR */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-orange-400 rounded-full blur-[60px] opacity-20 animate-pulse duration-3000" />
            <div className="relative bg-white border border-slate-100 p-8 rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] flex items-center justify-center h-32 w-32 mx-auto group">
              <Lock size={48} className="text-orange-500 transition-transform group-hover:scale-110 duration-500" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-slate-900 p-3 rounded-2xl text-white shadow-xl ring-4 ring-white">
              <Settings size={20} className="animate-spin-slow" />
            </div>
          </div>

          {/* 2. CORE MESSAGE */}
          <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              The Finance Engine is <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">Compiling</span>
            </h1>
            
            <div className="bg-white border border-slate-200/60 p-8 md:p-10 rounded-[2.5rem] relative overflow-hidden shadow-sm text-left">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-red-500" />
              <ShieldAlert size={160} className="absolute -right-10 -bottom-10 text-slate-50/80 rotate-12" />
              
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2 text-orange-500 font-bold uppercase tracking-widest text-[10px] mb-4">
                  <Sparkles size={14} /> System Architecture in Progress
                </div>
                <p className="text-lg text-slate-600 font-medium leading-relaxed">
                  Wealth management requires absolute precision. We are currently architecting a state-of-the-art financial module designed to track, forecast, and optimize your economic trajectory. 
                </p>
                <p className="text-lg text-slate-600 font-medium leading-relaxed">
                  Algorithmic perfection takes time. This sector remains locked until the core logic meets our strict deployment standards.
                </p>
                
                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Lead Architect
                    </p>
                    <p className="text-base font-black text-slate-900 mt-0.5">
                      Jothish Gandham
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold uppercase tracking-wider">
                    v0.9 Beta
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. REDIRECT / ACTIVE MODULES GRID */}
          <div className="space-y-6 text-left max-w-3xl mx-auto pt-4">
            <div className="flex items-center gap-3 px-2">
              <div className="h-[1px] flex-1 bg-slate-200" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">
                Explore Active System Nodes
              </p>
              <div className="h-[1px] flex-1 bg-slate-200" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Task Engine */}
              <Link 
                href="/" 
                className="group flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                    <CheckSquare size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Task Engine</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-0.5">Execute Objectives</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:translate-x-1 group-hover:text-emerald-500 transition-all" />
              </Link>

              {/* MINI NISC */}
              <Link 
                href="/mini-nisc" 
                className="group flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                    <BrainCircuit size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">MINI Workspace</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-0.5">Knowledge Vault</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:translate-x-1 group-hover:text-blue-500 transition-all" />
              </Link>

              {/* Diary / Life Engine */}
              <Link 
                href="/diary" 
                className="group flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Life Engine Archive</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-0.5">Behavior & Memory</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:translate-x-1 group-hover:text-purple-500 transition-all" />
              </Link>

              {/* Event Planner */}
              <Link 
                href="/calender-event" 
                className="group flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                    <CalendarDays size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Event Planner</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-0.5">Temporal Mapping</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:translate-x-1 group-hover:text-orange-500 transition-all" />
              </Link>

            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-8 text-center mt-auto">
        <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <Code2 size={12} />
          <span>NexEngine Core v2.0.4</span>
        </div>
      </footer>

      {/* Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}} />
    </div>
  );
}