// Date formatting utilities
export function formatTestDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [month, day, year] = dateStr.split('/');
    const date = new Date(parseInt(year) + 2000, parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch {
    return dateStr;
  }
}

