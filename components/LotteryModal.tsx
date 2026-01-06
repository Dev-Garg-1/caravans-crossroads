import React, { useState, useEffect } from 'react';

interface Reward {
  id: string;
  label: string;
  icon: string;
  gold?: number;
  food?: number;
  rep?: number;
  lives?: number;
  type: 'resource' | 'shop';
  color: string;
}

const REWARDS: Reward[] = [
  { id: 'gold_stash', label: 'ANCIENT ARTIFACT', icon: '🏺', gold: 125, type: 'resource', color: '#fbbf24' },
  { id: 'food_drop', label: 'SURPLUS RATIONS', icon: '🥩', food: 50, gold: 40, type: 'resource', color: '#f87171' },
  { id: 'fame_boost', label: 'LOST RECORDS', icon: '📜', rep: 30, gold: 60, type: 'resource', color: '#60a5fa' },
  { id: 'mystic_relic', label: 'MYSTIC RELIC', icon: '💎', gold: 150, type: 'resource', color: '#d946ef' },
  { id: 'extra_life_token', label: 'VITALITY CUBE', icon: '🔋', gold: 100, type: 'resource', color: '#ef4444' },
  { id: 'nothing', label: 'RUSTY SCRAP', icon: '⚙️', gold: 5, type: 'resource', color: '#71717a' },
];

interface LotteryModalProps {
  onComplete: (reward: Reward) => void;
  onClose: () => void;
  onPlaySound: (type: any) => void;
}

const LotteryModal: React.FC<LotteryModalProps> = ({ onComplete, onClose, onPlaySound }) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [finished, setFinished] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  const spin = () => {
    if (spinning || finished) return;
    onPlaySound('confirm');
    setSpinning(true);
    
    const extraDegrees = Math.floor(Math.random() * 360);
    const newRotation = rotation + (360 * 5) + extraDegrees;
    setRotation(newRotation);

    setTimeout(() => {
      setSpinning(false);
      setFinished(true);
      
      const normalized = (newRotation % 360);
      const wedgeSize = 360 / REWARDS.length;
      const index = Math.floor(((360 - normalized + (wedgeSize / 2)) % 360) / wedgeSize);
      const reward = REWARDS[index];
      setSelectedReward(reward);
      onPlaySound('win');
    }, 4000);
  };

  useEffect(() => {
    if (spinning) {
        const interval = setInterval(() => {
            onPlaySound('spin');
        }, 150);
        return () => clearInterval(interval);
    }
  }, [spinning, onPlaySound]);

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
      <div className="mc-container max-w-md w-full p-6 flex flex-col items-center gap-6 border-[8px] border-black shadow-[0_0_60px_#d946ef88] relative">
        {/* Close Button */}
        <button 
          onClick={onClose}
          disabled={spinning}
          className="absolute -top-5 -right-5 w-10 h-10 bg-red-600 border-4 border-black text-white font-black text-2xl flex items-center justify-center shadow-[4px_4px_0px_#000] hover:bg-red-500 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed z-50"
          title="Cancel"
        >
          X
        </button>

        <h2 className="text-4xl font-black text-pixel uppercase text-[#d946ef] drop-shadow-md tracking-widest text-center">
          MYSTERY WHEEL
        </h2>

        <div className="relative w-64 h-64 md:w-72 md:h-72">
          {/* Needle */}
          <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 z-20 w-6 h-10 bg-white border-4 border-black clip-path-needle">
            <div className="w-full h-full bg-red-600 border-b-2 border-black" />
          </div>

          {/* Wheel */}
          <div 
            className="w-full h-full rounded-full border-[6px] border-black overflow-hidden relative shadow-xl transition-transform duration-[4000ms] cubic-bezier(0.15, 0, 0.15, 1)"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {REWARDS.map((r, i) => {
              const wedgeSize = 360 / REWARDS.length;
              return (
                <div 
                  key={r.id}
                  className="absolute top-0 left-0 w-full h-full origin-center"
                  style={{ transform: `rotate(${i * wedgeSize}deg)` }}
                >
                  <div 
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[50%] origin-bottom"
                    style={{ 
                        backgroundColor: r.color, 
                        clipPath: `polygon(50% 100%, 0% 0%, 100% 0%)`
                    }}
                  />
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                    <span className="text-3xl md:text-4xl drop-shadow-md">{r.icon}</span>
                  </div>
                </div>
              );
            })}
            <div className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-black border-4 border-white z-10" />
          </div>
        </div>

        {!finished ? (
          <button 
            onClick={spin}
            disabled={spinning}
            className={`mc-button w-full text-2xl py-4 bg-[#d946ef] hover:bg-[#a21caf] border-[#f0abfc] font-black uppercase text-pixel shadow-[0_6px_0_#701a75] active:translate-y-1 active:shadow-none disabled:opacity-50 ${spinning ? 'animate-pulse' : ''}`}
          >
            {spinning ? 'SPINNING...' : 'SPIN WHEEL!'}
          </button>
        ) : (
          <div className="w-full space-y-4 animate-in zoom-in duration-300">
             <div className="bg-white p-4 border-[4px] border-black text-center shadow-lg">
                <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px] mb-1">REWARD FOUND</p>
                <h3 className="text-3xl font-black text-stone-900 uppercase leading-none mb-2">{selectedReward?.label}</h3>
                <span className="text-5xl">{selectedReward?.icon}</span>
                <p className="text-emerald-600 font-bold uppercase mt-2 text-sm italic">VALUABLE FOR TRADING</p>
             </div>
             <button 
                onClick={() => selectedReward && onComplete(selectedReward)}
                className="mc-button w-full text-2xl py-3 bg-emerald-600 hover:bg-emerald-500 font-black uppercase text-pixel shadow-[0_4px_0_#064e3b]"
             >
                TRADE & CONTINUE
             </button>
          </div>
        )}
      </div>
      <style>{`
        .clip-path-needle {
            clip-path: polygon(50% 100%, 0% 0%, 100% 0%);
        }
      `}</style>
    </div>
  );
};

export default LotteryModal;