"use client";

import { Task, Meta } from '../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler
);

export default function AnalyticsView({ tasks, meta }: { tasks: Task[], meta: Meta }) {
  const textColor = '#374151';
  const gridColor = '#e5e7eb';
  const tooltipBg = 'rgba(255,255,255,0.9)';
  const tooltipText = '#000';

  const labels = tasks.map(t => t.name);
  const totals = tasks.map(t => Object.keys(t.history).filter(d => d.startsWith(meta.currentMonth) && t.history[d]).length);

  const daysInMonth = new Date(parseInt(meta.currentMonth.split('-')[0]), parseInt(meta.currentMonth.split('-')[1]), 0).getDate();
  const daily = [];
  
  for (let i = 1; i <= daysInMonth; i++) {
    const ds = `${meta.currentMonth}-${String(i).padStart(2, '0')}`;
    daily.push(tasks.filter(t => t.history[ds]).length);
  }

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: { 
      legend: { display: false },
      tooltip: { backgroundColor: tooltipBg, titleColor: tooltipText, bodyColor: tooltipText, borderColor: gridColor, borderWidth: 1 }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor } },
      x: { grid: { display: false }, ticks: { color: textColor } }
    }
  };

  const pieOptions = {
    ...chartOptions,
    scales: {}, 
    plugins: { 
      ...chartOptions.plugins,
      legend: { display: true, position: 'right' as const, labels: { color: textColor } } 
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 bg-gray-50 transition-colors">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-gray-200 shadow-sm p-5 rounded-xl min-h-[380px] flex flex-col transition-colors">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Completion by Task</h4>
          <div className="flex-1 relative">
            <Bar data={{ labels, datasets: [{ backgroundColor: '#3b82f6', borderRadius: 6, data: totals }] }} options={chartOptions} />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 shadow-sm p-5 rounded-xl min-h-[380px] flex flex-col transition-colors">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Volume Distribution</h4>
          <div className="flex-1 relative">
            <Doughnut data={{ labels, datasets: [{ backgroundColor: ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#a855f7'], data: totals, borderColor: '#fff', borderWidth: 2 }] }} options={pieOptions} />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 shadow-sm p-5 rounded-xl min-h-[380px] flex flex-col md:col-span-2 transition-colors">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Monthly Pulse Trend</h4>
          <div className="flex-1 relative">
            <Line 
              data={{ 
                labels: Array.from({ length: daysInMonth }, (_, i) => i + 1), 
                datasets: [{ borderColor: '#22c55e', tension: 0.4, data: daily, fill: true, backgroundColor: 'rgba(34,197,94,0.05)' }] 
              }} 
              options={chartOptions} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}