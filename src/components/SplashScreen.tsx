
import React, { useState, useEffect } from 'react';
import { GameAction, GameState } from '../types';
import SettingsModal from './SettingsModal';
import CreditsModal from './CreditsModal';
import AudioUploadModal from './AudioUploadModal';
import { audioService } from '../services/AudioService';

interface SplashScreenProps {
  onStartGame: () => void;
  onLoadGame: () => void;
  dispatch: React.Dispatch<GameAction>;
  settings: GameState['settings'];
}

const SAVE_GAME_KEY = 'universe-connected-save';

const SplashScreen: React.FC<SplashScreenProps> = ({ onStartGame, onLoadGame, dispatch, settings }) => {
  const [modal, setModal] = useState<'options' | 'credits' | 'audio' | null>(null);
  const [hasSaveGame, setHasSaveGame] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    setHasSaveGame(localStorage.getItem(SAVE_GAME_KEY) !== null);
    audioService.userInteraction().then(() => {
        audioService.playThemeMusic();
    });
  }, []);
  
  const handleStartGameWithMusic = async () => {
      setIsStarting(true);
      audioService.stopThemeMusic();
      await onStartGame();
  };
  
  const handleLoadGameWithMusic = () => {
      audioService.stopThemeMusic();
      onLoadGame();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black"></div>
      <div className="absolute inset-0 particle-container">
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="particle" style={{
            '--x-start': `${Math.random() * 200 - 100}px`,
            '--y-start': `${Math.random() * 200 - 100}px`,
            '--x-end': `${Math.random() * 200 - 100}px`,
            '--y-end': `${Math.random() * 200 - 100}px`,
            '--size': `${Math.random() * 2.5 + 1}px`,
            '--duration': `${Math.random() * 10 + 12}s`,
            '--delay': `${Math.random() * -10}s`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          } as React.CSSProperties} />
        ))}
      </div>
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center gap-10">
          
          <div className="text-center animate-float">
              <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-cyan-300 drop-shadow-[0_0_25px_rgba(45,212,191,0.4)] tracking-tighter mb-2 header-font">
                  UNIVERSE
              </h1>
              <h2 className="text-3xl md:text-4xl font-light tracking-[0.5em] text-slate-200/80 header-font">
                  CONNECTED
              </h2>
              <div className="h-1 w-24 bg-gradient-to-r from-transparent via-amber-300 to-transparent mx-auto mt-8"></div>
          </div>

          <div className="w-full flex flex-col gap-4 mt-4">
              <button
                onClick={handleStartGameWithMusic}
                disabled={isStarting}
                className="neon-button primary h-16 w-full rounded-xl text-xl"
              >
                {isStarting ? 'Initializing Sequence...' : 'Initialize Universe'}
              </button>
              
              <button
                onClick={handleLoadGameWithMusic}
                disabled={!hasSaveGame}
                className={`neon-button h-14 w-full rounded-xl text-lg ${!hasSaveGame ? 'opacity-30' : ''}`}
              >
                Resume Simulation
              </button>
              
              <div className="flex gap-4">
                  <button onClick={() => setModal('options')} className="neon-button h-12 flex-1 rounded-xl text-sm">
                    Options
                  </button>
                  <button onClick={() => setModal('credits')} className="neon-button h-12 flex-1 rounded-xl text-sm">
                    Credits
                  </button>
              </div>
          </div>
      </div>
      
      <div className="absolute bottom-6">
         <button onClick={() => setModal('audio')} className="text-white/20 hover:text-white/60 text-xs uppercase tracking-widest transition-colors font-mono">
            // DEV_ACCESS_TERMINAL
          </button>
      </div>
      
      {modal === 'options' && <SettingsModal settings={settings} dispatch={dispatch} onClose={() => setModal(null)} />}
      {modal === 'credits' && <CreditsModal onClose={() => setModal(null)} />}
      {modal === 'audio' && <AudioUploadModal onClose={() => setModal(null)} />}
    </div>
  );
};

export default SplashScreen;
