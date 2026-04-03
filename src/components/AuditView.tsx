"use client";

import React, { useState, useMemo } from 'react';
import { Log, Meta } from '../types';
import { 
  Trash2, FileSpreadsheet, AlertCircle, 
  Filter, XCircle, Activity, Zap, 
  Clock, BarChart3, BrainCircuit, FileJson, FileText, AlertTriangle
} from 'lucide-react';

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

  // --- 1. SAFE DATE PARSING ---
  const parseDate = (time: string) => {
    const d = new Date(time);
    return isNaN(d.getTime()) ? null : d;
  };

  // --- 2. FILTERED DATA (The Source of Truth) ---
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Action Filter
      if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;

      // Temporal Filter
      if (filterType === 'all') return true;
      const date = parseDate(log.time);
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
  }, [logs, filterType, selectedMonth, selectedYear, fromDate, toDate, actionFilter]);

  // --- 3. ANALYTICS ENGINE ---
  const analytics = useMemo(() => {
    const actionCount: Record<string, number> = {};
    const dailyCount: Record<string, number> = {};
    const taskCount: Record<string, number> = {};
    const hourMap: Record<number, number> = {};

    filteredLogs.forEach(log => {
      actionCount[log.action] = (actionCount[log.action] || 0) + 1;
      const date = parseDate(log.time);
      if (date) {
        const day = date.toISOString().split('T')[0];
        dailyCount[day] = (dailyCount[day] || 0) + 1;
        const h = date.getHours();
        hourMap[h] = (hourMap[h] || 0) + 1;
      }
      if (log.name && log.name !== "User" && log.name !== "System") {
        taskCount[log.name] = (taskCount[log.name] || 0) + 1;
      }
    });

    const topTasks = Object.entries(taskCount).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const peakHourEntry = Object.entries(hourMap).sort((a, b) => b[1] - a[1])[0];
    
    const totalToggles = actionCount['TOGGLE'] || 0;
    const focusScore = Math.round((totalToggles / (filteredLogs.length || 1)) * 100);
    const deletes = actionCount['DELETE'] || 0;
    const creates = actionCount['CREATE'] || 1;
    const instabilityIndex = Math.round((deletes / creates) * 100);

    return { 
      actionCount, topTasks, focusScore, 
      instabilityIndex, peakHour: peakHourEntry ? parseInt(peakHourEntry[0]) : null,
      hourMap
    };
  }, [filteredLogs]);

  // --- 4. EXPORT ENGINE (CSV, JSON, SUMMARY) ---
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
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `NexEngine_Audit_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleExportJSON = () => {
    if (filteredLogs.length === 0) return alert("No data to export");
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `NexEngine_Logs_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleExportSummary = () => {
    if (filteredLogs.length === 0) return alert("No data to export");
    const summary = {
      exportedAt: new Date().toISOString(),
      totalEvents: filteredLogs.length,
      focusScore: `${analytics.focusScore}%`,
      instabilityIndex: `${analytics.instabilityIndex}%`,
      peakHour: analytics.peakHour !== null ? `${analytics.peakHour}:00` : "N/A",
      eventDistribution: analytics.actionCount,
      topTasks: Object.fromEntries(analytics.topTasks)
    };
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `NexEngine_Summary_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const maxHourActivity = Math.max(...Object.values(analytics.hourMap), 1);

  return (
    <div className="w-full min-h-screen flex flex-col p-4 md:p-8 bg-[#F9FAFB] text-gray-900 font-sans pb-24">
      
      <div className="max-w-[1500px] mx-auto w-full flex flex-col gap-6">

        {/* 1. SYSTEM STATUS STRIP */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full shadow-inner ${
              analytics.focusScore > 60 ? 'bg-green-500' :
              analytics.instabilityIndex > 50 ? 'bg-red-500' :
              'bg-orange-500'
            }`} />
            <span className="text-sm font-semibold text-gray-700">
              {analytics.focusScore > 60
                ? "Execution Stable"
                : analytics.instabilityIndex > 50
                ? "System Volatile"
                : "Moderate Activity"}
            </span>
          </div>
          <span className="text-xs text-gray-400 font-medium tracking-wide">
            Live Audit
          </span>
        </div>

        {/* 2. ALERT / RISK SIGNAL */}
        {analytics.instabilityIndex > 50 && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm font-medium flex items-center gap-3 shadow-sm">
            <AlertTriangle size={18} /> High deletion activity — unstable workflow detected
          </div>
        )}

        {/* HEADER */}
        <div className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mt-2">
          <div className="flex flex-row items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-orange-500 rounded-xl text-white shadow-sm">
              <BrainCircuit size={22} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800 m-0">NexEngine Intel</h1>
              <p className="text-xs text-gray-400 mt-0.5">Behavior Analytics</p>
            </div>
          </div>
        </div>

        {/* 3. INTELLIGENCE METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-[20px] p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-green-50 text-green-600 rounded-xl"><Zap size={16} /></div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Efficiency</span>
            </div>
            <h4 className="text-2xl font-semibold text-gray-800">{analytics.focusScore}%</h4>
            <p className="text-xs text-gray-400 mt-1">Focus Score</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-[20px] p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-red-50 text-red-600 rounded-xl"><Activity size={16} /></div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Stability</span>
            </div>
            <h4 className="text-2xl font-semibold text-gray-800">{analytics.instabilityIndex}%</h4>
            <p className="text-xs text-gray-400 mt-1">Volatility</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-[20px] p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-orange-50 text-orange-500 rounded-xl"><Clock size={16} /></div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Peak Time</span>
            </div>
            <h4 className="text-2xl font-semibold text-gray-800 uppercase">
              {analytics.peakHour !== null ? `${analytics.peakHour}:00` : '--'}
            </h4>
            <p className="text-xs text-gray-400 mt-1">Active Hour</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-[20px] p-6 shadow-sm">
             <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={16} className="text-gray-400" />
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Top Tasks</h3>
            </div>
            <div className="space-y-3 mt-1">
              {analytics.topTasks.map(([name, count]) => (
                <div key={name} className="flex justify-between items-center text-[13px]">
                  <span className="font-medium text-gray-700 truncate max-w-[130px]">{name}</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-500">{count}</span>
                </div>
              ))}
              {analytics.topTasks.length === 0 && (
                <span className="text-xs text-gray-400">No task data</span>
              )}
            </div>
          </div>
        </div>

        {/* 4. TIMELINE INTENSITY & SESSION CLUSTERING */}
        <div className="bg-white border border-gray-200 rounded-[20px] p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Activity Density (24h)</span>
            <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded font-medium">Session Clustering</span>
          </div>
          <div className="flex items-end gap-1 mt-2 h-16 w-full">
            {Array.from({length: 24}).map((_, i) => {
              const count = analytics.hourMap[i] || 0;
              const height = count === 0 ? 0 : (count / maxHourActivity) * 100;
              return (
                <div 
                  key={i} 
                  title={`${i}:00 - ${count} events`}
                  className="flex-1 bg-orange-400 rounded-t-sm transition-all hover:bg-orange-500" 
                  style={{ height: `${height}%`, opacity: count ? 1 : 0.1 }} 
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 font-medium tracking-wide mt-2">
            <span>00:00</span>
            <span>12:00</span>
            <span>23:59</span>
          </div>
        </div>

        {/* 5. FILTER BAR */}
        <div className="flex flex-wrap items-center gap-4 p-4 border border-gray-200 rounded-[16px] bg-white shadow-sm">
          <Filter size={16} className="text-gray-400" />
          
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium px-3 py-2 rounded-lg outline-none cursor-pointer focus:border-orange-400">
            <option value="all">Full Audit Stream</option>
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
            <option value="custom">Range</option>
          </select>

          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium px-3 py-2 rounded-lg outline-none cursor-pointer focus:border-orange-400">
            <option value="ALL">All Events</option>
            <option value="TOGGLE">Toggle</option>
            <option value="CREATE">Create</option>
            <option value="DELETE">Delete</option>
            <option value="LOCK">Lock</option>
          </select>

          {filterType === 'month' && <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-gray-50 border border-gray-200 text-xs px-3 py-2 rounded-lg outline-none focus:border-orange-400" />}
          {filterType === 'custom' && (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-1">
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="bg-transparent text-xs px-2 py-1 outline-none text-gray-700" />
              <span className="text-gray-400 font-medium">→</span>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="bg-transparent text-xs px-2 py-1 outline-none text-gray-700" />
            </div>
          )}
          {(filterType !== 'all' || actionFilter !== 'ALL') && (
            <button onClick={() => { setFilterType('all'); setActionFilter('ALL'); }} className="ml-auto text-gray-400 hover:text-red-500 transition-colors">
              <XCircle size={20} />
            </button>
          )}
        </div>

        {/* 6. LOG TABLE */}
        <div className="w-full border border-gray-200 rounded-[20px] overflow-hidden bg-white shadow-sm flex flex-col max-h-[600px]">
          <div className="overflow-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-20 border-b border-gray-200">
                <tr>
                  <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wide w-12 text-center">Sr.No</th>
                  <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Time</th>
                  <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Event</th>
                  <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Objective</th>
                  <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Payload</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log, index) => {
                    const rowId = log.id || `${log.time}-${index}`;
                    return (
                      <tr key={rowId} className="group transition-colors hover:bg-gray-50">
                        <td className="p-4 text-xs font-medium text-gray-500 text-center">
                          {filteredLogs.length - index}
                        </td>
                        <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(log.time).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wide ${
                            log.action === 'DELETE' ? 'bg-red-50 text-red-600' :
                            log.action === 'CREATE' ? 'bg-green-50 text-green-600' :
                            'bg-orange-50 text-orange-600'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 text-sm font-medium text-gray-700 max-w-[200px] truncate" title={log.name}>{log.name}</td>
                        <td className="p-4 text-xs text-gray-500 max-w-sm truncate" title={log.detail}>{log.detail}</td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => {
                              if (confirm("Delete this log entry?")) {
                                deleteLog(rowId);
                              }
                            }} 
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-24 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <AlertCircle size={32} className="text-gray-300" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">No events recorded in selected range</p>
                          <p className="text-xs text-gray-400 mt-1">Adjust filters or continue activity</p>
                        </div>
                        <button onClick={() => { setFilterType('all'); setActionFilter('ALL'); }} className="mt-2 text-xs text-orange-500 font-medium hover:underline">Reset Filters</button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Active Engine: v12.6.4</span>
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{filteredLogs.length} Events Listed</span>
          </div>
        </div>

        {/* 7. EXPORT OPTIONS & CLEAR ALL */}
        <div className="flex flex-wrap items-center justify-between mt-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-gray-500 mr-2">Export Data:</span>
            
            <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:scale-95 transition-all text-gray-700 shadow-sm">
              <FileSpreadsheet size={14} className="text-green-600" /> CSV
            </button>
            
            <button onClick={handleExportJSON} className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:scale-95 transition-all text-gray-700 shadow-sm">
              <FileJson size={14} className="text-orange-500" /> JSON Logs
            </button>
            
            <button onClick={handleExportSummary} className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:scale-95 transition-all text-gray-700 shadow-sm">
              <FileText size={14} className="text-orange-500" /> Executive Summary
            </button>
          </div>

          <button 
            onClick={() => {
              if (confirm("Delete ALL audit logs? This cannot be undone.")) {
                clearLogs();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 text-red-600 shadow-sm transition-colors"
          >
            <Trash2 size={14} /> Clear All Logs
          </button>
        </div>

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