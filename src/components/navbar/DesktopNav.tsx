"use client";

import React, { useState } from "react";
import { LayoutGrid, ListTodo, BookOpen, Brain, CalendarDays, Download, Upload, PanelLeftClose, PanelLeftOpen, Bell } from "lucide-react";
import NotificationCenter from "@/notifications/NotificationCenter"; // ✅ Import UI
import { NexNotification } from "@/notifications/types";

interface DesktopNavProps {
  activePaths: { isTasks: boolean; isMini: boolean; isDiary: boolean; isFocus: boolean; isCalendar: boolean; };
  handleNav: (path: string) => void;
  y: string; m: string; years: number[];
  setMonthYear: (val: string) => void;
  handleImportClick: () => void;
  exportData: () => void;
  // ✅ Notification Props
  notifications: NexNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  isNoteOpen: boolean;
  setIsNoteOpen: (v: boolean) => void;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const NAV_ITEMS = [
  { label: "Tasks", icon: LayoutGrid, path: "/", key: "isTasks", desc: "Manage your execution tasks" },
  { label: "Mini", icon: ListTodo, path: "/mini-nisc", key: "isMini", desc: "Workspace and quick notes" },
  { label: "Diary", icon: BookOpen, path: "/diary", key: "isDiary", desc: "Daily reflection system" },
  { label: "Focus", icon: Brain, path: "/focus", key: "isFocus", desc: "Deep work session engine" },
  { label: "Planner", icon: CalendarDays, path: "/calender-event", key: "isCalendar", desc: "Schedule your work" },
];

export default function DesktopNav({
  activePaths, handleNav, y, m, years, setMonthYear, handleImportClick, exportData,
  notifications, unreadCount, markAsRead, clearAll, isNoteOpen, setIsNoteOpen
}: DesktopNavProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="hidden md:flex h-[64px] items-center px-6 max-w-[1500px] mx-auto w-full relative">
      
      {/* BRAND */}
      <div className="text-lg font-semibold text-gray-800 flex items-center gap-2 shrink-0">
        <div className="flex items-center justify-center w-8 h-8 bg-gray-900 text-white rounded-lg">
          <span className="text-sm font-bold">Nx</span>
        </div>
        {!isCollapsed && (
          <div className="animate-in fade-in slide-in-from-left-2 duration-300 tracking-tight">
            NexTask <span className="text-orange-500 font-bold text-xs ml-0.5">v1.2</span>
          </div>
        )}
      </div>

      <div className="h-5 w-[1px] bg-gray-200 mx-4 shrink-0" />

      {/* UNIFIED NAVIGATION */}
      <div className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePaths[item.key as keyof typeof activePaths];

          return (
            <button
              key={item.label}
              onClick={() => handleNav(item.path)}
              title={`${item.label}: ${item.desc}`}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95
              ${isActive ? "bg-gray-900 text-white shadow-md shadow-gray-200" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      {/* RIGHT: Tools & Controls */}
      <div className="flex items-center gap-3 shrink-0">
        
        {/* DATE SELECTORS */}
        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
          <select 
            value={y} 
            onChange={(e) => setMonthYear(`${e.target.value}-${m}`)} 
            className="bg-transparent px-2 py-1 text-xs font-bold text-gray-700 outline-none cursor-pointer appearance-none hover:text-black transition-colors"
          >
            {years.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
          <div className="w-[1px] h-3 bg-gray-300" />
          <select 
            value={m} 
            onChange={(e) => setMonthYear(`${y}-${e.target.value}`)} 
            className="bg-transparent px-2 py-1 text-xs font-bold text-gray-700 outline-none cursor-pointer appearance-none hover:text-black transition-colors"
          >
            {MONTH_NAMES.map((name, i) => {
              const val = String(i + 1).padStart(2, '0');
              return <option key={val} value={val}>{name}</option>;
            })}
          </select>
        </div>

        <div className="h-5 w-[1px] bg-gray-200 mx-1" />

        {/* DATA ACTIONS */}
        <div className="flex gap-1">
          <button 
            onClick={handleImportClick} 
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-orange-50 hover:text-orange-600 transition-all active:scale-90"
            title="Import JSON"
          >
            <Download size={14} />
          </button>
          <button 
            onClick={exportData} 
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-green-50 hover:text-green-600 transition-all active:scale-90"
            title="Export JSON"
          >
            <Upload size={14} />
          </button>
        </div>

        <div className="h-5 w-[1px] bg-gray-200 mx-1" />

        {/* ✅ BELL ICON & NOTIFICATION DROPDOWN */}
        <div className="relative">
          <button 
            onClick={() => setIsNoteOpen(!isNoteOpen)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all relative ${
              unreadCount > 0 
                ? "border-orange-200 bg-orange-50 text-orange-600 animate-in fade-in scale-105" 
                : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Bell size={15} className={unreadCount > 0 ? "animate-swing" : ""} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-gray-900 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          <NotificationCenter 
            isOpen={isNoteOpen}
            onClose={() => setIsNoteOpen(false)}
            notifications={notifications}
            unreadCount={unreadCount}
            markAsRead={markAsRead}
            clearAll={clearAll}
          />
        </div>

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-400 hover:text-gray-900 transition-colors p-1 active:scale-90 ml-1"
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>
    </div>
  );
}