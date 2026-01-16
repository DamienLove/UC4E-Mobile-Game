
import React, { useState, useEffect } from 'react';
import { GameAction, GameState } from '../types';
import SettingsModal from './SettingsModal';
import CreditsModal from './CreditsModal';
import AudioUploadModal from './AudioUploadModal';
import { audioService } from '../services/AudioService';
import { generateCosmicVideo } from '../services/geminiService';

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
  const [introVideoUrl, setIntroVideoUrl] = useState<string | null>(null);
  const [isGeneratingIntro, setIsGeneratingIntro] = useState(false);


  useEffect(() => {
    // Check for a save game and start theme music
    setHasSaveGame(localStorage.getItem(SAVE_GAME_KEY) !== null);
    audioService.userInteraction().then(() => {
        audioService.playThemeMusic();
    });
  }, []);
  
  const handleStartGameWithMusic = async () => {
      setIsStarting(true);
      audioService.stopThemeMusic();
      await onStartGame();
      // No need to set isStarting to false, as the component will unmount.
  };
  
  const handleLoadGameWithMusic = () => {
      audioService.stopThemeMusic();
      onLoadGame();
  };

  const handlePlayIntro = async () => {
      if (introVideoUrl) return; // Already loaded or playing
      setIsGeneratingIntro(true);
      const prompt = "A cinematic, photorealistic timelapse of the universe beginning. The Big Bang explosion of white light, cooling into swirling nebula colors of purple and gold, forming the first bright stars and galaxies. Epic, 8k resolution, BBC documentary style.";
      const url = await generateCosmicVideo(prompt, "intro_cinematic");
      setIsGeneratingIntro(false);
      if (url) {
          setIntroVideoUrl(url);
          audioService.stopThemeMusic(); // Stop music so video audio can play (if any, though usually silent)
      }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center text-center p-4 splash-screen">
      <div className="absolute inset-0 particle-container">
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="particle particle-neutral" style={{
            '--size': `${Math.random() * 2 + 1}px`,
            '--duration': `${Math.random() * 40 + 30}s`,
            '--delay': `${Math.random() * -60}s`,
            '--x-start': `${Math.random() * 100}vw`,
            '--y-start': `${Math.random() * 100}vh`,
            '--x-end': `${Math.random() * 100}vw`,
            '--y-end': `${Math.random() * 100}vh`,
          } as React.CSSProperties} />
        ))}
      </div>
      
      <div className="splash-nebula"></div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-4">
          <div className="animate-fade-in-slow mb-8 text-center">
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-teal-300 glow-text mb-4 header-font">
              Universe Connected for Everyone
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-purple-300 font-mono">
              An interactive experience by Damien Nichols
              </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
              <button
                style={{ animationDelay: '1s' }}
                onClick={handleStartGameWithMusic}
                disabled={isStarting}
                className="w-full text-lg md:text-xl font-bold py-4 px-8 rounded-lg neon-button primary splash-menu-item"
              >
                {isStarting ? 'Generating...' : 'New Game'}
              </button>
              <button
                style={{ animationDelay: '1.2s' }}
                onClick={handleLoadGameWithMusic}
                disabled={!hasSaveGame}
                className={`w-full text-lg md:text-xl font-bold py-4 px-8 rounded-lg neon-button splash-menu-item ${!hasSaveGame ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Load Game
              </button>
              <button
                style={{ animationDelay: '1.3s' }}
                onClick={handlePlayIntro}
                className="w-full text-lg md:text-xl font-bold py-4 px-8 rounded-lg neon-button splash-menu-item border-amber-500/50 text-amber-200"
              >
                Cinematic Intro
              </button>
              <div className="flex gap-2">
                  <button
                    style={{ animationDelay: '1.4s' }}
                    onClick={() => setModal('options')}
                    className="flex-1 text-md font-bold py-4 px-4 rounded-lg neon-button splash-menu-item"
                  >
                    Options
                  </button>
                  <button
                   style={{ animationDelay: '1.6s' }}
                    onClick={() => setModal('credits')}
                    className="flex-1 text-md font-bold py-4 px-4 rounded-lg neon-button splash-menu-item"
                  >
                    Credits
                  </button>
              </div>
          </div>
      </div>
      
      <div className="absolute bottom-4 left-4 z-20">
         <button
            style={{ animationDelay: '1.8s' }}
            onClick={() => setModal('audio')}
            className="dev-menu-button splash-menu-item text-xs uppercase tracking-widest text-white/30 hover:text-white/80 transition-colors"
          >
            // DEV_ACCESS
          </button>
      </div>
      
      {/* Intro Video Overlay */}
      {(isGeneratingIntro || introVideoUrl) && (
          <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
              {isGeneratingIntro && (
                  <div className="text-center">
                      <div className="w-16 h-16 border-4 border-t-amber-500 border-white/20 rounded-full animate-spin mb-4 mx-auto"></div>
                      <h2 className="text-2xl text-amber-300 font-bold glow-text animate-pulse">Dreaming Reality...</h2>
                      <p className="text-white/50 text-sm mt-2">Generating 720p Cinematic (This may take a moment)</p>
                  </div>
              )}
              {introVideoUrl && (
                  <div className="relative w-full h-full bg-black">
                      <video 
                        src={introVideoUrl} 
                        className="w-full h-full object-contain" 
                        autoPlay 
                        controls
                        onEnded={() => { setIntroVideoUrl(null); audioService.playThemeMusic(); }}
                      />
                      <button 
                        onClick={() => { setIntroVideoUrl(null); audioService.playThemeMusic(); }}
                        className="absolute top-8 right-8 text-white/50 hover:text-white text-xl border border-white/20 px-4 py-2 rounded bg-black/50 backdrop-blur"
                      >
                        Close X
                      </button>
                  </div>
              )}
          </div>
      )}
      
      {modal === 'options' && <SettingsModal settings={settings} dispatch={dispatch} onClose={() => setModal(null)} />}
      {modal === 'credits' && <CreditsModal onClose={() => setModal(null)} />}
      {modal === 'audio' && <AudioUploadModal onClose={() => setModal(null)} />}

    </div>
  );
};

export default SplashScreen;
