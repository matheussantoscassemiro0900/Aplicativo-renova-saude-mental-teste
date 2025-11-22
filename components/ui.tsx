import React from 'react';
import { 
  Home, CheckSquare, BarChart2, BookOpen, User as UserIcon, 
  Wind, Activity, Heart, Brain, ChevronRight, Mic, Send, X, 
  Smile, Frown, Meh, Battery, Sparkles, ArrowLeft
} from 'lucide-react';

// --- Icons & Mappings ---

export const CategoryIcon = ({ category, className }: { category: string, className?: string }) => {
  switch(category) {
    case 'breathing': return <Wind className={className} />;
    case 'movement': return <Activity className={className} />;
    case 'gratitude': return <Heart className={className} />;
    case 'reflection': return <Brain className={className} />;
    default: return <Sparkles className={className} />;
  }
};

export const MoodIcon = ({ score, className, active }: { score: number, className?: string, active?: boolean }) => {
  const color = active ? 'text-renova-primary scale-110' : 'text-gray-400';
  const finalClass = `${className} ${color} transition-all duration-200`;
  
  if (score <= 1) return <Frown className={finalClass} />;
  if (score === 2) return <Meh className={finalClass} />; // Sad/Meh
  if (score === 3) return <Meh className={finalClass} />;
  if (score === 4) return <Smile className={finalClass} />;
  return <Smile className={finalClass} strokeWidth={2.5} />; // Happy
};

// --- Layout Components ---

export const BottomNav = ({ currentView, setView }: { currentView: string, setView: (v: any) => void }) => {
  const navItems = [
    { id: 'HOME', icon: Home, label: 'Início' },
    { id: 'TASKS', icon: CheckSquare, label: 'Tarefas' },
    { id: 'PROGRESS', icon: BarChart2, label: 'Progresso' },
    { id: 'JOURNAL', icon: BookOpen, label: 'Diário' },
    { id: 'PROFILE', icon: UserIcon, label: 'Perfil' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex justify-between items-center z-40 pb-safe">
      {navItems.map((item) => {
        const isActive = currentView === item.id;
        return (
          <button 
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-colors ${isActive ? 'text-renova-primary' : 'text-gray-400'}`}
          >
            <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }: any) => {
  const baseStyles = "w-full py-3.5 rounded-xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-renova-primary text-white shadow-lg shadow-renova-primary/30",
    secondary: "bg-renova-secondary text-renova-text shadow-lg shadow-renova-secondary/30",
    outline: "border-2 border-renova-primary text-renova-primary",
    ghost: "bg-transparent text-renova-text hover:bg-gray-100"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyles} ${(variants as any)[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const Card = ({ children, className = '', onClick }: any) => (
  <div onClick={onClick} className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 ${className}`}>
    {children}
  </div>
);

// --- Mascots ---

export const MascotAvatar = ({ type, phase, size = 'md' }: any) => {
  const sizes = { sm: 'text-2xl', md: 'text-5xl', lg: 'text-8xl' };
  const emojis: any = {
    'Lumi': '🦊',  // Raposa
    'Timo': '🐢',  // Tartaruga
    'Eli': '🦋',   // Borboleta
    'Nino': '🌱',  // Semente
    'Koda': '🐻',  // Urso
    'Aria': '🦉',  // Coruja
    'Zuri': '🐘',  // Elefante
    'Milo': '🦦'   // Lontra
  };
  
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full aspect-square shadow-inner ${(sizes as any)[size]}`}>
      <span className="drop-shadow-md animate-pulse">{emojis[type] || '🥚'}</span>
    </div>
  );
};