
import React, { useState, useEffect } from 'react';
import { Upgrade, GameState, NodeType } from '../types';
import { getGeminiFlavorText, generateNodeImage } from '../services/geminiService';
import { NODE_IMAGE_MAP } from './constants';
import { getNodeImagePrompt } from '../services/promptService';

interface UpgradeCardProps {
  upgrade: Upgrade;
  gameState: GameState;
  onPurchase: (upgrade: Upgrade, imageUrl?: string) => void;
  isPurchaseable: (upgrade: Upgrade) => boolean;
}

const UpgradeCard: React.FC<UpgradeCardProps> = ({ upgrade, gameState, onPurchase, isPurchaseable }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [flavorText, setFlavorText] = useState<string>('');
  const [isLoadingFlavorText, setIsLoadingFlavorText] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  useEffect(() => {
    if (isExpanded && !flavorText && !isLoadingFlavorText) {
      setIsLoadingFlavorText(true);
      getGeminiFlavorText(upgrade.title)
        .then(text => {
          setFlavorText(text);
        })
        .catch(err => {
          console.error(err);
          setFlavorText('"The archives are silent on this matter..."');
        })
        .finally(() => {
          setIsLoadingFlavorText(false);
        });
    }
  }, [isExpanded, flavorText, isLoadingFlavorText, upgrade.title]);

  const handlePurchase = async (e: React.MouseEvent) => {
    // Critical: Stop this click from reaching the card's toggle handler
    e.stopPropagation();
    e.preventDefault();

    if (!isPurchaseable(upgrade) || isGeneratingImage) return;

    const nodeTypeToGenerate = upgrade.generatesNodeType || upgrade.modifiesNodeTypeTarget;
    let imageUrl: string | undefined;

    if (nodeTypeToGenerate) {
        setIsGeneratingImage(true);
        try {
            const prompt = getNodeImagePrompt(nodeTypeToGenerate);
            // Add a timeout race condition to prevent button getting stuck if API hangs
            const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));
            const generatedUrl = await Promise.race([
                generateNodeImage(prompt),
                timeoutPromise
            ]);
            
            imageUrl = generatedUrl || NODE_IMAGE_MAP[nodeTypeToGenerate]?.[0];
        } catch (error) {
            console.error("Image generation failed, using fallback.", error);
            imageUrl = NODE_IMAGE_MAP[nodeTypeToGenerate]?.[0];
        } finally {
            setIsGeneratingImage(false);
        }
    }
    onPurchase(upgrade, imageUrl);
  };

  const unlocked = gameState.unlockedUpgrades.has(upgrade.id);
  const canBuy = isPurchaseable(upgrade);
  const exclusiveLock = (upgrade.exclusiveWith || []).some(ex => gameState.unlockedUpgrades.has(ex));

  const renderCost = (cost: Upgrade['cost']) => {
    const costString = Object.entries(cost)
      .map(([resource, value]) => `${value?.toLocaleString()} ${resource.charAt(0).toUpperCase() + resource.slice(1)}`)
      .join(', ');
    return `Cost: ${costString}`;
  };
  
  const getButtonState = () => {
      if (unlocked) return { text: 'Unlocked', disabled: true, class: 'bg-green-900/50 text-green-200 cursor-not-allowed border border-green-700' };
      if (exclusiveLock) return { text: 'Unavailable', disabled: true, class: 'bg-red-900/50 text-red-200 cursor-not-allowed border border-red-700' };
      if (isGeneratingImage) return { text: 'Forging...', disabled: true, class: 'bg-purple-900 text-purple-200 animate-pulse' };
      if (!canBuy) return { text: 'Insufficient Resources', disabled: true, class: 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed' };
      return { text: 'Unlock', disabled: false, class: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]' };
  }

  const btnState = getButtonState();

  return (
    <div 
      data-tutorial-id={upgrade.id}
      className={`p-4 rounded-lg border transition-all duration-300 relative z-10 ${
        unlocked ? 'bg-green-950/30 border-green-800' : 'bg-gray-900/80 border-gray-700 hover:border-purple-500'
      }`}
      style={{ cursor: 'pointer', touchAction: 'manipulation' }}
      onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="flex-1">
          <h3 className={`text-xl font-bold ${unlocked ? 'text-green-400' : 'text-cyan-300'}`}>{upgrade.title}</h3>
          <p className="text-gray-400 mt-1 text-sm leading-relaxed">{upgrade.description}</p>
        </div>
        <button
          onClick={handlePurchase}
          disabled={btnState.disabled}
          className={`px-6 py-3 rounded-md font-bold text-sm uppercase tracking-wider transition-all min-w-[140px] z-20 relative ${btnState.class}`}
        >
          {btnState.text}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap justify-between items-center text-xs border-t border-gray-800 pt-3">
        <span className={`${unlocked ? 'text-green-500' : 'text-yellow-400'} font-mono`}>{renderCost(upgrade.cost)}</span>
        <div className="text-right text-gray-500 space-x-3">
           <span>CH {upgrade.chapter + 1}</span>
          {upgrade.prerequisites && upgrade.prerequisites.length > 0 && (
            <span>REQ: {(upgrade.prerequisites || []).length}</span>
          )}
          {upgrade.karmaRequirementText && (
            <span className="text-purple-400">{upgrade.karmaRequirementText}</span>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-800" onClick={e => e.stopPropagation()}>
          {isLoadingFlavorText && <p className="text-gray-500 italic animate-pulse">Consulting the archives...</p>}
          {flavorText && !isLoadingFlavorText && (
            <blockquote className="text-purple-300 italic border-l-2 border-purple-500/50 pl-3 bg-purple-900/10 p-2 rounded-r">
              {flavorText}
              <cite className="block text-right text-purple-400/60 not-italic mt-2 text-xs uppercase tracking-widest">— Universe Connected for Everyone</cite>
            </blockquote>
          )}
        </div>
      )}
    </div>
  );
};

export default UpgradeCard;
