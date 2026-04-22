"use client";

import React, { useState, useMemo } from 'react';
import { Log, Meta } from '../types';
import { parseDate } from './audit/utils';

import SystemStatus from './audit/SystemStatus';
import AuditMetrics from './audit/AuditMetrics';
import ActivityDensity from './audit/ActivityDensity';
import LogFilters from './audit/LogFilters';
import LogTable from './audit/LogTable';
import ExportControls from './audit/ExportControls';

interface AuditProps {
  logs: Log[];
  meta: Meta;
  clearLogs: () => void;
  deleteLog: (id: string | number) => void;
}

export default function AuditView({ logs, meta, clearLogs, deleteLog }: AuditProps) {
  const [filterType, setFilterType] = useState<'all' | 'month' | 'year' | 'custom'>('all');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // --- 1. PERFORMANCE FIX: PRE-PARSE DATES ---
  const parsedLogs = useMemo(() => {
    return logs.map(log => ({
      ...log,
      parsedDate: parseDate(log.time)
    }));
  }, [logs]);

  // --- 2. FILTERED DATA ---
  const filteredLogs = useMemo(() => {
    return parsedLogs.filter(log => {
      if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
      if (filterType === 'all') return true;
      
      const date = log.parsedDate;
      if (!date) return true;

      const logYear = date.getFullYear();
      const logMonth = `${logYear}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const logDateStr = date.toISOString().split('T')[0];

      if (filterType === 'month') return logMonth === selectedMonth;
      if (filterType === 'year') return String(logYear) === selectedYear;
      if (filterType === 'custom') {
        if (!fromDate || !toDate) return true;
        return logDateStr >= fromDate && logDateStr <= toDate;
      }
      return true;
    });
  }, [parsedLogs, filterType, selectedMonth, selectedYear, fromDate, toDate, actionFilter]);

  // --- 3. ANALYTICS ENGINE ---
  const analytics = useMemo(() => {
    const actionCount: Record<string, number> = {};
    const dailyCount: Record<string, number> = {};
    const taskCount: Record<string, number> = {};
    const hourMap: Record<number, number> = {};
    
    // Tracking daily sub-metrics for delta calculations
    const dailyStats: Record<string, { productive: number, destructive: number, creates: number, edits: number }> = {};

    filteredLogs.forEach(log => {
      actionCount[log.action] = (actionCount[log.action] || 0) + 1;
      const date = log.parsedDate;
      if (date) {
        const day = date.toISOString().split('T')[0];
        dailyCount[day] = (dailyCount[day] || 0) + 1;
        
        if (!dailyStats[day]) dailyStats[day] = { productive: 0, destructive: 0, creates: 0, edits: 0 };
        if (log.action === 'TOGGLE' || log.action === 'COMPLETE') dailyStats[day].productive++;
        if (log.action === 'DELETE') dailyStats[day].destructive++;
        if (log.action === 'CREATE') dailyStats[day].creates++;
        if (log.action === 'UPDATE') dailyStats[day].edits++;

        const h = date.getHours();
        hourMap[h] = (hourMap[h] || 0) + 1;
      }
      if (log.name && log.name !== "User" && log.name !== "System") {
        taskCount[log.name] = (taskCount[log.name] || 0) + 1;
      }
    });

    const topTasks = Object.entries(taskCount).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const peakHourEntry = Object.entries(hourMap).sort((a, b) => b[1] - a[1])[0];
    const peakHour = peakHourEntry ? parseInt(peakHourEntry[0]) : null;

    // 🔥 DAILY DELTA ENGINE
    const sortedDates = Object.keys(dailyCount).sort();
    const dailyDeltas: number[] = sortedDates.map((date, i) => {
      const today = dailyCount[date] || 0;
      const prev = i > 0 ? dailyCount[sortedDates[i - 1]] || 0 : 0;
      return today - prev;
    });

    // 🔥 IMPROVED FOCUS SCORE (Productive vs Destructive)
    const totalProductive = (actionCount['TOGGLE'] || 0) + (actionCount['COMPLETE'] || 0);
    const totalDestructive = (actionCount['DELETE'] || 0);
    const focusScore = Math.round((totalProductive / (totalProductive + totalDestructive + 1)) * 100);

    // 🔥 IMPROVED INSTABILITY INDEX (Churn: Deletes + Edits / Creates)
    const totalDeletes = actionCount['DELETE'] || 0;
    const totalCreates = actionCount['CREATE'] || 1;
    const totalEdits = actionCount['UPDATE'] || 0;
    const instabilityIndex = Math.round(((totalDeletes + totalEdits) / (totalCreates + 1)) * 100);

    // 🔥 FOCUS & INSTABILITY DELTAS (Today vs Yesterday)
    let focusDelta = 0;
    let instabilityDelta = 0;

    if (sortedDates.length > 1) {
      const todayKey = sortedDates[sortedDates.length - 1];
      const yesterdayKey = sortedDates[sortedDates.length - 2];
      
      const t = dailyStats[todayKey];
      const y = dailyStats[yesterdayKey];

      const todayFocus = Math.round((t.productive / (t.productive + t.destructive + 1)) * 100);
      const yesterdayFocus = Math.round((y.productive / (y.productive + y.destructive + 1)) * 100);
      focusDelta = todayFocus - yesterdayFocus;

      const todayInstability = Math.round(((t.destructive + t.edits) / (t.creates + 1)) * 100);
      const yesterdayInstability = Math.round(((y.destructive + y.edits) / (y.creates + 1)) * 100);
      instabilityDelta = todayInstability - yesterdayInstability;
    }

    const weakHours = Object.entries(hourMap)
      .filter(([_, v]) => v < 2)
      .map(([h]) => h);

    return { 
      actionCount, 
      topTasks, 
      focusScore, 
      focusDelta,
      instabilityIndex, 
      instabilityDelta,
      peakHour,
      hourMap,
      weakHours,
      lastDelta: dailyDeltas.length > 0 ? dailyDeltas[dailyDeltas.length - 1] : 0
    };
  }, [filteredLogs]);

  // --- 4. EXPORT ENGINE ---
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return alert("No data to export");
    const headers = ["ID", "Time", "Action", "Objective", "Detail"];
    const rows = filteredLogs.map(log => [
      log.id || '',
      new Date(log.time).toLocaleString(),
      log.action,
      `"${log.name.replace(/"/g, '""')}"`,
      `"${log.detail.replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `NexEngine_Audit_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleExportJSON = () => {
    if (filteredLogs.length === 0) return alert("No data to export");
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `NexEngine_Logs_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleExportSummary = () => {
    if (filteredLogs.length === 0) return alert("No data to export");
    const summary = {
      exportedAt: new Date().toISOString(),
      trend: analytics.lastDelta > 0 ? "Improving" : analytics.lastDelta < 0 ? "Dropping" : "Stable",
      totalEvents: filteredLogs.length,
      focusScore: `${analytics.focusScore}%`,
      instabilityIndex: `${analytics.instabilityIndex}%`,
      peakHour: analytics.peakHour !== null ? `${analytics.peakHour}:00` : "N/A",
      eventDistribution: analytics.actionCount,
      topTasks: Object.fromEntries(analytics.topTasks)
    };
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `NexEngine_Summary_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // 🔥 AUDIT ALERT ENGINE
  const auditAlert =
    analytics.lastDelta < 0
      ? "Recent activity decline detected"
      : analytics.instabilityIndex > 60
      ? "High instability in task behavior"
      : null;

  return (
    <div className="w-full min-h-screen flex flex-col p-4 md:p-8 bg-[#F9FAFB] text-gray-900 font-sans pb-24">
      <div className="max-w-[1500px] mx-auto w-full flex flex-col gap-6">

        {/* AUDIT ALERT */}
        {auditAlert && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-bold p-4 rounded-xl shadow-sm animate-in fade-in">
            ⚠️ {auditAlert}
          </div>
        )}

        <SystemStatus 
          focusScore={analytics.focusScore} 
          instabilityIndex={analytics.instabilityIndex} 
          trend={analytics.lastDelta} 
        />

        <AuditMetrics 
          focusScore={analytics.focusScore}
          focusDelta={analytics.focusDelta}
          instabilityIndex={analytics.instabilityIndex}
          instabilityDelta={analytics.instabilityDelta}
          peakHour={analytics.peakHour}
          topTasks={analytics.topTasks}
        />

        <ActivityDensity 
          hourMap={analytics.hourMap} 
          peakHour={analytics.peakHour} 
          weakHours={analytics.weakHours} 
        />

        <LogFilters 
          filterType={filterType} setFilterType={setFilterType}
          actionFilter={actionFilter} setActionFilter={setActionFilter}
          selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear} setSelectedYear={setSelectedYear}
          fromDate={fromDate} setFromDate={setFromDate}
          toDate={toDate} setToDate={setToDate}
        />

        <LogTable 
          filteredLogs={filteredLogs} 
          deleteLog={deleteLog} 
          resetFilters={() => { setFilterType('all'); setActionFilter('ALL'); }}
        />

        <ExportControls 
          handleExportCSV={handleExportCSV}
          handleExportJSON={handleExportJSON}
          handleExportSummary={handleExportSummary}
          clearLogs={clearLogs}
        />

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
      `}} />
    </div>
  );
}