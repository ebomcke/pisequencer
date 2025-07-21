import React from 'react';
import type { ControlsProps } from '../types/sequencer';

const Controls: React.FC<ControlsProps> = ({
  bpm,
  isPlaying,
  onBpmChange,
  onPlayToggle
}) => {
  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBpm = parseInt(e.target.value, 10);
    if (!isNaN(newBpm)) {
      onBpmChange(newBpm);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow spacebar to toggle playback even when focused on BPM input
    if (e.code === 'Space') {
      e.preventDefault();
      onPlayToggle();
    }
  };

  return (
    <div className="sequencer-controls mb-6">
      <div className="flex items-center justify-between">
        {/* Left side - BPM control */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="bpm-input" className="text-sm font-semibold text-gray-300">
              BPM:
            </label>
            <input
              id="bpm-input"
              type="number"
              min="80"
              max="200"
              step="1"
              value={bpm}
              onChange={handleBpmChange}
              onKeyDown={handleKeyDown}
              className="sequencer-input w-20 text-center"
              aria-label="Beats per minute"
            />
          </div>
          
          {/* BPM indicator */}
          <div className="text-xs text-gray-400">
            {bpm} BPM
          </div>
        </div>

        {/* Center - Play/Stop button */}
        <div className="flex items-center">
          <button
            onClick={onPlayToggle}
            className={`sequencer-button text-lg px-8 py-3 ${
              isPlaying 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
            aria-label={isPlaying ? 'Stop sequencer' : 'Start sequencer'}
          >
            {isPlaying ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
                <span>STOP</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="w-0 h-0 border-l-4 border-l-white border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                <span>PLAY</span>
              </div>
            )}
          </button>
        </div>

        {/* Right side - Tempo indicators */}
        <div className="flex items-center space-x-4">
          {/* Tempo description */}
          <div className="text-xs text-gray-400">
            {bpm < 90 && "Slow"}
            {bpm >= 90 && bpm < 120 && "Moderate"}
            {bpm >= 120 && bpm < 140 && "Medium"}
            {bpm >= 140 && bpm < 160 && "Fast"}
            {bpm >= 160 && "Very Fast"}
          </div>
          
          {/* Step duration indicator */}
          <div className="text-xs text-gray-500">
            {Math.round((60000 / bpm) / 4)}ms/step
          </div>
        </div>
      </div>

      {/* Bottom row - Additional controls */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-600">
        {/* Left - Pattern info */}
        <div className="flex items-center space-x-4 text-xs text-gray-400">
          <span>16 Steps</span>
          <span>•</span>
          <span>8 Channels</span>
          <span>•</span>
          <span>1/16 Notes</span>
        </div>

        {/* Right - Keyboard hints */}
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <span>Spacebar: Play/Stop</span>
          <span>•</span>
          <span>Q-I: Trigger Channels</span>
          <span>•</span>
          <span>Cmd+Click: Toggle Pads</span>
        </div>
      </div>
    </div>
  );
};

export default Controls; 