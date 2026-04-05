"use client";
import React, { useState, useMemo } from 'react';
import { 
  BarChart3, Activity, FileText, Image as ImageIcon, 
  Clock, TrendingUp, Award, Tag 
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

export default function Analytics({ documents, media }: any) {
  const [timeFilter, setTimeFilter] = useState<'7' | '30' | 'all'>('30');

  // Calculate Total Words
  const totalWords = useMemo(() => {
    return documents.reduce((acc: number, doc: any) => {
      const text = doc.content ? doc.content.replace(/<[^>]+>/g, ' ') : '';
      return acc + text.split(/\s+/).filter(Boolean).length;
    }, 0);
  }, [documents]);

  // Last Edited Document
  const lastEdited = useMemo(() => {
    if (!documents.length) return null;
    return [...documents].sort(
      (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    )[0];
  }, [documents]);

  // Most Used Tags
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

  // Productivity Score
  const productivityScore = useMemo(() => {
    const score = Math.floor(documents.length * 8 + totalWords / 120);
    if (score > 180) return { level: 'High', emoji: '🚀', color: 'text-emerald-600' };
    if (score > 80) return { level: 'Medium', emoji: '📈', color: 'text-amber-600' };
    return { level: 'Low', emoji: '🌱', color: 'text-blue-600' };
  }, [documents.length, totalWords]);

  // Smart Insight
  const smartInsight = useMemo(() => {
    if (documents.length > 15) return "You're on a serious writing streak! Keep it going 🚀";
    if (totalWords > 8000) return "Impressive volume this period. Your ideas are flowing!";
    if (documents.length > 5) return "Consistent progress — great habit building!";
    return "Every document counts. Start small and build momentum.";
  }, [documents.length, totalWords]);

  // Mock Data for Documents Created Over Time (replace with real logic later)
  const chartData = useMemo(() => {
    const days = timeFilter === '7' ? 7 : timeFilter === '30' ? 30 : 14;
    const data = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const count = Math.floor(Math.random() * 3) + (i % 3 === 0 ? 2 : 0); // fake but realistic
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        documents: count,
      });
    }
    return data;
  }, [timeFilter]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-10 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3 text-gray-900">
              <BarChart3 size={28} className="text-green-500" /> 
              Workspace Analytics
            </h2>
            <p className="text-gray-500 mt-1">Understand your productivity patterns</p>
          </div>

          <div className="mt-4 md:mt-0">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as '7' | '30' | 'all')}
              className="bg-white border border-gray-200 rounded-2xl px-5 py-2.5 text-sm font-medium focus:outline-none focus:border-green-400"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>

        {/* Stats Cards - Horizontal Scroll on Mobile */}
        <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-4 md:gap-6">
          {/* Total Documents */}
          <div className="bg-white border border-gray-100 hover:border-green-200 p-6 rounded-2xl min-w-[260px] snap-start transition-all hover:shadow-md hover:scale-[1.02]">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="text-green-500" size={28} />
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Documents</h3>
            </div>
            <p className="text-5xl font-black text-gray-900">{documents.length}</p>
            <p className="text-xs text-gray-400 mt-3">+2 this week</p>
          </div>

          {/* Total Words */}
          <div className="bg-white border border-gray-100 hover:border-green-200 p-6 rounded-2xl min-w-[260px] snap-start transition-all hover:shadow-md hover:scale-[1.02]">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="text-green-500" size={28} />
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Words</h3>
            </div>
            <p className="text-5xl font-black text-gray-900">{totalWords.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-3">Average {Math.floor(totalWords / Math.max(documents.length, 1))} per doc</p>
          </div>

          {/* Total Media */}
          <div className="bg-white border border-gray-100 hover:border-green-200 p-6 rounded-2xl min-w-[260px] snap-start transition-all hover:shadow-md hover:scale-[1.02]">
            <div className="flex items-center gap-3 mb-4">
              <ImageIcon className="text-green-500" size={28} />
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Media Files</h3>
            </div>
            <p className="text-5xl font-black text-gray-900">{media.length}</p>
            <p className="text-xs text-gray-400 mt-3">Attached across notes</p>
          </div>

          {/* Productivity */}
          <div className="bg-gradient-to-br from-green-50 to-white border border-green-100 p-6 rounded-2xl min-w-[260px] snap-start transition-all hover:shadow-md hover:scale-[1.02] flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <Award className="text-green-600" size={28} />
              <h3 className="text-xs font-bold text-green-700 uppercase tracking-widest">Productivity</h3>
            </div>
            <div className="mt-auto">
              <p className={`text-5xl font-black ${productivityScore.color}`}>
                {productivityScore.emoji} {productivityScore.level}
              </p>
            </div>
          </div>
        </div>

        {/* Smart Insight */}
        <div className="mt-8 bg-green-50 border border-green-100 rounded-2xl p-6 flex items-start gap-4">
          <Activity size={28} className="text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800">Insight</p>
            <p className="text-green-700 mt-1">{smartInsight}</p>
          </div>
        </div>

        {/* Last Edited & Top Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {lastEdited && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="text-amber-500" size={24} />
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Last Edited</h3>
              </div>
              <p className="font-semibold text-lg">{lastEdited.title || 'Untitled'}</p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(lastEdited.updatedAt || Date.now()).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          )}

          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Tag className="text-purple-500" size={24} />
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Most Used Tags</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {topTags.length > 0 ? (
                topTags.map(([tag, count]) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs font-medium px-4 py-1.5 rounded-full border border-purple-100"
                  >
                    #{tag} <span className="text-purple-400">({count})</span>
                  </span>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No tags yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Documents Over Time Chart */}
        <div className="mt-10">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-green-500" />
            Documents Created Over Time
          </h3>
          <div className="bg-white border border-gray-100 rounded-3xl p-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="documents" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}