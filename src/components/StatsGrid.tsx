"use client";

import { Task, Meta } from "../types";

export default function StatsGrid({ tasks, meta }: { tasks: Task[], meta: Meta }) {
  const getDaysInMonth = (m: string) => new Date(parseInt(m.split('-')[0]), parseInt(m.split('-')[1]), 0).getDate();
  const getToday = () => new Date().toISOString().split('T')[0];

  const today = getToday();
  const daysInMonth = getDaysInMonth(meta.currentMonth);

  let missed = 0;
  for (let i = 1; i <= daysInMonth; i++) {
    const dStr = `${meta.currentMonth}-${String(i).padStart(2, '0')}`;
    if (dStr < today) {
      if (!tasks.some(t => t.history[dStr])) missed++;
    }
  }

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    if (tasks.some(t => t.history[ds])) streak++;
    else if (i > 0) break;
  }

  const dayCheckins: Record<string, number> = {};
  let totalMonthly = 0;
  tasks.forEach(t => {
    Object.keys(t.history).forEach(d => {
      if (t.history[d] && d.startsWith(meta.currentMonth)) {
        dayCheckins[d] = (dayCheckins[d] || 0) + 1;
        totalMonthly++;
      }
    });
  });

  const best = Math.max(...Object.values(dayCheckins), 0);
  const possible = tasks.length * daysInMonth;
  const rate = possible > 0 ? Math.round((totalMonthly / possible) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 shrink-0 bg-gray-50 transition-colors">
      <div className="border border-gray-200 p-4 rounded-xl text-center bg-white shadow-sm transition-colors">
        <div className="text-3xl font-black text-blue-600">{streak}</div>
        <div className="text-xs text-gray-500 uppercase mt-1 font-bold tracking-wider">Streak</div>
      </div>
      <div className="border border-gray-200 p-4 rounded-xl text-center bg-white shadow-sm transition-colors">
        <div className="text-3xl font-black text-red-600">{missed}</div>
        <div className="text-xs text-gray-500 uppercase mt-1 font-bold tracking-wider">Ghost Days</div>
      </div>
      <div className="border border-gray-200 p-4 rounded-xl text-center bg-white shadow-sm transition-colors">
        <div className="text-3xl font-black text-gray-900">{best}</div>
        <div className="text-xs text-gray-500 uppercase mt-1 font-bold tracking-wider">Peak Reps</div>
      </div>
      <div className="border border-gray-200 p-4 rounded-xl text-center bg-white shadow-sm transition-colors">
        <div className="text-3xl font-black text-gray-900">{rate}%</div>
        <div className="text-xs text-gray-500 uppercase mt-1 font-bold tracking-wider">Efficiency</div>
      </div>
    </div>
  );
}