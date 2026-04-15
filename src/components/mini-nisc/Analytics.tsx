"use client";
import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts';

export default function Analytics({ documents = [] }: any) {
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
    <div className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-10 space-y-8 bg-white min-h-screen">
      
      {/* 1. Header & Summary Strip */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          Your Writing Activity
        </h2>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          Track how you write, not just what you write
        </p>

        <div className="flex gap-6 flex-wrap bg-gray-50 border border-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-2">
            📄 <span className="text-sm text-gray-600"><b className="text-gray-900">{documents.length}</b> docs</span>
          </div>
          <div className="flex items-center gap-2">
            ✍️ <span className="text-sm text-gray-600"><b className="text-gray-900">{totalWords.toLocaleString()}</b> words</span>
          </div>
          <div className="flex items-center gap-2">
            🔥 <span className="text-sm text-gray-600"><b className="text-gray-900">{writingStreak}</b> day streak</span>
          </div>
          <div className="flex items-center gap-2">
            📅 <span className="text-sm text-gray-600"><b className="text-gray-900">{thisWeekDocs}</b> this week</span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* 2. Main Activity Chart */}
      {chartData.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6 h-64 md:h-72 shadow-sm hover:shadow-lg transition-all duration-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
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
              <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  color: '#0f172a',
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
                activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 3. Heatmap (Compact GitHub Style) */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-lg transition-all duration-200">
        <h3 className="text-sm font-semibold mb-3 text-gray-700">
          Daily Activity
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">Less</span>
          <div className="grid grid-cols-7 gap-1">
            {heatmapDays.map(({ date, count }) => (
              <div
                key={date}
                title={`${date}: ${count} edits`}
                className={`w-2.5 h-2.5 md:w-4 md:h-4 rounded-sm transition-all ${
                  count > 4 ? "bg-green-600" :
                  count > 2 ? "bg-green-400" :
                  count > 0 ? "bg-green-200" :
                  "bg-gray-100"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-400">More</span>
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* 4. Deep Insights (Semantic Color Cards with Micro-Interactions) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-100 via-white to-white border border-blue-100 hover:scale-[1.03] hover:shadow-lg transition-all duration-200">
          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Writing Time</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">
            {Math.floor(totalWritingTime / 60000)} <span className="text-base text-gray-500 font-medium">min</span>
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-100 via-white to-white border border-orange-100 hover:scale-[1.03] hover:shadow-lg transition-all duration-200">
          <p className="text-xs text-orange-600 font-semibold uppercase tracking-wider mb-1">Current Streak</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">
            {writingStreak} <span className="text-base text-gray-500 font-medium">days</span>
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-100 via-white to-white border border-purple-100 hover:scale-[1.03] hover:shadow-lg transition-all duration-200">
          <p className="text-xs text-purple-600 font-semibold uppercase tracking-wider mb-1">Most Active Day</p>
          <p className="text-xl md:text-2xl font-bold text-gray-900 truncate">
            {mostActiveDay?.[0] || "—"}
          </p>
          {mostActiveDay && (
            <p className="text-sm text-gray-500 mt-0.5">{mostActiveDay[1]} total edits</p>
          )}
        </div>

      </div>

      <div className="border-t border-gray-100" />

      {/* 5. Tags Section */}
      <div className="pb-6">
        <h3 className="text-sm font-semibold mb-3 text-gray-900">Top Tags</h3>
        <div className="flex flex-wrap gap-2">
          {topTags.length > 0 ? (
            topTags.map(([tag, count]) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-default"
              >
                #{tag} <span className="text-gray-400">{count}</span>
              </span>
            ))
          ) : (
            <button className="text-sm text-green-600 font-medium hover:text-green-700 transition-colors">
              + Add tags to organize your workspace
            </button>
          )}
        </div>
      </div>

    </div>
  );
}