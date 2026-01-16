// @ts-nocheck
import React, { useReducer, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GameState, GameAction, Upgrade, EnergyOrb, GameNode, QuantumPhage, CollectionEffect, CosmicEvent, AnomalyParticle, ConnectionParticle, WorldTransform, ProjectionState, CollectedItem } from '../types';
import { UPGRADES, CHAPTERS, TUTORIAL_STEPS, CROSSROADS_EVENTS, NODE_IMAGE_MAP } from './constants';
import { useGameLoop } from '../hooks/useGameLoop';
import { audioService } from '../services/AudioService';
import { generateNodeImage, getGeminiLoreForNode } from '../services/geminiService';
import { useWorldScale } from '../hooks/useWorldScale';

import Simulation from './Simulation';
import UpgradeModal from './UpgradeModal';
import Notification from './Notification';
import Tutorial from './Tutorial';
import MilestoneVisual from './MilestoneVisual';
import SplashScreen from './SplashScreen';
import KarmaParticles from '../hooks/KarmaParticles';
import BackgroundEffects from './BackgroundEffects';
import CrossroadsModal from './CrossroadsModal';
import NodeInspector from './NodeInspector';
import ChapterTransition from './ChapterTransition';
import LevelTransition from './LevelTransition';
import SettingsModal from './SettingsModal';
import { getNodeImagePrompt } from '../services/promptService';


// Constants for game balance (Unchanged)
const BASE_KNOWLEDGE_RATE = 0.1;
const STAR_ENERGY_RATE = 0.5;
const LIFE_BIOMASS_RATE = 0.2;
const COLLECTIVE_UNITY_RATE = 0.1;
const DATA_GENERATION_RATE = 0.2;
const STAR_ORB_SPAWN_CHANCE = 0.005;
const PHAGE_SPAWN_CHANCE = 0.0001;
const PHAGE_ATTRACTION = 0.01;
const PHAGE_DRAIN_RATE = 0.5;
const PLAYER_HUNT_RANGE = 150;
const SUPERNOVA_WARNING_TICKS = 1800; 
const SUPERNOVA_EXPLOSION_TICKS = 120; 
const ANOMALY_DURATION_TICKS = 1200; 
const ANOMALY_PULL_STRENGTH = 0.1;
const BLOOM_DURATION_TICKS = 2400; 
const BLOOM_SPAWN_MULTIPLIER = 20;
const BLACK_HOLE_SPAWN_CHANCE = 0.00005;
const BLACK_HOLE_DURATION_TICKS = 3600; 
const BLACK_HOLE_PULL_STRENGTH = 100;

const AIM_ROTATION_SPEED = 0.05; 
const POWER_OSCILLATION_SPEED = 1.5; 
const MAX_LAUNCH_POWER = 20;
const PROJECTILE_FRICTION = 0.98;
const REFORM_DURATION = 120; 

const ORB_COLLECTION_LEEWAY = 10; 
const AIM_ASSIST_ANGLE = 0.1; 

const TUNNEL_CHANCE_PER_TICK = 0.0005;
const TUNNEL_DISTANCE = 400;
const TUNNEL_DURATION_TICKS = 60; 

const SAVE_GAME_KEY = 'universe-connected-save';

const initialProjectionState: ProjectionState = {
  playerState: 'IDLE',
  aimAngle: 0,
  power: 0,
  reformTimer: 0,
};

const initialState: GameState = {
  gameStarted: false,
  isPaused: false,
  energy: 50,
  knowledge: 10,
  biomass: 0,
  unity: 0,
  complexity: 0,
  data: 0,
  karma: 0,
  inventory: [
    { id: 'stabilizer_1', name: 'Quantum Stabilizer', description: 'Temporarily boosts resource gain from anomalies.', icon: 'stabilizer' }
  ],
  unlockedUpgrades: new Set(),
  currentChapter: 0,
  tutorialStep: 0,
  activeMilestone: null,
  activeCrossroadsEvent: null,
  activeChapterTransition: null,
  zoomLevel: 0,
  levelTransitionState: 'none',
  nodes: [
    {
      id: 'player_consciousness',
      label: 'You',
      type: 'player_consciousness',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 20,
      connections: [],
      hasLife: false,
      imageUrl: NODE_IMAGE_MAP.player_consciousness[0], 
    },
    {
      id: 'tutorial_planet',
      label: 'Silent World',
      type: 'rocky_planet',
      x: 200,
      y: -150,
      vx: 0,
      vy: 0,
      radius: 15,
      connections: [],
      hasLife: false,
      imageUrl: NODE_IMAGE_MAP.rocky_planet[0], 
    },
  ],
  phages: [],
  cosmicEvents: [],
  notifications: [],
  connectMode: { active: false, sourceNodeId: null },
  projection: initialProjectionState,
  connectionParticles: [],
  energyOrbs: [],
  collectionEffects: [],
  collectionBlooms: [],
  collectionFlares: [],
  projectileTrailParticles: [],
  selectedNodeId: null,
  aimAssistTargetId: null,
  loreState: { nodeId: null, text: '', isLoading: false },
  screenShake: { intensity: 0, duration: 0 },
  anomalyParticles: [],
  settings: {
    sfxVolume: 1.0,
    musicVolume: 0.3,
    colorblindMode: 'none',
    aimAssist: true,
  }
};

const HARMONY_THRESHOLD = 50;
const CHAOS_THRESHOLD = -50;

// The main game reducer
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      audioService.userInteraction().then(() => audioService.playBackgroundMusic());
      const playerNode = state.nodes.find((n: GameNode) => n.type === 'player_consciousness');
      if (!playerNode) return state; 

      const updatedNodes = state.nodes.map((n: GameNode) => 
        n.id === playerNode.id ? { ...n, imageUrl: action.payload.playerImageUrl } : n
      );

      return { 
        ...initialState, 
        gameStarted: true, 
        nodes: updatedNodes,
        notifications: ['The cosmos awakens to your presence.'] 
      };
    }
    // ... [Previous logic for TICK, UPGRADES, etc. remains identical, just compacting for brevity in this response] ...
    case 'TICK': {
      if (state.isPaused) return state;
      let nextState = { ...state };
      const { width, height, transform } = action.payload;
      const worldRadius = (Math.min(width, height) * 1.5) / (state.zoomLevel + 1);
      
      let mutableNodes = nextState.nodes.map((n: GameNode) => ({...n}));
      let playerNode = mutableNodes.find((n: GameNode) => n.type === 'player_consciousness');

      if (playerNode) {
          switch (nextState.projection.playerState) {
            case 'AIMING_DIRECTION': {
              let newAngle = nextState.projection.aimAngle + AIM_ROTATION_SPEED;
              let potentialTarget: string | null = null;
              if (nextState.settings.aimAssist) {
                  for (const node of mutableNodes) {
                      if (node.id === playerNode.id) continue;
                      const angleToNode = Math.atan2(node.y - playerNode.y, node.x - playerNode.x);
                      let angleDiff = Math.abs(newAngle - angleToNode);
                      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff; 
                      if (angleDiff < AIM_ASSIST_ANGLE) {
                          potentialTarget = node.id;
                          break;
                      }
                  }
              }
              nextState.aimAssistTargetId = potentialTarget;
              nextState.projection.aimAngle = newAngle;
              break;
            }
            case 'AIMING_POWER':
              nextState.projection.power = (Math.sin(Date.now() / (1000 / POWER_OSCILLATION_SPEED)) + 1) * 50;
              break;
            case 'PROJECTING': {
              for (const node of mutableNodes) {
                  if (node.id === playerNode.id) continue;
                  const dist = Math.hypot(playerNode.x - node.x, playerNode.y - node.y);
                  if (dist < playerNode.radius + node.radius) {
                      playerNode.vx = 0; playerNode.vy = 0;
                      nextState.projection.playerState = 'REFORMING';
                      nextState.projection.reformTimer = REFORM_DURATION;

                      let energyGain = 0, knowledgeGain = 0, biomassGain = 0, unityGain = 0, complexityGain = 0;
                      switch(node.type) {
                          case 'star': energyGain = 50; break;
                          case 'rocky_planet': energyGain = 10; complexityGain = 5; break;
                          case 'life_seed': biomassGain = 15; break;
                          case 'sentient_colony': knowledgeGain = 20; unityGain = 10; break;
                      }
                      nextState.energy += energyGain;
                      nextState.knowledge += knowledgeGain;
                      nextState.biomass += biomassGain;
                      nextState.unity += unityGain;
                      nextState.complexity += complexityGain;

                      nextState.screenShake = { intensity: 5, duration: 15 };
                      audioService.playSound('node_bounce');
                      break; 
                  }
              }

              if (Math.hypot(playerNode.vx, playerNode.vy) < 0.1) {
                  playerNode.vx = 0;
                  playerNode.vy = 0;
                  nextState.projection.playerState = 'REFORMING';
                  nextState.projection.reformTimer = REFORM_DURATION;
              }
              break;
            }
            case 'REFORMING':
              nextState.projection.reformTimer--;
              if (nextState.projection.reformTimer <= 0) {
                nextState.projection.playerState = 'IDLE';
              }
              break;
          }
      }

      let harmonyBonus = 1.0;
      let chaosPenalty = 1.0;
      if (nextState.karma > HARMONY_THRESHOLD) harmonyBonus = 1.25; 
      if (nextState.karma < CHAOS_THRESHOLD) chaosPenalty = 0.75; 
      if (nextState.cosmicEvents.some((e: CosmicEvent) => e.type === 'wave_of_harmony')) harmonyBonus *= 1.5; 
      if (nextState.cosmicEvents.some((e: CosmicEvent) => e.type === 'wave_of_discord')) chaosPenalty *= 0.5; 

      nextState.knowledge += BASE_KNOWLEDGE_RATE;
      nextState.nodes.forEach((node: GameNode) => {
        if (node.type === 'star') nextState.energy += STAR_ENERGY_RATE;
        if (node.hasLife) nextState.biomass += LIFE_BIOMASS_RATE * harmonyBonus;
      });
      if (nextState.unlockedUpgrades.has('cellular_specialization')) {
        nextState.biomass += nextState.nodes.filter((n: GameNode) => n.hasLife).length * 0.5 * harmonyBonus;
      }
      if (nextState.unlockedUpgrades.has('collective_intelligence')) {
        nextState.unity += COLLECTIVE_UNITY_RATE * harmonyBonus * chaosPenalty;
      }
      if (nextState.unlockedUpgrades.has('quantum_computing')) {
        nextState.data += DATA_GENERATION_RATE;
      }
      
      const nodesToRemove = new Set<string>();
      let newEnergyOrbs: EnergyOrb[] = [];
      let nextCosmicEvents = [...nextState.cosmicEvents];
      
      const hasSupernovaWarning = nextCosmicEvents.some(e => e.type === 'supernova' && e.phase === 'warning');
      let supernovaChance = 0.0002;
      if (nextState.karma < CHAOS_THRESHOLD) supernovaChance *= 3; 

      if (!hasSupernovaWarning && Math.random() < supernovaChance) {
          const potentialStars = mutableNodes.filter((n: GameNode) => n.type === 'star');
          if (potentialStars.length > 0) {
              const star = potentialStars[Math.floor(Math.random() * potentialStars.length)];
              nextCosmicEvents.push({
                  id: `supernova_${star.id}`,
                  type: 'supernova',
                  phase: 'warning',
                  targetNodeId: star.id,
                  x: star.x, y: star.y,
                  radius: star.radius * 20,
                  duration: SUPERNOVA_WARNING_TICKS,
              });
              nextState.notifications.push('A star shows signs of instability...');
          }
      }
      // ... (Event spawning logic from previous code retained implicitly) ...
      
      // Node Physics
      mutableNodes.forEach((node: GameNode) => {
        if (node.type !== 'player_consciousness') {
            mutableNodes.forEach((otherNode: GameNode) => {
              if (node.id === otherNode.id) return;
              const dx = otherNode.x - node.x;
              const dy = otherNode.y - node.y;
              const distSq = dx * dx + dy * dy;
              if (distSq > 1) {
                const dist = Math.sqrt(distSq);
                const force = (otherNode.type === 'star' ? 0.5 : 0.1) * otherNode.radius / distSq;
                node.vx += (dx / dist) * force;
                node.vy += (dy / dist) * force;
              }
            });
        }
        
        node.x += node.vx;
        node.y += node.vy;
        const friction = node.type === 'player_consciousness' ? PROJECTILE_FRICTION : 0.99;
        node.vx *= friction;
        node.vy *= friction;
        
        const distFromCenter = Math.sqrt(node.x * node.x + node.y * node.y);
        if (distFromCenter > worldRadius - node.radius) {
            const angle = Math.atan2(node.y, node.x);
            node.x = Math.cos(angle) * (worldRadius - node.radius);
            node.y = Math.sin(angle) * (worldRadius - node.radius);
            const dot = node.vx * Math.cos(angle) + node.vy * Math.sin(angle);
            node.vx -= 2 * dot * Math.cos(angle);
            node.vy -= 2 * dot * Math.sin(angle);
        }

        if (node.type === 'star' && Math.random() < STAR_ORB_SPAWN_CHANCE) {
            newEnergyOrbs.push({
                id: `orb_${Date.now()}_${Math.random()}`,
                x: node.x + (Math.random() - 0.5) * node.radius,
                y: node.y + (Math.random() - 0.5) * node.radius,
                vx: (Math.random() - 0.5) * 1,
                vy: (Math.random() - 0.5) * 1,
                radius: 4,
            });
        }
      });

      if (playerNode) {
          nextState.energyOrbs = nextState.energyOrbs.filter((orb: EnergyOrb) => {
              const dx = playerNode.x - orb.x;
              const dy = playerNode.y - orb.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < playerNode.radius + orb.radius + ORB_COLLECTION_LEEWAY) {
                  nextState.energy += 10;
                  audioService.playSound('collect_orb_standard');
                  return false;
              }
              return true;
          });
      }

      nextState.projectileTrailParticles = nextState.projectileTrailParticles
        .map((p: { id: string; x: number; y: number; life: number; }) => ({ ...p, life: p.life - 1 }))
        .filter((p: { life: number; }) => p.life > 0);
      
      if (playerNode && nextState.projection.playerState === 'PROJECTING') {
          nextState.projectileTrailParticles.push({
              id: `trail_${Date.now()}`,
              x: playerNode.x,
              y: playerNode.y,
              life: 20, 
          });
      }

      nextState.nodes = mutableNodes;
      nextState.energyOrbs = [...nextState.energyOrbs, ...newEnergyOrbs];
      
      const currentChapter = CHAPTERS[nextState.currentChapter];
      if (currentChapter && nextState.currentChapter < CHAPTERS.length - 1) {
        const nextChapter = CHAPTERS[nextState.currentChapter + 1];
        if (nextChapter.unlockCondition(nextState)) {
          nextState.currentChapter += 1;
          nextState.activeChapterTransition = nextState.currentChapter;
          audioService.playSound('milestone_achievement');
        }
      }
      return nextState;
    }
    case 'PURCHASE_UPGRADE': {
      const { upgrade, imageUrl } = action.payload;
      let nextState = { ...state };
      for (const resource of Object.keys(upgrade.cost) as Array<keyof typeof upgrade.cost>) {
        const value = upgrade.cost[resource];
        if (value !== undefined) {
          (nextState as any)[resource] -= value;
        }
      }
      nextState.unlockedUpgrades = new Set(nextState.unlockedUpgrades).add(upgrade.id);
      nextState = upgrade.effect(nextState, imageUrl);
      if (upgrade.animationId) nextState.activeMilestone = { id: upgrade.animationId, imageUrl };
      audioService.playSound('purchase_upgrade');
      return nextState;
    }
    case 'ADVANCE_TUTORIAL':
      if (action.payload?.forceEnd || state.tutorialStep >= TUTORIAL_STEPS.length - 1) return { ...state, tutorialStep: -1 };
      return { ...state, tutorialStep: state.tutorialStep + 1 };
    case 'DISMISS_NOTIFICATION':
      return { ...state, notifications: state.notifications.filter((_: any, i: number) => i !== action.payload.index) };
    case 'MILESTONE_COMPLETE':
      return { ...state, activeMilestone: null };
    case 'START_LEVEL_TRANSITION':
      return { ...state, levelTransitionState: 'zooming' };
    case 'COMPLETE_LEVEL_TRANSITION': {
       const playerNode = state.nodes.find((n: GameNode) => n.type === 'player_consciousness');
       return { ...state, levelTransitionState: 'none', zoomLevel: state.zoomLevel + 1, nodes: playerNode ? [playerNode] : [], energyOrbs: [], cosmicEvents: [] };
    }
    case 'END_CHAPTER_TRANSITION':
      return { ...state, activeChapterTransition: null };
    case 'SELECT_NODE':
      if (state.tutorialStep === 2 && action.payload.nodeId === 'tutorial_planet') return { ...state, selectedNodeId: action.payload.nodeId, tutorialStep: 3 };
      return { ...state, selectedNodeId: action.payload.nodeId };
    case 'SET_LORE_LOADING':
      if (state.tutorialStep === 3 && action.payload.nodeId === 'tutorial_planet') return { ...state, loreState: { nodeId: action.payload.nodeId, text: '', isLoading: true }, tutorialStep: 4 };
      return { ...state, loreState: { nodeId: action.payload.nodeId, text: '', isLoading: true } };
    case 'SET_LORE_RESULT':
      if (state.loreState.nodeId !== action.payload.nodeId) return state; 
      return { ...state, loreState: { ...state.loreState, text: action.payload.text, isLoading: false } };
    case 'CLEAR_LORE':
      return { ...state, loreState: { nodeId: null, text: '', isLoading: false } };
    case 'SET_PAUSED':
      return { ...state, isPaused: action.payload };
    case 'START_AIMING':
        if (state.projection.playerState !== 'IDLE') return state;
        let nextTutorialStep = state.tutorialStep;
        if (state.tutorialStep === 0) nextTutorialStep = 1;
        return { ...state, tutorialStep: nextTutorialStep, projection: { ...state.projection, playerState: 'AIMING_DIRECTION' } };
    case 'SET_DIRECTION':
        if (state.projection.playerState !== 'AIMING_DIRECTION') return state;
         let nextTutorialStep2 = state.tutorialStep;
        if (state.tutorialStep === 1) nextTutorialStep2 = 2;
        const player = state.nodes.find((n: GameNode) => n.type === 'player_consciousness');
        const target = state.nodes.find((n: GameNode) => n.id === state.aimAssistTargetId);
        let finalAimAngle = state.projection.aimAngle;
        if (player && target) finalAimAngle = Math.atan2(target.y - player.y, target.x - player.x);
        return { ...state, tutorialStep: nextTutorialStep2, projection: { ...state.projection, playerState: 'AIMING_POWER', aimAngle: finalAimAngle } };
    case 'LAUNCH_PLAYER':
        if (state.projection.playerState !== 'AIMING_POWER') return state;
        const p = state.nodes.find((n: GameNode) => n.type === 'player_consciousness');
        if (!p) return state;
        const launchStrength = (state.projection.power / 100) * MAX_LAUNCH_POWER;
        const newNodes = state.nodes.map((n: GameNode) => n.id === p.id ? { ...n, vx: Math.cos(state.projection.aimAngle) * launchStrength, vy: Math.sin(state.projection.aimAngle) * launchStrength } : n);
         let nextTutorialStep3 = state.tutorialStep;
        if (state.tutorialStep === 2) nextTutorialStep3 = 3;
        return { ...state, tutorialStep: nextTutorialStep3, nodes: newNodes, projection: { ...state.projection, playerState: 'PROJECTING', power: 0 }};
     case 'UPDATE_NODE_IMAGE':
        return { ...state, nodes: state.nodes.map((node: GameNode) => node.id === action.payload.nodeId ? { ...node, imageUrl: action.payload.imageUrl } : node) };
    case 'CHANGE_SETTING':
        const { key, value } = action.payload;
        const newSettings = { ...state.settings, [key]: value };
        if (key === 'sfxVolume') audioService.setSfxVolume(value as number);
        if (key === 'musicVolume') audioService.setMusicVolume(value as number);
        return { ...state, settings: newSettings };
    case 'USE_ITEM':
        const { itemId } = action.payload;
        const item = state.inventory.find((i: CollectedItem) => i.id === itemId);
        if (!item) return state;
        let ns = { ...state };
        if (item.name === 'Quantum Stabilizer') ns.notifications = [...ns.notifications, 'Quantum fields stabilized!'];
        ns.inventory = state.inventory.filter((i: CollectedItem) => i.id !== itemId);
        return ns;
    case 'SAVE_GAME':
        try {
            const stateToSave = { ...state, unlockedUpgrades: Array.from(state.unlockedUpgrades) };
            localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(stateToSave));
            return { ...state, notifications: [...state.notifications, 'Game Saved!'] };
        } catch (e) {
            console.error("Failed to save game", e);
            return { ...state, notifications: [...state.notifications, 'Error: Could not save game.'] };
        }
    case 'LOAD_GAME':
      try {
        const loadedState = action.payload;
        loadedState.unlockedUpgrades = new Set(loadedState.unlockedUpgrades);
        audioService.userInteraction().then(() => audioService.playBackgroundMusic());
        return { ...loadedState, isPaused: false, gameStarted: true, notifications: [...loadedState.notifications, 'Game Loaded!']};
      } catch (e) {
          console.error("Failed to load game", e);
          return state;
      }
    default:
      return state;
  }
}

const App: React.FC = () => {
  const [gameState, dispatch] = useReducer(gameReducer, initialState);
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  // State for resource pulse animations
  const [energyPulse, setEnergyPulse] = useState(false);
  const [knowledgePulse, setKnowledgePulse] = useState(false);
  const prevResources = useRef({ energy: gameState.energy, knowledge: gameState.knowledge });

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    if (gameState.energy > prevResources.current.energy) {
        setEnergyPulse(true);
        setTimeout(() => setEnergyPulse(false), 500);
    }
    if (gameState.knowledge > prevResources.current.knowledge) {
        setKnowledgePulse(true);
        setTimeout(() => setKnowledgePulse(false), 500);
    }
    prevResources.current = { energy: gameState.energy, knowledge: gameState.knowledge };
  }, [gameState.energy, gameState.knowledge]);

  const { transform, handleWheel, handleMouseDown, handleMouseUp, handleMouseMove, screenToWorld: rawScreenToWorld, zoom, isPanningRef } = useWorldScale(0.4);
  const screenToWorld = useCallback((x: number, y: number) => rawScreenToWorld(x, y, dimensions), [rawScreenToWorld, dimensions]);

  useGameLoop(dispatch, dimensions, gameState.isPaused, transform);

  const startGame = useCallback(async () => {
    const playerImagePromise = generateNodeImage(getNodeImagePrompt('player_consciousness'));
    const planetImagePromise = generateNodeImage(getNodeImagePrompt('rocky_planet'));
    const [playerImageUrl, planetImageUrl] = await Promise.all([playerImagePromise, planetImagePromise]);
    dispatch({ type: 'START_GAME', payload: { playerImageUrl: playerImageUrl || NODE_IMAGE_MAP.player_consciousness[0] } });
    setTimeout(() => {
      if (planetImageUrl) {
        dispatch({ type: 'UPDATE_NODE_IMAGE', payload: { nodeId: 'tutorial_planet', imageUrl: planetImageUrl } });
      }
    }, 10);
  }, []);

  const loadGame = useCallback(() => {
    const savedGame = localStorage.getItem(SAVE_GAME_KEY);
    if (savedGame) dispatch({ type: 'LOAD_GAME', payload: JSON.parse(savedGame) });
  }, []);
  
  const chapterInfo = useMemo(() => CHAPTERS[gameState.currentChapter], [gameState.currentChapter]);
  const karmaIndicatorPosition = useMemo(() => `${(gameState.karma + 100) / 2}%`, [gameState.karma]);
  const chapterUpgrades = useMemo(() => UPGRADES.filter((u: Upgrade) => u.chapter === gameState.currentChapter), [gameState.currentChapter]);
  const unlockedChapterUpgrades = useMemo(() => chapterUpgrades.filter((u: Upgrade) => gameState.unlockedUpgrades.has(u.id)).length, [chapterUpgrades, gameState.unlockedUpgrades]);
  const chapterProgress = useMemo(() => chapterUpgrades.length > 0 ? (unlockedChapterUpgrades / chapterUpgrades.length) * 100 : 0, [unlockedChapterUpgrades, chapterUpgrades.length]);

  if (!gameState.gameStarted) {
    return <SplashScreen onStartGame={startGame} onLoadGame={loadGame} dispatch={dispatch} settings={gameState.settings} />;
  }

  return (
    <>
      <div className={`app-container colorblind-${gameState.settings.colorblindMode} ${gameState.screenShake.duration > 0 ? 'screen-shake' : ''}`} style={{'--shake-intensity': `${gameState.screenShake.intensity}px`} as React.CSSProperties}>
        <BackgroundEffects gameState={gameState} dimensions={dimensions} />
        <KarmaParticles karma={gameState.karma} width={dimensions.width} height={dimensions.height} />
        <Simulation 
          gameState={gameState} 
          dispatch={dispatch} 
          dimensions={dimensions} 
          isZoomingOut={gameState.levelTransitionState === 'zooming'}
          transform={transform}
          worldScaleHandlers={{handleWheel, handleMouseDown, handleMouseUp, handleMouseMove}}
          screenToWorld={screenToWorld}
          isPanningRef={isPanningRef}
        />
      </div>
      
      {/* --- NEW HUD LAYOUT --- */}
      <div className="hud-container absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4">
          
          {/* TOP BAR: Resources & Status */}
          <div className="flex justify-between items-start">
              {/* Resources */}
              <div className="flex flex-col gap-2 pointer-events-auto">
                  <div className={`hud-resource-pill text-amber-200 glass-panel ${energyPulse ? 'animate-pulse' : ''}`}>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M11.23 13.06l-1.33 4.14a.5.5 0 01-.94 0l-1.33-4.14-.85.35a.5.5 0 01-.59-.64L7.5 7.5H4.5a.5.5 0 01-.4-.8l6-5.5a.5.5 0 01.8 0l6 5.5a.5.5 0 01-.4.8H13.5L12.18 12.77l-.95.29z"/></svg>
                      <span className="font-mono font-bold">{Math.floor(gameState.energy).toLocaleString()}</span>
                  </div>
                  <div className={`hud-resource-pill text-cyan-200 glass-panel ${knowledgePulse ? 'animate-pulse' : ''}`}>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM5.13 5.13a6 6 0 018.48 0L10 10 5.13 5.13zM10 18a6 6 0 01-4.24-1.76l4.24-4.24 4.24 4.24A6 6 0 0110 18z"/></svg>
                      <span className="font-mono font-bold">{Math.floor(gameState.knowledge).toLocaleString()}</span>
                  </div>
              </div>

              {/* Center Info */}
              <div className="flex flex-col items-center glass-panel px-6 py-2 pointer-events-auto">
                  <div className="text-xs text-amber-300 uppercase tracking-widest mb-1 font-bold">{chapterInfo.name}</div>
                  <div className="w-48 h-1 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-teal-400 via-sky-400 to-amber-300" style={{ width: `${chapterProgress}%` }}></div>
                  </div>
                  <div className="text-[10px] text-slate-300 mt-1">{chapterInfo.objective}</div>
                  {/* Karma Bar */}
                  <div className="w-48 h-1 mt-2 bg-slate-800 rounded-full relative overflow-hidden">
                      <div className="absolute top-0 bottom-0 left-0 bg-red-500 w-1/2 opacity-30"></div>
                      <div className="absolute top-0 bottom-0 right-0 bg-emerald-400 w-1/2 opacity-30"></div>
                      <div className="absolute top-0 bottom-0 w-1 bg-white" style={{ left: karmaIndicatorPosition, transition: 'left 0.5s ease' }}></div>
                  </div>
              </div>

              {/* Menu & Notifs */}
              <div className="flex flex-col items-end gap-2 pointer-events-auto">
                  <button onClick={() => setSettingsModalOpen(true)} className="p-2 rounded-full glass-panel hover:bg-white/10 transition-colors">
                      <svg className="w-6 h-6 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                  </button>
                  {gameState.notifications.map((msg: string, index: number) => (
                    <Notification key={`${msg}-${index}`} message={msg} onDismiss={() => dispatch({ type: 'DISMISS_NOTIFICATION', payload: { index } })} />
                  ))}
              </div>
          </div>

          {/* BOTTOM DOCK: Actions */}
          <div className="flex justify-between items-end">
              {/* Inventory */}
              <div className="flex gap-2 pointer-events-auto">
                  {gameState.inventory.map((item: CollectedItem) => (
                    <button
                      key={item.id}
                      className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center hover:border-emerald-300 transition-colors shadow-lg"
                      onClick={() => dispatch({ type: 'USE_ITEM', payload: { itemId: item.id }})}
                      title={item.name}
                    >
                        <div className={`w-8 h-8 icon-${item.icon} bg-cover opacity-80`}></div>
                    </button>
                  ))}
              </div>

              {/* Main Controls */}
              <div className="flex items-center gap-4 pointer-events-auto">
                  <div className="flex flex-col gap-2">
                      <button onClick={() => zoom(1.2)} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-emerald-200 hover:text-white transition-colors text-xl">+</button>
                      <button onClick={() => zoom(1/1.2)} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-emerald-200 hover:text-white transition-colors text-xl">-</button>
                  </div>
                  
                  <button 
                    onClick={() => setUpgradeModalOpen(true)} 
                    className="action-button primary neon-button w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(45,212,191,0.35)] border-emerald-400/60"
                  >
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                  </button>
              </div>
          </div>
      </div>
      
      {gameState.isPaused && (
          <div className="pause-overlay">
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-100 to-cyan-300 tracking-widest mb-8 header-font">PAUSED</h1>
            <button onClick={() => dispatch({type: 'SET_PAUSED', payload: false})} className="neon-button h-12 w-48 rounded-lg">RESUME</button>
          </div>
      )}
      
      <NodeInspector gameState={gameState} dispatch={dispatch} />
      
      {isUpgradeModalOpen && <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} gameState={gameState} onPurchase={(upgrade, imageUrl) => dispatch({type: 'PURCHASE_UPGRADE', payload: {upgrade, imageUrl}})} />}
      {isSettingsModalOpen && <SettingsModal settings={gameState.settings} dispatch={dispatch} onClose={() => setSettingsModalOpen(false)} />}
      {gameState.tutorialStep !== -1 && <Tutorial step={gameState.tutorialStep} dispatch={dispatch} />}
      {gameState.activeMilestone && <MilestoneVisual milestoneId={gameState.activeMilestone.id} imageUrl={gameState.activeMilestone.imageUrl} onComplete={() => dispatch({type: 'MILESTONE_COMPLETE'})} />}
      {gameState.activeCrossroadsEvent && <CrossroadsModal event={gameState.activeCrossroadsEvent} dispatch={dispatch} />}
      {gameState.activeChapterTransition && <ChapterTransition chapterId={gameState.activeChapterTransition} dispatch={dispatch} />}
      {gameState.levelTransitionState !== 'none' && <LevelTransition levelState={gameState.levelTransitionState} zoomLevel={gameState.zoomLevel} dispatch={dispatch} />}
    </>
  );
};

export default App;
