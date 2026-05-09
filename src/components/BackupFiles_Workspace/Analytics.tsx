"use client";
import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts';
import { useTheme } from "@/theme/ThemeProvider"; // 🔥 Consuming theme state

export default function Analytics({ documents = [] }: any) {
  const { isDarkMode } = useTheme(); // 🔥 Consuming theme state

  // 1. Total Words
  const totalWords = useMemo(() => {
    return documents.reduce((acc: number, doc: any) => {
      const text = doc.content ? doc.content.replace(/<[^>]+>/g, ' ') : '';
      return acc + text.split(/\s+/).filter(Boolean).length;
    }, 0);
  }, [documents]);

  // 2. Total Writing Time (Assuming doc.writingTime is stored in ms)
  const totalWritingTime = useMemo(() => {
    return documents.reduce((acc: number, doc: any) => {
      return acc + (doc.writingTime || 0);
    }, 0);
  }, [documents]);

  // 3. Activity Timeline (Chart)
  const chartData = useMemo(() => {
    const map: Record<string, number> = {};
    documents.forEach((doc: any) => {
      if (!doc.updatedAt) return;
      const date = new Date(doc.updatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      map[date] = (map[date] || 0) + 1;
    });

    return Object.entries(map)
      .map(([date, count]) => ({ 
        date, 
        documents: count, 
        timestamp: new Date(date).getTime() 
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(({ date, documents }) => ({ date, documents }));
  }, [documents]);

  // 4. Heatmap Data (Last 35 days for a clean 7-column grid)
  const heatmapDays = useMemo(() => {
    const map: Record<string, number> = {};
    documents.forEach((doc: any) => {
      if (!doc.updatedAt) return;
      const date = new Date(doc.updatedAt).toISOString().slice(0, 10);
      map[date] = (map[date] || 0) + 1;
    });

    const days = [];
    const today = new Date();
    for (let i = 34; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        date: dateStr,
        count: map[dateStr] || 0
      });
    }
    return days;
  }, [documents]);

  // 5. Real Writing Streak
  const writingStreak = useMemo(() => {
    const days = new Set(
      documents.map((doc: any) =>
        new Date(doc.updatedAt || Date.now()).toDateString()
      )
    );
    let streak = 0;
    let current = new Date();
    while (days.has(current.toDateString())) {
      streak++;
      current.setDate(current.getDate() - 1);
    }
    return streak;
  }, [documents]);

  // 6. Most Active Day
  const mostActiveDay = useMemo(() => {
    const map: Record<string, number> = {};
    documents.forEach((doc: any) => {
      if (!doc.updatedAt) return;
      const day = new Date(doc.updatedAt).toLocaleDateString('en-US', { weekday: 'long' });
      map[day] = (map[day] || 0) + 1;
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0] : null;
  }, [documents]);

  // 7. Most Edited Document
  const mostEdited = useMemo(() => {
    if (!documents.length) return null;
    return [...documents].sort((a, b) => (b.version || 0) - (a.version || 0))[0];
  }, [documents]);

  // 8. Updated This Week
  const thisWeekDocs = useMemo(() => {
    return documents.filter((doc: any) => {
      if (!doc.updatedAt) return false;
      const d = new Date(doc.updatedAt);
      const now = new Date();
      return now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
    }).length;
  }, [documents]);

  // 9. Top Tags
  const topTags = useMemo(() => {
    const tagCount: Record<string, number> = {};
    documents.forEach((doc: any) => {
      doc.tags?.forEach((tag: string) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [documents]);

  return (
    <div className={`max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-10 space-y-8 min-h-screen transition-colors duration-300 ${
      isDarkMode ? "bg-[#050505]" : "bg-white"
    }`}>
      
      {/* 1. Header & Summary Strip */}
      <div>
        <h2 className={`text-2xl md:text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          Your Writing Activity
        </h2>
        <p className={`text-sm mt-1 mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          Track how you write, not just what you write
        </p>

        <div className={`flex gap-6 flex-wrap rounded-xl p-4 border transition-colors ${
          isDarkMode ? "bg-[#111111] border-gray-800" : "bg-gray-50 border-gray-100"
        }`}>
          <div className="flex items-center gap-2">
            📄 <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}><b className={isDarkMode ? "text-white" : "text-gray-900"}>{documents.length}</b> docs</span>
          </div>
          <div className="flex items-center gap-2">
            ✍️ <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}><b className={isDarkMode ? "text-white" : "text-gray-900"}>{totalWords.toLocaleString()}</b> words</span>
          </div>
          <div className="flex items-center gap-2">
            🔥 <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}><b className={isDarkMode ? "text-white" : "text-gray-900"}>{writingStreak}</b> day streak</span>
          </div>
          <div className="flex items-center gap-2">
            📅 <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}><b className={isDarkMode ? "text-white" : "text-gray-900"}>{thisWeekDocs}</b> this week</span>
          </div>
        </div>
      </div>

      <div className={`border-t ${isDarkMode ? "border-gray-800" : "border-gray-100"}`} />

      {/* 2. Main Activity Chart */}
      {chartData.length > 0 && (
        <div className={`border rounded-2xl p-4 md:p-6 h-64 md:h-72 shadow-sm hover:shadow-lg transition-all duration-200 ${
          isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200"
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Documents Created Over Time
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 2" vertical={false} stroke={isDarkMode ? "#1f2937" : "#f1f5f9"} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: isDarkMode ? '#6b7280' : '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: isDarkMode ? '#6b7280' : '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#0a0a0a' : '#fff', 
                  border: `1px solid ${isDarkMode ? '#374151' : '#e2e8f0'}`, 
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  color: isDarkMode ? '#f3f4f6' : '#0f172a',
                  fontSize: '14px',
                  fontWeight: 600
                }}
                itemStyle={{ color: '#4f46e5' }}
              />
              <Line 
                type="monotone" 
                dataKey="documents" 
                name="Edits"
                stroke="url(#chartGradient)" 
                strokeWidth={3} 
                dot={false}
                activeDot={{ r: 6, fill: '#4f46e5', stroke: isDarkMode ? '#111111' : '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 3. Heatmap (Compact GitHub Style) */}
      <div className={`border rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-lg transition-all duration-200 ${
        isDarkMode ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200"
      }`}>
        <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
          Daily Activity
        </h3>
        <div className="flex items-center gap-3">
          <span className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Less</span>
          <div className="grid grid-cols-7 gap-1">
            {heatmapDays.map(({ date, count }) => (
              <div
                key={date}
                title={`${date}: ${count} edits`}
                className={`w-2.5 h-2.5 md:w-4 md:h-4 rounded-sm transition-all ${
                  count > 4 ? "bg-green-600" :
                  count > 2 ? "bg-green-400" :
                  count > 0 ? "bg-green-200" :
                  (isDarkMode ? "bg-gray-800" : "bg-gray-100")
                }`}
              />
            ))}
          </div>
          <span className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>More</span>
        </div>
      </div>

      <div className={`border-t ${isDarkMode ? "border-gray-800" : "border-gray-100"}`} />

      {/* 4. Deep Insights (Semantic Color Cards with Micro-Interactions) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className={`p-5 rounded-2xl border hover:scale-[1.03] hover:shadow-lg transition-all duration-200 ${
          isDarkMode 
            ? "bg-gradient-to-br from-blue-900/20 via-[#1a1a1a] to-[#111111] border-blue-900/50" 
            : "bg-gradient-to-br from-blue-100 via-white to-white border-blue-100"
        }`}>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>Writing Time</p>
          <p className={`text-2xl md:text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {Math.floor(totalWritingTime / 60000)} <span className={`text-base font-medium ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>min</span>
          </p>
        </div>

        <div className={`p-5 rounded-2xl border hover:scale-[1.03] hover:shadow-lg transition-all duration-200 ${
          isDarkMode 
            ? "bg-gradient-to-br from-orange-900/20 via-[#1a1a1a] to-[#111111] border-orange-900/50" 
            : "bg-gradient-to-br from-orange-100 via-white to-white border-orange-100"
        }`}>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDarkMode ? "text-orange-400" : "text-orange-600"}`}>Current Streak</p>
          <p className={`text-2xl md:text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {writingStreak} <span className={`text-base font-medium ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>days</span>
          </p>
        </div>

        <div className={`p-5 rounded-2xl border hover:scale-[1.03] hover:shadow-lg transition-all duration-200 ${
          isDarkMode 
            ? "bg-gradient-to-br from-purple-900/20 via-[#1a1a1a] to-[#111111] border-purple-900/50" 
            : "bg-gradient-to-br from-purple-100 via-white to-white border-purple-100"
        }`}>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>Most Active Day</p>
          <p className={`text-xl md:text-2xl font-bold truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {mostActiveDay?.[0] || "—"}
          </p>
          {mostActiveDay && (
            <p className={`text-sm mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>{mostActiveDay[1]} total edits</p>
          )}
        </div>

      </div>

      <div className={`border-t ${isDarkMode ? "border-gray-800" : "border-gray-100"}`} />

      {/* 5. Tags Section */}
      <div className="pb-6">
        <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Top Tags</h3>
        <div className="flex flex-wrap gap-2">
          {topTags.length > 0 ? (
            topTags.map(([tag, count]) => (
              <span
                key={tag}
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-default ${
                  isDarkMode 
                    ? "bg-[#111111] text-gray-300 border-gray-800 hover:bg-gray-800" 
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                #{tag} <span className={isDarkMode ? "text-gray-500" : "text-gray-400"}>{count}</span>
              </span>
            ))
          ) : (
            <button className={`text-sm font-medium transition-colors ${
              isDarkMode ? "text-green-400 hover:text-green-300" : "text-green-600 hover:text-green-700"
            }`}>
              + Add tags to organize your workspace
            </button>
          )}
        </div>
      </div>

    </div>
  );
}