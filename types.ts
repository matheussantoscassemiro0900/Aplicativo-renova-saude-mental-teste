
export interface User {
  name: string;
  mascot: 'Lumi' | 'Timo' | 'Eli' | 'Nino' | 'Koda' | 'Aria' | 'Zuri' | 'Milo' | null;
  mascotPhase: number;
  evolutionPoints: number;
  streakDays: number;
  onboardingCompleted: boolean;
  situation: string[];
  dietaryPreferences?: {
    type: string;
    goal: string;
    restrictions: string;
    description?: string;
  };
  savedMealPlan?: Meal[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: 'breathing' | 'movement' | 'gratitude' | 'reflection' | 'custom';
  duration: number;
  completed: boolean;
  iconName: string;
  instructions: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood: number;
}

export interface MoodLog {
  date: string;
  score: number; // 1-5
  energy: number; // 0-100
}

export interface Professional {
  id: string;
  name: string;
  role: 'Psicólogo(a)' | 'Psiquiatra' | 'Nutricionista';
  specialty: string;
  rating: number;
  price: number;
  image: string;
}

export interface Meal {
  type: 'Café da Manhã' | 'Almoço' | 'Lanche' | 'Jantar';
  title: string;
  calories: number;
  ingredients: string[];
  instructions?: string;
}

export enum AppView {
  SPLASH = 'SPLASH',
  ONBOARDING = 'ONBOARDING',
  HOME = 'HOME',
  TASKS = 'TASKS',
  TASK_DETAIL = 'TASK_DETAIL',
  TASK_EXECUTION = 'TASK_EXECUTION',
  PROGRESS = 'PROGRESS',
  JOURNAL = 'JOURNAL',
  JOURNAL_NEW = 'JOURNAL_NEW',
  PROFILE = 'PROFILE',
  CHAT = 'CHAT',
  VOICE = 'VOICE',
  PROFESSIONALS = 'PROFESSIONALS',
  MEAL_PLAN = 'MEAL_PLAN'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}