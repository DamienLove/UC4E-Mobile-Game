
import React from 'react';
import { GameAction, GameState } from '../types';

interface SettingsModalProps {
  settings: GameState['settings'];
  dispatch: React.Dispatch<GameAction>;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, dispatch, onClose }) => {

  const handleSettingChange = (key: keyof GameState['settings'], value: string | number | boolean) => {
    dispatch({ type: 'CHANGE_SETTING', payload: { key, value } });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  const handleSave = () => {
      dispatch({ type: 'SAVE_GAME' });
  };

  return (
    <div 
      className="settings-modal-backdrop fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4" 
      onClick={handleBackdropClick}
    >
      <div 
        className="settings-modal-content glass-panel w-full max-w-md p-6 max-h-[90vh] overflow-y-auto relative z-[1001] flex flex-col gap-6" 
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="flex justify-between items-center shrink-0">
            <h2 className="text-2xl font-bold header-font text-cyan-300">SYSTEM</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer pointer-events-auto">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        
        <div className="space-y-6">
          {/* Main Action Buttons */}
          <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={handleSave}
                className="neon-button h-12 rounded flex items-center justify-center gap-2 border-green-500/50 text-green-300 hover:bg-green-500/10 pointer-events-auto"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                SAVE SIMULATION
              </button>
          </div>

          <div>
            <div className="flex justify-between mb-2">
                <label className="text-gray-400 text-xs uppercase tracking-wider">SFX Volume</label>
                <span className="text-xs font-mono text-cyan-400">{Math.round(settings.sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              className="w-full accent-cyan-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer pointer-events-auto"
              value={settings.sfxVolume}
              onChange={(e) => handleSettingChange('sfxVolume', parseFloat(e.target.value))}
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
                <label className="text-gray-400 text-xs uppercase tracking-wider">Music Volume</label>
                <span className="text-xs font-mono text-cyan-400">{Math.round(settings.musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              className="w-full accent-cyan-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer pointer-events-auto"
              value={settings.musicVolume}
              onChange={(e) => handleSettingChange('musicVolume', parseFloat(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2">Color Mode</label>
            <select
              className="w-full p-3 bg-black/60 border border-gray-600 rounded text-white focus:border-cyan-500 outline-none pointer-events-auto"
              value={settings.colorblindMode}
              onChange={(e) => handleSettingChange('colorblindMode', e.target.value)}
            >
              <option value="none">Standard</option>
              <option value="deuteranopia">Deuteranopia (Red-Green)</option>
              <option value="protanopia">Protanopia (Red-Green)</option>
              <option value="tritanopia">Tritanopia (Blue-Yellow)</option>
            </select>
          </div>
          
          <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
            <label className="flex justify-between items-center cursor-pointer group pointer-events-auto w-full">
              <span className="text-gray-300 group-hover:text-white transition-colors text-sm">Targeting Assistance</span>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.aimAssist}
                  onChange={(e) => handleSettingChange('aimAssist', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer-checked:bg-cyan-600 transition-colors border border-gray-600"></div>
                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5 shadow-md"></div>
              </div>
            </label>
          </div>

        </div>
        
        <div className="mt-auto pt-4 border-t border-white/10 text-center">
            <button onClick={onClose} className="w-full py-3 neon-button rounded pointer-events-auto text-sm font-bold tracking-wider">
                RESUME
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
