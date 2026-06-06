"use client";

import React, { useState, useMemo } from "react";
import { parseDate } from "./utils";
import { useTheme } from "@/theme/ThemeProvider";
import { Trash2, MoreHorizontal, FileSpreadsheet, FileJson, FileText, Settings2 } from "lucide-react";

import LogFilters from "./components/LogFilters/LogFilters";
import LogTable from "./components/LogTable/LogTable";

import { Log, Meta } from "../types";

interface AuditProps {
  logs: Log[];
  meta: Meta;
  taskCount: number; // Single source of truth from parent
  clearLogs: () => void;
  deleteLog: (id: string | number) => void;
}

function formatHourLabel(hour: number | null) {
  if (hour === null) return "—";

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;

  return `${displayHour} ${period}`;
}

export default function AuditView({
  logs,
  meta: _meta,
  taskCount,
  clearLogs,
  deleteLog,
}: AuditProps) {
  const { isDarkMode } = useTheme();

  const [filterType, setFilterType] = useState<
    "all" | "month" | "year" | "custom"
  >("all");

  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  
  const [isAdvancedMenuOpen, setIsAdvancedMenuOpen] = useState(false);

  const parsedLogs = useMemo(() => {
    return logs.map((log) => ({
      ...log,
      parsedDate: parseDate(log.time),
    }));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return parsedLogs.filter((log) => {
      if (actionFilter !== "ALL" && log.action !== actionFilter) return false;
      if (filterType === "all") return true;

      const date = log.parsedDate;
      if (!date) return true;

      const logYear = date.getFullYear();
      const logMonth = `${logYear}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      const logDateStr = date.toISOString().split("T")[0];

      if (filterType === "month") return logMonth === selectedMonth;
      if (filterType === "year") return String(logYear) === selectedYear;

      if (filterType === "custom") {
        if (!fromDate || !toDate) return true;
        return logDateStr >= fromDate && logDateStr <= toDate;
      }

      return true;
    });
  }, [
    parsedLogs,
    filterType,
    selectedMonth,
    selectedYear,
    fromDate,
    toDate,
    actionFilter,
  ]);

  const analytics = useMemo(() => {
    const actionCount: Record<string, number> = {};
    const taskCountMap: Record<string, number> = {};
    const hourMap: Record<number, number> = {};

    filteredLogs.forEach((log) => {
      actionCount[log.action] = (actionCount[log.action] || 0) + 1;

      const date = log.parsedDate;

      if (date) {
        const hour = date.getHours();
        hourMap[hour] = (hourMap[hour] || 0) + 1;
      }

      if (log.name && log.name !== "User" && log.name !== "System") {
        taskCountMap[log.name] = (taskCountMap[log.name] || 0) + 1;
      }
    });

    const topTasks = Object.entries(taskCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const peakHourEntry = Object.entries(hourMap).sort(
      (a, b) => b[1] - a[1]
    )[0];

    const peakHour = peakHourEntry ? parseInt(peakHourEntry[0]) : null;

    return {
      actionCount,
      topTasks,
      peakHour,
      hourMap,
    };
  }, [filteredLogs]);

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return alert("No data to export");

    const headers = ["ID", "Time", "Action", "Objective", "Detail"];

    const rows = filteredLogs.map((log) => [
      log.id || "",
      new Date(log.time).toLocaleString(),
      log.action,
      `"${String(log.name || "").replace(/"/g, '""')}"`,
      `"${String(log.detail || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))]
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `NexEngine_Audit_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
  };

  const handleExportJSON = () => {
    if (filteredLogs.length === 0) return alert("No data to export");

    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], {
      type: "application/json",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `NexEngine_Logs_${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();
  };

  const handleExportSummary = () => {
    if (filteredLogs.length === 0) return alert("No data to export");

    const summary = {
      exportedAt: new Date().toISOString(),
      totalEvents: filteredLogs.length,
      mostActiveTime:
        analytics.peakHour !== null ? formatHourLabel(analytics.peakHour) : "N/A",
      topObjective: analytics.topTasks[0]?.[0] || "N/A",
      eventDistribution: analytics.actionCount,
      topTasks: Object.fromEntries(analytics.topTasks),
    };

    const blob = new Blob([JSON.stringify(summary, null, 2)], {
      type: "application/json",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `NexEngine_Summary_${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();
  };

  const textPrimaryClass = isDarkMode ? "text-white" : "text-slate-900";
  const textMutedClass = isDarkMode ? "text-white/55" : "text-slate-500";

  return (
    <div
      className={`w-full min-h-screen flex flex-col p-4 md:p-8 font-sans pb-24 transition-colors duration-300 ${
        isDarkMode ? "bg-[var(--background)] text-white" : "bg-[var(--background)] text-gray-900"
      }`}
    >
      <div className="max-w-[1500px] mx-auto w-full flex flex-col gap-5 md:gap-6">
        
        {/* FILTERS */}
        <LogFilters
          filterType={filterType}
          setFilterType={setFilterType}
          actionFilter={actionFilter}
          setActionFilter={setActionFilter}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          fromDate={fromDate}
          setFromDate={setFromDate}
          toDate={toDate}
          setToDate={setToDate}
        />

        {/* HERO SECTION */}
        <div className="flex flex-col mb-6 mt-4">
          <p className={`text-xs uppercase tracking-[0.22em] font-medium mb-4 ${isDarkMode ? "text-orange-400" : "text-orange-500"}`}>
            AUDIT LOGS
          </p>

          <div className="flex flex-col md:flex-row gap-8 items-end">
            
            {/* Left Side Details */}
            <div className="flex-1 space-y-4">
              <h1 className={`text-[2.6rem] md:text-[3.4rem] font-semibold tracking-[-0.06em] leading-none ${textPrimaryClass}`}>
                {filteredLogs.length} <span className="text-[1.2rem] md:text-[1.5rem] font-medium opacity-60 tracking-normal">Events</span>
              </h1>

              <div className={`max-w-xl text-[15px] leading-relaxed ${isDarkMode ? "text-white/72" : "text-slate-600"}`}>
                Complete history of objective creation, updates, deletions and execution tracking.
              </div>

              {/* Dynamic Breakdown Row */}
              <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-5 text-[13px] font-semibold tracking-wide">
                {Object.entries(analytics.actionCount).slice(0, 4).map(([action, count]) => (
                  <div key={action} className={isDarkMode ? "text-white/60" : "text-slate-500"}>
                    <span className={isDarkMode ? "text-white/40" : "text-slate-400"}>{action.toUpperCase()}</span> {count}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side Stats Grid (Now 3 Cards) */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full md:min-w-[480px] md:w-auto">
              <div className={`rounded-2xl p-4 border ${isDarkMode ? "border-white/[0.04]" : "border-black/[0.04]"}`}>
                <div className={`text-[1.8rem] font-semibold tracking-tight ${textPrimaryClass}`}>
                  {formatHourLabel(analytics.peakHour)}
                </div>
                <div className={`text-sm ${textMutedClass}`}>Peak Hour</div>
              </div>

              <div className={`rounded-2xl p-4 border ${isDarkMode ? "border-white/[0.04]" : "border-black/[0.04]"}`}>
                <div className={`text-lg font-semibold leading-tight line-clamp-2 mt-1 ${textPrimaryClass}`}>
                  {analytics.topTasks[0]?.[0] || "—"}
                </div>
                <div className={`text-sm mt-1 ${textMutedClass}`}>Most Edited</div>
              </div>

              <div className={`rounded-2xl p-4 border ${isDarkMode ? "border-white/[0.04]" : "border-black/[0.04]"}`}>
                <div className={`text-[1.8rem] font-semibold tracking-tight ${textPrimaryClass}`}>
                  {taskCount}
                </div>
                <div className={`text-sm ${textMutedClass}`}>Objectives</div>
              </div>
            </div>

          </div>
        </div>

        {/* LOG TABLE */}
        <LogTable
          filteredLogs={filteredLogs}
          deleteLog={deleteLog}
          resetFilters={() => {
            setFilterType("all");
            setActionFilter("ALL");
          }}
        />

        {/* ADVANCED ACTIONS MENU (Moved to bottom) */}
        <div className={`mt-4 pt-6 flex items-center justify-between border-t ${isDarkMode ? "border-white/10" : "border-black/5"}`}>
          <div className={`text-[11px] font-bold uppercase tracking-[0.15em] ${isDarkMode ? "text-white/40" : "text-slate-400"}`}>
            System Maintenance
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsAdvancedMenuOpen(!isAdvancedMenuOpen)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all active:scale-95 border ${
                isDarkMode
                  ? "text-slate-300 border-white/10 hover:bg-white/5"
                  : "text-slate-600 border-black/5 hover:bg-black/5"
              }`}
            >
              <Settings2 size={14} /> Advanced Actions
            </button>

            {isAdvancedMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsAdvancedMenuOpen(false)} />
                <div className={`absolute right-0 bottom-full mb-2 w-48 rounded-xl border shadow-2xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-200 ${
                  isDarkMode ? "bg-[#0F1115] border-white/10 shadow-black/50" : "bg-white border-gray-100 shadow-gray-200/50"
                }`}>
                  <button onClick={() => { handleExportCSV(); setIsAdvancedMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium transition-colors ${isDarkMode ? "text-slate-300 hover:bg-white/5" : "text-slate-700 hover:bg-gray-50"}`}>
                    <FileSpreadsheet size={14} className={isDarkMode ? "text-emerald-400" : "text-emerald-600"} /> Export CSV
                  </button>
                  <button onClick={() => { handleExportJSON(); setIsAdvancedMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium transition-colors ${isDarkMode ? "text-slate-300 hover:bg-white/5" : "text-slate-700 hover:bg-gray-50"}`}>
                    <FileJson size={14} className={isDarkMode ? "text-amber-400" : "text-amber-500"} /> Export JSON
                  </button>
                  <button onClick={() => { handleExportSummary(); setIsAdvancedMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium transition-colors ${isDarkMode ? "text-slate-300 hover:bg-white/5" : "text-slate-700 hover:bg-gray-50"}`}>
                    <FileText size={14} className={isDarkMode ? "text-amber-400" : "text-amber-500"} /> Export Summary
                  </button>
                  
                  <div className={`my-1.5 border-t ${isDarkMode ? "border-white/10" : "border-gray-100"}`} />
                  
                  <button 
                    onClick={() => {
                      if (confirm("Delete ALL audit logs? This cannot be undone.")) {
                        clearLogs();
                      }
                      setIsAdvancedMenuOpen(false);
                    }} 
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium transition-colors ${isDarkMode ? "text-rose-400 hover:bg-rose-500/10" : "text-rose-600 hover:bg-rose-50"}`}
                  >
                    <Trash2 size={14} /> Clear All Logs
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: ${
              isDarkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)"
            }; border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${
              isDarkMode ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.16)"
            }; }
          `,
        }}
      />
    </div>
  );
}