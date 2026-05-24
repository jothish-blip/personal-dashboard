"use client";

import React, { useState, useMemo } from "react";
import { parseDate } from "./utils";

import { useTheme } from "@/theme/ThemeProvider";

import LogFilters from "./components/LogFilters/LogFilters";
import LogTable from "./components/LogTable/LogTable";
import ExportControls from "./components/ExportControls/ExportControls";

import { Log, Meta } from "../types";

interface AuditProps {
  logs: Log[];
  meta: Meta;
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
    const taskCount: Record<string, number> = {};
    const hourMap: Record<number, number> = {};

    filteredLogs.forEach((log) => {
      actionCount[log.action] = (actionCount[log.action] || 0) + 1;

      const date = log.parsedDate;

      if (date) {
        const hour = date.getHours();
        hourMap[hour] = (hourMap[hour] || 0) + 1;
      }

      if (log.name && log.name !== "User" && log.name !== "System") {
        taskCount[log.name] = (taskCount[log.name] || 0) + 1;
      }
    });

    const topTasks = Object.entries(taskCount)
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

  const historyInsight = useMemo(() => {
    const total = filteredLogs.length;

    if (total === 0) {
      return {
        title: "No history yet",
        description: "Task activity will appear here over time.",
      };
    }

    if (analytics.topTasks.length > 0) {
      return {
        title: `${total} actions recorded`,
        description: `You've been actively updating ${analytics.topTasks[0][0]}.`,
      };
    }

    return {
      title: `${total} actions recorded`,
      description: "Your task history is being tracked.",
    };
  }, [filteredLogs.length, analytics.topTasks]);

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

  return (
    <div
      className={`w-full min-h-screen flex flex-col p-4 md:p-8 font-sans pb-24 transition-colors duration-300 ${
        isDarkMode ? "bg-[#050505] text-gray-200" : "bg-[#F9FAFB] text-gray-900"
      }`}
    >
      <div className="max-w-[1500px] mx-auto w-full flex flex-col gap-6">
        <div
          className={`rounded-[28px] border p-6 transition-all duration-300 hover:-translate-y-[2px] ${
            isDarkMode
              ? "bg-[#111111] border-[#1c1c1c]"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] font-semibold text-gray-500">
                Activity History
              </p>

              <h2
                className={`text-2xl font-semibold mt-2 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {historyInsight.title}
              </h2>

              <p
                className={`mt-2 text-sm max-w-[500px] ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {historyInsight.description}
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <div
                className={`rounded-2xl px-4 py-3 border ${
                  isDarkMode
                    ? "bg-[#0d0d0d] border-[#1c1c1c]"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <p className="text-xs text-gray-500">Total Actions</p>
                <p className="text-lg font-semibold">{filteredLogs.length}</p>
              </div>

              <div
                className={`rounded-2xl px-4 py-3 border ${
                  isDarkMode
                    ? "bg-[#0d0d0d] border-[#1c1c1c]"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <p className="text-xs text-gray-500">Most Active Time</p>
                <p className="text-lg font-semibold">
                  {formatHourLabel(analytics.peakHour)}
                </p>
              </div>

              <div
                className={`rounded-2xl px-4 py-3 border ${
                  isDarkMode
                    ? "bg-[#0d0d0d] border-[#1c1c1c]"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <p className="text-xs text-gray-500">Top Objective</p>
                <p className="text-lg font-semibold truncate max-w-[160px]">
                  {analytics.topTasks[0]?.[0] || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

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

        <LogTable
          filteredLogs={filteredLogs}
          deleteLog={deleteLog}
          resetFilters={() => {
            setFilterType("all");
            setActionFilter("ALL");
          }}
        />

        <ExportControls
          handleExportCSV={handleExportCSV}
          handleExportJSON={handleExportJSON}
          handleExportSummary={handleExportSummary}
          clearLogs={clearLogs}
        />
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: ${
              isDarkMode ? "#374151" : "#e5e7eb"
            }; border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${
              isDarkMode ? "#4b5563" : "#d1d5db"
            }; }
          `,
        }}
      />
    </div>
  );
}