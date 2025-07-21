import React from 'react';
import type { SequencerGridProps } from '../types/sequencer';
import Pad from './Pad';

const SequencerGrid: React.FC<SequencerGridProps> = ({
  grid,
  currentStep,
  onPadToggle,
  onChannelTrigger
}) => {
  // Channel labels for each row (instrument names)
  const channelLabels = [
    'Kick', 'Snare', 'Hi-Hat', 'Open Hat',
    'Crash', 'Ride', 'Clap', 'Perc'
  ];

  return (
    <div className="sequencer-grid p-4">
      {/* Header with step numbers */}
      <div className="grid grid-cols-17 gap-2 mb-4">
        <div className="w-24"></div> {/* Empty cell for channel labels column */}
        {Array.from({ length: 16 }, (_, i) => (
          <div 
            key={i} 
            className={`text-center text-sm font-bold py-2 ${
              i === currentStep ? 'text-sequencer-current' : 'text-gray-400'
            }`}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Grid with channel labels and pads */}
      {grid.map((row, channelIndex) => (
        <div key={channelIndex} className="grid grid-cols-17 gap-2 mb-2">
          {/* Channel label */}
          <div className="w-24 flex items-center justify-end pr-4">
            <span className="text-sm font-bold text-gray-300 text-right">
              {channelLabels[channelIndex]}
            </span>
          </div>
          
          {/* Pads for this channel */}
          {row.map((isActive, stepIndex) => (
            <Pad
              key={`${channelIndex}-${stepIndex}`}
              isActive={isActive}
              isCurrentStep={stepIndex === currentStep}
              channelIndex={channelIndex}
              stepIndex={stepIndex}
              onToggle={onPadToggle}
              onTrigger={onChannelTrigger}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default SequencerGrid; 