
import React from 'react';
import { Upgrade, GameState } from '../types';
import { UPGRADES } from './constants';
import UpgradeCard from './UpgradeCard';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  onPurchase: (upgrade: Upgrade, imageUrl?: string) => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, gameState, onPurchase }) => {
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
  
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass-panel w-full max-w-5xl h-[85vh] rounded-2xl flex flex-col overflow-hidden border border-cyan-400/20 shadow-[0_0_50px_rgba(56,189,248,0.12)]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
          <div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-cyan-300 header-font">
                EVOLUTIONARY MATRIX
              </h2>
              <p className="text-slate-300 text-sm mt-1 font-mono">Select nodes to advance universal complexity.</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gradient-to-b from-transparent to-black/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getVisibleUpgrades().map(upgrade => (
                <UpgradeCard 
                key={upgrade.id}
                upgrade={upgrade}
                gameState={gameState}
                onPurchase={onPurchase}
                isPurchaseable={isPurchaseable}
                />
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-black/60 border-t border-white/10 flex justify-between text-xs text-gray-500 uppercase tracking-widest font-mono">
            <span>Available Karma: {gameState.karma}</span>
            <span>Upgrades Unlocked: {gameState.unlockedUpgrades.size}</span>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
