export const parseDate = (time: string) => {
  const d = new Date(time);
  return isNaN(d.getTime()) ? null : d;
};