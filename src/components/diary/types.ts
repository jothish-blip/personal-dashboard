export interface DiaryEntry {
  morning: string;
  afternoon: string;
  evening: string;
  learning: string;
  tomorrow: string;
  mood: 'good' | 'neutral' | 'bad';
  energy: 'high' | 'medium' | 'low';
  tags: string[];
  isMissed?: boolean;
  relatedDates?: string[];                    
  focusArea?: 'Work' | 'Health' | 'Learning' | 'Social' | 'None'; 
  goalAlignment?: number;                     
  frictions?: string[];                       
  identity?: string;                          
  chapter?: string;                           
  isLocked?: boolean;                         
  versions?: Array<{ timestamp: string; snapshot: Omit<DiaryEntry, 'versions'> }>; 
  morningTime?: string;                       
  afternoonTime?: string;
  eveningTime?: string;
}

export interface Task {
  id: string | number;
  name: string;
  history?: Record<string, boolean>;
}

export const getLocalDate = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().split('T')[0];
};

export const PREDEFINED_TAGS = [
  'Deep Work', 'Breakthrough', 'Failure', 'Learning',
  'Distraction Day', 'Focused', 'Tired', 'Motivated', 'Busy', 'Lazy'
];

export const PREDEFINED_FRICTIONS = [
  'Phone notifications', 'Low energy', 'Lack of clarity',
  'Unexpected meetings', 'Internet issues', 'Mental fatigue',
  'Distractions', 'Overwhelm', 'No routine', 'External pressure'
];

export const DEFAULT_ENTRY: DiaryEntry = {
  morning: '', afternoon: '', evening: '', learning: '', tomorrow: '',
  mood: 'neutral', energy: 'medium', tags: [],
  focusArea: 'None', goalAlignment: 50, frictions: [], identity: '',
  chapter: '', isLocked: false, relatedDates: [], versions: [],
  morningTime: '', afternoonTime: '', eveningTime: ''
};