import React from 'react';
import type { PadProps } from '../types/sequencer';

const Pad: React.FC<PadProps> = ({
  isActive,
  isCurrentStep,
  channelIndex,
  stepIndex,
  onToggle,
  onTrigger
}) => {
  const handleClick = (e: React.MouseEvent) => {
    // Prevent default and stop propagation
    e.preventDefault();
    e.stopPropagation();

    // Check for Command/Ctrl key for toggling pad state
    if (e.metaKey || e.ctrlKey) {
      onToggle(channelIndex, stepIndex);
    } else {
      // Direct click triggers the channel immediately
      onTrigger(channelIndex);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent text selection and dragging
    e.preventDefault();
  };

  return (
    <div
      className={`sequencer-pad ${isActive ? 'active' : 'inactive'} ${
        isCurrentStep ? 'current-step' : ''
      }`}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      role="button"
      tabIndex={0}
      aria-label={`Channel ${channelIndex + 1}, Step ${stepIndex + 1}, ${
        isActive ? 'Active' : 'Inactive'
      }`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (e.metaKey || e.ctrlKey) {
            onToggle(channelIndex, stepIndex);
          } else {
            onTrigger(channelIndex);
          }
        }
      }}
    >
    </div>
  );
};

export default Pad; 