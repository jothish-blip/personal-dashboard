import { Task } from '../../types';

export const getLocalDate = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().split('T')[0];
};

export const getISODay = (date: Date) => {
  const day = date.getDay();
  return day === 0 ? 7 : day; 
};

export const calculateBestStreak = (tasks: Task[]) => {
  let max = 0;
  tasks.forEach(t => {
    if (!t.history) return;
    const dates = Object.keys(t.history).sort();
    let currentStreak = 0;
    let lastDate: string | null = null;
    
    dates.forEach(d => {
      if (t.history![d]) {
        if (!lastDate) currentStreak = 1;
        else {
          const diff = Math.round((new Date(d).getTime() - new Date(lastDate).getTime()) / 86400000);
          if (diff === 1) currentStreak++;
          else currentStreak = 1;
        }
        max = Math.max(max, currentStreak);
        lastDate = d;
      }
    });
  });
  return max;
};