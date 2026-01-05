import React from 'react';
import { GameStatus, NPC, Passenger } from '../types';
import { WORLD_COLORS, WORLD_WIDTH, WORLD_HEIGHT, ROAD_TOP, ROAD_BOTTOM, INTERACTION_RANGE } from '../constants';

interface GameCanvasProps {
  playerPos: { x: number, y: number };
  npcs: NPC[];
  scrollOffset: number;
  status: GameStatus;
  progress: number;
  passengers: Passenger[];
}

const GameCanvas: React.FC<GameCanvasProps> = ({ playerPos, npcs, scrollOffset, status, progress, passengers }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-[#1a1a1a]">
      <svg width={WORLD_WIDTH} height={WORLD_HEIGHT} viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`} className="w-full h-auto shadow-2xl border-4 border-black">
        <defs>
          <radialGradient id="coinGlowSmall">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="coinGlowBig">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>
          <pattern id="roadPattern" x={-scrollOffset} y="0" width="100" height="100" patternUnits="userSpaceOnUse">
             <rect width="100" height="100" fill={WORLD_COLORS.road} />
             <rect x="0" y="45" width="20" height="10" fill="rgba(255,255,255,0.1)" />
          </pattern>
        </defs>

        {/* Grass Background */}
        <rect width={WORLD_WIDTH} height={WORLD_HEIGHT} fill={WORLD_COLORS.grass} />
        
        {/* Scrolling Dirt Road */}
        <rect y={ROAD_TOP} width={WORLD_WIDTH} height={ROAD_BOTTOM - ROAD_TOP} fill="url(#roadPattern)" stroke="black" strokeWidth="4" />

        {/* NPCs / Encounter Markers / People / Coins */}
        {npcs.map(npc => {
          const isNear = Math.abs(npc.x - playerPos.x) < INTERACTION_RANGE && Math.abs(npc.y - playerPos.y) < INTERACTION_RANGE;
          
          if (npc.type === 'coin') {
              const isBig = npc.encounterId === 'big_coin';
              return (
                <g key={npc.id} transform={`translate(${npc.x}, ${npc.y})`}>
                    {/* Glowing Aura */}
                    <circle r={isBig ? 30 : 20} fill={isBig ? "url(#coinGlowBig)" : "url(#coinGlowSmall)"} />
                    
                    {/* Coin Shadow */}
                    <ellipse rx={isBig ? 12 : 8} ry={2} cy={isBig ? 18 : 12} fill="rgba(0,0,0,0.4)" />
                    
                    {/* The Coin Body with bounce + rotate feel */}
                    <g className="animate-bounce">
                        <circle r={isBig ? 14 : 9} fill={isBig ? "#fbbf24" : "#f59e0b"} stroke="black" strokeWidth="2" />
                        <circle r={isBig ? 10 : 6} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeDasharray="5,2" className="animate-[spin_3s_linear_infinite]" />
                        <text textAnchor="middle" y={isBig ? 6 : 4} className={`fill-yellow-950 font-black ${isBig ? 'text-[14px]' : 'text-[10px]'}`}>$</text>
                    </g>
                </g>
              );
          }

          if (npc.type === 'person') {
              return (
                <g key={npc.id} transform={`translate(${npc.x}, ${npc.y})`}>
                    <rect x="-8" y="-18" width="16" height="24" fill="#ffdbac" stroke="black" strokeWidth="2" />
                    <rect x="-10" y="6" width="6" height="12" fill="#333" stroke="black" strokeWidth="1" />
                    <rect x="4" y="6" width="6" height="12" fill="#333" stroke="black" strokeWidth="1" />
                    <rect x="-12" y="-10" width="24" height="16" fill={npc.passengerData?.type === 'merchant' ? '#fbbf24' : npc.passengerData?.type === 'cook' ? '#f87171' : npc.passengerData?.type === 'scholar' ? '#60a5fa' : '#4ade80'} stroke="black" strokeWidth="2" />
                    <text y="-25" textAnchor="middle" className="fill-white text-[10px] font-bold uppercase tracking-widest bg-black/50">{npc.passengerData?.name}</text>
                    {isNear && (
                        <g transform="translate(0, -50)">
                            <rect x="-40" y="-15" width="80" height="25" fill="black" rx="4" />
                            <text textAnchor="middle" y="3" className="fill-yellow-400 text-[10px] font-bold">PRESS [E] TO ONBOARD</text>
                        </g>
                    )}
                </g>
              );
          }

          return (
            <g key={npc.id} transform={`translate(${npc.x}, ${npc.y})`}>
                <rect x={-npc.width/2} y={-npc.height/2} width={npc.width} height={npc.height} fill={npc.type === 'haven' ? "#ffffff" : "#444"} stroke="black" strokeWidth="2" />
                <rect x={-npc.width/2 + 4} y={-npc.height/2 + 4} width={npc.width - 8} height={npc.height - 8} fill={npc.type === 'haven' ? "#aaa" : "#666"} />
                <text y={npc.height/2 + 20} textAnchor="middle" className="fill-white text-[14px] font-bold text-pixel uppercase">
                {npc.type.toUpperCase()}
                </text>
                <text y="5" textAnchor="middle" className="fill-yellow-400 text-xl font-black">!</text>
            </g>
          );
        })}

        {/* Player Caravan */}
        <g transform={`translate(${playerPos.x}, ${playerPos.y})`}>
          <rect x="-16" y="10" width="32" height="6" fill="rgba(0,0,0,0.3)" />
          <rect x="-14" y="-12" width="28" height="20" fill="#3d2b1f" stroke="#000" strokeWidth="2" />
          <rect x="-14" y="-22" width="28" height="12" fill="#e0e0e0" stroke="#000" strokeWidth="2" />
          <rect x="-12" y="4" width="8" height="8" fill="#1a1a1a" stroke="#000" strokeWidth="2" />
          <rect x="4" y="4" width="8" height="8" fill="#1a1a1a" stroke="#000" strokeWidth="2" />
          
          {passengers.map((p, i) => {
             const colors = { merchant: '#fbbf24', cook: '#f87171', scholar: '#60a5fa', guard: '#4ade80' };
             return (
                <rect key={p.id} x={-10 + (i * 8)} y="-18" width="6" height="6" fill={colors[p.type]} stroke="black" strokeWidth="1" className="animate-pulse" />
             );
          })}

          {status === 'playing' && (
            <rect x="-25" y="5" width="4" height="4" fill="rgba(255,255,255,0.3)" className="animate-ping" />
          )}
        </g>

        {/* Progress Bar */}
        <g transform="translate(100, 30)">
           <rect width={WORLD_WIDTH - 200} height="10" fill="black" />
           <rect width={(progress / 100) * (WORLD_WIDTH - 200)} height="10" fill="#fbbf24" />
           <text x={(WORLD_WIDTH - 200) / 2} y="-10" textAnchor="middle" className="fill-white text-lg font-bold uppercase tracking-wider">PROGRESS TO HAVEN</text>
        </g>
      </svg>
    </div>
  );
};

export default GameCanvas;
