
import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Task, JournalEntry, MoodLog, AppView, ChatMessage, Professional, Meal
} from './types';
import { 
  BottomNav, Button, Card, CategoryIcon, MoodIcon, MascotAvatar 
} from './components/ui';
import { 
  ArrowLeft, Mic, Send, X, CheckCircle2, 
  Play, Pause, CheckSquare, BookOpen, Sparkles, ChevronRight,
  Stethoscope, Utensils, Download, FileText, Star, Calendar,
  Settings, LogOut, Filter, PhoneOff, HelpCircle, Info
} from 'lucide-react';
import { sendChatMessage, RenovaLiveClient, generatePersonalizedTask, generatePersonalizedMealPlan } from './services/geminiService';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// --- Mock Data ---
const MOCK_TASKS: Task[] = [
  { id: '1', title: 'Respiração 4-7-8', description: 'Técnica calmante para ansiedade', category: 'breathing', duration: 3, completed: false, iconName: 'air', instructions: 'Inspire pelo nariz por 4 segundos.\nSegure por 7 segundos.\nExpire pela boca por 8 segundos.' },
  { id: '2', title: '3 Gratidões', description: 'Liste 3 coisas boas', category: 'gratitude', duration: 5, completed: false, iconName: 'heart', instructions: 'Pense em 3 momentos simples e bons do seu dia.' },
  { id: '3', title: 'Alongamento', description: 'Relaxe o corpo', category: 'movement', duration: 5, completed: false, iconName: 'activity', instructions: 'Estique os braços acima da cabeça.' },
];

const MOCK_PROFESSIONALS: Professional[] = [
  { id: '1', name: 'Dr. Pedro Silva', role: 'Psicólogo(a)', specialty: 'Ansiedade e Burnout', rating: 4.9, price: 150, image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=100&h=100&fit=crop' },
  { id: '2', name: 'Dra. Ana Costa', role: 'Psiquiatra', specialty: 'Transtornos de Humor', rating: 5.0, price: 300, image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop' },
  { id: '3', name: 'Dr. Lucas Lima', role: 'Nutricionista', specialty: 'Nutrição Comportamental', rating: 4.8, price: 120, image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop' },
  { id: '4', name: 'Dra. Marina Souza', role: 'Nutricionista', specialty: 'Reeducação Alimentar', rating: 4.9, price: 130, image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
];

// --- Helper Functions ---

const getMotivationalMessage = (context: 'mood_checkin' | 'task_complete' | 'evolution' | 'streak' | 'welcome', value: any, name?: string) => {
  const userName = name ? `, ${name}` : '';
  
  switch (context) {
    case 'mood_checkin':
      const score = Number(value);
      if (score >= 4) return "Que alegria! Continue assim! 🌟";
      if (score <= 2) return "Hoje está difícil, mas você não está sozinho 💚";
      return "Obrigado por compartilhar. Um passo de cada vez. 🍃";
    case 'task_complete':
      return "Incrível! Você completou uma tarefa! ⭐";
    case 'evolution':
      return "Seu mascote evoluiu! Você está crescendo! 🎉";
    case 'streak':
      return `${value} dias seguidos! Você é incrível! 🔥`;
    case 'welcome':
       // Value is last mood score
       if (!value) return `Vamos começar sua jornada${userName}.`;
       if (value >= 4) return `Que energia boa${userName}! Continue assim! 🌟`;
       if (value === 3) return `Tudo bem buscar equilíbrio${userName}. Estamos juntos. 🍃`;
       return `Respire fundo${userName}. Vai ficar tudo bem. 💚`;
    default:
      return "Bem-vindo ao Renova!";
  }
};

// --- Sub-Components ---

const Onboarding = ({ user, setUser, setView, setMoodLog, addEvolutionPoints }: any) => {
  const [step, setStep] = useState(1);
  const [nameInput, setNameInput] = useState('');

  return (
    <div className="h-screen bg-white p-6 flex flex-col pt-safe">
      {step === 1 && (
        <>
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <h1 className="text-3xl font-bold text-renova-primary mb-4">Bem-vindo ao Renova</h1>
            <p className="text-gray-500 text-lg">Vamos conhecer você e encontrar o melhor caminho para sua recuperação.</p>
          </div>
          <Button onClick={() => setStep(2)}>Começar Jornada</Button>
        </>
      )}

      {step === 2 && (
        <>
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-center mb-2">Como gostaria de ser chamado?</h2>
            <p className="text-center text-gray-400 mb-8">Para tornarmos sua experiência mais pessoal.</p>
            <input 
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Digite seu nome"
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-lg outline-none focus:border-renova-primary focus:ring-2 focus:ring-renova-primary/20 transition-all"
              autoFocus
            />
          </div>
          <Button 
            onClick={() => {
              setUser((prev: User) => ({ ...prev, name: nameInput }));
              setStep(3);
            }}
            disabled={!nameInput.trim()}
          >
            Continuar
          </Button>
        </>
      )}

      {step === 3 && (
        <>
          <h2 className="text-2xl font-bold text-center mb-8">Como você se sente?</h2>
          <div className="flex justify-between mb-12">
            {[1, 2, 3, 4, 5].map(score => (
                <button key={score} onClick={() => {
                  setMoodLog((prev: MoodLog[]) => [...prev, { date: new Date().toISOString(), score, energy: 50 }]);
                  addEvolutionPoints(5);
                  setStep(4);
                }} className="text-4xl hover:scale-110 transition-transform">
                  <MoodIcon score={score} active={true} />
                </button>
            ))}
          </div>
          <Button variant="ghost" onClick={() => setStep(4)}>Pular</Button>
        </>
      )}

      {step === 4 && (
        <>
          <h2 className="text-2xl font-bold text-center mb-2">Escolha seu guardião</h2>
          <p className="text-center text-gray-400 mb-6">Quem reflete sua busca atual?</p>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {[
              { id: 'Lumi', name: 'Lumi', desc: 'Raposa da Clareza', detail: 'Busca inteligência emocional e estratégia.' },
              { id: 'Koda', name: 'Koda', desc: 'Urso do Acolhimento', detail: 'Força interior, proteção e descanso.' },
              { id: 'Timo', name: 'Timo', desc: 'Tartaruga da Paciência', detail: 'Um passo de cada vez, sem pressa.' },
              { id: 'Aria', name: 'Aria', desc: 'Coruja da Sabedoria', detail: 'Ver além da ansiedade e confusão.' },
              { id: 'Eli', name: 'Eli', desc: 'Borboleta da Transformação', detail: 'Para grandes mudanças e renascimento.' },
              { id: 'Zuri', name: 'Zuri', desc: 'Elefante da Memória', detail: 'Conexão, luto e laços afetivos.' },
              { id: 'Milo', name: 'Milo', desc: 'Lontra da Alegria', detail: 'Reencontrar a leveza e o brincar.' },
              { id: 'Nino', name: 'Nino', desc: 'Semente do Crescimento', detail: 'Começando do zero, cultivando potencial.' }
            ].map((m) => (
              <Card 
                key={m.id} 
                onClick={() => {
                  setUser((u: User) => ({ ...u, mascot: m.id as any, onboardingCompleted: true }));
                  setView(AppView.HOME);
                }}
                className="flex items-center gap-4 cursor-pointer hover:border-renova-primary active:bg-purple-50 transition-colors"
              >
                <MascotAvatar type={m.id} size="md" />
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{m.name}</h3>
                  <p className="text-renova-primary font-semibold text-sm">{m.desc}</p>
                  <p className="text-gray-400 text-xs mt-1">{m.detail}</p>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const TaskExecution = ({ task, onComplete, onBack }: { task: Task | null, onComplete: (id: string) => void, onBack: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(task ? task.duration * 60 : 0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 0) return 0;
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    if (timeLeft === 0 && isActive) {
      setIsActive(false);
    }
  }, [timeLeft, isActive]);

  const progress = task ? 100 - (timeLeft / (task.duration * 60)) * 100 : 0;

  if (!task) return null;

  return (
    <div className="h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col pt-safe relative overflow-hidden">
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-renova-secondary/20 rounded-full blur-3xl transition-all duration-[4000ms] ${isActive ? 'scale-150 opacity-50' : 'scale-100 opacity-20'}`}></div>

      <div className="p-4 flex justify-between relative z-10">
        <button onClick={onBack}><X className="text-gray-500"/></button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <div className="w-64 h-64 relative flex items-center justify-center mb-12">
            <svg className="w-full h-full -rotate-90">
              <circle cx="128" cy="128" r="120" stroke="#E5E7EB" strokeWidth="8" fill="none" />
              <circle cx="128" cy="128" r="120" stroke="#A78BFA" strokeWidth="8" fill="none" strokeDasharray="753" strokeDashoffset={753 - (753 * progress) / 100} className="transition-all duration-1000 ease-linear" />
            </svg>
            <div className="absolute text-5xl font-bold text-gray-700 font-mono">
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">{task.title}</h2>
        <p className="text-gray-500">{isActive ? 'Acompanhe o ritmo...' : 'Atividade concluída!'}</p>
      </div>

      <div className="p-8 relative z-10">
        {timeLeft === 0 ? (
            <Button onClick={() => onComplete(task.id)} variant="primary" className="animate-bounce">Concluir Atividade</Button>
        ) : (
          <div className="flex justify-center gap-6">
              <button onClick={() => setIsActive(!isActive)} className="bg-white p-4 rounded-full shadow-lg text-renova-primary">
                {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
              </button>
          </div>
        )}
      </div>
    </div>
  );
};

const NewJournalEntry = ({ onSave, onCancel }: { onSave: (entry: JournalEntry) => void, onCancel: () => void }) => {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(3);

  const handleSave = () => {
    if (!content.trim()) return;
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      content,
      mood
    };
    onSave(newEntry);
  };

  return (
    <div className="h-screen bg-white flex flex-col pt-safe">
      <div className="px-4 py-4 flex justify-between items-center border-b border-gray-100">
        <button onClick={onCancel}><X /></button>
        <span className="font-bold">Nova Entrada</span>
        <button onClick={handleSave} className="text-renova-primary font-bold">Salvar</button>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <p className="text-gray-500 mb-4">Como você está se sentindo?</p>
        <div className="flex justify-between mb-8">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => setMood(s)} className="text-3xl transition-transform hover:scale-110">
                <MoodIcon score={s} active={mood === s} />
              </button>
            ))}
        </div>
        <textarea 
          className="flex-1 w-full resize-none outline-none text-lg text-gray-700 placeholder-gray-300"
          placeholder="Escreva sobre seu dia, seus sentimentos..."
          value={content}
          onChange={e => setContent(e.target.value)}
          autoFocus
        />
      </div>
    </div>
  );
};

const RenderProfessionals = ({ setView, filterRole }: { setView: (v: AppView) => void, filterRole?: string }) => {
  // Use state to manage local filter, initialized with prop
  const [activeRole, setActiveRole] = useState<string | undefined>(filterRole);

  const filteredPros = activeRole 
    ? MOCK_PROFESSIONALS.filter(p => p.role === activeRole)
    : MOCK_PROFESSIONALS;

  const filters = ['Todos', 'Psicólogo(a)', 'Psiquiatra', 'Nutricionista'];

  return (
    <div className="h-full bg-gray-50 flex flex-col pt-safe">
      <div className="p-4 flex items-center bg-white shadow-sm z-10">
        <button onClick={() => setView(AppView.HOME)} className="p-2 hover:bg-gray-100 rounded-full mr-2">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Especialistas</h1>
      </div>
      
      {/* Filter Bar */}
      <div className="bg-white border-b border-gray-100 py-3 px-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {filters.map(filter => {
            const isActive = (filter === 'Todos' && !activeRole) || filter === activeRole;
            return (
              <button
                key={filter}
                onClick={() => setActiveRole(filter === 'Todos' ? undefined : filter)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                  isActive 
                  ? 'bg-renova-primary text-white border-renova-primary' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredPros.map(prof => (
          <div key={prof.id} className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex gap-4">
              <img src={prof.image} alt={prof.name} className="w-16 h-16 rounded-full object-cover" />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg text-gray-800">{prof.name}</h3>
                  <div className="flex items-center text-yellow-500 text-sm font-bold">
                    <Star size={14} fill="currentColor" className="mr-1"/> {prof.rating}
                  </div>
                </div>
                <p className="text-renova-primary font-medium text-sm">{prof.role}</p>
                <p className="text-gray-400 text-xs">{prof.specialty}</p>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
              <span className="font-bold text-gray-700">R$ {prof.price},00 <span className="text-gray-400 text-xs font-normal">/ sessão</span></span>
              <button className="bg-renova-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-600 transition-colors">
                Agendar
              </button>
            </div>
          </div>
        ))}
        {filteredPros.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <p className="text-center">Nenhum profissional encontrado<br/>nesta categoria.</p>
          </div>
        )}
        <p className="text-center text-gray-400 text-xs mt-4 mb-4">Todos os profissionais são verificados.</p>
      </div>
    </div>
  );
};

const RenderMealPlan = ({ 
  user, 
  updateUser, 
  setView, 
  setFilterRole 
}: { 
  user: User, 
  updateUser: (u: Partial<User>) => void, 
  setView: (v: AppView) => void,
  setFilterRole: (r: string) => void
}) => {
  // Initialize meals with saved plan if available
  const [meals, setMeals] = useState<Meal[] | null>(user.savedMealPlan || null);
  const [loading, setLoading] = useState(false);
  
  // Nutrition Data Options
  const DIET_STYLES = [
    { label: 'Onívoro', desc: 'Come de tudo (carnes e vegetais).' },
    { label: 'Vegetariano', desc: 'Sem carnes, inclui ovos/laticínios.' },
    { label: 'Vegano', desc: '100% vegetal, sem origem animal.' },
    { label: 'Plant-Based', desc: 'Foco em vegetais integrais.' },
    { label: 'Flexitariano', desc: 'Vegetariano casual, carne ocasional.' },
    { label: 'Carnívoro', desc: 'Exclusivamente alimentos animais.' },
    { label: 'Mediterrânea', desc: 'Azeite, grãos, peixes e vegetais.' },
    { label: 'Paleo', desc: 'Dieta ancestral, sem processados.' },
    { label: 'Keto / Cetogênica', desc: 'Muita gordura, zero carboidratos.' },
    { label: 'Low Carb', desc: 'Redução de carboidratos simples.' },
    { label: 'Whole30', desc: '30 dias de comida real e limpa.' },
    { label: 'Clean Eating', desc: 'Alimentos naturais, sem químicos.' },
  ];

  const DIET_RESTRICTIONS = [
    'Sem Glúten', 'Sem Lactose', 'Sem Açúcar', 'Baixo Sódio', 
    'Baixo FODMAP', 'Diabético', 'Hipertensão (DASH)'
  ];

  const DIET_GOALS = [
    'Perder Peso', 'Ganhar Massa', 'Manutenção', 
    'Alta Proteína', 'Anti-inflamatória', 'Mais Energia'
  ];

  // Form State
  const [dietType, setDietType] = useState(user.dietaryPreferences?.type || 'Onívoro');
  const [dietGoal, setDietGoal] = useState(user.dietaryPreferences?.goal || 'Manter peso');
  // Parse saved restrictions string back to array for UI logic if needed, or just keep string
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>(
    user.dietaryPreferences?.restrictions ? user.dietaryPreferences.restrictions.split(', ').filter(Boolean) : []
  );
  const [dietDescription, setDietDescription] = useState(user.dietaryPreferences?.description || '');

  const toggleRestriction = (res: string) => {
    setSelectedRestrictions(prev => 
      prev.includes(res) ? prev.filter(r => r !== res) : [...prev, res]
    );
  };

  const handleGeneratePlan = async () => {
    setLoading(true);
    const restrictionsString = selectedRestrictions.join(', ');
    
    // Update user preferences
    updateUser({
      dietaryPreferences: { 
        type: dietType, 
        goal: dietGoal, 
        restrictions: restrictionsString,
        description: dietDescription
      }
    });

    try {
      const plan = await generatePersonalizedMealPlan({ 
        type: dietType, 
        goal: dietGoal, 
        restrictions: restrictionsString,
        description: dietDescription
      });
      setMeals(plan);
    } catch (error) {
      console.error(error);
      alert('Erro ao gerar plano. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndDownload = () => {
    if (!meals) return;
    
    // Save locally
    const restrictionsString = selectedRestrictions.join(', ');
    updateUser({ savedMealPlan: meals });

    // Generate PDF
    const reportDate = new Date().toLocaleDateString();
    const htmlContent = `
      <html>
        <head>
          <title>Plano Alimentar - Renova</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #374151; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #A78BFA; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 48px; margin-bottom: 10px; }
            .title { color: #A78BFA; font-size: 24px; font-weight: bold; margin: 0; }
            .subtitle { color: #9CA3AF; font-size: 14px; margin-top: 5px; }
            .user-info { background: #F9FAFB; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #E5E7EB; }
            .meal-card { border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; margin-bottom: 15px; page-break-inside: avoid; }
            .meal-type { color: #A78BFA; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
            .meal-title { font-size: 18px; font-weight: bold; margin: 5px 0; color: #1F2937; }
            .meal-calories { color: #6B7280; font-size: 14px; margin-bottom: 10px; }
            .ingredients-list { display: flex; flex-wrap: wrap; gap: 8px; }
            .ingredient { background: #F3F4F6; padding: 4px 8px; border-radius: 4px; font-size: 12px; color: #4B5563; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 20px; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">🍎</div>
            <h1 class="title">Renova Nutrição</h1>
            <p class="subtitle">Plano Alimentar Personalizado • ${reportDate}</p>
          </div>

          <div class="user-info">
             <p><strong>Nome:</strong> ${user.name || 'Visitante'}</p>
             <p><strong>Objetivo:</strong> ${dietGoal}</p>
             <p><strong>Estilo:</strong> ${dietType}</p>
             ${selectedRestrictions.length > 0 ? `<p><strong>Restrições:</strong> ${selectedRestrictions.join(', ')}</p>` : ''}
             ${dietDescription ? `<p><strong>Notas:</strong> ${dietDescription}</p>` : ''}
          </div>

          <h3>Sugestão de Cardápio</h3>

          ${meals.map(meal => `
            <div class="meal-card">
              <div class="meal-type">${meal.type}</div>
              <h3 class="meal-title">${meal.title}</h3>
              <div class="meal-calories">${meal.calories} kcal</div>
              <div class="ingredients-list">
                ${meal.ingredients.map(ing => `<span class="ingredient">${ing}</span>`).join('')}
              </div>
            </div>
          `).join('')}

          <div class="footer">
            Gerado automaticamente pelo aplicativo Renova. Consulte sempre um nutricionista.
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '', 'width=800,height=900');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  const handleFindNutritionist = () => {
    setFilterRole('Nutricionista');
    setView(AppView.PROFESSIONALS);
  };

  // Check if we should show the generation form
  if (!meals) {
     return (
        <div className="h-full bg-white flex flex-col pt-safe">
          <div className="p-4 flex items-center">
            <button onClick={() => setView(AppView.HOME)} className="p-2 hover:bg-gray-100 rounded-full mr-2">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold">Nutrição Personalizada</h1>
          </div>
          <div className="flex-1 p-6 overflow-y-auto pb-safe">
            <div className="bg-orange-50 p-6 rounded-2xl mb-8 flex flex-col items-center text-center">
               <div className="bg-white p-4 rounded-full mb-4 shadow-sm text-orange-500">
                  <Utensils size={32} />
               </div>
               <h2 className="text-lg font-bold text-gray-800 mb-2">Vamos criar seu cardápio</h2>
               <p className="text-gray-600 text-sm">O Renova utiliza IA para sugerir refeições saudáveis baseadas no seu perfil único.</p>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-700 mb-3">Qual seu estilo de alimentação?</label>
              <div className="grid grid-cols-2 gap-3">
                 {DIET_STYLES.map(style => (
                    <button 
                      key={style.label}
                      onClick={() => setDietType(style.label)}
                      className={`p-3 rounded-xl text-left border transition-all ${
                        dietType === style.label 
                        ? 'border-renova-primary bg-purple-50 ring-1 ring-renova-primary' 
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`font-bold text-sm mb-1 ${dietType === style.label ? 'text-renova-primary' : 'text-gray-700'}`}>{style.label}</div>
                      <div className="text-[10px] text-gray-400 leading-tight">{style.desc}</div>
                    </button>
                 ))}
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-700 mb-3">Qual seu objetivo principal?</label>
              <div className="flex flex-wrap gap-2">
                {DIET_GOALS.map(goal => (
                   <button 
                     key={goal}
                     onClick={() => setDietGoal(goal)}
                     className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                        dietGoal === goal
                        ? 'bg-orange-100 text-orange-700 border-orange-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                     }`}
                   >
                     {goal}
                   </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-700 mb-3">Restrições Alimentares (Opcional)</label>
              <div className="flex flex-wrap gap-2 mb-4">
                 {DIET_RESTRICTIONS.map(res => {
                   const isSelected = selectedRestrictions.includes(res);
                   return (
                    <button 
                      key={res}
                      onClick={() => toggleRestriction(res)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                        isSelected
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {res} {isSelected && '✕'}
                    </button>
                   );
                 })}
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-700 mb-2">Detalhes do seu processo (Opcional)</label>
              <p className="text-xs text-gray-400 mb-3">Conte mais sobre o que você gosta, horários ou dificuldades.</p>
              <textarea 
                value={dietDescription}
                onChange={(e) => setDietDescription(e.target.value)}
                placeholder="Ex: Prefiro refeições quentes à noite, não gosto de azeitona..."
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none h-32 resize-none focus:ring-2 focus:ring-renova-primary/20 transition-all"
              />
            </div>

            <Button onClick={handleGeneratePlan} disabled={loading}>
              {loading ? 'Gerando Cardápio...' : 'Gerar Meu Plano'}
            </Button>
          </div>
        </div>
     );
  }

  return (
    <div className="h-full bg-white flex flex-col pt-safe">
      <div className="p-4 flex items-center bg-white border-b border-gray-100">
        <button onClick={() => setView(AppView.HOME)} className="p-2 hover:bg-gray-100 rounded-full mr-2">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Nutrição & Corpo</h1>
        <button 
          onClick={() => { 
            setMeals(null); 
            updateUser({ dietaryPreferences: undefined, savedMealPlan: undefined }); 
          }} 
          className="ml-auto p-2 text-gray-400 hover:text-gray-600"
        >
           <Settings size={20} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {loading ? (
           <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <div className="animate-spin h-8 w-8 border-4 border-renova-primary border-t-transparent rounded-full mb-4"></div>
              <p>O Chef IA está preparando suas sugestões...</p>
           </div>
        ) : (
          <>
            <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex gap-3">
               <div className="text-green-600 mt-1"><Sparkles size={20}/></div>
               <div>
                 <h3 className="font-bold text-green-800 mb-1">Dica Personalizada</h3>
                 <p className="text-sm text-green-700">Para seu objetivo de <strong>{user.dietaryPreferences?.goal.toLowerCase()}</strong> na dieta <strong>{user.dietaryPreferences?.type}</strong>, lembre-se de manter a consistência e hidratação.</p>
               </div>
            </div>

            <div>
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Utensils size={20} className="text-renova-primary"/> Plano Sugerido
              </h2>
              <div className="space-y-4">
                {meals?.map((meal, index) => (
                  <div key={index} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-bold text-renova-primary uppercase tracking-wide">{meal.type}</span>
                      <span className="text-xs text-gray-400">{meal.calories} kcal</span>
                    </div>
                    <h3 className="font-bold text-gray-800 mb-2">{meal.title}</h3>
                    <div className="flex flex-wrap gap-2">
                      {meal.ingredients.map(ing => (
                        <span key={ing} className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-md">{ing}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4">
               <Button onClick={handleSaveAndDownload} className="flex items-center justify-center gap-2 bg-green-500 shadow-green-200">
                  <Download size={20} />
                  Salvar e Baixar Plano PDF
               </Button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
               <p className="text-gray-500 text-sm mb-4">Precisa de um acompanhamento mais detalhado?</p>
               <Button variant="secondary" onClick={handleFindNutritionist} className="flex items-center justify-center gap-2">
                  <Stethoscope size={20} />
                  Agendar com Nutricionista
               </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  const [view, setView] = useState<AppView>(AppView.SPLASH);
  const [user, setUser] = useState<User>({
    name: '',
    mascot: null,
    mascotPhase: 1,
    evolutionPoints: 0,
    streakDays: 0,
    onboardingCompleted: false,
    situation: [],
  });
  const [moodLog, setMoodLog] = useState<MoodLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [selectedTaskCategory, setSelectedTaskCategory] = useState<string>('Todas');
  
  // Professional Filters
  const [proFilterRole, setProFilterRole] = useState<string | undefined>(undefined);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'model', text: 'Olá! Sou o Renova. Como posso ajudar você hoje?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isGeneratingTask, setIsGeneratingTask] = useState(false);

  // Live Mode State
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [liveStatus, setLiveStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [liveVolume, setLiveVolume] = useState(0); // 0-255
  const [liveAiSpeaking, setLiveAiSpeaking] = useState(false);
  const liveClient = useRef<RenovaLiveClient | null>(null);

  // Help State
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Splash Timer
  useEffect(() => {
    if (view === AppView.SPLASH) {
      const timer = setTimeout(() => {
        setView(user.onboardingCompleted ? AppView.HOME : AppView.ONBOARDING);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [view, user.onboardingCompleted]);

  // --- Actions ---

  const addEvolutionPoints = (points: number) => {
    setUser(prev => {
      const newPoints = prev.evolutionPoints + points;
      if (newPoints >= 100) {
        return { 
          ...prev, 
          evolutionPoints: newPoints - 100, 
          mascotPhase: Math.min(prev.mascotPhase + 1, 5) 
        };
      }
      return { ...prev, evolutionPoints: newPoints };
    });
  };

  const handleTaskComplete = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));
    addEvolutionPoints(15);
    setView(AppView.TASKS);
  };

  const handleSaveJournal = (entry: JournalEntry) => {
    setJournal([entry, ...journal]);
    setView(AppView.JOURNAL);
  };

  const handleGenerateTask = async () => {
    setIsGeneratingTask(true);
    const lastMood = moodLog.length > 0 ? moodLog[moodLog.length - 1].score : 3;
    
    try {
      const newTaskData = await generatePersonalizedTask(user.name, lastMood);
      const newTask: Task = {
        id: Date.now().toString(),
        title: newTaskData.title || 'Tarefa Especial',
        description: newTaskData.description || 'Uma atividade criada para você.',
        category: (newTaskData.category as any) || 'custom',
        duration: newTaskData.duration || 5,
        completed: false,
        iconName: 'sparkles',
        instructions: newTaskData.instructions || 'Siga sua intuição.'
      };
      
      setTasks([newTask, ...tasks]);
      setActiveTask(newTask);
      setView(AppView.TASK_DETAIL);
    } catch (e) {
      console.error(e);
      alert('Não foi possível gerar a tarefa agora. Tente novamente.');
    } finally {
      setIsGeneratingTask(false);
    }
  };

  const handlePrintReport = () => {
    const reportDate = new Date().toLocaleDateString();
    const moodAverage = moodLog.length > 0 
      ? (moodLog.reduce((acc, curr) => acc + curr.score, 0) / moodLog.length).toFixed(1)
      : 'N/A';
    
    // Construct HTML content for the PDF-like view
    const htmlContent = `
      <html>
        <head>
          <title>Relatório de Progresso - Renova</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #374151; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #A78BFA; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 48px; margin-bottom: 10px; }
            .title { color: #A78BFA; font-size: 24px; font-weight: bold; margin: 0; }
            .subtitle { color: #9CA3AF; font-size: 14px; margin-top: 5px; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 18px; font-weight: bold; color: #4B5563; border-bottom: 1px solid #E5E7EB; padding-bottom: 5px; margin-bottom: 15px; }
            .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .stat-card { background: #F9FAFB; padding: 15px; border-radius: 8px; border: 1px solid #F3F4F6; }
            .stat-label { font-size: 12px; color: #6B7280; text-transform: uppercase; font-weight: bold; }
            .stat-value { font-size: 24px; font-weight: bold; color: #1F2937; margin-top: 5px; }
            .list-item { padding: 10px 0; border-bottom: 1px solid #F3F4F6; }
            .list-item:last-child { border-bottom: none; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 20px; }
            @media print {
              body { padding: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">💚</div>
            <h1 class="title">Renova</h1>
            <p class="subtitle">Relatório de Bem-Estar Emocional • ${reportDate}</p>
          </div>

          <div class="section">
            <h2 class="section-title">Resumo do Usuário</h2>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Nome</div>
                <div class="stat-value">${user.name || 'Visitante'}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Mascote Atual</div>
                <div class="stat-value">${user.mascot || '-'} <span style="font-size:14px; font-weight:normal">(Fase ${user.mascotPhase})</span></div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Sequência (Streak)</div>
                <div class="stat-value">${user.streakDays} dias</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Média de Humor</div>
                <div class="stat-value">${moodAverage}/5</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Histórico Recente de Humor</h2>
            ${moodLog.slice(-7).reverse().map(log => `
              <div class="list-item">
                <strong>${new Date(log.date).toLocaleDateString()}</strong>: Humor ${log.score}/5 - Energia ${log.energy}%
              </div>
            `).join('') || '<p>Nenhum registro recente.</p>'}
          </div>

          <div class="section">
            <h2 class="section-title">Tarefas Concluídas</h2>
            ${tasks.filter(t => t.completed).slice(0, 10).map(t => `
              <div class="list-item">
                <span style="color: #34D399; margin-right: 5px;">&#10003;</span> ${t.title} <span style="color: #9CA3AF; font-size: 12px;">(${t.category})</span>
              </div>
            `).join('') || '<p>Nenhuma tarefa completada recentemente.</p>'}
          </div>

          <div class="section">
            <h2 class="section-title">Entradas do Diário</h2>
            ${journal.slice(0, 3).map(j => `
              <div class="list-item">
                <div style="font-weight: bold; margin-bottom: 5px;">${new Date(j.date).toLocaleDateString()}</div>
                <div style="font-style: italic; color: #4B5563;">"${j.content}"</div>
              </div>
            `).join('') || '<p>Nenhum registro.</p>'}
          </div>

          <div class="footer">
            Gerado automaticamente pelo aplicativo Renova. Cuide-se com carinho.
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '', 'width=800,height=900');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const responseText = await sendChatMessage(chatMessages, chatInput);
      const modelMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
      setChatMessages(prev => [...prev, modelMsg]);
    } catch (e) {
      setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Erro ao conectar.', isError: true }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const toggleLiveMode = () => {
    if (isLiveMode) {
      liveClient.current?.disconnect();
      setIsLiveMode(false);
      setLiveStatus('disconnected');
    } else {
      setIsLiveMode(true);
      liveClient.current = new RenovaLiveClient(
        (status: any) => setLiveStatus(status),
        (vol: number) => setLiveVolume(vol),
        (isSpeaking: boolean) => setLiveAiSpeaking(isSpeaking)
      );
      liveClient.current.connect();
    }
  };

  // --- Render Helpers ---
  
  const renderSplash = () => (
    <div className="h-screen w-full bg-gradient-to-br from-renova-primary to-renova-secondary flex flex-col items-center justify-center text-white animate-fade-in">
      <div className="text-6xl mb-4">💚</div>
      <h1 className="text-4xl font-bold tracking-tight">Renova</h1>
      <p className="mt-2 opacity-90 font-light">Seu companheiro emocional</p>
    </div>
  );

  const renderHome = () => {
    const lastMood = moodLog.length > 0 ? moodLog[moodLog.length - 1].score : null;
    const welcomeMessage = getMotivationalMessage('welcome', lastMood, user.name);

    return (
      <div className="pb-24 px-4 pt-safe">
        <header className="flex justify-between items-center py-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Olá, {user.name || 'Amigo'}!</h1>
            <p className="text-gray-500 text-sm mt-1">{welcomeMessage}</p>
          </div>
          <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            🔥 {user.streakDays}
          </div>
        </header>

        {/* Mascot Card */}
        <div className="bg-gradient-to-r from-renova-primary to-purple-400 rounded-3xl p-6 text-white mb-6 shadow-xl shadow-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">{user.mascot}</h2>
              <p className="text-purple-100 text-sm mb-4">Fase {user.mascotPhase}</p>
              <div className="bg-black/20 rounded-full h-2 w-32 mb-1">
                <div className="bg-renova-tertiary h-full rounded-full transition-all" style={{ width: `${user.evolutionPoints}%` }}></div>
              </div>
              <p className="text-xs text-purple-100">{100 - user.evolutionPoints} xp para evoluir</p>
            </div>
            <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
              <MascotAvatar type={user.mascot} size="md" />
            </div>
          </div>
        </div>

        {/* Mood Check-in */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="font-bold text-gray-700 mb-4">Como você está agora?</h3>
          <div className="flex justify-between">
            {[1, 2, 3, 4, 5].map(score => (
              <button 
                key={score}
                onClick={() => {
                  const newLog = { date: new Date().toISOString(), score, energy: 50 };
                  setMoodLog([...moodLog, newLog]);
                  addEvolutionPoints(5);
                }}
                className={`transition-transform hover:scale-110 active:scale-95 ${lastMood === score ? 'scale-110' : ''}`}
              >
                <MoodIcon score={score} className="w-10 h-10" active={lastMood === score} />
              </button>
            ))}
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button onClick={() => setIsChatOpen(true)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <div className="bg-blue-100 p-3 rounded-full text-blue-500"><CheckCircle2 size={24}/></div>
            <span className="font-semibold text-sm text-gray-600">Chat IA</span>
          </button>
          <button onClick={toggleLiveMode} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <div className="bg-green-100 p-3 rounded-full text-green-500"><Mic size={24}/></div>
            <span className="font-semibold text-sm text-gray-600">Conversar</span>
          </button>
           <button onClick={() => { setProFilterRole(undefined); setView(AppView.PROFESSIONALS); }} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <div className="bg-purple-100 p-3 rounded-full text-purple-500"><Stethoscope size={24}/></div>
            <span className="font-semibold text-sm text-gray-600">Especialistas</span>
          </button>
           <button onClick={() => setView(AppView.MEAL_PLAN)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <div className="bg-orange-100 p-3 rounded-full text-orange-500"><Utensils size={24}/></div>
            <span className="font-semibold text-sm text-gray-600">Nutrição</span>
          </button>
        </div>

        {/* Tasks Preview */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-gray-700">Para Hoje</h3>
          <button onClick={() => setView(AppView.TASKS)} className="text-renova-primary text-sm font-medium">Ver todas</button>
        </div>
        <div className="space-y-3">
          {tasks.slice(0, 2).map(task => (
            <Card key={task.id} onClick={() => { setActiveTask(task); setView(AppView.TASK_DETAIL); }} className="flex items-center gap-4 active:bg-gray-50">
              <div className={`p-3 rounded-xl ${task.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                <CategoryIcon category={task.category} />
              </div>
              <div className="flex-1">
                <h4 className={`font-semibold ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{task.title}</h4>
                <p className="text-xs text-gray-400">{task.duration} min • {task.category}</p>
              </div>
              {task.completed ? <CheckCircle2 className="text-green-500" /> : <ChevronRight className="text-gray-300" />}
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderTasks = () => (
    <div className="pb-24 px-4 pt-safe h-full flex flex-col">
      <header className="py-6">
        <h1 className="text-2xl font-bold text-gray-800">Tarefas de Bem-estar</h1>
      </header>
      
      {/* AI Task Button */}
      <button 
        onClick={handleGenerateTask}
        disabled={isGeneratingTask}
        className="w-full mb-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-4 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-purple-200 hover:shadow-xl transition-all active:scale-95 disabled:opacity-70"
      >
        {isGeneratingTask ? (
          <>
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"/>
            Criando sua tarefa...
          </>
        ) : (
          <>
            <Sparkles size={20} className="text-yellow-300" />
            Criar Tarefa Mágica com IA
          </>
        )}
      </button>

      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        {['Todas', 'Respiração', 'Movimento', 'Gratidão', 'Reflexão'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedTaskCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedTaskCategory === cat 
              ? 'bg-renova-primary text-white' 
              : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mt-2">
        {tasks.filter(t => selectedTaskCategory === 'Todas' || t.category === selectedTaskCategory.toLowerCase().replace('respiração', 'breathing').replace('movimento', 'movement').replace('gratidão', 'gratitude').replace('reflexão', 'reflection')).map(task => (
           <Card key={task.id} onClick={() => { setActiveTask(task); setView(AppView.TASK_DETAIL); }} className="flex items-center gap-4">
             <div className={`p-3 rounded-xl ${task.completed ? 'bg-renova-success/20 text-renova-success' : 'bg-indigo-50 text-indigo-500'}`}>
               <CategoryIcon category={task.category} />
             </div>
             <div className="flex-1">
               <h4 className="font-semibold text-gray-700">{task.title}</h4>
               <p className="text-xs text-gray-400">{task.description}</p>
             </div>
             <div className="flex flex-col items-end gap-1">
                <span className="text-xs font-bold text-gray-400">{task.duration}m</span>
                {task.completed && <CheckCircle2 size={16} className="text-renova-success"/>}
             </div>
           </Card>
        ))}
      </div>
    </div>
  );

  const renderTaskDetail = () => {
    if (!activeTask) return null;
    return (
      <div className="h-screen bg-white flex flex-col pt-safe">
        <div className="p-4 flex items-center">
          <button onClick={() => setView(AppView.TASKS)} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft/></button>
          <span className="ml-2 font-semibold text-lg">Detalhes</span>
        </div>
        
        <div className="flex-1 p-6 flex flex-col items-center">
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mb-6">
            <CategoryIcon category={activeTask.category} className="w-12 h-12" />
          </div>
          
          <h1 className="text-3xl font-bold text-center mb-2">{activeTask.title}</h1>
          <div className="flex gap-2 mb-8">
            <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium text-gray-500">{activeTask.duration} minutos</span>
            <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium text-gray-500 capitalize">{activeTask.category}</span>
          </div>

          <div className="w-full space-y-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Sobre esta atividade</h3>
              <p className="text-gray-600 leading-relaxed">{activeTask.description}</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Instruções</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{activeTask.instructions}</p>
            </div>
          </div>

          <div className="mt-auto w-full pt-8 pb-6">
            <Button onClick={() => setView(AppView.TASK_EXECUTION)}>Começar Agora</Button>
          </div>
        </div>
      </div>
    );
  };

  const renderProgress = () => {
    const data = [
      { day: 'Seg', mood: 3 }, { day: 'Ter', mood: 4 }, { day: 'Qua', mood: 2 },
      { day: 'Qui', mood: 4 }, { day: 'Sex', mood: 5 }, { day: 'Sab', mood: 4 }, { day: 'Dom', mood: 5 }
    ];

    return (
      <div className="pb-24 px-4 pt-safe">
        <header className="flex justify-between items-center py-6">
          <h1 className="text-2xl font-bold text-gray-800">Seu Progresso</h1>
          <button 
            onClick={handlePrintReport}
            className="text-renova-primary bg-purple-50 p-2 rounded-full hover:bg-purple-100 transition-colors"
            title="Baixar Relatório PDF"
          >
            <Download size={24} />
          </button>
        </header>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-orange-50 border-orange-100">
            <h3 className="text-orange-500 font-bold text-sm">Sequência</h3>
            <p className="text-3xl font-bold text-gray-800 mt-1">{user.streakDays} <span className="text-sm font-normal text-gray-500">dias</span></p>
          </Card>
          <Card className="bg-purple-50 border-purple-100">
            <h3 className="text-purple-500 font-bold text-sm">Total Pontos</h3>
            <p className="text-3xl font-bold text-gray-800 mt-1">{user.evolutionPoints}</p>
          </Card>
        </div>

        <Card className="mb-6 h-64 flex flex-col">
           <h3 className="font-bold text-gray-700 mb-4">Humor Semanal</h3>
           <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 6]} hide />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="mood" stroke="#A78BFA" strokeWidth={3} dot={{ r: 4, fill: '#A78BFA', strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
           </div>
        </Card>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-6">Jornada do {user.mascot}</h3>
          <div className="relative pl-4 border-l-2 border-gray-100 space-y-8">
            {[1, 2, 3, 4, 5].map(phase => (
              <div key={phase} className="relative">
                <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 ${phase <= user.mascotPhase ? 'bg-renova-primary border-renova-primary' : 'bg-white border-gray-300'}`}></div>
                <h4 className={`font-bold ${phase <= user.mascotPhase ? 'text-gray-800' : 'text-gray-400'}`}>Fase {phase}</h4>
                <p className="text-xs text-gray-400">Desbloqueia novos exercícios</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderJournal = () => (
    <div className="pb-24 px-4 pt-safe h-full flex flex-col">
      <header className="py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Diário</h1>
        <button onClick={() => setView(AppView.JOURNAL_NEW)} className="bg-renova-primary text-white p-2 rounded-full shadow-md hover:bg-purple-600"><CheckSquare className="w-6 h-6" /></button>
      </header>
      
      {journal.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
          <BookOpen size={64} className="mb-4 text-gray-300" />
          <p>Seu diário está vazio.<br/>Escreva sobre seu dia.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {journal.map(entry => (
            <Card key={entry.id} className="hover:bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-gray-400">{new Date(entry.date).toLocaleDateString()}</span>
                <MoodIcon score={entry.mood} className="w-5 h-5" />
              </div>
              <p className="text-gray-600 line-clamp-3">{entry.content}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // --- Overlays & New Screens ---

  const renderChatOverlay = () => (
    <div className={`fixed inset-0 z-50 bg-white flex flex-col transform transition-transform duration-300 ${isChatOpen ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="bg-renova-primary p-4 pt-safe text-white flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-2 rounded-full"><Sparkles size={18}/></div>
          <span className="font-bold">Chat Renova</span>
        </div>
        <button onClick={() => setIsChatOpen(false)}><X/></button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {chatMessages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-renova-primary text-white rounded-tr-none' : 'bg-white text-gray-700 shadow-sm rounded-tl-none border border-gray-100'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isChatLoading && (
           <div className="flex justify-start"><div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-gray-400 text-sm animate-pulse">...</div></div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-100 flex gap-2 pb-safe">
        <input 
          type="text" 
          value={chatInput} 
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
          placeholder="Digite sua mensagem..." 
          className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-renova-primary/50 transition-all"
        />
        <button onClick={handleChatSend} disabled={!chatInput.trim() || isChatLoading} className="bg-renova-primary text-white p-3 rounded-full disabled:opacity-50">
          <Send size={20}/>
        </button>
      </div>
    </div>
  );

  const renderLiveOverlay = () => {
    if (!isLiveMode) return null;
    return (
      <div className="fixed inset-0 z-[60] bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col items-center justify-between p-6 pt-safe animate-fade-in">
        
        {/* Header - Status */}
        <div className="w-full flex justify-between items-center">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                <div className={`w-2 h-2 rounded-full ${liveStatus === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
                <span className="text-xs font-medium uppercase tracking-wide">{liveStatus === 'connected' ? 'Ao Vivo' : 'Conectando'}</span>
            </div>
        </div>
        
        {/* Main Content - Avatar & AI Speaking Indicator */}
        <div className="flex flex-col items-center justify-center flex-1 w-full relative">
           {/* Pulsing Rings for AI Speaking */}
           <div className={`absolute inset-0 bg-renova-primary/20 rounded-full blur-3xl transition-all duration-300 ${liveAiSpeaking ? 'scale-150 opacity-100' : 'scale-75 opacity-20'}`}></div>
           <div className={`absolute inset-0 bg-blue-500/20 rounded-full blur-2xl transition-all duration-700 ${liveAiSpeaking ? 'scale-125 opacity-80' : 'scale-90 opacity-0'}`}></div>
           
           {/* Avatar */}
           <div className={`w-40 h-40 bg-gradient-to-br from-renova-primary to-blue-500 rounded-full flex items-center justify-center relative z-10 shadow-2xl transition-all duration-300 ${liveAiSpeaking ? 'scale-110 shadow-purple-500/50' : 'scale-100'}`}>
             <Mic size={48} className="text-white drop-shadow-lg" />
           </div>
           
           <div className="mt-8 text-center h-8">
               {liveAiSpeaking && <p className="text-blue-200 animate-pulse font-medium">Renova está falando...</p>}
           </div>
        </div>

        {/* Footer - Controls & User Viz */}
        <div className="w-full flex flex-col items-center gap-8 mb-4">
            {/* User Audio Visualizer (Simple Bars) */}
            <div className="h-12 flex items-center gap-1.5">
               {[...Array(5)].map((_, i) => {
                   // Calculate bar height based on liveVolume
                   // Center bars are taller
                   const baseHeight = 8 + (i % 2) * 4; 
                   // Dynamic height
                   const dynamicHeight = Math.min(48, Math.max(8, (liveVolume / 255) * 40 * (Math.random() * 0.5 + 0.5)));
                   return (
                       <div 
                         key={i} 
                         className="w-2 bg-white/80 rounded-full transition-all duration-75 ease-out"
                         style={{ 
                             height: liveStatus === 'connected' ? `${dynamicHeight}px` : `${baseHeight}px`,
                             opacity: liveStatus === 'connected' ? 0.8 : 0.2
                         }}
                       ></div>
                   )
               })}
            </div>

            {/* End Call Button */}
            <button 
                onClick={toggleLiveMode} 
                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-6 shadow-lg transform transition-transform active:scale-95 flex items-center justify-center"
            >
                <PhoneOff size={32} fill="currentColor" />
            </button>
        </div>
      </div>
    );
  };

  const renderHelpOverlay = () => {
    if (!isHelpOpen) return null;
    return (
      <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden animate-fade-in">
          <div className="bg-renova-primary p-4 text-white flex justify-between items-center">
             <div className="flex items-center gap-2">
               <HelpCircle size={20} />
               <span className="font-bold text-lg">Central de Ajuda</span>
             </div>
             <button onClick={() => setIsHelpOpen(false)} className="bg-white/20 p-1 rounded-full"><X size={20}/></button>
          </div>
          <div className="p-4 max-h-[70vh] overflow-y-auto">
             <h3 className="font-bold text-gray-800 mb-3">Dúvidas Frequentes</h3>
             
             <div className="space-y-3">
               <div className="border-b border-gray-100 pb-2">
                 <h4 className="font-semibold text-sm text-gray-700">Como evoluir meu mascote?</h4>
                 <p className="text-gray-500 text-sm mt-1">Complete tarefas (15 pontos) e faça check-ins de humor (5 pontos). A cada 100 pontos, seu mascote evolui.</p>
               </div>
               
               <div className="border-b border-gray-100 pb-2">
                 <h4 className="font-semibold text-sm text-gray-700">O que é o Modo Ao Vivo?</h4>
                 <p className="text-gray-500 text-sm mt-1">É uma conversa de voz em tempo real com nossa Inteligência Artificial para te ajudar a acalmar ou refletir.</p>
               </div>

               <div className="border-b border-gray-100 pb-2">
                 <h4 className="font-semibold text-sm text-gray-700">O plano de refeições é confiável?</h4>
                 <p className="text-gray-500 text-sm mt-1">São sugestões baseadas em IA. Para dietas específicas, recomendamos agendar com um de nossos nutricionistas parceiros.</p>
               </div>

               <div>
                 <h4 className="font-semibold text-sm text-gray-700">Preciso pagar para usar?</h4>
                 <p className="text-gray-500 text-sm mt-1">O plano básico com check-ins e tarefas é gratuito. Sessões com especialistas são pagas à parte.</p>
               </div>
             </div>

             <div className="mt-6 pt-4 border-t border-gray-100">
               <Button variant="outline" onClick={() => setIsHelpOpen(false)} className="w-full text-sm">Fechar</Button>
             </div>
          </div>
        </div>
      </div>
    );
  };

  // --- Main Render Switch ---

  return (
    <div className="bg-renova-bg min-h-screen font-sans text-renova-text selection:bg-renova-primary/20">
      {view === AppView.SPLASH && renderSplash()}
      
      {view === AppView.ONBOARDING && (
        <Onboarding 
          user={user} 
          setUser={setUser} 
          setView={setView} 
          setMoodLog={setMoodLog} 
          addEvolutionPoints={addEvolutionPoints} 
        />
      )}

      {/* Main Authenticated Views */}
      {[AppView.HOME, AppView.TASKS, AppView.PROGRESS, AppView.JOURNAL, AppView.PROFILE].includes(view) && (
        <>
          <div className="h-full overflow-y-auto no-scrollbar">
            {view === AppView.HOME && renderHome()}
            {view === AppView.TASKS && renderTasks()}
            {view === AppView.PROGRESS && renderProgress()}
            {view === AppView.JOURNAL && renderJournal()}
            {view === AppView.PROFILE && (
              <div className="pt-safe px-4 py-8 h-full flex flex-col">
                <header className="mb-8 flex flex-col items-center">
                  <MascotAvatar type={user.mascot} size="lg" />
                  <h2 className="text-2xl font-bold mt-4 text-gray-800">{user.name || 'Visitante'}</h2>
                  <div className="mt-2 bg-purple-100 text-renova-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                    Plano Gratuito
                  </div>
                </header>

                <div className="space-y-3 flex-1">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 mb-2">Bem-estar</h3>
                  
                  <button 
                    onClick={() => { setProFilterRole(undefined); setView(AppView.PROFESSIONALS); }}
                    className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-95 transition-transform"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-50 p-2.5 rounded-lg text-renova-primary">
                        <Stethoscope size={20} />
                      </div>
                      <div className="text-left">
                        <span className="font-semibold text-gray-700 block">Saúde Mental</span>
                        <span className="text-xs text-gray-400">Especialistas e Agendamento</span>
                      </div>
                    </div>
                    <ChevronRight className="text-gray-300" size={20} />
                  </button>

                  <button 
                    onClick={() => setView(AppView.MEAL_PLAN)}
                    className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-95 transition-transform"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-50 p-2.5 rounded-lg text-orange-500">
                        <Utensils size={20} />
                      </div>
                      <div className="text-left">
                         <span className="font-semibold text-gray-700 block">Nutrição</span>
                         <span className="text-xs text-gray-400">Plano Alimentar</span>
                      </div>
                    </div>
                    <ChevronRight className="text-gray-300" size={20} />
                  </button>
                  
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 mb-2 mt-6">Conta</h3>

                  <button 
                    onClick={() => alert('Configurações em breve')}
                    className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-95 transition-transform"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-50 p-2.5 rounded-lg text-gray-500">
                        <Settings size={20} />
                      </div>
                      <span className="font-semibold text-gray-700">Configurações</span>
                    </div>
                    <ChevronRight className="text-gray-300" size={20} />
                  </button>

                  <button 
                    onClick={() => setView(AppView.SPLASH)}
                    className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-95 transition-transform group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-red-50 p-2.5 rounded-lg text-red-500 group-hover:bg-red-100 transition-colors">
                        <LogOut size={20} />
                      </div>
                      <span className="font-semibold text-red-500">Sair</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Floating Help Button */}
          {!isLiveMode && (
            <button 
              onClick={() => setIsHelpOpen(true)}
              className="fixed bottom-20 right-4 bg-renova-primary text-white p-3 rounded-full shadow-lg z-30 hover:bg-purple-600 transition-colors"
            >
              <HelpCircle size={24} />
            </button>
          )}

          <BottomNav currentView={view} setView={setView} />
        </>
      )}

      {/* Detail & Extra Views */}
      {view === AppView.TASK_DETAIL && renderTaskDetail()}
      {view === AppView.TASK_EXECUTION && (
        <TaskExecution 
          task={activeTask} 
          onComplete={handleTaskComplete} 
          onBack={() => setView(AppView.TASK_DETAIL)} 
        />
      )}
      {view === AppView.JOURNAL_NEW && (
        <NewJournalEntry 
          onSave={handleSaveJournal} 
          onCancel={() => setView(AppView.JOURNAL)} 
        />
      )}
      {view === AppView.PROFESSIONALS && (
        <RenderProfessionals setView={setView} filterRole={proFilterRole} />
      )}
      {view === AppView.MEAL_PLAN && (
        <RenderMealPlan 
          user={user} 
          updateUser={(u: Partial<User>) => setUser(prev => ({...prev, ...u}))}
          setView={setView} 
          setFilterRole={setProFilterRole}
        />
      )}

      {/* Overlays */}
      {renderChatOverlay()}
      {renderLiveOverlay()}
      {renderHelpOverlay()}
    </div>
  );
};

export default App;
