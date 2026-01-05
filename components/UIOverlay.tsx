
import React, { useState, useEffect, useRef } from 'react';
import { ResourceState } from '../types';

interface UIOverlayProps {
  resources: ResourceState;
  flags: Set<string>;
  musicVolume: number;
  ambientVolume: number;
  onSetMusicVolume: (v: number) => void;
  onSetAmbientVolume: (v: number) => void;
  onPlaySound: (type: any) => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ 
  resources, 
  flags,
  musicVolume, ambientVolume, onSetMusicVolume, onSetAmbientVolume,
  onPlaySound
}) => {
  const foodWidth = Math.min(100, (resources.food / 100) * 100);
  const [showSettings, setShowSettings] = useState(false);

  // Animation states
  const [goldAnim, setGoldAnim] = useState<'gain' | 'loss' | null>(null);
  const [repAnim, setRepAnim] = useState<'gain' | 'loss' | null>(null);
  const [foodAnim, setFoodAnim] = useState<'gain' | 'loss' | null>(null);
  const [lifeAnim, setLifeAnim] = useState(false);

  // Previous values to detect changes
  const prevGold = useRef(resources.gold);
  const prevRep = useRef(resources.reputation);
  const prevFood = useRef(resources.food);
  const prevLives = useRef(resources.lives);

  useEffect(() => {
    if (resources.gold > prevGold.current) setGoldAnim('gain');
    else if (resources.gold < prevGold.current) setGoldAnim('loss');
    prevGold.current = resources.gold;
    const timer = setTimeout(() => setGoldAnim(null), 500);
    return () => clearTimeout(timer);
  }, [resources.gold]);

  useEffect(() => {
    if (resources.reputation > prevRep.current) setRepAnim('gain');
    else if (resources.reputation < prevRep.current) setRepAnim('loss');
    prevRep.current = resources.reputation;
    const timer = setTimeout(() => setRepAnim(null), 500);
    return () => clearTimeout(timer);
  }, [resources.reputation]);

  useEffect(() => {
    const delta = resources.food - prevFood.current;
    if (Math.abs(delta) > 1) {
        if (delta > 0) setFoodAnim('gain');
        else setFoodAnim('loss');
    }
    prevFood.current = resources.food;
    const timer = setTimeout(() => setFoodAnim(null), 500);
    return () => clearTimeout(timer);
  }, [resources.food]);

  useEffect(() => {
    if (resources.lives < prevLives.current) {
      setLifeAnim(true);
      setTimeout(() => setLifeAnim(false), 800);
    }
    prevLives.current = resources.lives;
  }, [resources.lives]);

  const toggleSettings = () => {
    onPlaySound('select');
    setShowSettings(!showSettings);
  };

  const maxPassengers = flags.has('capacity_upgrade') ? 5 : 3;

  return (
    <div className="absolute inset-0 pointer-events-none z-40 p-8 flex flex-col justify-between">
      {/* Top Right: Settings Button */}
      <div className="absolute right-8 top-8 pointer-events-auto">
        <button 
          onClick={toggleSettings}
          onMouseEnter={() => onPlaySound('select')}
          className="mc-button w-14 h-14 text-2xl flex items-center justify-center bg-[#444] border-black"
        >
          ⚙️
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute right-8 top-24 w-80 bg-black/90 border-4 border-black p-6 pointer-events-auto animate-in slide-in-from-right-10">
          <h3 className="text-2xl font-black text-white text-pixel uppercase mb-6 border-b-2 border-white/20 pb-2">Audio Config</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm uppercase font-bold text-white/60">
                <span>Music</span>
                <span>{Math.round(musicVolume * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.01" 
                value={musicVolume} 
                onChange={(e) => onSetMusicVolume(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 bg-stone-700 h-4 border-2 border-black appearance-none"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm uppercase font-bold text-white/60">
                <span>Ambient</span>
                <span>{Math.round(ambientVolume * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.01" 
                value={ambientVolume} 
                onChange={(e) => onSetAmbientVolume(parseFloat(e.target.value))}
                className="w-full accent-amber-500 bg-stone-700 h-4 border-2 border-black appearance-none"
              />
            </div>
          </div>
          <button 
            onClick={toggleSettings}
            className="w-full mt-6 bg-amber-600 p-2 font-black uppercase border-2 border-black hover:bg-amber-500"
          >
            Close
          </button>
        </div>
      )}

      {/* Right: Passengers List */}
      <div className="absolute right-8 top-24 w-64 flex flex-col gap-2 mt-16">
         <h3 className="text-white text-xl font-bold uppercase tracking-widest bg-black/40 p-2 border-b-2 border-yellow-500 text-pixel">The Caravan Crew ({resources.passengers.length}/{maxPassengers})</h3>
         {resources.passengers.length === 0 && (
             <p className="text-white/40 text-sm italic p-2 bg-black/20">Wandering the lonely roads alone...</p>
         )}
         {resources.passengers.map(p => (
             <div key={p.id} className="bg-black/60 border-2 border-white/10 p-3 flex flex-col animate-in slide-in-from-right-10">
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-yellow-400 font-bold uppercase text-lg text-pixel">{p.name}</span>
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 text-white uppercase">{p.type}</span>
                 </div>
                 <span className="text-emerald-400 text-sm font-bold tracking-tight">{p.bonusText}</span>
             </div>
         ))}
      </div>

      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-4">
            <div className={`flex gap-2 bg-black/40 p-2 border-2 border-white/10 ${lifeAnim ? 'animate-bounce' : ''}`}>
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={`text-3xl transition-opacity duration-300 ${i < resources.lives ? 'opacity-100 scale-110' : 'opacity-20 grayscale'}`}>
                ❤️
                </div>
            ))}
            </div>

            <div className="flex items-center gap-3">
                <span className={`bg-black/60 text-white px-3 py-1 text-2xl border-2 border-white/20 transition-colors ${foodAnim === 'gain' ? 'text-green-400' : foodAnim === 'loss' ? 'text-red-400' : ''}`}>
                    PROVISIONS
                </span>
                <div className={`w-64 h-10 bg-black border-4 border-[#313131] relative shadow-2xl ${foodAnim ? 'animate-pop' : ''}`}>
                    <div 
                        className="h-full bg-red-600 transition-all duration-300" 
                        style={{ width: `${foodWidth}%` }} 
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-white text-xl font-bold text-pixel tracking-wider shadow-inner">
                        {Math.ceil(resources.food)} / 100
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className={`w-14 h-14 bg-yellow-600 border-4 border-black flex items-center justify-center text-3xl shadow-[inset_-4px_-4px_0px_rgba(0,0,0,0.5)] ${goldAnim ? 'animate-pop' : ''}`}>
                    💰
                </div>
                <span className={`text-4xl text-yellow-400 text-pixel font-bold transition-all drop-shadow-md ${goldAnim === 'gain' ? 'animate-flash-gain' : goldAnim === 'loss' ? 'animate-flash-loss' : ''}`}>
                    {resources.gold} GOLD
                </span>
            </div>
        </div>

        <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-3">
                <span className={`text-4xl text-cyan-400 text-pixel font-bold transition-all drop-shadow-md ${repAnim === 'gain' ? 'animate-flash-gain' : repAnim === 'loss' ? 'animate-flash-loss' : ''}`}>
                    RENOWN: {resources.reputation}
                </span>
                <div className={`w-14 h-14 bg-cyan-800 border-4 border-black flex items-center justify-center text-3xl shadow-[inset_-4px_-4px_0px_rgba(0,0,0,0.5)] ${repAnim ? 'animate-pop' : ''}`}>
                    ⭐
                </div>
            </div>
            <div className="w-56 h-3 bg-black border-2 border-[#313131] shadow-xl">
                <div 
                    className="h-full bg-cyan-400 transition-all duration-700" 
                    style={{ width: `${Math.min(100, (resources.reputation) * 2)}%` }} 
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default UIOverlay;
