import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ResourceState, GameStatus, Encounter, Choice, VictoryType, NPC, Passenger } from './types';
import { INITIAL_RESOURCES, PLAYER_SPEED, SCROLL_SPEED, FOOD_DRAIN_RATE, WORLD_WIDTH, WORLD_HEIGHT, ROAD_TOP, ROAD_BOTTOM, INTERACTION_RANGE } from './constants';
import { ENCOUNTERS } from './data/gameData';
import GameCanvas from './components/GameCanvas';
import ChoiceModal from './components/ChoiceModal';
import UIOverlay from './components/UIOverlay';
import EndScreen from './components/EndScreen';
import TitleScreen from './components/TitleScreen';
import { GoogleGenAI, Modality } from "@google/genai";

// --- ENHANCED AUDIO ENGINE ---
let audioCtx: AudioContext | null = null;
let bgmGain: GainNode | null = null;
let ambientGain: GainNode | null = null;
let introGain: GainNode | null = null;
let isBgmPlaying = false;
let isIntroPlaying = false;

const BASE_INTRO_GAIN = 0.5;
const BASE_BGM_GAIN = 0.6;
const BASE_AMBIENT_GAIN = 0.6;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
};

// Decodes raw PCM from Gemini TTS
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

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

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
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
      osc.start(); osc.stop(now + 0.1);
      break;
    case 'confirm':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.exponentialRampToValueAtTime(1046, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
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

  const [musicVolume, setMusicVolume] = useState(0.5);
  const [ambientVolume, setAmbientVolume] = useState(0.5);

  const keys = useRef<Set<string>>(new Set());
  const requestRef = useRef<number>();
  const lastUpdate = useRef<number>(Date.now());
  const spawnTimer = useRef<number>(0);

  useEffect(() => {
    if (audioCtx) {
      if (bgmGain) bgmGain.gain.setTargetAtTime(BASE_BGM_GAIN * musicVolume * (isPaused ? 0.05 : 0.15), audioCtx.currentTime, 0.1);
      if (introGain) introGain.gain.setTargetAtTime(BASE_INTRO_GAIN * musicVolume * 0.15, audioCtx.currentTime, 0.1);
      if (ambientGain) ambientGain.gain.setTargetAtTime(BASE_AMBIENT_GAIN * ambientVolume * (isPaused ? 0.05 : 0.2), audioCtx.currentTime, 0.1);
    }
  }, [musicVolume, ambientVolume, isPaused]);

  const playNarration = async (text: string) => {
    if (!audioCtx) return;
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `In a gravelly, old-timey arcade narrator voice, say: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
          },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), audioCtx, 24000, 1);
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        const nGain = audioCtx.createGain();
        nGain.gain.value = 1.0;
        source.connect(nGain);
        nGain.connect(audioCtx.destination);
        source.start();
      }
    } catch (e) { console.error("TTS Failed", e); }
  };

  const startIntroMusic = useCallback(() => {
    if (isIntroPlaying || !audioCtx) return;
    isIntroPlaying = true;
    introGain = audioCtx.createGain();
    introGain.gain.setValueAtTime(0, audioCtx.currentTime);
    introGain.gain.linearRampToValueAtTime(BASE_INTRO_GAIN * musicVolume * 0.15, audioCtx.currentTime + 2);
    introGain.connect(audioCtx.destination);

    const notes = [220.00, 261.63, 293.66, 329.63, 392.00, 440.00]; 
    const bassNotes = [110.00, 130.81, 146.83]; 
    let i = 0;
    const play = () => {
      if (!isIntroPlaying || !audioCtx) return;
      const now = audioCtx.currentTime;
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
      if (i % 4 === 0) {
        const bOsc = audioCtx.createOscillator();
        bOsc.type = 'sine';
        bOsc.frequency.setValueAtTime(bassNotes[(i / 4) % bassNotes.length], now);
        const bEnv = audioCtx.createGain();
        bEnv.gain.setValueAtTime(0, now);
        bEnv.gain.linearRampToValueAtTime(0.15, now + 1);
        bEnv.gain.exponentialRampToValueAtTime(0.001, now + 4);
        bOsc.connect(bEnv); bEnv.connect(introGain!);
        bOsc.start(); bOsc.stop(now + 4);
      }
      i++;
      setTimeout(play, 1500);
    };
    play();
  }, [musicVolume]);

  const startBGM = useCallback(() => {
    if (isBgmPlaying || !audioCtx) return;
    isBgmPlaying = true;
    bgmGain = audioCtx.createGain();
    bgmGain.gain.setValueAtTime(0, audioCtx.currentTime);
    bgmGain.gain.linearRampToValueAtTime(BASE_BGM_GAIN * musicVolume * 0.15, audioCtx.currentTime + 3);
    bgmGain.connect(audioCtx.destination);

    const bassNotes = [73.42, 73.42, 82.41, 98.00]; 
    const leadNotes = [146.83, 164.81, 196.00, 220.00, 246.94];
    let step = 0;

    const loop = () => {
      if (!isBgmPlaying || !audioCtx) return;
      const now = audioCtx.currentTime;
      
      // Bass
      if (step % 2 === 0) {
        const bOsc = audioCtx.createOscillator();
        bOsc.type = 'triangle';
        bOsc.frequency.setValueAtTime(bassNotes[(step / 2) % bassNotes.length], now);
        const bEnv = audioCtx.createGain();
        bEnv.gain.setValueAtTime(0.1, now);
        bEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        bOsc.connect(bEnv); bEnv.connect(bgmGain!);
        bOsc.start(); bOsc.stop(now + 0.4);
      }

      // Lead
      if (step % 4 === 0 || (step % 4 === 2 && Math.random() > 0.5)) {
        const osc = audioCtx.createOscillator();
        osc.type = 'square';
        const freq = leadNotes[Math.floor(Math.random() * leadNotes.length)];
        osc.frequency.setValueAtTime(freq, now);
        const env = audioCtx.createGain();
        env.gain.setValueAtTime(0.05, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(env); env.connect(bgmGain!);
        osc.start(); osc.stop(now + 0.2);
      }

      // Kick Drum
      if (step % 4 === 0) {
        const kOsc = audioCtx.createOscillator();
        kOsc.frequency.setValueAtTime(150, now);
        kOsc.frequency.exponentialRampToValueAtTime(0.01, now + 0.1);
        const kEnv = audioCtx.createGain();
        kEnv.gain.setValueAtTime(0.2, now);
        kEnv.gain.linearRampToValueAtTime(0, now + 0.1);
        kOsc.connect(kEnv); kEnv.connect(bgmGain!);
        kOsc.start(); kOsc.stop(now + 0.1);
      }

      // Hi-Hat / Snare
      if (step % 2 === 1) {
        const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.05, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for(let i=0; i<data.length; i++) data[i] = Math.random() * 2 - 1;
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const nEnv = audioCtx.createGain();
        nEnv.gain.setValueAtTime(0.03, now);
        nEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        noise.connect(nEnv); nEnv.connect(bgmGain!);
        noise.start();
      }

      step++;
      setTimeout(loop, 220); 
    };
    loop();
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
    ambientGain.gain.linearRampToValueAtTime(BASE_AMBIENT_GAIN * ambientVolume * 0.2, audioCtx.currentTime + 2);
    noise.connect(filter); filter.connect(ambientGain);
    ambientGain.connect(audioCtx.destination);
    noise.start();
  }, [ambientVolume]);

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
    if (rand < 0.35) {
      type = 'coin'; 
      eId = Math.random() < 0.1 ? 'big_coin' : 'small_coin'; 
    } else if (rand < 0.5 && resources.progress < 90) {
      type = 'person';
      const pType = Array.from(['merchant', 'cook', 'scholar', 'guard'])[Math.floor(Math.random() * 4)] as Passenger['type'];
      passenger = { id: Math.random().toString(), name: "Traveler", type: pType, bonusText: "Ready for hire" };
    } else {
      eId = encounterPool[Math.floor(Math.random() * encounterPool.length)];
      if (resources.progress > 45 && resources.progress < 55) eId = 'waystation';
      if (resources.progress >= 95) eId = 'haven_checkpoint';
      type = (eId === 'haven_checkpoint' ? 'haven' : 'trader');
    }
    const newNpc: NPC = {
      id: Math.random().toString(),
      x: WORLD_WIDTH + 100,
      y: ROAD_TOP + Math.random() * (ROAD_BOTTOM - ROAD_TOP - 40),
      type, encounterId: eId,
      width: type === 'coin' ? 32 : 48,
      height: type === 'coin' ? 32 : 48,
      speedMultiplier: 0.5 + Math.random() * 0.5,
      passengerData: passenger
    };
    setNpcs(prev => [...prev, newNpc]);
  }, [resources.progress]);

  const gameLoop = useCallback(() => {
    if (status !== 'playing' || isPaused) {
      requestRef.current = requestAnimationFrame(gameLoop);
      return;
    }
    const currentSpeed = PLAYER_SPEED * (flags.has('speed_upgrade') ? 1.4 : 1.0);
    setPlayerPos(prev => {
      let nx = prev.x, ny = prev.y;
      if (keys.current.has('w') || keys.current.has('arrowup')) ny -= currentSpeed;
      if (keys.current.has('s') || keys.current.has('arrowdown')) ny += currentSpeed;
      if (keys.current.has('a') || keys.current.has('arrowleft')) nx -= currentSpeed;
      if (keys.current.has('d') || keys.current.has('arrowright')) nx += currentSpeed;
      return { x: Math.max(50, Math.min(WORLD_WIDTH - 50, nx)), y: Math.max(ROAD_TOP + 20, Math.min(ROAD_BOTTOM - 20, ny)) };
    });
    setResources(prev => {
      const isMoving = keys.current.size > 0;
      let drainMultiplier = 1.0;
      if (prev.passengers.some(p => p.type === 'cook')) drainMultiplier *= 0.8;
      if (flags.has('efficiency_upgrade')) drainMultiplier *= 0.75;
      let nextFood = Math.max(0, prev.food - (isMoving ? FOOD_DRAIN_RATE * 2 : FOOD_DRAIN_RATE) * drainMultiplier);
      let nextLives = prev.lives;
      if (nextFood <= 0) {
        if (nextLives > 1) { playSound('hurt'); nextLives -= 1; nextFood = 50; }
        else { playSound('gameover'); setStatus('gameover'); stopAllAudio(); }
      }
      return { ...prev, food: nextFood, lives: nextLives, progress: Math.min(100, prev.progress + (SCROLL_SPEED / 80)), score: (prev.gold * 10) + (prev.reputation * 50) + Math.floor(prev.progress * 10) };
    });
    setScrollOffset(prev => (prev + SCROLL_SPEED) % 100);
    setNpcs(prev => {
      const updated = prev.map(n => ({ ...n, x: n.x - SCROLL_SPEED * n.speedMultiplier })).filter(n => n.x > -150);
      const coinHitIndex = updated.findIndex(n => n.type === 'coin' && Math.abs(n.x - playerPos.x) < 35 && Math.abs(n.y - playerPos.y) < 35);
      if (coinHitIndex !== -1) {
        playSound('trade');
        const val = updated[coinHitIndex].encounterId === 'big_coin' ? 25 : 5;
        setResources(r => ({ ...r, gold: r.gold + val }));
        return updated.filter((_, i) => i !== coinHitIndex);
      }
      const hit = updated.find(n => n.type !== 'person' && n.type !== 'coin' && Math.abs(n.x - playerPos.x) < 45 && Math.abs(n.y - playerPos.y) < 45);
      if (hit) {
        playSound('collision');
        setActiveEncounter(ENCOUNTERS[hit.encounterId]);
        setStatus('encounter');
        return updated.filter(n => n.id !== hit.id);
      }
      return updated;
    });
    spawnTimer.current += 16;
    if (spawnTimer.current > 1300 && resources.progress < 95) { spawnNPC(); spawnTimer.current = 0; }
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [status, playerPos, spawnNPC, isPaused, flags, musicVolume, ambientVolume]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [gameLoop]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'p') { setIsPaused(prev => !prev); playSound('select'); return; }
      keys.current.add(key);
      if (status === 'playing' && key === 'e') {
        const idx = npcs.findIndex(n => n.type === 'person' && Math.abs(n.x - playerPos.x) < INTERACTION_RANGE);
        if (idx !== -1) {
          const cap = flags.has('capacity_upgrade') ? 5 : 3;
          if (resources.passengers.length < cap) {
            playSound('onboard');
            setResources(prev => ({ ...prev, passengers: [...prev.passengers, npcs[idx].passengerData!] }));
            setNpcs(prev => prev.filter((_, i) => i !== idx));
          }
        }
      }
      if (status === 'encounter' && activeEncounter && !lastChoiceResult) {
        const num = parseInt(key);
        if (!isNaN(num) && num > 0 && num <= activeEncounter.choices.length) handleChoice(activeEncounter.choices[num - 1]);
      } else if (status === 'encounter' && lastChoiceResult && (key === ' ' || key === 'enter')) {
        playSound('confirm'); closeEncounter();
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [status, isPaused, activeEncounter, lastChoiceResult, npcs, playerPos]);

  const handleChoice = (choice: Choice) => {
    const hasRep = (choice.requiredFlag === 'reputation_10' ? resources.reputation >= 10 : true);
    if (!hasRep) return;
    playSound('trade');
    setResources(prev => ({
      ...prev,
      food: Math.max(0, Math.min(100, prev.food - (choice.foodCost || 0) + (choice.foodGain || 0))),
      gold: Math.max(0, prev.gold - (choice.goldCost || 0) + (choice.goldGain || 0)),
      reputation: prev.reputation - (choice.reputationCost || 0) + (choice.reputationGain || 0)
    }));
    if (choice.flagToSet) setFlags(prev => new Set(prev).add(choice.flagToSet!));
    if (choice.action) setPendingAction(choice.action);
    setLastChoiceResult(choice.consequenceText);
  };

  const closeEncounter = () => {
    const action = pendingAction;
    setPendingAction(null); setActiveEncounter(null); setLastChoiceResult(null);
    if (action === 'continue_journey') { setResources(prev => ({ ...prev, journeyCount: prev.journeyCount + 1, progress: 0 })); setNpcs([]); setStatus('playing'); }
    else if (action === 'end_journey') { setVictoryType('hero'); setStatus('victory'); stopAllAudio(); }
    else setStatus('playing');
  };

  return (
    <div className="relative w-full h-screen bg-[#111] text-stone-100 overflow-hidden select-none">
      <GameCanvas playerPos={playerPos} npcs={npcs} scrollOffset={scrollOffset} status={status} progress={resources.progress} passengers={resources.passengers} />
      {status !== 'title' && status !== 'gameover' && status !== 'victory' && (
        <UIOverlay resources={resources} flags={flags} musicVolume={musicVolume} ambientVolume={ambientVolume} onSetMusicVolume={setMusicVolume} onSetAmbientVolume={setAmbientVolume} onPlaySound={playSound} />
      )}
      {(status === 'title') && (
        <TitleScreen onStart={startGame} onInitAudio={handleInitAudio} onPlaySound={playSound} musicVolume={musicVolume} ambientVolume={ambientVolume} onSetMusicVolume={setMusicVolume} onSetAmbientVolume={setAmbientVolume} onNarrate={playNarration} />
      )}
      {status === 'encounter' && activeEncounter && (
        <ChoiceModal encounter={activeEncounter} onChoice={handleChoice} result={lastChoiceResult} onClose={closeEncounter} flags={flags} reputation={resources.reputation} passengers={resources.passengers} onPlaySound={playSound} />
      )}
      {(status === 'gameover' || status === 'victory') && (
        <EndScreen status={status} victoryType={victoryType} resources={resources} onRestart={startGame} onPlaySound={playSound} />
      )}
      {isPaused && (
          <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
              <div className="mc-container p-12 text-center border-[8px] border-black shadow-[0_0_80px_rgba(0,0,0,0.8)] space-y-8">
                  <h2 className="text-8xl font-black text-pixel text-white uppercase italic animate-pulse">PAUSED</h2>
                  <p className="text-3xl text-yellow-400 font-bold tracking-widest uppercase">Journey in Progress</p>
                  <div className="flex flex-col gap-4">
                    <button 
                      onClick={() => { setIsPaused(false); playSound('confirm'); }}
                      className="mc-button text-4xl bg-emerald-600 border-emerald-400"
                    >
                      RESUME [P]
                    </button>
                    <button 
                      onClick={() => {
                        setIsPaused(false);
                        stopAllAudio();
                        setStatus('title');
                        startIntroMusic();
                        playSound('select');
                      }}
                      className="mc-button text-3xl bg-red-800 border-red-600"
                    >
                      ABANDON JOURNEY
                    </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
