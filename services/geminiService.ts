
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { ChatMessage, Task, Meal } from "../types";

// Initialize client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Model Constants
const TEXT_MODEL = 'gemini-2.5-flash';
const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';

// --- Text Chat ---

export const sendChatMessage = async (
  history: ChatMessage[], 
  newMessage: string
): Promise<string> => {
  try {
    const chat = ai.chats.create({
        model: TEXT_MODEL,
        config: {
            systemInstruction: "Você é o Renova, um assistente de bem-estar emocional empático, gentil e encorajador. Responda de forma breve e acolhedora.",
        }
    });
    
    const response = await chat.sendMessage({ message: newMessage });
    return response.text || "Desculpe, não consegui entender.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw new Error("Não foi possível conectar ao assistente.");
  }
};

// --- AI Task Generation ---

export const generatePersonalizedTask = async (
  userName: string, 
  mood: number
): Promise<Partial<Task>> => {
  try {
    const prompt = `
      Crie uma tarefa de bem-estar rápida e personalizada para ${userName} que está se sentindo ${mood}/5 (onde 1 é muito triste e 5 é muito feliz).
      A tarefa deve durar entre 2 a 10 minutos.
      
      Retorne APENAS um JSON com o seguinte formato, sem markdown:
      {
        "title": "Titulo curto",
        "description": "Uma frase de descrição",
        "category": "reflection",
        "duration": 5,
        "instructions": "Passo 1... Passo 2..."
      }
      As categorias permitidas são: 'breathing', 'movement', 'gratitude', 'reflection'.
    `;

    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
    });

    const text = response.text?.replace(/```json|```/g, '').trim();
    if (!text) throw new Error("Empty response");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Task Gen Error:", error);
    // Fallback task if AI fails
    return {
      title: "Respirar e Sorrir",
      description: "Uma pausa rápida para se reconectar.",
      category: "breathing",
      duration: 2,
      instructions: "Feche os olhos.\nInspire profundamente.\nSorria levemente enquanto expira."
    };
  }
};

// --- AI Meal Plan Generation ---

export const generatePersonalizedMealPlan = async (
  preferences: { type: string; goal: string; restrictions: string; description?: string }
): Promise<Meal[]> => {
  try {
    const prompt = `
      Crie um plano de refeições de 1 dia (Café da Manhã, Almoço, Lanche, Jantar) para uma pessoa com a seguinte dieta:
      - Tipo: ${preferences.type}
      - Objetivo: ${preferences.goal}
      - Restrições/Alergias: ${preferences.restrictions || "Nenhuma"}
      - Contexto/Detalhes do usuário: ${preferences.description || "Nenhum detalhe adicional"}
      
      Retorne APENAS um JSON array com o seguinte formato, sem markdown:
      [
        {
          "type": "Café da Manhã",
          "title": "Nome do Prato",
          "calories": 300,
          "ingredients": ["Item 1", "Item 2"]
        },
        ...
      ]
    `;

    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
    });

    const text = response.text?.replace(/```json|```/g, '').trim();
    if (!text) throw new Error("Empty response");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Meal Plan Gen Error:", error);
    return [
      { type: 'Café da Manhã', title: 'Opção Saudável Padrão', calories: 300, ingredients: ['Frutas', 'Aveia'] },
      { type: 'Almoço', title: 'Prato Equilibrado', calories: 500, ingredients: ['Proteína', 'Salada', 'Grãos'] },
      { type: 'Lanche', title: 'Snack Energético', calories: 200, ingredients: ['Castanhas', 'Iogurte'] },
      { type: 'Jantar', title: 'Sopa Leve', calories: 300, ingredients: ['Legumes Variados'] }
    ];
  }
};

// --- Live API (Audio) ---

// Helpers for Audio Encoding/Decoding
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// Live Client Class
export class RenovaLiveClient {
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private sessionPromise: Promise<any> | null = null;
  private sources = new Set<AudioBufferSourceNode>();
  private nextStartTime = 0;
  private userStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private volumeInterval: any = null;
  private activeSourceCount = 0;
  private isActive = false;

  constructor(
    private onStatusChange: (status: string) => void,
    private onVolumeChange: (vol: number) => void,
    private onAiSpeakingChange: (isSpeaking: boolean) => void
  ) {}

  async connect() {
    try {
      this.onStatusChange('connecting');
      
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const outputNode = this.outputAudioContext.createGain();
      outputNode.connect(this.outputAudioContext.destination);

      this.userStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.sessionPromise = ai.live.connect({
        model: LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: "Você é o Renova, um companheiro de bem-estar emocional. Fale de forma calma, lenta e encorajadora. Ajude o usuário a se acalmar ou refletir. Seja conciso.",
        },
        callbacks: {
          onopen: () => {
            this.onStatusChange('connected');
            this.startAudioInput();
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            
            if (base64Audio && this.outputAudioContext) {
               this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
               
               const audioBuffer = await decodeAudioData(
                 decode(base64Audio),
                 this.outputAudioContext,
                 24000,
                 1
               );
               
               const source = this.outputAudioContext.createBufferSource();
               source.buffer = audioBuffer;
               source.connect(this.outputAudioContext.destination);
               
               source.addEventListener('ended', () => {
                 this.sources.delete(source);
                 this.activeSourceCount--;
                 if (this.activeSourceCount <= 0) {
                     this.activeSourceCount = 0;
                     this.onAiSpeakingChange(false);
                 }
               });
               
               source.start(this.nextStartTime);
               this.nextStartTime += audioBuffer.duration;
               this.sources.add(source);
               
               this.activeSourceCount++;
               this.onAiSpeakingChange(true);
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
                this.sources.forEach(src => src.stop());
                this.sources.clear();
                this.activeSourceCount = 0;
                this.onAiSpeakingChange(false);
                this.nextStartTime = 0;
            }
          },
          onclose: () => {
            this.onStatusChange('disconnected');
          },
          onerror: (err) => {
            console.error(err);
            this.onStatusChange('error');
          }
        }
      });
      
      this.isActive = true;
    } catch (error) {
      console.error("Live connection failed", error);
      this.onStatusChange('error');
      this.disconnect();
    }
  }

  private startAudioInput() {
    if (!this.inputAudioContext || !this.userStream) return;

    const source = this.inputAudioContext.createMediaStreamSource(this.userStream);
    
    // Analyzer setup for visualization
    this.analyser = this.inputAudioContext.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);

    // Audio Processing for API
    this.scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
    this.scriptProcessor.onaudioprocess = (e) => {
      if (!this.isActive) return;
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = createBlob(inputData);
      
      this.sessionPromise?.then(session => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    // Chain: Source -> Analyser -> ScriptProcessor -> Dest
    this.analyser.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.inputAudioContext.destination);

    // Volume Polling
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.volumeInterval = setInterval(() => {
        if (this.analyser) {
            this.analyser.getByteFrequencyData(dataArray);
            // Calculate average volume
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            this.onVolumeChange(average); // 0-255
        }
    }, 100);
  }

  disconnect() {
    this.isActive = false;
    
    if (this.volumeInterval) {
        clearInterval(this.volumeInterval);
        this.volumeInterval = null;
    }

    if (this.scriptProcessor) {
        this.scriptProcessor.disconnect();
        this.scriptProcessor = null;
    }
    
    if (this.userStream) {
        this.userStream.getTracks().forEach(track => track.stop());
        this.userStream = null;
    }

    this.sources.forEach(src => src.stop());
    this.sources.clear();
    this.activeSourceCount = 0;
    this.onAiSpeakingChange(false);

    if (this.inputAudioContext) {
        this.inputAudioContext.close();
        this.inputAudioContext = null;
    }
    if (this.outputAudioContext) {
        this.outputAudioContext.close();
        this.outputAudioContext = null;
    }
    this.onStatusChange('disconnected');
  }
}
