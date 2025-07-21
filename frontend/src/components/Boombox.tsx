import React from 'react';

interface BoomboxProps {
  isPlaying: boolean;
}

const Boombox: React.FC<BoomboxProps> = ({ isPlaying }) => {
  return (
    <div className="flex items-center space-x-3">
      {/* Left sound waves - only when playing */}
      {isPlaying ? (
        <div className="font-mono text-xs text-gray-400 leading-tight">
          <div>&nbsp;((</div>
          <div>(((</div>
          <div>&nbsp;((</div>
        </div>
      ) : (
        <div className="w-6"></div>
      )}
      
      {/* ASCII Boombox */}
      <div className={`font-mono text-xs text-gray-300 leading-none ${isPlaying ? 'boombox-pulse' : ''}`}>
        <pre className="whitespace-pre select-none">
{`⠀⠀⠀  ⠀⠀⠀⠀⣿⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⢸⣿⣉⣉⣉⣉⣉⣉⣉⣉⣉⣉⣉⣉⣉⣉⣉⣉⣉⣉⣉⣉⣉⣉⣉⣉⣿⡇⠀
⠀⢸⣿⡿⠋⣉⣭⣍⡙⢿⣿⡏⢉⣭⣭⣭⣭⡉⢹⣿⡿⢋⣩⣭⣉⠙⢿⣿⡇⠀
⠀⢸⡟⢠⣾⠟⠛⠻⣿⣆⠹⡇⢸⣿⣿⣿⣿⡇⢸⠏⣰⣿⠟⠛⠻⣷⡄⢻⡇⠀
⠀⢸⡇⢸⣿⡀⠛⢀⣿⡿⢀⣧⣤⣤⣤⣤⣤⣤⣼⡀⢿⣿⡀⠛⢀⣿⡇⢸⡇⠀
⠀⢸⣿⣄⠙⠿⣿⡿⠟⣡⣾⣿⡏⢹⡏⢹⡏⢹⣿⣷⣌⠻⢿⣿⠿⠋⣠⣿⡇⠀
⠀⠸⠿⠿⠷⠶⠶⠶⠾⠿⠿⠿⠿⠾⠿⠿⠷⠿⠿⠿⠿⠷⠶⠶⠶⠾⠿⠿⠇⠀`}
        </pre>
      </div>
      
      {/* Right sound waves - only when playing */}
      {isPlaying ? (
        <div className="font-mono text-xs text-gray-400 leading-tight">
          <div>))</div>
          <div>)))</div>
          <div>))</div>
        </div>
      ) : (
        <div className="w-6"></div>
      )}
    </div>
  );
};

export default Boombox; 