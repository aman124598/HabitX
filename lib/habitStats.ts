import { Habit } from './habitsApi';

export function getGreeting(): { greeting: string; subtitle: string } {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return {
      greeting: "Good Morning!",
      subtitle: "Ready to build great habits?"
    };
  } else if (hour < 17) {
    return {
      greeting: "Good Afternoon!",
      subtitle: "Keep up the momentum!"
    };
  } else {
    return {
      greeting: "Good Evening!",
      subtitle: "Finish strong today!"
    };
  }
}

export function getToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isCompletedToday(habit: Habit, today = getToday()): boolean {
  return habit.lastCompletedOn === today;
}

export function calculateCurrentStreak(habits: Habit[]): number {
  if (habits.length === 0) return 0;
  
  // Find the highest current streak among all habits
  return Math.max(...habits.map(habit => habit.streak));
}

export function calculateSuccessRate(habits: Habit[]): number {
  if (habits.length === 0) return 0;
  
  const today = getToday();
  const completedToday = habits.filter(habit => isCompletedToday(habit, today)).length;
  
  // Calculate success rate based on today's completion
  const rate = Math.round((completedToday / habits.length) * 100);
  return rate;
}

export function calculateOverallSuccessRate(habits: Habit[]): number {
  if (habits.length === 0) return 0;
  
  // Calculate average streak as a percentage of days since creation
  const today = Date.now();
  let totalSuccessRate = 0;
  
  for (const habit of habits) {
    const createdAt = new Date(habit.createdAt).getTime();
    const daysSinceCreation = Math.max(1, Math.ceil((today - createdAt) / (1000 * 60 * 60 * 24)));
    const habitSuccessRate = Math.min(100, (habit.streak / daysSinceCreation) * 100);
    totalSuccessRate += habitSuccessRate;
  }
  
  return Math.round(totalSuccessRate / habits.length);
}
