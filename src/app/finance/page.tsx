"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import { 
  Lock, 
  Settings, 
  Code2, 
  CalendarDays, 
  CheckSquare, 
  ArrowRight,
  ShieldAlert
} from "lucide-react";

export default function FinanceLockedPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Navigation - Kept for consistency but simplified */}
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

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center space-y-12">
          
          {/* 1. STATUS INDICATOR */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-orange-100 rounded-full blur-3xl opacity-30 animate-pulse" />
            <div className="relative bg-white border border-slate-100 p-8 rounded-[3rem] shadow-2xl shadow-slate-200/50">
              <Lock size={64} className="text-orange-500 mx-auto transition-transform hover:scale-110 duration-500" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-slate-900 p-3 rounded-2xl text-white shadow-xl">
              <Settings size={20} className="animate-spin-slow" />
            </div>
          </div>

          {/* 2. CORE MESSAGE */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              Finance Hub is <span className="text-orange-500">Locked</span>
            </h1>
            
            <div className="bg-slate-50 border border-slate-100 p-6 md:p-8 rounded-[2.5rem] relative overflow-hidden">
              <ShieldAlert size={120} className="absolute -right-10 -bottom-10 text-slate-100/50" />
              <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed relative z-10">
                This page is currently locked and will be opened as soon as it is ready. 
                Our developers are working incredibly hard to bring these advanced 
                financial features to your dashboard.
              </p>
              <div className="mt-8 pt-6 border-t border-slate-200/60 relative z-10">
                <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
                  Regards,
                </p>
                <p className="text-lg font-black text-slate-900 mt-1">
                  Jothish Gandham
                </p>
              </div>
            </div>
          </div>

          {/* 3. REDIRECT / SUGGESTION BOX */}
          <div className="space-y-4">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
              Explore Active Modules
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a 
                href="/calendar" 
                className="group flex items-center justify-between p-6 bg-white border border-slate-200 rounded-2xl hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/5 transition-all"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    <CalendarDays size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Event Planner</p>
                    <p className="text-[10px] font-medium text-slate-500">Manage your daily schedule</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
              </a>

              <a 
                href="/tasks" 
                className="group flex items-center justify-between p-6 bg-white border border-slate-200 rounded-2xl hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/5 transition-all"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <CheckSquare size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Task Engine</p>
                    <p className="text-[10px] font-medium text-slate-500">Track and execute goals</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="p-8 text-center">
        <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <Code2 size={12} />
          <span>System Version 2.0.4 Alpha Build</span>
        </div>
      </footer>

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