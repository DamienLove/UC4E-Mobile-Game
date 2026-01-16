
import React, { useEffect, useState } from 'react';
import { generateCosmicVideo } from '../services/geminiService';
import { VIDEO_PROMPTS } from './constants';

interface MilestoneVisualProps {
  milestoneId: string;
  imageUrl?: string;
  onComplete: () => void;
}

const MILESTONE_DURATION: { [key: string]: number } = {
  default: 6000,
  the_great_zoom_out: 14000, 
  star_formation: 8000,
  planetary_accretion: 8000,
  quantum_computing: 8000,
  quantum_tunneling: 8000,
  basic_physics: 8000,
};

// Fallback visual content while video loads or if it fails
const getVisuals = (imageUrl?: string): { [key: string]: React.ReactNode } => ({
  // --- UPGRADE CINEMATICS (CSS Fallbacks) ---
  basic_physics: (
    <div className="milestone-scene bg-black flex items-center justify-center">
      <div className="physics-container">
          <div className="singularity"></div>
          {Array.from({length: 150}).map((_, i) => {
              const angle = Math.random() * Math.PI * 2;
              const dist = 50 + Math.random() * 50;
              return (<div key={i} className="physics-particle" style={{
                  '--angle': `${angle}rad`,
                  '--dist': `${dist}%`,
                  '--duration': `${2 + Math.random() * 4}s`,
                  '--delay': `${Math.random() * -6}s`,
              } as React.CSSProperties} />);
          })}
      </div>
      <h2 className="milestone-title">The fundamental rules of reality are revealed.</h2>
    </div>
  ),
  star_formation: (
    <div className="milestone-scene bg-black flex items-center justify-center">
        <div className="star-formation-container">
             <div className="gas-cloud"></div>
            {imageUrl && (
                <img src={imageUrl} alt="Newly formed star" className="formed-star" />
            )}
            <div className="star-shockwave"></div>
        </div>
        <h2 className="milestone-title">From dust and gas, the first light is born.</h2>
    </div>
  ),
  planetary_accretion: (
    <div className="milestone-scene bg-black flex items-center justify-center">
      <div className="relative w-[100vmin] h-[100vmin] flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt="Newly formed planet" className="w-[30vmin] h-[30vmin] object-cover rounded-full z-10 absolute" />
        ) : (
          <div className="proto-planet" />
        )}
        <div className="accretion-disk" style={{ transform: 'rotateX(75deg) scale(1.5)' }} />
        <div className="accretion-disk" style={{ transform: 'rotateX(75deg) scale(1.1)', animationDelay: '-2s' }} />
      </div>
      <h2 className="milestone-title">Worlds coalesce in the darkness.</h2>
    </div>
  ),
  eukaryotic_evolution: (
    <div className="milestone-scene bg-slate-900 flex items-center justify-center">
      {imageUrl ? (
          <div className="w-[50vmin] h-[50vmin] relative flex items-center justify-center">
              <img src={imageUrl} alt="Eukaryotic evolution" className="w-full h-full object-cover rounded-full z-10 evolution-image" />
          </div>
      ) : (
          <div className="w-48 h-48 rounded-full bg-cyan-900 flex items-center justify-center animate-pulse">
              <div className="w-24 h-24 rounded-full bg-cyan-700"></div>
          </div>
      )}
      <h2 className="milestone-title">A new complexity emerges from ancient symbiosis.</h2>
    </div>
  ),
  collective_intelligence: (
     <div className="milestone-scene bg-indigo-900 flex items-center justify-center">
      {/* Animation of glowing orbs with connecting light beams */}
      <h2 className="milestone-title">The many begin to think as one.</h2>
    </div>
  ),
  quantum_computing: (
    <div className="milestone-scene bg-black">
        <div className="qc-grid"></div>
        {Array.from({length: 50}).map((_, i) => (
            <div key={i} className="qubit" style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
            }}></div>
        ))}
      <h2 className="milestone-title">Reality itself becomes the engine of calculation.</h2>
    </div>
  ),
  quantum_tunneling: (
    <div className="milestone-scene bg-black flex items-center justify-center">
        <div className="qc-grid"></div>
        <div className="tunneling-node"></div>
        <h2 className="milestone-title">The shortest distance between two points is zero.</h2>
    </div>
  ),

  // --- EXISTING MILESTONES ---
  spark_of_life: (
    <div className="milestone-scene deep-sea-bg flex items-center justify-center">
      {imageUrl ? (
            <div className="w-[50vmin] h-[50vmin] relative flex items-center justify-center">
                <img src={imageUrl} alt="Spark of life" className="w-full h-full object-cover rounded-full z-10 life-spark-image" />
            </div>
        ) : (
            <div className="w-24 h-24 rounded-full bg-green-500/50 shadow-[0_0_40px_10px_#34d399] animate-pulse"></div>
        )}
      <h2 className="milestone-title">Life stirs in the abyssal depths.</h2>
    </div>
  ),
  panspermia: (
    <div className="milestone-scene starfield">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="comet" style={{ top: `${10 + Math.random() * 60}%`, animationDelay: `${i * 0.6}s` }}></div>
        ))}
        <h2 className="milestone-title">The seeds of life arrive from distant stars.</h2>
    </div>
  ),
  mycorrhizal_networks: (
    <div className="milestone-scene earthy">
        <div className="network-line" style={{ transform: 'rotate(20deg)', animationDelay: '0s' }}></div>
        <div className="network-line" style={{ transform: 'rotate(-30deg) scaleX(-1)', animationDelay: '0.5s' }}></div>
        <div className="network-line" style={{ transform: 'rotate(70deg)', animationDelay: '1s' }}></div>
        <div className="network-line" style={{ transform: 'rotate(-80deg) scaleX(-1)', animationDelay: '1.2s' }}></div>
        <h2 className="milestone-title">A silent, planetary intelligence awakens.</h2>
    </div>
  ),
  the_great_zoom_out: (
    <div className="milestone-scene bg-black">
      <div className="w-full h-full flex items-center justify-center zoom-out-container">
        <div className="w-64 h-64 rounded-full bg-blue-500 shadow-[0_0_100px_20px_#4299e1] relative">
            {/* Fake galaxy inside */}
            <div className="absolute w-2 h-2 bg-yellow-200 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      </div>
      <div className="absolute inset-0 bg-purple-500 rounded-full opacity-0 particle-zoom-in"></div>
      <h2 className="milestone-title opacity-0" style={{ animation: 'fadeInSlow 4s 9s forwards' }}>The universe is a holographic projection of entangled consciousness.</h2>
    </div>
  )
});

const MilestoneVisual: React.FC<MilestoneVisualProps> = ({ milestoneId, imageUrl, onComplete }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const visuals = getVisuals(imageUrl);
  const visualContent = visuals[milestoneId];
  const duration = MILESTONE_DURATION[milestoneId] || MILESTONE_DURATION.default;

  useEffect(() => {
    // If unknown milestone ID, complete immediately.
    if (!visualContent) {
      onComplete();
      return;
    }

    // Try to generate a video if a prompt exists
    const videoPrompt = VIDEO_PROMPTS[milestoneId];
    if (videoPrompt) {
        setIsGenerating(true);
        generateCosmicVideo(videoPrompt, milestoneId)
            .then(url => {
                if (url) {
                    setVideoUrl(url);
                    setShowVideo(true);
                }
            })
            .finally(() => {
                setIsGenerating(false);
            });
    }

    // If no video prompt, or as a failsafe timer if video takes too long (but here we want to wait for video if possible)
    // We only auto-close if we are NOT showing a video.
    // If we show a video, the onEnded event will handle close.
    // BUT video generation takes long, so we show the CSS animation while waiting.
    
  }, [milestoneId, visualContent, onComplete]);

  // If we're not generating video and haven't found one, rely on the timer.
  useEffect(() => {
      if (!isGenerating && !videoUrl && visualContent) {
          const timer = setTimeout(onComplete, duration);
          return () => clearTimeout(timer);
      }
  }, [isGenerating, videoUrl, onComplete, duration, visualContent]);


  if (!visualContent) {
    return null;
  }

  return (
    <div className="milestone-container" style={{ animationDuration: `1s, 1s`, animationDelay: `0s, ${showVideo ? '999s' : duration/1000 -1}s`}}>
      <div className="milestone-explosion-flash" />
      
      {showVideo && videoUrl ? (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50 animate-fade-in-slow">
              <video 
                src={videoUrl} 
                autoPlay 
                className="w-full h-full object-contain"
                onEnded={onComplete}
              />
              <button className="milestone-skip-button" onClick={onComplete}>Continue</button>
          </div>
      ) : (
          <>
            {visualContent}
            {isGenerating && (
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50">
                    <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="text-white/70 text-sm tracking-widest uppercase animate-pulse">Dreaming Reality...</span>
                </div>
            )}
            <button className="milestone-skip-button" onClick={onComplete}>
                {isGenerating ? 'Skip Video' : 'Skip'}
            </button>
          </>
      )}
    </div>
  );
};

export default MilestoneVisual;
