import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ResourceState, GameStatus, Encounter, Choice, VictoryType, NPC, Passenger } from './types';
import { INITIAL_RESOURCES, PLAYER_SPEED, SCROLL_SPEED, FOOD_DRAIN_RATE, WORLD_WIDTH, WORLD_HEIGHT, ROAD_TOP, ROAD_BOTTOM, INTERACTION_RANGE } from './constants';
import { ENCOUNTERS } from './data/gameData';
import GameCanvas from './components/GameCanvas';
import ChoiceModal from './components/ChoiceModal';
import UIOverlay from './components/UIOverlay';
import EndScreen from './components/EndScreen';
import TitleScreen from './components/TitleScreen';

// --- ENHANCED AUDIO ENGINE ---
let audioCtx: AudioContext | null = null;
let bgmGain: GainNode | null = null;
let ambientGain: GainNode | null = null;
let introGain: GainNode | null = null;
let isBgmPlaying = false;
let isIntroPlaying = false;

const BASE_INTRO_GAIN = 0.5; // Adjusted for better baseline control
const BASE_BGM_GAIN = 0.4;
const BASE_AMBIENT_GAIN = 0.6;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
};

const playSound = (type: 'select' | 'confirm' | 'trade' | 'collision' | 'move' | 'gameover' | 'victory' | 'hurt' | 'onboard' | 'type') => {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;

  switch(type) {
    case 'type':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200 + Math.random() * 50, now);
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.03);
      osc.start(); osc.stop(now + 0.03);
      break;
    case 'onboard':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(); osc.stop(now + 0.3);
      break;
    case 'select':
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
      osc.start(); osc.stop(now + 0.1);
      break;
    case 'confirm':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.exponentialRampToValueAtTime(1046, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(); osc.stop(now + 0.2);
      break;
    case 'trade':
      osc.type = 'sawtooth';
      [440, 554, 659].forEach((f, i) => {
        osc.frequency.setValueAtTime(f, now + i * 0.05);
      });
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(); osc.stop(now + 0.2);
      break;
    case 'collision':
      osc.type = 'square';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.linearRampToValueAtTime(40, now + 0.3);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(); osc.stop(now + 0.3);
      break;
    case 'hurt':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.linearRampToValueAtTime(20, now + 0.5);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.5);
      osc.start(); osc.stop(now + 0.5);
      break;
    case 'gameover':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(30, now + 1.5);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0, now + 1.5);
      osc.start(); osc.stop(now + 1.5);
      break;
    case 'victory':
      [523, 659, 783, 1046, 1318].forEach((f, i) => {
        const o = audioCtx!.createOscillator();
        const g = audioCtx!.createGain();
        o.connect(g); g.connect(audioCtx!.destination);
        o.frequency.setValueAtTime(f, now + i * 0.1);
        g.gain.setValueAtTime(0.1, now + i * 0.1);
        g.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.6);
        o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.6);
      });
      break;
  }
};

const PassengerNames = ["Oliver", "Elias", "Soren", "Kael", "Bryn", "Jana", "Mira"];
const PassengerTypes: Array<Passenger['type']> = ['merchant', 'cook', 'scholar', 'guard'];

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>('title');
  const [isPaused, setIsPaused] = useState(false);
  const [victoryType, setVictoryType] = useState<VictoryType | null>(null);
  const [resources, setResources] = useState<ResourceState>(INITIAL_RESOURCES);
  const [playerPos, setPlayerPos] = useState({ x: 200, y: 300 });
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [activeEncounter, setActiveEncounter] = useState<Encounter | null>(null);
  const [lastChoiceResult, setLastChoiceResult] = useState<string | null>(null);
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [pendingAction, setPendingAction] = useState<'continue_journey' | 'end_journey' | 'remove_passenger' | null>(null);

  // Volume control state (0.0 to 1.0)
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [ambientVolume, setAmbientVolume] = useState(0.5);

  const keys = useRef<Set<string>>(new Set());
  const requestRef = useRef<number>();
  const lastUpdate = useRef<number>(Date.now());
  const spawnTimer = useRef<number>(0);

  // Update Gain Nodes dynamically when state changes
  useEffect(() => {
    if (audioCtx) {
      if (bgmGain) bgmGain.gain.setTargetAtTime(BASE_BGM_GAIN * musicVolume * (isPaused ? 0.01 : 0.05), audioCtx.currentTime, 0.1);
      if (introGain) introGain.gain.setTargetAtTime(BASE_INTRO_GAIN * musicVolume * 0.05, audioCtx.currentTime, 0.1);
      if (ambientGain) ambientGain.gain.setTargetAtTime(BASE_AMBIENT_GAIN * ambientVolume * (isPaused ? 0.01 : 0.05), audioCtx.currentTime, 0.1);
    }
  }, [musicVolume, ambientVolume, isPaused]);

  const startIntroMusic = useCallback(() => {
    if (isIntroPlaying || !audioCtx) return;
    isIntroPlaying = true;
    introGain = audioCtx.createGain();
    introGain.gain.setValueAtTime(0, audioCtx.currentTime);
    introGain.gain.linearRampToValueAtTime(BASE_INTRO_GAIN * musicVolume * 0.05, audioCtx.currentTime + 2);
    introGain.connect(audioCtx.destination);

    // Am Pentatonic: A C D E G A
    const notes = [220.00, 261.63, 293.66, 329.63, 392.00, 440.00]; 
    const bassNotes = [110.00, 130.81, 146.83]; // A2, C3, D3
    let i = 0;
    
    const play = () => {
      if (!isIntroPlaying || !audioCtx) return;
      const now = audioCtx.currentTime;
      
      // Melody
      const osc = audioCtx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(notes[i % notes.length], now);
      const env = audioCtx.createGain();
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(0.1, now + 0.1);
      env.gain.exponentialRampToValueAtTime(0.001, now + 2);
      osc.connect(env);
      env.connect(introGain!);
      osc.start(); osc.stop(now + 2);

      // Bass drone every 4 steps
      if (i % 4 === 0) {
        const bOsc = audioCtx.createOscillator();
        bOsc.type = 'sine';
        bOsc.frequency.setValueAtTime(bassNotes[(i / 4) % bassNotes.length], now);
        const bEnv = audioCtx.createGain();
        bEnv.gain.setValueAtTime(0, now);
        bEnv.gain.linearRampToValueAtTime(0.15, now + 1);
        bEnv.gain.exponentialRampToValueAtTime(0.001, now + 4);
        bOsc.connect(bEnv);
        bEnv.connect(introGain!);
        bOsc.start(); bOsc.stop(now + 4);
      }

      i++;
      setTimeout(play, 1500); // Slow, atmospheric tempo for story
    };
    play();
  }, [musicVolume]);

  const startAmbient = useCallback(() => {
    if (ambientGain || !audioCtx) return;
    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;

    ambientGain = audioCtx.createGain();
    ambientGain.gain.setValueAtTime(0, audioCtx.currentTime);
    ambientGain.gain.linearRampToValueAtTime(BASE_AMBIENT_GAIN * ambientVolume * 0.05, audioCtx.currentTime + 2);

    noise.connect(filter);
    filter.connect(ambientGain);
    ambientGain.connect(audioCtx.destination);
    noise.start();
  }, [ambientVolume]);

  const startBGM = useCallback(() => {
    if (isBgmPlaying || !audioCtx) return;
    isBgmPlaying = true;
    bgmGain = audioCtx.createGain();
    bgmGain.gain.setValueAtTime(0, audioCtx.currentTime);
    bgmGain.gain.linearRampToValueAtTime(BASE_BGM_GAIN * musicVolume * 0.05, audioCtx.currentTime + 3);
    bgmGain.connect(audioCtx.destination);

    const notes = [146.83, 164.81, 196.00, 220.00, 246.94]; // D E G A B
    let step = 0;

    const loop = () => {
      if (!isBgmPlaying || !audioCtx) return;
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      const freq = notes[Math.floor(Math.random() * notes.length)] * (step % 8 === 0 ? 0.5 : 1);
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      
      const env = audioCtx.createGain();
      env.gain.setValueAtTime(0, audioCtx.currentTime);
      env.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.1);
      env.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      
      osc.connect(env);
      env.connect(bgmGain!);
      osc.start();
      osc.stop(audioCtx.currentTime + 1);
      step++;
      setTimeout(loop, 600);
    };
    loop();
  }, [musicVolume]);

  const stopIntroMusic = () => {
    isIntroPlaying = false;
    if (introGain) {
      introGain.gain.linearRampToValueAtTime(0, audioCtx!.currentTime + 1);
      setTimeout(() => { if (introGain) introGain.disconnect(); }, 1100);
    }
  };

  const stopAllAudio = () => {
    isBgmPlaying = false;
    isIntroPlaying = false;
    if (bgmGain) {
      bgmGain.gain.linearRampToValueAtTime(0, audioCtx!.currentTime + 1);
      bgmGain = null;
    }
    if (ambientGain) {
      ambientGain.gain.linearRampToValueAtTime(0, audioCtx!.currentTime + 1);
      ambientGain = null;
    }
    if (introGain) {
      introGain.gain.linearRampToValueAtTime(0, audioCtx!.currentTime + 1);
      introGain = null;
    }
  };

  const handleInitAudio = () => {
    initAudio();
    startIntroMusic();
  };

  const startGame = () => {
    initAudio();
    stopAllAudio();
    startAmbient();
    startBGM();
    playSound('confirm');
    setResources(INITIAL_RESOURCES);
    setPlayerPos({ x: 200, y: 300 });
    setNpcs([]);
    setScrollOffset(0);
    setFlags(new Set());
    setVictoryType(null);
    setIsPaused(false);
    setStatus('playing');
  };

  const spawnNPC = useCallback(() => {
    const rand = Math.random();
    
    let type: NPC['type'] = 'trader';
    let eId = '';
    let passenger: Passenger | undefined;
    
    const encounterPool = Object.keys(ENCOUNTERS).filter(key => key !== 'waystation' && key !== 'haven_checkpoint');

    // Frequency Adjustment for Replayability
    if (rand < 0.35) {
      // 35% chance for a coin. 5% chance it's a "BIG" coin.
      type = 'coin'; 
      eId = Math.random() < 0.1 ? 'big_coin' : 'small_coin'; 
    } else if (rand < 0.5 && resources.progress < 90) {
      type = 'person';
      const pType = PassengerTypes[Math.floor(Math.random() * PassengerTypes.length)];
      const bonusTxt = pType === 'merchant' ? "+15% Gold Earnings" : 
                       pType === 'cook' ? "-20% Food Consumption" : 
                       pType === 'scholar' ? "+5 Renown from encounters" : "+5 Food on encounter";
      passenger = {
          id: Math.random().toString(),
          name: PassengerNames[Math.floor(Math.random() * PassengerNames.length)],
          type: pType,
          bonusText: bonusTxt
      };
    } else {
      eId = encounterPool[Math.floor(Math.random() * encounterPool.length)];
      
      // Force Cursed Bandits if flag is set
      if (flags.has('cursed_caravan') && Math.random() < 0.6) {
        eId = 'bandit_toll';
      }

      if (resources.progress > 45 && resources.progress < 55 && !npcs.some(n => n.encounterId === 'waystation')) {
        eId = 'waystation';
      }
      if (resources.progress >= 95 && !npcs.some(n => n.encounterId === 'haven_checkpoint')) {
        eId = 'haven_checkpoint';
      }
      type = (eId === 'haven_checkpoint' ? 'haven' : 'trader');
    }

    const newNpc: NPC = {
      id: Math.random().toString(),
      x: WORLD_WIDTH + 100,
      y: ROAD_TOP + Math.random() * (ROAD_BOTTOM - ROAD_TOP - 40),
      type: type,
      encounterId: eId,
      width: type === 'coin' ? (eId === 'big_coin' ? 32 : 24) : (type === 'person' ? 32 : 48),
      height: type === 'coin' ? (eId === 'big_coin' ? 32 : 24) : (type === 'person' ? 42 : 48),
      speedMultiplier: 0.5 + Math.random() * 0.5,
      passengerData: passenger
    };
    setNpcs(prev => [...prev, newNpc]);
  }, [resources.progress, npcs, resources.journeyCount, flags]);

  const gameLoop = useCallback(() => {
    const now = Date.now();
    const dt = now - lastUpdate.current;
    lastUpdate.current = now;

    if (status !== 'playing' || isPaused) {
      requestRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    // 1. Movement
    setPlayerPos(prev => {
      let nx = prev.x;
      let ny = prev.y;
      if (keys.current.has('w') || keys.current.has('arrowup')) ny -= PLAYER_SPEED;
      if (keys.current.has('s') || keys.current.has('arrowdown')) ny += PLAYER_SPEED;
      if (keys.current.has('a') || keys.current.has('arrowleft')) nx -= PLAYER_SPEED;
      if (keys.current.has('d') || keys.current.has('arrowright')) nx += PLAYER_SPEED;
      return { 
        x: Math.max(50, Math.min(WORLD_WIDTH - 50, nx)), 
        y: Math.max(ROAD_TOP + 20, Math.min(ROAD_BOTTOM - 20, ny)) 
      };
    });

    // 2. Resource Drain & Life System
    setResources(prev => {
      const isMoving = keys.current.size > 0;
      
      const hasCook = prev.passengers.some(p => p.type === 'cook');
      const hasAxleUpgrade = flags.has('axle_upgrade');
      
      let drainMultiplier = 1.0;
      if (hasCook) drainMultiplier *= 0.80;
      if (hasAxleUpgrade) drainMultiplier *= 0.70; 
      
      let nextFood = Math.max(0, prev.food - (isMoving ? FOOD_DRAIN_RATE * 2 : FOOD_DRAIN_RATE) * drainMultiplier);
      let nextLives = prev.lives;
      
      if (nextFood <= 0) {
        if (nextLives > 1) {
          playSound('hurt');
          nextLives -= 1;
          nextFood = 50; 
        } else {
          playSound('gameover');
          setStatus('gameover');
          nextLives = 0;
          stopAllAudio();
        }
      }

      const nextProgress = prev.progress + (SCROLL_SPEED / 80);
      const currentScore = (prev.gold * 10) + (prev.reputation * 50) + (prev.journeyCount * 1000) + Math.floor(prev.progress * 10);

      return { 
        ...prev, 
        food: nextFood, 
        lives: nextLives, 
        progress: Math.min(100, nextProgress),
        score: currentScore
      };
    });

    // 3. Scroll & NPCS (including Coins)
    setScrollOffset(prev => (prev + SCROLL_SPEED) % 100);
    setNpcs(prev => {
      const updated = prev.map(n => ({ ...n, x: n.x - SCROLL_SPEED * n.speedMultiplier })).filter(n => n.x > -150);
      
      // Check for Coin Collision
      const coinHitIndex = updated.findIndex(n => n.type === 'coin' && Math.abs(n.x - playerPos.x) < 35 && Math.abs(n.y - playerPos.y) < 35);
      if (coinHitIndex !== -1) {
          const coin = updated[coinHitIndex];
          playSound('trade'); 
          const value = coin.encounterId === 'big_coin' ? 25 : 5;
          setResources(r => ({ ...r, gold: r.gold + value }));
          return updated.filter((_, i) => i !== coinHitIndex);
      }

      // Check for Encounter Collision
      const hit = updated.find(n => n.type !== 'person' && n.type !== 'coin' && Math.abs(n.x - playerPos.x) < 45 && Math.abs(n.y - playerPos.y) < 45);
      if (hit) {
        playSound('collision');
        setActiveEncounter(ENCOUNTERS[hit.encounterId]);
        setStatus('encounter');
        return updated.filter(n => n.id !== hit.id);
      }
      return updated;
    });

    // 4. Spawning (Adjusted for high engagement)
    spawnTimer.current += dt;
    if (spawnTimer.current > (1300 - (resources.journeyCount * 100)) && resources.progress < 95) {
      spawnNPC();
      spawnTimer.current = 0;
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  }, [status, playerPos, spawnNPC, resources.progress, resources.journeyCount, resources.passengers, flags, musicVolume, ambientVolume, isPaused]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [gameLoop]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      if (key === 'p') {
          if (status === 'playing' || status === 'encounter') {
              setIsPaused(prev => !prev);
              playSound('select');
              return;
          }
      }

      keys.current.add(key);

      if (isPaused) return; 

      if (status === 'playing' && key === 'e') {
          const nearbyPersonIndex = npcs.findIndex(n => n.type === 'person' && Math.abs(n.x - playerPos.x) < INTERACTION_RANGE && Math.abs(n.y - playerPos.y) < INTERACTION_RANGE);
          if (nearbyPersonIndex !== -1) {
              const person = npcs[nearbyPersonIndex];
              if (person.passengerData && resources.passengers.length < 3) {
                  playSound('onboard');
                  setResources(prev => ({
                      ...prev,
                      passengers: [...prev.passengers, person.passengerData!]
                  }));
                  setNpcs(prev => prev.filter((_, i) => i !== nearbyPersonIndex));
              }
          }
      }

      if (status === 'encounter' && activeEncounter) {
        if (!lastChoiceResult) {
          const num = parseInt(key);
          if (!isNaN(num) && num > 0 && num <= activeEncounter.choices.length) {
            handleChoice(activeEncounter.choices[num - 1]);
          }
        } else if (key === ' ' || key === 'enter') {
          playSound('confirm');
          closeEncounter();
        }
      }
      if ((status === 'gameover' || status === 'victory') && (key === 'r' || key === 'enter')) {
        startGame();
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [status, isPaused, activeEncounter, lastChoiceResult, flags, resources, npcs, playerPos]);

  const handleChoice = (choice: Choice) => {
    const hasRequiredFlag = 
      (!choice.requiredFlag) || 
      (flags.has(choice.requiredFlag)) || 
      (choice.requiredFlag === 'reputation_15' && resources.reputation >= 15) ||
      (choice.requiredFlag === 'reputation_10' && resources.reputation >= 10) ||
      (choice.requiredFlag === 'reputation_5' && resources.reputation >= 5) ||
      (choice.requiredFlag === 'reputation_3' && resources.reputation >= 3);

    const hasRequiredPassenger = 
      (!choice.requiredPassengerType) || 
      (resources.passengers.some(p => p.type === choice.requiredPassengerType));

    if (!hasRequiredFlag || !hasRequiredPassenger) return;

    const hasMerchant = resources.passengers.some(p => p.type === 'merchant');
    const hasScholar = resources.passengers.some(p => p.type === 'scholar');
    const hasGuard = resources.passengers.some(p => p.type === 'guard');

    let goldGainMod = (choice.goldGain || 0);
    if (goldGainMod > 0 && hasMerchant) goldGainMod = Math.floor(goldGainMod * 1.15);

    let repGainMod = (choice.reputationGain || 0);
    if (repGainMod > 0 && hasScholar) repGainMod += 5;

    let foodGainMod = (choice.foodGain || 0);
    if (hasGuard && choice.id !== 'rob_cart') foodGainMod += 5;

    playSound('trade');
    setResources(prev => ({
      ...prev,
      food: Math.max(0, Math.min(100, prev.food - (choice.foodCost || 0) + foodGainMod)),
      gold: Math.max(0, prev.gold - (choice.goldCost || 0) + goldGainMod),
      reputation: prev.reputation - (choice.reputationCost || 0) + repGainMod
    }));

    if (choice.flagToSet) setFlags(prev => new Set(prev).add(choice.flagToSet!));
    if (choice.action) setPendingAction(choice.action);
    setLastChoiceResult(choice.consequenceText);
  };

  const closeEncounter = () => {
    const action = pendingAction;
    setPendingAction(null);
    setActiveEncounter(null);
    setLastChoiceResult(null);

    if (action === 'continue_journey') {
      playSound('victory');
      setResources(prev => ({ ...prev, journeyCount: prev.journeyCount + 1, progress: 0 }));
      setNpcs([]);
      setStatus('playing');
    } else if (action === 'end_journey') {
      playSound('victory');
      stopAllAudio();
      const type: VictoryType = resources.reputation >= 20 ? 'hero' : (resources.gold >= 250 ? 'merchant_prince' : 'survivor');
      setVictoryType(type);
      setStatus('victory');
    } else if (action === 'remove_passenger') {
        setResources(prev => ({
            ...prev,
            passengers: prev.passengers.length > 0 ? prev.passengers.slice(1) : []
        }));
        setStatus('playing');
    } else {
      setStatus('playing');
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#111] text-stone-100 overflow-hidden select-none">
      <GameCanvas 
        playerPos={playerPos} 
        npcs={npcs} 
        scrollOffset={scrollOffset}
        status={status}
        progress={resources.progress}
        passengers={resources.passengers}
      />

      {status !== 'title' && status !== 'story' && status !== 'how-to' && (
        <>
          <UIOverlay 
            resources={resources} 
            musicVolume={musicVolume}
            ambientVolume={ambientVolume}
            onSetMusicVolume={setMusicVolume}
            onSetAmbientVolume={setAmbientVolume}
            onPlaySound={playSound}
          />
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10">
            <div className="bg-black/60 border-2 border-white/20 px-6 py-1 text-pixel text-xl text-amber-300 shadow-lg">
              CHUNKS: {resources.journeyCount}
            </div>
            <div className="bg-black/80 border-2 border-yellow-400 px-4 py-0.5 text-pixel text-3xl text-yellow-400 mt-2 shadow-2xl animate-pulse">
              SCORE: {resources.score}
            </div>
          </div>
        </>
      )}

      {isPaused && (
          <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
              <div className="mc-container p-12 text-center border-[8px] border-black shadow-[0_0_80px_rgba(0,0,0,0.8)]">
                  <h2 className="text-8xl font-black text-pixel text-white uppercase italic animate-pulse mb-4">PAUSED</h2>
                  <p className="text-3xl text-yellow-400 font-bold tracking-widest uppercase">Press [P] to Resume Journey</p>
                  <div className="mt-8 flex justify-center gap-8">
                      <div className="flex flex-col items-center">
                          <span className="text-white/40 uppercase text-xs mb-2">Sound</span>
                          <div className="w-32 h-2 bg-white/10 border border-black overflow-hidden">
                              <div className="h-full bg-indigo-500" style={{width: `${musicVolume * 100}%`}}></div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {(status === 'title' || status === 'story' || status === 'how-to') && (
        <TitleScreen 
            onStart={startGame} 
            onInitAudio={handleInitAudio}
            onPlaySound={playSound}
            musicVolume={musicVolume}
            ambientVolume={ambientVolume}
            onSetMusicVolume={setMusicVolume}
            onSetAmbientVolume={setAmbientVolume}
        />
      )}

      {status === 'encounter' && activeEncounter && (
        <ChoiceModal 
          encounter={activeEncounter} 
          onChoice={handleChoice} 
          result={lastChoiceResult}
          onClose={closeEncounter}
          flags={flags}
          reputation={resources.reputation}
          passengers={resources.passengers}
          onPlaySound={playSound}
        />
      )}

      {(status === 'gameover' || status === 'victory') && (
        <EndScreen status={status} victoryType={victoryType} resources={resources} onRestart={startGame} onPlaySound={playSound} />
      )}
    </div>
  );
};

export default App;
