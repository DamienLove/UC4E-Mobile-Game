import { GameState, GameAction, EnergyOrb, ProjectionState } from './types';
import { CHAPTERS, TUTORIAL_STEPS, CROSSROADS_EVENTS, NODE_IMAGE_MAP } from './components/constants';
import { audioService } from '../services/AudioService';

// Constants for game balance
const BASE_KNOWLEDGE_RATE = 0.1;
const STAR_ENERGY_RATE = 0.5;
const LIFE_BIOMASS_RATE = 0.2;
const COLLECTIVE_UNITY_RATE = 0.1;
const DATA_GENERATION_RATE = 0.2;
const STAR_ORB_SPAWN_CHANCE = 0.005;
const PHAGE_SPAWN_CHANCE = 0.0005;
const PHAGE_ATTRACTION = 0.02;
const PHAGE_DRAIN_RATE = 0.1;
const SUPERNOVA_WARNING_TICKS = 1800;
const ANOMALY_DURATION_TICKS = 1200;
const BLOOM_SPAWN_MULTIPLIER = 5;

const AIM_ROTATION_SPEED = 0.05;
const POWER_OSCILLATION_SPEED = 1.5;
const MAX_LAUNCH_POWER = 20;
const PROJECTILE_FRICTION = 0.98;
const REFORM_DURATION = 120;

const ORB_COLLECTION_LEEWAY = 10;
const AIM_ASSIST_ANGLE = 0.1;

export const SAVE_GAME_KEY = 'universe-connected-save';

const initialProjectionState: ProjectionState = {
  playerState: 'IDLE',
  aimAngle: 0,
  power: 0,
  reformTimer: 0,
};

export const initialState: GameState = {
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
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      audioService.userInteraction().then(() => audioService.playBackgroundMusic());
      const playerNode = state.nodes.find(n => n.type === 'player_consciousness');
      if (!playerNode) return state;

      const updatedNodes = state.nodes.map(n =>
        n.id === playerNode.id ? { ...n, imageUrl: action.payload.playerImageUrl } : n
      );

      return {
        ...initialState,
        gameStarted: true,
        nodes: updatedNodes,
        notifications: ['The cosmos awakens to your presence.']
      };
    }
    case 'TICK': {
      if (state.isPaused) return state;
      let nextState = { ...state };
      const { width, height } = action.payload;
      const worldRadius = (Math.min(width, height) * 1.5) / (state.zoomLevel + 1);

      let mutableNodes = [...nextState.nodes];
      const originalNodes = nextState.nodes;

      const ensureMutable = (idx: number) => {
          if (mutableNodes[idx] === originalNodes[idx]) {
              mutableNodes[idx] = { ...originalNodes[idx] };
          }
          return mutableNodes[idx];
      };

      let playerIndex = mutableNodes.findIndex(n => n.type === 'player_consciousness');
      let playerNode = playerIndex >= 0 ? ensureMutable(playerIndex) : undefined;

      // --- Player Projection Mechanics ---
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

      // --- Resource Calculation ---
      let harmonyBonus = 1.0;
      let chaosPenalty = 1.0;
      if (nextState.karma > HARMONY_THRESHOLD) harmonyBonus = 1.25;
      if (nextState.karma < CHAOS_THRESHOLD) chaosPenalty = 0.75;
      if (nextState.cosmicEvents.some(e => e.type === 'wave_of_harmony')) harmonyBonus *= 1.5;
      if (nextState.cosmicEvents.some(e => e.type === 'wave_of_discord')) chaosPenalty *= 0.5;

      nextState.knowledge += BASE_KNOWLEDGE_RATE;
      nextState.nodes.forEach(node => {
        if (node.type === 'star') nextState.energy += STAR_ENERGY_RATE;
        if (node.hasLife) nextState.biomass += LIFE_BIOMASS_RATE * harmonyBonus;
      });
      if (nextState.unlockedUpgrades.has('cellular_specialization')) {
        nextState.biomass += nextState.nodes.filter(n => n.hasLife).length * 0.5 * harmonyBonus;
      }
      if (nextState.unlockedUpgrades.has('collective_intelligence')) {
        nextState.unity += COLLECTIVE_UNITY_RATE * harmonyBonus * chaosPenalty;
      }
      if (nextState.unlockedUpgrades.has('quantum_computing')) {
        nextState.data += DATA_GENERATION_RATE;
      }

      let newEnergyOrbs: EnergyOrb[] = [];
      let nextCosmicEvents = [...nextState.cosmicEvents];

      // --- Supernova Logic ---
      const hasSupernovaWarning = nextCosmicEvents.some(e => e.type === 'supernova' && e.phase === 'warning');
      let supernovaChance = 0.0002;
      if (nextState.karma < CHAOS_THRESHOLD) supernovaChance *= 3;

      if (!hasSupernovaWarning && Math.random() < supernovaChance) {
          const potentialStars = mutableNodes.filter(n => n.type === 'star');
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

      // --- Cosmic Event Spawning ---
      if (Math.random() < 0.0001) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * worldRadius * 0.8;
          nextCosmicEvents.push({
              id: `anomaly_${Date.now()}`,
              type: 'gravitational_anomaly',
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
              radius: 50,
              duration: ANOMALY_DURATION_TICKS,
          });
      }

      // --- Phage Logic ---
      if (nextState.gameStarted && Math.random() < PHAGE_SPAWN_CHANCE) {
          const angle = Math.random() * Math.PI * 2;
          const dist = worldRadius + 100;
          nextState.phages.push({
              id: `phage_${Date.now()}`,
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
              vx: 0, vy: 0,
              radius: 12,
              targetNodeId: null,
              state: 'seeking'
          });
          if (nextState.phages.length === 1) nextState.notifications.push('A Quantum Phage has entered the sector.');
      }

      nextState.phages = nextState.phages.map(phage => {
          let ax = 0, ay = 0;
          if (playerNode) {
              const dx = playerNode.x - phage.x;
              const dy = playerNode.y - phage.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist > 0) {
                  ax = (dx / dist) * PHAGE_ATTRACTION;
                  ay = (dy / dist) * PHAGE_ATTRACTION;
              }
              if (dist < playerNode.radius + phage.radius + 10) {
                  nextState.energy = Math.max(0, nextState.energy - PHAGE_DRAIN_RATE);
                  nextState.knowledge = Math.max(0, nextState.knowledge - PHAGE_DRAIN_RATE);
              }
          }
          return {
              ...phage,
              vx: (phage.vx + ax) * 0.95,
              vy: (phage.vy + ay) * 0.95,
              x: phage.x + phage.vx,
              y: phage.y + phage.vy
          };
      });

      // --- Crossroads Check ---
      if (!nextState.activeCrossroadsEvent && Math.random() < 0.0001) {
          const event = CROSSROADS_EVENTS.find(e => e.trigger(nextState));
          if (event) {
              nextState.activeCrossroadsEvent = event;
          }
      }

      // --- Physics & Blooms ---
      for (let i = 0; i < mutableNodes.length; i++) {
        let node = mutableNodes[i];
        let newVx = node.vx;
        let newVy = node.vy;
        let newX = node.x;
        let newY = node.y;

        if (node.type !== 'player_consciousness') {
            for (let j = 0; j < mutableNodes.length; j++) {
              if (i === j) continue;
              const otherNode = mutableNodes[j];
              const dx = otherNode.x - newX;
              const dy = otherNode.y - newY;
              const distSq = dx * dx + dy * dy;
              if (distSq > 1) {
                const dist = Math.sqrt(distSq);
                const force = (otherNode.type === 'star' ? 0.5 : 0.1) * otherNode.radius / distSq;
                newVx += (dx / dist) * force;
                newVy += (dy / dist) * force;
              }
            }
        }

        newX += newVx;
        newY += newVy;
        const friction = node.type === 'player_consciousness' ? PROJECTILE_FRICTION : 0.99;
        newVx *= friction;
        newVy *= friction;

        // World Boundary
        const distFromCenter = Math.sqrt(newX * newX + newY * newY);
        if (distFromCenter > worldRadius - node.radius) {
            const angle = Math.atan2(newY, newX);
            newX = Math.cos(angle) * (worldRadius - node.radius);
            newY = Math.sin(angle) * (worldRadius - node.radius);
            const dot = newVx * Math.cos(angle) + newVy * Math.sin(angle);
            newVx -= 2 * dot * Math.cos(angle);
            newVy -= 2 * dot * Math.sin(angle);
        }

        // Apply changes if any
        if (newX !== node.x || newY !== node.y || newVx !== node.vx || newVy !== node.vy) {
            node = ensureMutable(i);
            node.x = newX;
            node.y = newY;
            node.vx = newVx;
            node.vy = newVy;
        }

        // Bloom Logic
        const activeBlooms = nextCosmicEvents.filter(e => e.type === 'resource_bloom');
        for (const bloom of activeBlooms) {
            const bx = bloom.x || 0;
            const by = bloom.y || 0;
            const br = bloom.radius || 100;
            const dist = Math.hypot(node.x - bx, node.y - by);
            if (dist < br) {
                if (Math.random() < STAR_ORB_SPAWN_CHANCE * BLOOM_SPAWN_MULTIPLIER) {
                    newEnergyOrbs.push({
                        id: `orb_bloom_${Date.now()}_${Math.random()}`,
                        x: node.x + (Math.random() - 0.5) * node.radius,
                        y: node.y + (Math.random() - 0.5) * node.radius,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        radius: 5,
                        isFromBloom: true,
                    });
                }
            }
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
      }

      if (playerNode) {
          nextState.energyOrbs = nextState.energyOrbs.filter(orb => {
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
        .map(p => ({ ...p, life: p.life - 1 }))
        .filter(p => p.life > 0);

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

      // Update cosmic event durations
      nextState.cosmicEvents = nextCosmicEvents
        .map(e => ({...e, duration: e.duration - 1}))
        .filter(e => e.duration > 0);

      // Handle event transitions (e.g. warning to active)
      nextState.cosmicEvents = nextState.cosmicEvents.map(e => {
          if (e.type === 'supernova' && e.phase === 'warning' && e.duration <= 1) {
              // Transform to active explosion
              return {
                  ...e,
                  phase: 'active',
                  duration: 120, // Reset duration for explosion
                  radius: (e.radius || 100) * 1.5 // Expand radius
              };
          }
          return e;
      });

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
      return { ...state, notifications: state.notifications.filter((_, i) => i !== action.payload.index) };
    case 'MILESTONE_COMPLETE':
      return { ...state, activeMilestone: null };
    case 'START_LEVEL_TRANSITION':
      return { ...state, levelTransitionState: 'zooming' };
    case 'COMPLETE_LEVEL_TRANSITION': {
       const playerNode = state.nodes.find(n => n.type === 'player_consciousness');
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
        const player = state.nodes.find(n => n.type === 'player_consciousness');
        const target = state.nodes.find(n => n.id === state.aimAssistTargetId);
        let finalAimAngle = state.projection.aimAngle;
        if (player && target) finalAimAngle = Math.atan2(target.y - player.y, target.x - player.x);
        return { ...state, tutorialStep: nextTutorialStep2, projection: { ...state.projection, playerState: 'AIMING_POWER', aimAngle: finalAimAngle } };
    case 'LAUNCH_PLAYER':
        if (state.projection.playerState !== 'AIMING_POWER') return state;
        const p = state.nodes.find(n => n.type === 'player_consciousness');
        if (!p) return state;
        const launchStrength = (state.projection.power / 100) * MAX_LAUNCH_POWER;
        const newNodes = state.nodes.map(n => n.id === p.id ? { ...n, vx: Math.cos(state.projection.aimAngle) * launchStrength, vy: Math.sin(state.projection.aimAngle) * launchStrength } : n);
         let nextTutorialStep3 = state.tutorialStep;
        if (state.tutorialStep === 2) nextTutorialStep3 = 3;
        return { ...state, tutorialStep: nextTutorialStep3, nodes: newNodes, projection: { ...state.projection, playerState: 'PROJECTING', power: 0 }};
     case 'UPDATE_NODE_IMAGE':
        return { ...state, nodes: state.nodes.map(node => node.id === action.payload.nodeId ? { ...node, imageUrl: action.payload.imageUrl } : node) };
    case 'CHANGE_SETTING':
        const { key, value } = action.payload;
        const newSettings = { ...state.settings, [key]: value };
        if (key === 'sfxVolume') audioService.setSfxVolume(value as number);
        if (key === 'musicVolume') audioService.setMusicVolume(value as number);
        return { ...state, settings: newSettings };
    case 'USE_ITEM':
        const { itemId } = action.payload;
        const item = state.inventory.find(i => i.id === itemId);
        if (!item) return state;
        let ns = { ...state };
        if (item.name === 'Quantum Stabilizer') ns.notifications = [...ns.notifications, 'Quantum fields stabilized!'];
        ns.inventory = state.inventory.filter(i => i.id !== itemId);
        return ns;
    case 'CANCEL_CONNECTION_MODE':
        return { ...state, connectMode: { active: false, sourceNodeId: null } };
    case 'RESOLVE_CROSSROADS':
        const { choiceEffect } = action.payload;
        const stateAfterChoice = choiceEffect(state);
        return { ...stateAfterChoice, activeCrossroadsEvent: null };
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
