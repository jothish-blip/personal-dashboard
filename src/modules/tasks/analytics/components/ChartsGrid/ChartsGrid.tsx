"use client";

import React, { useMemo, useState } from 'react';
import { useTheme } from "@/theme/ThemeProvider";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  PointElement, LineElement, Filler, RadialLinearScale, RadarController, ScatterController, 
  BubbleController, BarController, LineController, DoughnutController, ArcElement
} from 'chart.js';
import type { ScriptableLineSegmentContext } from 'chart.js'; // FIX APPLIED
import { Line, Bar, Scatter, Bubble, Chart, Radar } from 'react-chartjs-2';

import { ExtendedFilteredData } from '../../AnalyticsView';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  PointElement, LineElement, Filler, RadialLinearScale, RadarController, ScatterController, 
  BubbleController, BarController, LineController, DoughnutController, ArcElement
);

interface ChartsGridProps {
  data: ExtendedFilteredData;
  targetGoal: number;
  setTargetGoal: (val: number) => void;
  isLoading: boolean;
}

export default function ChartsGrid({ data, targetGoal, setTargetGoal, isLoading }: ChartsGridProps) {
  const { isDarkMode } = useTheme(); 
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('NexSpace');
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  
  const textPrimary = isDarkMode ? "#ffffff" : "#111827";
  const textMuted = isDarkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const gridColor = isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';

  // Calculate Pace and Projections for Hero & Combo Charts
  const { cumulativeActual, dailyPaceLine, projectionLine } = useMemo(() => {
    const timelineLabels = data.timelineLabels || [];
    const safeGoal = Math.max(targetGoal || 1, 1);
    
    // Daily Target Array
    const dailyTarget = timelineLabels.length > 0 ? safeGoal / timelineLabels.length : 0;
    const dailyPaceArray = timelineLabels.map((_, i) => Math.round((i + 1) * dailyTarget));

    const actual = data.cumulativeActual || [];
    const projection = Array(timelineLabels.length).fill(null);
    
    // Splice projection from end of actual data to end of period
    if (actual.length > 0) {
      const lastActualIdx = actual.length - 1;
      projection[lastActualIdx] = actual[lastActualIdx];
      projection[timelineLabels.length - 1] = data.stats.projectedTotal;
    }

    return { 
      cumulativeActual: actual, 
      dailyPaceLine: dailyPaceArray,
      projectionLine: projection 
    };
  }, [data, targetGoal]);

  const baseChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: { 
      legend: { display: false }, 
      tooltip: { 
        backgroundColor: isDarkMode ? '#050505' : '#ffffff', 
        titleColor: isDarkMode ? '#ffffff' : '#111827', 
        bodyColor: isDarkMode ? '#a1a1aa' : '#4b5563', 
        borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', 
        borderWidth: 1, padding: 12, boxPadding: 6,
      } 
    },
    scales: { 
      y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textMuted, font: { size: 10 } } }, 
      x: { grid: { display: false }, ticks: { color: textMuted, font: { size: 10 } } } 
    }
  };

  const getCardClass = (glowType: 'orange' | 'purple' | 'blue' | 'green' | 'pink' | 'none' = 'none') => {
    const base = `relative border p-6 rounded-[1.7rem] flex flex-col transition-all duration-300 group ${
      isDarkMode 
        ? "bg-black/[0.72] border-white/[0.05] shadow-[0_14px_40px_rgba(0,0,0,0.18)]" 
        : "bg-white/[0.75] border-black/[0.04] shadow-[0_14px_40px_rgba(0,0,0,0.06)]"
    }`;
    if (glowType === 'none') return base;
    const glowMap = {
      orange: isDarkMode ? "hover:shadow-[0_0_20px_rgba(249,115,22,0.1)]" : "hover:shadow-[0_0_20px_rgba(249,115,22,0.15)]",
      purple: isDarkMode ? "hover:shadow-[0_0_20px_rgba(168,85,247,0.1)]" : "hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]",
      blue:   isDarkMode ? "hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]" : "hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]",
      green:  isDarkMode ? "hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]" : "hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]",
      pink:   isDarkMode ? "hover:shadow-[0_0_20px_rgba(236,72,153,0.1)]" : "hover:shadow-[0_0_20px_rgba(236,72,153,0.15)]",
    };
    return `${base} ${glowMap[glowType]}`;
  };

  const renderEmptyState = () => (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-6 bg-[var(--background)]/50 backdrop-blur-[6px] rounded-[1.7rem]">
      <p className={`text-sm font-semibold mb-1 ${textPrimary}`}>No activity yet</p>
      <p className={`text-xs ${textMuted}`}>Complete your first task to unlock analytics.</p>
    </div>
  );

  const hasData = data.stats.totalCompletions > 0;

  // Reusable Header Component with Insight Chips
  const CardHeader = ({ title, subtitle, chips, chartId }: { title: string, subtitle: string, chips: {label: string, color?: string}[], chartId: string }) => (
    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
      <div>
        <h3 className={`text-[15px] font-semibold tracking-[-0.02em] ${isDarkMode ? "text-white" : "text-slate-900"}`}>{title}</h3>
        <p className={`text-[11px] mt-1 ${textMuted}`}>{subtitle}</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {chips.map((c, i) => (
          <span key={i} className={`px-2.5 py-1 rounded-[0.5rem] text-[10px] font-bold tracking-wide uppercase ${
            c.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' :
            c.color === 'rose' ? 'bg-rose-500/10 text-rose-500' :
            c.color === 'purple' ? 'bg-purple-500/10 text-purple-500' :
            isDarkMode ? 'bg-white/5 text-white/70' : 'bg-black/5 text-slate-600'
          }`}>
            {c.label}
          </span>
        ))}
        {chartId !== 'none' && (
          <button onClick={() => setExpandedChart(chartId)} className={`ml-2 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-all ${isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-black'}`}>
            ⤢
          </button>
        )}
      </div>
    </div>
  );

  // Define Chart Contents for reuse in Grid and Modal
  const renderChart = (id: string) => {
    switch(id) {
      case 'velocity':
        return (
          <Line 
            data={{
              labels: data.timelineLabels,
              datasets: [
                {
                  label: 'Actual', 
                  data: hasData ? cumulativeActual : data.timelineLabels.map(() => 0), 
                  borderColor: '#f97316', 
                  backgroundColor: isDarkMode ? 'rgba(249, 115, 22, 0.15)' : 'rgba(249, 115, 22, 0.1)',
                  borderWidth: 3, tension: 0.3, pointRadius: 0, fill: true
                },
                {
                  label: 'Projection',
                  data: hasData ? projectionLine : [],
                  borderColor: '#f97316',
                  borderWidth: 2, borderDash: [4, 4], pointRadius: 4, pointBackgroundColor: '#f97316', tension: 0
                },
                {
                  label: 'Target Pace',
                  data: hasData ? dailyPaceLine : [],
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                  borderWidth: 2, borderDash: [5, 5], pointRadius: 0, fill: false
                }
              ]
            }}
            options={baseChartOptions as any}
          />
        );
      case 'momentum':
        return (
          <Line 
            data={{
              labels: data.timelineLabels,
              datasets: [{
                label: 'Delta', 
                data: hasData ? data.dailyDeltas : data.timelineLabels.map(() => 0), 
                borderWidth: 2, pointRadius: 0, tension: 0.4,
                fill: { target: 'origin', above: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)', below: isDarkMode ? 'rgba(244, 63, 94, 0.15)' : 'rgba(244, 63, 94, 0.1)' },
                segment: {
                  borderColor: (ctx: ScriptableLineSegmentContext) => {
                    const y = ctx.p1.parsed.y ?? 0;
                    return y >= 0 ? "#10b981" : "#f43f5e";
                  }
                }
              }]
            }}
            options={{...baseChartOptions, scales: { ...baseChartOptions.scales, y: { ...baseChartOptions.scales.y, grid: { color: (ctx: any) => ctx.tick.value === 0 ? gridColor : 'transparent' } } } } as any}
          />
        );
      case 'quadrant':
        return (
          <Scatter
            data={{
              datasets: hasData ? data.quadrantData.map(q => ({
                label: q.label,
                data: [{ x: q.x, y: q.y }],
                backgroundColor: q.color,
                pointRadius: 6, pointHoverRadius: 8
              })) : []
            }}
            options={{
              ...baseChartOptions,
              plugins: { ...baseChartOptions.plugins, legend: { display: false } },
              scales: {
                x: { title: { display: true, text: 'Active Days (Consistency)', color: textMuted }, grid: { color: gridColor }, ticks: { color: textMuted } },
                y: { title: { display: true, text: 'Total Volume (Output)', color: textMuted }, grid: { color: gridColor }, ticks: { color: textMuted } }
              }
            } as any}
          />
        );
      case 'bubble':
        return (
          <Bubble
            data={{
              datasets: hasData ? data.bubbleData.map(b => ({
                label: b.label,
                data: [{ x: b.x, y: b.y, r: b.r }],
                backgroundColor: b.color + '99',
                borderColor: b.color,
                borderWidth: 1
              })) : []
            }}
            options={{
              ...baseChartOptions,
              plugins: { 
                ...baseChartOptions.plugins,
                tooltip: {
                  ...baseChartOptions.plugins.tooltip,
                  callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${ctx.raw.y} Output (${Math.round(ctx.raw.x)}% Consistency)` }
                }
              },
              scales: {
                x: { title: { display: true, text: 'Consistency (%)', color: textMuted }, grid: { color: gridColor }, ticks: { color: textMuted } },
                y: { title: { display: true, text: 'Output Volume', color: textMuted }, grid: { color: gridColor }, ticks: { color: textMuted } }
              }
            } as any}
          />
        );
      case 'histogram':
        return (
          <Bar 
            data={{
              labels: hasData ? data.histogramData.labels : [0, 1, 2, 3, 4],
              datasets: [{
                label: 'Days', 
                data: hasData ? data.histogramData.values : [0, 0, 0, 0, 0],
                backgroundColor: isDarkMode ? '#ec4899' : '#db2777',
                borderRadius: 4, barPercentage: 1.0, categoryPercentage: 0.95
              }]
            }}
            options={{
              ...baseChartOptions,
              scales: {
                x: { title: { display: true, text: 'Daily Completions', color: textMuted }, grid: { display: false }, ticks: { color: textMuted } },
                y: { title: { display: true, text: 'Number of Days', color: textMuted }, grid: { color: gridColor }, ticks: { color: textMuted, stepSize: 1 } }
              }
            } as any}
          />
        );
      default: return null;
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans mt-2 relative">
      
      {/* Full-Screen Modal */}
      {expandedChart && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md p-4 md:p-12 flex flex-col animate-in fade-in duration-200">
          <div className={`flex-1 relative border rounded-2xl flex flex-col p-6 md:p-10 ${isDarkMode ? "bg-[#0a0a0a] border-white/10" : "bg-white border-black/10"}`}>
            <button onClick={() => setExpandedChart(null)} className={`absolute top-4 right-4 md:top-8 md:right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold transition-all z-10`}>
              ✕
            </button>
            <div className="flex-1 w-full relative">
              {renderChart(expandedChart)}
            </div>
          </div>
        </div>
      )}

      {/* HERO CHART: Execution Velocity (Always visible) */}
      <div className={`${getCardClass('orange')} min-h-[260px] md:min-h-[380px]`}>
        {isLoading && <div className="absolute inset-0 z-20 bg-[var(--background)] animate-pulse rounded-[1.7rem]" />}
        <CardHeader 
          title="Execution Velocity" 
          subtitle="Your cumulative output over time reacting to target pace." 
          chartId="velocity"
          chips={[
            { label: data.stats.paceStatus, color: data.stats.paceStatus.includes('Ahead') ? 'emerald' : 'rose' },
            { label: `Projected: ${data.stats.projectedTotal}` },
            { label: `Goal: ${targetGoal}` }
          ]} 
        />
        <div className="flex-1 relative">
          {!hasData && renderEmptyState()}
          {renderChart('velocity')}
        </div>
        {/* Goal Editor Overlay */}
        <div className="absolute top-6 right-16 z-10">
          {isEditingGoal ? (
            <input type="number" autoFocus value={targetGoal} onChange={(e) => setTargetGoal(Number(e.target.value))} onBlur={() => setIsEditingGoal(false)} onKeyDown={(e) => e.key === 'Enter' && setIsEditingGoal(false)} className="w-16 bg-[var(--background)] border rounded px-2 py-1 text-xs text-center outline-none" />
          ) : (
            <button onClick={() => setIsEditingGoal(true)} className={`text-[10px] uppercase font-bold tracking-wide px-3 py-1.5 rounded-lg border opacity-50 hover:opacity-100 transition-opacity ${isDarkMode ? "border-white/20" : "border-black/20"}`}>Edit Target</button>
          )}
        </div>
      </div>

      {/* --- ENTERPRISE TABS (Sticky & Snap Scrolling) --- */}
      <div className="sticky top-0 z-20 bg-[var(--background)]/90 backdrop-blur-md py-4 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex overflow-x-auto snap-x hide-scrollbar gap-2 w-full">
          {['NexSpace Insights', 'Performance', 'Focus', 'Advanced'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`snap-start shrink-0 px-5 py-2 rounded-full text-[13px] font-medium transition-all ${
                activeTab === tab 
                  ? "bg-orange-500 text-white shadow-[0_4px_14px_rgba(249,115,22,0.3)]" 
                  : (isDarkMode ? "bg-white/[0.04] text-white/60 hover:bg-white/[0.08]" : "bg-black/[0.03] text-slate-600 hover:bg-black/[0.06]")
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* --- TAB CONTENT SECTIONS --- */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
           <div className={`h-[340px] rounded-[1.7rem] ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />
           <div className={`h-[340px] rounded-[1.7rem] ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />
        </div>
      ) : (
        <>
          {/* NEXSPACE TAB (The "Damn" Moment) */}
          {activeTab === 'NexSpace' && (
            <div className="flex flex-col gap-5 md:gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className={`${getCardClass('purple')} min-h-[260px] md:min-h-[340px] border-purple-500/20`}>
                 <CardHeader 
                   title="Life Operating System" 
                   subtitle="Who you became this period through your habits and work." 
                   chartId="none"
                   chips={[
                     { label: `Dominant: ${data.nexspace.topDNA}`, color: 'purple' },
                     { label: `Trajectory: ${data.nexspace.trajectory}` }
                   ]} 
                 />
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1">
                    <div className="flex flex-col justify-center space-y-4">
                       <div className="mb-4">
                         <div className={`text-3xl font-bold ${textPrimary}`}>{data.nexspace.deepWorkScore}<span className="text-sm opacity-50 font-normal">/100</span></div>
                         <div className={`text-xs font-medium uppercase tracking-widest mt-1 ${textMuted}`}>Deep Work Score</div>
                       </div>
                       <div className="mt-4">
                         <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${textMuted}`}>System Progression</p>
                         <div className="flex items-center gap-3">
                           <span className={`text-sm font-bold ${textPrimary}`}>Lvl {data.dopamine.level}</span>
                           <div className={`h-1.5 flex-1 rounded-full overflow-hidden ${isDarkMode ? "bg-white/[0.1]" : "bg-black/[0.1]"}`}>
                             <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${data.dopamine.levelProgress}%` }} />
                           </div>
                         </div>
                       </div>
                    </div>

                    {/* Execution DNA Radar */}
                    <div className="relative md:col-span-1 h-[200px] md:h-full flex items-center justify-center">
                      {!hasData && renderEmptyState()}
                      <Radar
                        data={{
                          labels: data.nexspace.executionDna.labels,
                          datasets: [{
                            label: 'DNA',
                            data: hasData ? data.nexspace.executionDna.data : [20,20,20,20,20],
                            backgroundColor: 'rgba(168, 85, 247, 0.2)',
                            borderColor: '#a855f7',
                            borderWidth: 2,
                            pointBackgroundColor: '#a855f7',
                            pointBorderColor: '#fff',
                            pointHoverBackgroundColor: '#fff',
                            pointHoverBorderColor: '#a855f7'
                          }]
                        }}
                        options={{
                          maintainAspectRatio: false,
                          scales: {
                            r: {
                              ticks: { display: false },
                              grid: { color: gridColor },
                              angleLines: { color: gridColor },
                              pointLabels: { color: textMuted, font: { size: 10, weight: 600 } }
                            }
                          },
                          plugins: { legend: { display: false } }
                        } as any}
                      />
                    </div>

                    {/* Focus Drift */}
                    <div className="relative md:col-span-1 flex flex-col justify-center gap-6">
                      <div>
                        <h4 className={`text-[10px] font-bold mb-3 uppercase tracking-widest ${textMuted}`}>Focus Drift</h4>
                        {hasData ? (
                          <div className="space-y-3">
                            {data.nexspace.focusDrift.labels.slice(0, 3).map((label, i) => {
                              const curr = data.nexspace.focusDrift.current[i];
                              const prev = data.nexspace.focusDrift.previous[i];
                              const diff = curr - prev;
                              return (
                                <div key={label} className="flex items-center justify-between">
                                  <span className={`text-xs font-medium truncate w-1/2 ${textPrimary}`}>{label}</span>
                                  <div className="w-1/2 flex items-center justify-end gap-2">
                                    <div className={`text-[10px] font-bold ${diff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                      {diff > 0 ? '+' : ''}{diff}
                                    </div>
                                    <div className={`h-1.5 w-16 rounded-full overflow-hidden ${isDarkMode ? "bg-white/[0.1]" : "bg-black/[0.1]"}`}>
                                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, (curr / Math.max(1, curr+prev))*100)}%` }} />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className={`text-xs ${textMuted}`}>Unlock shifts by completing tasks across multiple periods.</div>
                        )}
                      </div>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* PERFORMANCE TAB */}
          {activeTab === 'Performance' && (
            <div className="flex flex-col gap-5 md:gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`${getCardClass('blue')} p-5 min-h-[120px] justify-center`}>
                  <span className="text-xl mb-2">🏆</span>
                  <p className={`text-[10px] uppercase tracking-wider font-bold mb-1 ${textMuted}`}>Best Day Ever</p>
                  <h4 className={`text-lg font-bold ${textPrimary}`}>{hasData ? data.dopamine.records.bestDay.count : '-'} Tasks</h4>
                </div>
                <div className={`${getCardClass('blue')} p-5 min-h-[120px] justify-center`}>
                  <span className="text-xl mb-2">🔥</span>
                  <p className={`text-[10px] uppercase tracking-wider font-bold mb-1 ${textMuted}`}>Longest Streak</p>
                  <h4 className={`text-lg font-bold ${textPrimary}`}>{hasData ? data.dopamine.records.longestStreak : '-'} Days</h4>
                </div>
                <div className={`${getCardClass('blue')} p-5 min-h-[120px] justify-center`}>
                  <span className="text-xl mb-2">⚡</span>
                  <p className={`text-[10px] uppercase tracking-wider font-bold mb-1 ${textMuted}`}>Highest Momentum</p>
                  <h4 className={`text-lg font-bold ${textPrimary}`}>{hasData ? `+${data.dopamine.records.highestMomentum}` : '-'}</h4>
                </div>
                <div className={`${getCardClass('blue')} p-5 min-h-[120px] justify-center`}>
                  <span className="text-xl mb-2">🎯</span>
                  <p className={`text-[10px] uppercase tracking-wider font-bold mb-1 ${textMuted}`}>Best Month</p>
                  <h4 className={`text-lg font-bold ${textPrimary}`}>{hasData ? data.dopamine.records.bestMonth.count : '-'} Tasks</h4>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
                <div className={`${getCardClass('blue')} min-h-[260px] md:min-h-[340px]`}>
                  <CardHeader 
                    title="Output vs. Goal Pace" 
                    subtitle="Daily individual output plotted against the required run-rate."
                    chartId="none" 
                    chips={[]} 
                  />
                  <div className="flex-1 relative">
                    {!hasData && renderEmptyState()}
                    <Chart
                      type="bar"
                      data={{
                        labels: data.timelineLabels,
                        datasets: [
                          { type: 'line', label: 'Required Daily Pace', data: hasData ? dailyPaceLine : data.timelineLabels.map(() => 0), borderColor: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', borderWidth: 2, borderDash: [5, 5], pointRadius: 0, fill: false },
                          { type: 'bar', label: 'Actual Output', data: hasData ? data.volumeData : data.timelineLabels.map(() => 0), backgroundColor: data.volumeData.map((v, i) => v >= dailyPaceLine[i] ? '#10b981' : '#3b82f6'), borderRadius: 4 }
                        ]
                      }}
                      options={baseChartOptions as any}
                    />
                  </div>
                </div>

                <div className={`${getCardClass('blue')} min-h-[260px] md:min-h-[340px]`}>
                  <CardHeader 
                    title="Momentum Trend" 
                    subtitle="Net output change over time highlighting periods of acceleration." 
                    chartId="momentum"
                    chips={[{ label: `Peak: +${data.dopamine.records.highestMomentum}` }]} 
                  />
                  <div className="flex-1 relative">
                    {!hasData && renderEmptyState()}
                    {renderChart('momentum')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FOCUS TAB */}
          {activeTab === 'Focus' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className={`${getCardClass('green')} min-h-[260px] md:min-h-[340px]`}>
                <CardHeader title="Focus Allocation" subtitle="How your total effort is distributed across areas." chartId="none" chips={[{ label: `Top: ${data.stats.topTaskName}`, color: 'green' }]} />
                <div className="flex-1 relative">
                  {!hasData && renderEmptyState()}
                  <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar h-full absolute inset-0 pt-2">
                    {data.taskTotals.map((val, i) => ({ label: data.labels[i], value: val, color: data.quadrantData[i].color }))
                      .sort((a, b) => b.value - a.value)
                      .map((item, index) => {
                        const total = Math.max(data.stats.totalCompletions, 1);
                        const pct = Math.round((item.value / total) * 100);
                        return (
                          <div key={index} className="flex flex-col gap-1.5">
                            <div className="flex justify-between text-xs font-medium">
                              <span className={isDarkMode ? "text-white/80" : "text-slate-700 truncate"}>{item.label}</span>
                              <span style={{ color: item.color }} className="ml-2 font-bold">{pct}%</span>
                            </div>
                            <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDarkMode ? "bg-white/[0.05]" : "bg-black/[0.05]"}`}>
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                            </div>
                          </div>
                        );
                    })}
                  </div>
                </div>
              </div>

              <div className={`${getCardClass('green')} min-h-[260px] md:min-h-[340px]`}>
                <CardHeader title="Volume Treemap" subtitle="A proportional mapping of output weight." chartId="none" chips={[]} />
                <div className="flex-1 relative">
                  {!hasData && renderEmptyState()}
                  <div className="absolute inset-0 flex flex-wrap gap-1 w-full rounded-xl overflow-hidden content-start">
                    {data.taskTotals.map((val, i) => ({ label: data.labels[i], value: val, color: data.quadrantData[i].color }))
                      .filter(item => item.value > 0)
                      .sort((a, b) => b.value - a.value)
                      .map((item, index) => {
                        const flexBasis = Math.max(10, Math.round((item.value / data.stats.totalCompletions) * 100));
                        return (
                          <div 
                            key={index} title={`${item.label} (${item.value})`}
                            style={{ flexGrow: item.value, flexBasis: `${flexBasis}%`, backgroundColor: item.color }}
                            className="min-h-[60px] flex items-center justify-center p-2 rounded-sm transition-opacity hover:opacity-80 cursor-default"
                          >
                            <span className="text-white text-xs font-bold truncate drop-shadow-md">{item.label}</span>
                          </div>
                        );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ADVANCED TAB */}
          {activeTab === 'Advanced' && (
            <div className="flex flex-col gap-5 md:gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
                <div className={`${getCardClass('pink')} min-h-[260px] md:min-h-[340px]`}>
                  <CardHeader title="Performance Quadrant" subtitle="Evaluates consistency vs. total impact volume." chartId="quadrant" chips={[]} />
                  <div className="flex-1 relative">
                    {!hasData && renderEmptyState()}
                    {renderChart('quadrant')}
                  </div>
                </div>

                <div className={`${getCardClass('pink')} min-h-[260px] md:min-h-[340px]`}>
                  <CardHeader title="Output Bubble Matrix" subtitle="Priority weight matched with output consistency." chartId="bubble" chips={[]} />
                  <div className="flex-1 relative">
                    {!hasData && renderEmptyState()}
                    {renderChart('bubble')}
                  </div>
                </div>
              </div>

              <div className={`${getCardClass('pink')} min-h-[260px] md:min-h-[340px]`}>
                <CardHeader title="Frequency Distribution" subtitle="How frequently specific daily output levels occur." chartId="histogram" chips={[]} />
                <div className="flex-1 relative">
                  {!hasData && renderEmptyState()}
                  {renderChart('histogram')}
                </div>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}