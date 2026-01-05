
import React, { useState, useEffect } from 'react';

interface TitleScreenProps {
  onStart: () => void;
  onInitAudio: () => void;
  onPlaySound: (type: any) => void;
  musicVolume: number;
  ambientVolume: number;
  onSetMusicVolume: (v: number) => void;
  onSetAmbientVolume: (v: number) => void;
  onNarrate?: (text: string) => void;
}

const TitleScreen: React.FC<TitleScreenProps> = ({ 
  onStart, onInitAudio, onPlaySound, 
  musicVolume, ambientVolume, onSetMusicVolume, onSetAmbientVolume,
  onNarrate
}) => {
  const [step, setStep] = useState<'title' | 'story' | 'how-to' | 'settings'>('title');
  const [lineIndex, setLineIndex] = useState(0);

  const storyLines = [
    "The year is 0x7E2. The Great Chunks have drifted apart.",
    "Hunger is a constant companion in the Westfold.",
    "As a Master Caravanner, you are the lifeline of the blocks.",
    "But the road is treacherous. Bandits want your gold.",
    "The desert heat drains your provisions.",
    "Will you reach the Haven as a Hero, a Prince, or a ghost?",
    "Press the button to write your legend."
  ];

  useEffect(() => {
    if (step === 'story') {
      const timer = setInterval(() => {
        setLineIndex(prev => {
          if (prev < storyLines.length - 1) {
            const nextIndex = prev + 1;
            onPlaySound('type');
            if (onNarrate) onNarrate(storyLines[nextIndex]);
            return nextIndex;
          }
          clearInterval(timer);
          return prev;
        });
      }, 2800); // Increased interval to allow TTS to finish
      return () => clearInterval(timer);
    }
  }, [step, onPlaySound, onNarrate]);

  const handleBegin = () => {
    onInitAudio();
    onPlaySound('confirm');
    setStep('story');
    // Trigger sound and narration for the first line immediately
    onPlaySound('type');
    if (onNarrate) onNarrate(storyLines[0]);
  };

  const handleHowTo = () => {
    onInitAudio();
    onPlaySound('select');
    setStep('how-to');
  };

  const handleSettings = () => {
    onInitAudio();
    onPlaySound('select');
    setStep('settings');
  };

  const handleBack = () => {
    onPlaySound('select');
    setStep('title');
  };

  const handleFinalStart = () => {
    onPlaySound('confirm');
    onStart();
  };

  if (step === 'title') {
    return (
      <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black">
            <div className="absolute top-0 left-0 w-full h-full opacity-40 bg-[radial-gradient(circle_at_20%_20%,_#f59e0b_0%,_transparent_50%),radial-gradient(circle_at_80%_80%,_#3b82f6_0%,_transparent_50%),radial-gradient(circle_at_50%_50%,_#10b981_0%,_transparent_100%)] animate-pulse" />
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] opacity-30" />
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute w-[200%] h-[200%] top-[-50%] left-[-50%] bg-[url('https://www.transparenttextures.com/patterns/dust.png')] opacity-10 animate-[spin_60s_linear_infinite]" />
            </div>
        </div>

        <div className="relative text-center space-y-10 animate-in fade-in duration-1000 z-10">
          <div className="flex flex-col items-center">
             <div className="bg-[#55aa33] p-1 border-4 border-black mb-6 shadow-2xl rotate-3 animate-bounce">
                <div className="w-24 h-24 bg-white border-4 border-black flex items-center justify-center text-6xl">📦</div>
             </div>
             <h1 className="text-7xl md:text-[10rem] font-black text-pixel text-white uppercase tracking-tighter italic drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)] leading-none">
               CARAVAN <br/> <span className="text-yellow-400">CROSSROADS</span>
             </h1>
             <p className="text-yellow-100/80 text-3xl tracking-[0.3em] mt-6 uppercase font-black text-pixel">The Golden Road Awaits</p>
          </div>

          <div className="flex flex-col gap-6 items-center">
            <button
              onClick={handleBegin}
              onMouseEnter={() => onPlaySound('select')}
              className="mc-button w-96 text-5xl py-8 bg-emerald-600 border-emerald-400 hover:scale-110 hover:brightness-125 transition-all duration-200 shadow-[0_10px_0_#064e3b]"
            >
              BEGIN JOURNEY
            </button>
            <div className="flex gap-4">
              <button
                onClick={handleHowTo}
                onMouseEnter={() => onPlaySound('select')}
                className="mc-button w-56 text-2xl py-3 bg-[#5d5d5d] border-[#999] hover:bg-[#777] shadow-[0_6px_0_#333]"
              >
                HOW TO PLAY
              </button>
              <button
                onClick={handleSettings}
                onMouseEnter={() => onPlaySound('select')}
                className="mc-button w-56 text-2xl py-3 bg-[#444] border-[#777] hover:bg-[#555] shadow-[0_6px_0_#222]"
              >
                SETTINGS
              </button>
            </div>
          </div>
        </div>
        
        <div className="absolute inset-0 pointer-events-none opacity-20">
            <span className="absolute top-[10%] left-[10%] text-6xl animate-bounce">🥩</span>
            <span className="absolute top-[80%] left-[15%] text-6xl animate-pulse">💰</span>
            <span className="absolute top-[20%] right-[10%] text-6xl animate-bounce delay-100">⭐</span>
            <span className="absolute top-[70%] right-[20%] text-6xl animate-pulse delay-75">⚔️</span>
        </div>
      </div>
    );
  }

  if (step === 'settings') {
    return (
      <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/95 p-6 backdrop-blur-md">
        <div className="mc-container max-w-2xl w-full p-0 overflow-hidden shadow-2xl border-[8px] border-black">
          <div className="bg-indigo-600 p-6 border-b-8 border-black">
            <h2 className="text-6xl font-black text-center text-white text-pixel uppercase leading-none">AUDIO SETTINGS</h2>
          </div>
          <div className="bg-[#c6c6c6] p-10 space-y-12">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-3xl font-black text-stone-800 uppercase text-pixel">Music Volume</label>
                <span className="text-2xl font-bold text-indigo-700">{Math.round(musicVolume * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="1" step="0.01" 
                value={musicVolume} 
                onChange={(e) => onSetMusicVolume(parseFloat(e.target.value))}
                className="w-full h-8 bg-stone-400 rounded-none border-4 border-black appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-3xl font-black text-stone-800 uppercase text-pixel">Ambient Volume</label>
                <span className="text-2xl font-bold text-amber-700">{Math.round(ambientVolume * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="1" step="0.01" 
                value={ambientVolume} 
                onChange={(e) => onSetAmbientVolume(parseFloat(e.target.value))}
                className="w-full h-8 bg-stone-400 rounded-none border-4 border-black appearance-none cursor-pointer accent-amber-600"
              />
            </div>
          </div>
          <div className="bg-[#3a3a3a] p-6 border-t-8 border-black">
            <button 
                onClick={handleBack} 
                onMouseEnter={() => onPlaySound('select')}
                className="mc-button w-full text-4xl py-6 bg-amber-600 hover:bg-amber-500 border-amber-300 font-black uppercase text-pixel shadow-[0_6px_0_#92400e]"
            >
                DONE
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'how-to') {
    return (
      <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/95 p-6 backdrop-blur-md">
        <div className="mc-container max-w-4xl w-full p-0 overflow-hidden shadow-[0_0_100px_rgba(255,255,255,0.05)] border-[8px] border-black">
          <div className="bg-yellow-500 p-6 border-b-8 border-black">
            <h2 className="text-6xl font-black text-center text-black text-pixel uppercase leading-none">SURVIVAL PROTOCOL</h2>
          </div>
          <div className="bg-[#c6c6c6] p-10 grid grid-cols-1 md:grid-cols-2 gap-12 text-2xl">
            <div className="space-y-8">
              <h3 className="font-black border-b-4 border-red-600 pb-2 uppercase tracking-widest text-red-700 text-3xl">THE ECONOMY</h3>
              <ul className="space-y-6">
                <li className="flex gap-4 items-center">
                    <span className="bg-red-600 p-2 border-2 border-black w-12 h-12 flex items-center justify-center text-2xl">🥩</span> 
                    <div>
                        <strong className="text-red-900 uppercase block">PROVISIONS</strong>
                        <span className="text-stone-700 text-lg">Drains as you move. Hits 0 = Loss of Life.</span>
                    </div>
                </li>
                <li className="flex gap-4 items-center">
                    <span className="bg-yellow-400 p-2 border-2 border-black w-12 h-12 flex items-center justify-center text-2xl">💰</span> 
                    <div>
                        <strong className="text-yellow-800 uppercase block">GOLD</strong>
                        <span className="text-stone-700 text-lg">Trade at encounters. Key to high scores.</span>
                    </div>
                </li>
                <li className="flex gap-4 items-center">
                    <span className="bg-blue-500 p-2 border-2 border-black w-12 h-12 flex items-center justify-center text-2xl">⭐</span> 
                    <div>
                        <strong className="text-blue-900 uppercase block">RENOWN</strong>
                        <span className="text-stone-700 text-lg">Earned by helping others. Unlocks elite trades.</span>
                    </div>
                </li>
              </ul>
            </div>
            <div className="space-y-8">
              <h3 className="font-black border-b-4 border-blue-600 pb-2 uppercase tracking-widest text-blue-700 text-3xl">YOUR CONTROLS</h3>
              <ul className="space-y-6">
                <li className="bg-white/40 p-4 border-2 border-black/20 flex justify-between items-center">
                    <span className="font-bold text-stone-800 uppercase">Movement</span>
                    <kbd className="bg-white text-3xl px-3 py-1 border-4 border-black text-pixel">W/A/S/D</kbd>
                </li>
                <li className="bg-white/40 p-4 border-2 border-black/20 flex justify-between items-center">
                    <span className="font-bold text-stone-800 uppercase">Onboard Person</span>
                    <kbd className="bg-white text-3xl px-3 py-1 border-4 border-black text-pixel">E</kbd>
                </li>
              </ul>
            </div>
          </div>
          <div className="bg-[#3a3a3a] p-6 border-t-8 border-black">
            <button 
                onClick={handleBack} 
                onMouseEnter={() => onPlaySound('select')}
                className="mc-button w-full text-4xl py-6 bg-amber-600 hover:bg-amber-500 border-amber-300 font-black uppercase text-pixel shadow-[0_6px_0_#92400e]"
            >
                BACK TO TITLE
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black p-12 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-900 via-black to-black opacity-60" />
      <div className="max-w-4xl w-full space-y-10 relative z-10">
        <div className="space-y-6">
          {storyLines.slice(0, lineIndex + 1).map((line, i) => (
            <p 
              key={i} 
              className="text-4xl md:text-5xl text-emerald-400 font-black leading-tight animate-in fade-in slide-in-from-left-8 duration-700 fill-mode-both italic text-pixel"
            >
              <span className="text-emerald-700 mr-4 tracking-tighter">&gt;&gt;</span>
              {line}
            </p>
          ))}
        </div>
        {lineIndex === storyLines.length - 1 && (
          <div className="pt-16 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-1000">
            <button
              onClick={handleFinalStart}
              onMouseEnter={() => onPlaySound('select')}
              className="mc-button text-6xl px-20 py-10 bg-emerald-700 border-emerald-500 hover:bg-emerald-500 shadow-[0_10px_0_#064e3b] animate-pulse uppercase font-black"
            >
              START CARAVAN
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TitleScreen;
