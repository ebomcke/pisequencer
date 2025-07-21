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

  return (
    <div className="sequencer-controls mb-6">
      {/* Main controls row */}
      <div className="flex items-center justify-between">
        {/* Left side - BPM control */}
        <div className="flex items-center space-x-4">
          <label htmlFor="bpm-slider" className="text-sm font-semibold text-gray-300 min-w-[3rem]">
            BPM:
          </label>
          <input
            id="bpm-slider"
            type="range"
            min="80"
            max="200"
            step="1"
            value={bpm}
            onChange={handleBpmChange}
            className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            aria-label="Beats per minute"
          />
          <div className="text-sm font-mono text-white bg-gray-800 px-2 py-1 rounded min-w-[3rem] text-center">
            {bpm}
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
            {isPlaying ? 'STOP' : 'PLAY'}
          </button>
        </div>

        {/* Right side - Empty for balance */}
        <div className="w-48">
          <div className="flex flex-col items-center space-y-2 text-gray-500 text-xs">
            <div>Spacebar: Play/Stop</div>
            <div>Q-I: Trigger Channels</div>
            <div>Cmd+Click: Toggle Pads</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Controls; 