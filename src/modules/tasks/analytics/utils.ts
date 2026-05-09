export type FilterType = 'month' | 'year' | 'custom';

export const getLocalDate = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().split('T')[0];
};

export const getISODay = (date: Date) => {
  const day = date.getDay();
  return day === 0 ? 7 : day; 
};

export interface FilteredData {
  labels: string[];
  taskTotals: number[];
  volumeData: number[];
  timelineLabels: string[];
  consistencyTrend: number[];
  weeklyPerformance: { labels: string[]; values: number[] };
  cumulativeActual: number[];
  cumulativeTarget: number[];
  stats: { 
    totalCompletions: number; 
    delta: number; 
    activeDays: number; 
    peakVolume: number; 
    peakText: string; 
    consistencyPercent: number; 
    avgPerDay: number; 
    worstDayInsight: string; 
    zeroDays: number; 
  };
}