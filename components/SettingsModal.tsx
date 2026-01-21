
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
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="glass-panel w-full max-w-lg p-8">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold header-font text-cyan-300">SYSTEM OPTIONS</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-4xl leading-none" aria-label="Close Settings" title="Close Settings">&times;</button>
        </div>
        
        <div className="space-y-6">
          {/* Main Action Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-8">
              <button 
                onClick={handleSave}
                className="col-span-2 neon-button h-12 rounded flex items-center justify-center gap-2 border-green-500/50 text-green-300 hover:bg-green-500/10"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                SAVE SIMULATION
              </button>
          </div>

          <div>
            <label className="block text-gray-400 text-sm uppercase tracking-wider mb-2">SFX Volume</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              className="w-full accent-cyan-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              value={settings.sfxVolume}
              onChange={(e) => handleSettingChange('sfxVolume', parseFloat(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm uppercase tracking-wider mb-2">Music Volume</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              className="w-full accent-cyan-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              value={settings.musicVolume}
              onChange={(e) => handleSettingChange('musicVolume', parseFloat(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm uppercase tracking-wider mb-2">Visual Accessibility</label>
            <select
              className="w-full p-2 bg-black/50 border border-gray-600 rounded text-white focus:border-cyan-500 outline-none"
              value={settings.colorblindMode}
              onChange={(e) => handleSettingChange('colorblindMode', e.target.value)}
            >
              <option value="none">Standard Spectrum</option>
              <option value="deuteranopia">Deuteranopia Mode</option>
              <option value="protanopia">Protanopia Mode</option>
              <option value="tritanopia">Tritanopia Mode</option>
            </select>
          </div>
          
          <div>
            <label className="flex justify-between items-center cursor-pointer group">
              <span className="text-gray-300 group-hover:text-white transition-colors">Targeting Assistance</span>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.aimAssist}
                  onChange={(e) => handleSettingChange('aimAssist', e.target.checked)}
                />
                <div className="w-14 h-8 bg-gray-700 rounded-full peer-checked:bg-cyan-600 transition-colors border border-gray-600"></div>
                <div className="absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform peer-checked:translate-x-6 shadow-md"></div>
              </div>
            </label>
          </div>

        </div>
        
        <div className="mt-8 text-center">
            <button onClick={onClose} className="w-full neon-button h-12 rounded">
                Return to Cosmos
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
