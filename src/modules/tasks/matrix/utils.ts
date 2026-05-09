export const getLocalDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

export const getISODay = (date: Date) => {
  const day = date.getDay();
  return day === 0 ? 7 : day; 
};

export const parseLocalDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const calculateCurrentStreak = (history: Record<string, boolean> | undefined, todayStr: string) => {
  if (!history) return 0;
  let streak = 0;
  
  const [y, m, d] = todayStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  
  if (history[todayStr]) streak++;
  
  dateObj.setDate(dateObj.getDate() - 1);
  let prevDateStr = getLocalDate(dateObj);
  
  if (!history[todayStr] && !history[prevDateStr]) return 0;
  
  while (history[prevDateStr]) {
    streak++;
    dateObj.setDate(dateObj.getDate() - 1);
    prevDateStr = getLocalDate(dateObj);
  }
  return streak;
};