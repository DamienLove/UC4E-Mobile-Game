
import React, { useEffect, useState, useRef } from 'react';
import { Upgrade, GameState } from '../types';
import { UPGRADES } from './constants';
import UpgradeCard from './UpgradeCard';
import { audioService } from '../services/AudioService';
import { generateNodeImage } from '../services/geminiService';
import { getNodeImagePrompt } from '../services/promptService';
import { NODE_IMAGE_MAP } from './constants';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  onPurchase: (upgrade: Upgrade, imageUrl?: string) => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, gameState, onPurchase }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  if (!isOpen) return null;

  const isPurchaseable = (upgrade: Upgrade): boolean => {
    const hasEnoughResources = 
      (upgrade.cost.energy === undefined || gameState.energy >= upgrade.cost.energy) &&
      (upgrade.cost.knowledge === undefined || gameState.knowledge >= upgrade.cost.knowledge) &&
      (upgrade.cost.unity === undefined || gameState.unity >= upgrade.cost.unity) &&
      (upgrade.cost.complexity === undefined || gameState.complexity >= upgrade.cost.complexity) &&
      (upgrade.cost.data === undefined || gameState.data >= upgrade.cost.data);
      
    const meetsKarmaReq = upgrade.karmaRequirement ? upgrade.karmaRequirement(gameState.karma) : true;
    const meetsPrereqs = (upgrade.prerequisites || []).length === 0 || 
                         (upgrade.prerequisites || []).every(p => gameState.unlockedUpgrades.has(p));
    const isUnlocked = gameState.unlockedUpgrades.has(upgrade.id);
    const inChapter = upgrade.chapter <= gameState.currentChapter;
    const isExclusive = (upgrade.exclusiveWith || []).some(ex => gameState.unlockedUpgrades.has(ex));

    return hasEnoughResources && meetsKarmaReq && meetsPrereqs && !isUnlocked && inChapter && !isExclusive;
  };
  
  const getVisibleUpgrades = () => {
    return UPGRADES.filter(u => {
        if (u.chapter > gameState.currentChapter) return false;
        const isUnlocked = gameState.unlockedUpgrades.has(u.id);
        if (isUnlocked) return true;
        const prereqs = u.prerequisites || [];
        return prereqs.every(p => gameState.unlockedUpgrades.has(p));
    });
  }

  const visibleUpgrades = getVisibleUpgrades();

  // Keyboard Navigation
  useEffect(() => {
      const handleKeyDown = async (e: KeyboardEvent) => {
          if (!isOpen) return;

          if (e.key === 'ArrowDown') {
              setSelectedIndex(prev => (prev + 1) % visibleUpgrades.length);
              audioService.playSound('ui_click');
          } else if (e.key === 'ArrowUp') {
              setSelectedIndex(prev => (prev - 1 + visibleUpgrades.length) % visibleUpgrades.length);
              audioService.playSound('ui_click');
          } else if (e.key === ' ' || e.key === 'Enter') {
              const upgrade = visibleUpgrades[selectedIndex];
              if (upgrade && isPurchaseable(upgrade)) {
                  e.preventDefault(); 
                  
                  const nodeTypeToGenerate = upgrade.generatesNodeType || upgrade.modifiesNodeTypeTarget;
                  let imageUrl: string | undefined;

                  if (nodeTypeToGenerate) {
                        try {
                            const prompt = getNodeImagePrompt(nodeTypeToGenerate);
                            const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));
                            const generatedUrl = await Promise.race([
                                generateNodeImage(prompt),
                                timeoutPromise
                            ]);
                            imageUrl = generatedUrl || NODE_IMAGE_MAP[nodeTypeToGenerate]?.[0];
                        } catch (error) {
                            console.error("Image generation failed", error);
                            imageUrl = NODE_IMAGE_MAP[nodeTypeToGenerate]?.[0];
                        }
                  }
                  
                  onPurchase(upgrade, imageUrl);
              } else {
                  audioService.playSound('collect_orb_bad'); 
              }
          } else if (e.key === 'Escape') {
              onClose();
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, visibleUpgrades, selectedIndex, gameState, onPurchase]);

  useEffect(() => {
      if (cardRefs.current[selectedIndex]) {
          cardRefs.current[selectedIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
  }, [selectedIndex]);
  
  return (
    <div 
      className="fixed inset-0 z-[200] flex items-end justify-center pointer-events-none" 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
        {/* Backdrop for click-to-close area (top part of screen) */}
        <div className="absolute inset-0 bg-black/60 pointer-events-auto" onClick={onClose}></div>

      <div 
        className="w-full max-w-7xl h-[65vh] rounded-t-2xl flex flex-col overflow-hidden border-t border-purple-500/50 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] relative z-[201] bg-slate-950 pointer-events-auto transform transition-transform duration-300"
        onClick={(e) => e.stopPropagation()} 
      >
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900/90 shrink-0">
          <div>
              <h2 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300 header-font">
                EVOLUTIONARY MATRIX
              </h2>
              <p className="text-gray-400 text-xs mt-1 font-mono">Unlock Nodes & Abilities</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center transition-colors text-white cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar bg-gradient-to-b from-slate-900 to-black">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
            {visibleUpgrades.map((upgrade, index) => (
                <div key={upgrade.id} ref={el => { cardRefs.current[index] = el; }}>
                    <UpgradeCard 
                        upgrade={upgrade}
                        gameState={gameState}
                        onPurchase={onPurchase}
                        isPurchaseable={isPurchaseable}
                        isSelected={index === selectedIndex}
                    />
                </div>
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default UpgradeModal;
