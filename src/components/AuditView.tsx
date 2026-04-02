"use client";

import React, { useState, useMemo } from 'react';
import { Log, Meta } from '../types';
import { 
  Trash2, FileSpreadsheet, AlertCircle, 
  Trash, Filter, XCircle, Activity, Zap, 
  Clock, BarChart3, BrainCircuit 
} from 'lucide-react';

interface AuditProps {
  logs: Log[];
  meta: Meta;
  clearLogs: () => void;
  deleteLog: (id: string | number) => void;
}

export default function AuditView({ logs, meta, clearLogs, deleteLog }: AuditProps) {
  const [filterType, setFilterType] = useState<'all' | 'month' | 'year' | 'custom'>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  // --- 1. SAFE DATE PARSING ---
  const parseDate = (time: string) => {
    const d = new Date(time);
    return isNaN(d.getTime()) ? null : d;
  };

  // --- 2. FILTERED DATA (The Source of Truth) ---
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
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
  }, [logs, filterType, selectedMonth, selectedYear, fromDate, toDate]);

  // --- 3. EXPORT ENGINE (CSV GENERATOR) ---
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return alert("No data to export");

    // Define Headers
    const headers = ["ID", "Time", "Action", "Objective", "Detail"];
    
    // Transform rows
    const rows = filteredLogs.map(log => [
      log.id || '',
      new Date(log.time).toLocaleString(),
      log.action,
      `"${log.name.replace(/"/g, '""')}"`, // Escape quotes for CSV safety
      `"${log.detail.replace(/"/g, '""')}"`
    ]);

    // Combine into CSV string
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Create Download Link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `NexTask_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 4. ANALYTICS ENGINE ---
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

    const getInsight = () => {
      if (filteredLogs.length === 0) return "Awaiting system activity data...";
      if (instabilityIndex > 50) return "High volatility: Frequent task deletion detected.";
      if (focusScore > 60) return "Deep focus: High ratio of task completions.";
      return "Stable system workflow observed.";
    };

    return { 
      actionCount, topTasks, focusScore, 
      instabilityIndex, peakHour: peakHourEntry ? peakHourEntry[0] : '--',
      insight: getInsight()
    };
  }, [filteredLogs]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLogs.length && filteredLogs.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLogs.map((log, i) => log.id || `${log.time}-${i}`)));
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col p-8 bg-[#fcfcfc] text-slate-900 font-sans">
      
      {/* HEADER & INSIGHT LINE */}
      <div className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div>
          <div className="flex flex-row items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-slate-900 rounded-xl text-white shadow-lg">
              <BrainCircuit size={22} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 m-0">NexEngine Intel</h1>
          </div>
          <div className="flex items-center gap-2 mt-3 ml-[52px]">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <p className="text-sm font-bold text-indigo-600 italic tracking-tight">{analytics.insight}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* FIXED EXPORT BUTTON */}
          <button 
            onClick={handleExportCSV} 
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-white border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-95 transition-all text-slate-600 uppercase shadow-sm"
          >
            <FileSpreadsheet size={16} /> Export CSV
          </button>
          
          {selectedIds.size > 0 && (
            <button onClick={() => {}} className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-100 active:scale-95 transition-all">
              <Trash size={16} /> Purge ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {/* INTELLIGENCE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Zap size={18} /></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</span>
          </div>
          <h4 className="text-4xl font-black text-slate-900">{analytics.focusScore}%</h4>
          <p className="text-[11px] text-slate-500 font-bold mt-1">Focus Score</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><Activity size={18} /></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stability</span>
          </div>
          <h4 className="text-4xl font-black text-slate-900">{analytics.instabilityIndex}%</h4>
          <p className="text-[11px] text-slate-500 font-bold mt-1">Volatility</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Clock size={18} /></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peak Time</span>
          </div>
          <h4 className="text-4xl font-black text-slate-900 uppercase">
            {analytics.peakHour !== '--' ? `${analytics.peakHour}:00` : '--'}
          </h4>
          <p className="text-[11px] text-slate-500 font-bold mt-1">Active Hour</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm">
           <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-slate-400" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top Tasks</h3>
          </div>
          <div className="space-y-2">
            {analytics.topTasks.map(([name, count]) => (
              <div key={name} className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-slate-700 truncate max-w-[130px]">{name}</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-full font-mono text-slate-500">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="mb-6 flex flex-wrap items-center gap-4 p-4 border border-slate-200 rounded-2xl bg-white shadow-sm">
        <Filter size={16} className="text-slate-400" />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="bg-white border border-slate-200 text-slate-900 text-sm px-3 py-2 rounded-xl outline-none cursor-pointer">
          <option value="all">Full Audit Stream</option>
          <option value="month">Monthly Analysis</option>
          <option value="year">Yearly Audit</option>
          <option value="custom">Range Select</option>
        </select>

        {filterType === 'month' && <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="border border-slate-200 text-sm px-3 py-2 rounded-xl" />}
        {filterType === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border border-slate-200 text-sm px-3 py-2 rounded-xl" />
            <span className="text-slate-400">to</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border border-slate-200 text-sm px-3 py-2 rounded-xl" />
          </div>
        )}
        {filterType !== 'all' && <button onClick={() => setFilterType('all')} className="ml-auto text-slate-400 hover:text-rose-600"><XCircle size={20} /></button>}
      </div>

      {/* LOG TABLE */}
      <div className="w-full flex-1 border border-slate-200 rounded-[24px] overflow-hidden bg-white shadow-sm flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-20 border-b border-slate-200">
              <tr>
                <th className="p-5 w-14 text-center">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-slate-900 cursor-pointer" checked={filteredLogs.length > 0 && selectedIds.size === filteredLogs.length} onChange={toggleSelectAll} />
                </th>
                <th className="p-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                <th className="p-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Event</th>
                <th className="p-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Objective</th>
                <th className="p-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Payload</th>
                <th className="p-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, index) => {
                  const rowId = log.id || `${log.time}-${index}`;
                  const isSelected = selectedIds.has(rowId);
                  return (
                    <tr key={rowId} className={`group transition-all ${isSelected ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}>
                      <td className="p-5 text-center"><input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-slate-900 cursor-pointer" checked={isSelected} onChange={() => setSelectedIds(prev => {
                        const next = new Set(prev);
                        next.has(rowId) ? next.delete(rowId) : next.add(rowId);
                        return next;
                      })} /></td>
                      <td className="p-5 text-xs font-mono text-slate-400">{new Date(log.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                      <td className="p-5"><span className="px-2 py-1 rounded-lg border border-slate-100 bg-slate-50 text-[9px] font-black uppercase text-slate-600">{log.action}</span></td>
                      <td className="p-5 text-sm font-bold text-slate-800">{log.name}</td>
                      <td className="p-5 text-xs text-slate-500 font-medium max-w-sm">{log.detail}</td>
                      <td className="p-5 text-right"><button onClick={() => deleteLog(rowId)} className="p-2 text-slate-300 hover:text-rose-600"><Trash2 size={18} /></button></td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={32} className="text-slate-200" />
                      <p className="text-sm font-bold text-slate-400">No activity matching your current filters.</p>
                      <button onClick={() => setFilterType('all')} className="text-xs text-indigo-600 font-bold hover:underline">Reset Filters</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Engine: v12.6.4</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredLogs.length} Events Filtered</span>
        </div>
      </div>
    </div>
  );
}