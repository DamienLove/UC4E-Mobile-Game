
import React, { useReducer, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GameState, GameAction, EnergyOrb, ProjectionState } from '../types';
import { UPGRADES, CHAPTERS, NODE_IMAGE_MAP } from './constants';
import { useGameLoop } from '../hooks/useGameLoop';
import { audioService } from '../services/AudioService';
import { generateNodeImage } from '../services/geminiService';
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


import { gameReducer, initialState, SAVE_GAME_KEY } from '../gameReducer';

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
  
  // Keyboard Shortcut Handler
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key.toLowerCase() === 'u') {
              if (isUpgradeModalOpen) {
                  setUpgradeModalOpen(false);
                  audioService.playSound('ui_click');
              } else {
                  setUpgradeModalOpen(true);
                  audioService.playSound('ui_open');
              }
          }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUpgradeModalOpen]);
  
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
  const chapterUpgrades = useMemo(() => UPGRADES.filter(u => u.chapter === gameState.currentChapter), [gameState.currentChapter]);
  const unlockedChapterUpgrades = useMemo(() => chapterUpgrades.filter(u => gameState.unlockedUpgrades.has(u.id)).length, [chapterUpgrades, gameState.unlockedUpgrades]);
  const chapterProgress = useMemo(() => chapterUpgrades.length > 0 ? (unlockedChapterUpgrades / chapterUpgrades.length) * 100 : 0, [unlockedChapterUpgrades, chapterUpgrades.length]);

  if (!gameState.gameStarted) {
    return <SplashScreen onStartGame={startGame} onLoadGame={loadGame} dispatch={dispatch} settings={gameState.settings} />;
  }

  // Helper to hide HUD when modals are open to prevent overlap and z-index confusion
  const isModalOpen = isUpgradeModalOpen || isSettingsModalOpen || gameState.activeMilestone || gameState.activeCrossroadsEvent;

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
      
      {/* --- HUD DASHBOARD LAYOUT --- */}
      {/* Fixed bottom dashboard containing all main game controls and info */}
      {!isModalOpen && (
      <>
        {/* Floating Notifications (Top Right) */}
        <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2 pointer-events-none">
            {gameState.notifications.map((msg, index) => (
                <div key={`${msg}-${index}`} className="pointer-events-auto">
                    <Notification message={msg} onDismiss={() => dispatch({ type: 'DISMISS_NOTIFICATION', payload: { index } })} />
                </div>
            ))}
        </div>

        {/* Bottom Dashboard */}
        <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none flex flex-col justify-end">
            
            {/* Zoom Controls Floating above Dashboard */}
            <div className="w-full flex justify-end px-4 pb-2 pointer-events-none">
                <div className="pointer-events-auto flex flex-col gap-2">
                    <button onClick={() => zoom(1.2)} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-cyan-300 hover:text-white transition-colors text-xl shadow-lg bg-black/60 border-cyan-800">+</button>
                    <button onClick={() => zoom(1/1.2)} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-cyan-300 hover:text-white transition-colors text-xl shadow-lg bg-black/60 border-cyan-800">-</button>
                </div>
            </div>

            {/* Main Dashboard Panel */}
            <div className="bg-slate-950/90 backdrop-blur-md border-t border-cyan-900/50 p-3 pb-safe pointer-events-auto shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
                {/* Chapter Progress Bar (Top of Dash) */}
                <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden mb-3 relative">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500" style={{ width: `${chapterProgress}%` }}></div>
                </div>

                <div className="max-w-7xl mx-auto grid grid-cols-12 gap-2 md:gap-4 items-end">
                    
                    {/* LEFT: Resources */}
                    <div className="col-span-4 md:col-span-3 flex flex-col gap-2">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded bg-yellow-900/20 border border-yellow-700/30 ${energyPulse ? 'animate-pulse bg-yellow-900/40' : ''}`}>
                            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M11.23 13.06l-1.33 4.14a.5.5 0 01-.94 0l-1.33-4.14-.85.35a.5.5 0 01-.59-.64L7.5 7.5H4.5a.5.5 0 01-.4-.8l6-5.5a.5.5 0 01.8 0l6 5.5a.5.5 0 01-.4.8H13.5L12.18 12.77l-.95.29z"/></svg>
                            <span className="font-mono font-bold text-yellow-200 text-lg">{Math.floor(gameState.energy).toLocaleString()}</span>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-2 rounded bg-purple-900/20 border border-purple-700/30 ${knowledgePulse ? 'animate-pulse bg-purple-900/40' : ''}`}>
                            <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM5.13 5.13a6 6 0 018.48 0L10 10 5.13 5.13zM10 18a6 6 0 01-4.24-1.76l4.24-4.24 4.24 4.24A6 6 0 0110 18z"/></svg>
                            <span className="font-mono font-bold text-purple-200 text-lg">{Math.floor(gameState.knowledge).toLocaleString()}</span>
                        </div>
                    </div>

                    {/* CENTER: Info & Karma */}
                    <div className="col-span-4 md:col-span-6 flex flex-col items-center justify-end text-center">
                        <div className="text-xs text-cyan-500 uppercase tracking-widest font-bold mb-1 hidden sm:block">{chapterInfo.name}</div>
                        <div className="text-[10px] text-gray-400 truncate max-w-full hidden md:block mb-2">{chapterInfo.objective}</div>
                        
                        {/* Karma Bar */}
                        <div className="w-full max-w-[200px] h-1.5 bg-gray-800 rounded-full relative overflow-hidden mb-1">
                            <div className="absolute top-0 bottom-0 left-0 bg-red-500 w-1/2 opacity-40"></div>
                            <div className="absolute top-0 bottom-0 right-0 bg-cyan-500 w-1/2 opacity-40"></div>
                            <div className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_5px_white]" style={{ left: karmaIndicatorPosition, transition: 'left 0.5s ease' }}></div>
                        </div>
                        <div className="flex justify-between w-full max-w-[200px] text-[8px] text-gray-500 uppercase font-mono">
                            <span>Chaos</span>
                            <span>Harmony</span>
                        </div>
                    </div>

                    {/* RIGHT: Actions */}
                    <div className="col-span-4 md:col-span-3 flex justify-end items-end gap-2">
                        {/* Inventory Slots (Small) */}
                        <div className="hidden sm:flex gap-1 mr-2">
                             {gameState.inventory.map(item => (
                                <button
                                key={item.id}
                                className="w-10 h-10 rounded bg-gray-800 border border-gray-700 flex items-center justify-center hover:border-cyan-400 transition-colors"
                                onClick={() => dispatch({ type: 'USE_ITEM', payload: { itemId: item.id }})}
                                title={item.name}
                                >
                                    <div className={`w-6 h-6 icon-${item.icon} bg-cover opacity-80`}></div>
                                </button>
                            ))}
                        </div>

                        <button onClick={() => setSettingsModalOpen(true)} className="w-12 h-12 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 flex items-center justify-center text-gray-300 transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        
                        <button 
                            onClick={() => setUpgradeModalOpen(true)} 
                            className="h-12 px-4 rounded-lg bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 border border-purple-500 text-white font-bold tracking-wider shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center justify-center"
                        >
                            <svg className="w-6 h-6 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                            <span className="hidden sm:inline">MATRIX</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </>
      )}
      
      {gameState.isPaused && (
          <div className="pause-overlay">
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500 tracking-widest mb-8 font-['Orbitron']">PAUSED</h1>
            <button onClick={() => dispatch({type: 'SET_PAUSED', payload: false})} className="neon-button h-12 w-48 rounded-lg pointer-events-auto">RESUME</button>
          </div>
      )}
      
      <NodeInspector gameState={gameState} dispatch={dispatch} />
      
      {/* Modals and Overlays - No relative wrappers, direct fixed positioning to ensure stacking context works */}
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
