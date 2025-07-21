import { useEffect, useCallback } from 'react';
import { useSequencer } from './hooks/useSequencer';
import { useSequencerWebSocket } from './hooks/useWebSocket';
import SequencerGrid from './components/SequencerGrid';
import Controls from './components/Controls';

function App() {
  // Initialize sequencer state
  const {
    grid,
    isPlaying,
    currentStep,
    bpm,
    togglePad,
    setBpm,
    togglePlayback,
    getActiveChannels,
    setStepCallback
  } = useSequencer();

  // Initialize WebSocket connection
  const {
    isConnected,
    connectionStatus,
    lastError,
    triggerGPIO,
    triggerImmediate
  } = useSequencerWebSocket({
    onConnect: () => console.log('Connected to sequencer backend'),
    onDisconnect: () => console.log('Disconnected from sequencer backend'),
    onError: (error) => console.error('WebSocket error:', error)
  });

  // Handle step changes - trigger GPIO for active channels
  const handleStep = useCallback((step: number) => {
    const activeChannels = getActiveChannels(step);
    if (activeChannels.length > 0) {
      triggerGPIO(activeChannels, 50); // 50ms trigger duration
    }
  }, [getActiveChannels, triggerGPIO]);

  // Set step callback in sequencer
  useEffect(() => {
    setStepCallback(handleStep);
  }, [setStepCallback, handleStep]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only prevent default for exact key presses without modifiers
      const sequencerKeys = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'Space'];
      if (sequencerKeys.includes(e.code) && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
      }

      // Handle spacebar for play/toggle
      if (e.code === 'Space') {
        togglePlayback();
        return;
      }

      // Handle Q-I keys for channel triggers (0-7)
      const keyChannelMap: { [key: string]: number } = {
        'KeyQ': 0,
        'KeyW': 1,
        'KeyE': 2,
        'KeyR': 3,
        'KeyT': 4,
        'KeyY': 5,
        'KeyU': 6,
        'KeyI': 7
      };

      const channel = keyChannelMap[e.code];
      if (channel !== undefined) {
        triggerImmediate(channel, 50);
      }
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlayback, triggerImmediate]);

  // Handle pad toggle
  const handlePadToggle = useCallback((channelIndex: number, stepIndex: number) => {
    togglePad(channelIndex, stepIndex);
  }, [togglePad]);

  // Handle channel trigger (immediate pad press without Cmd)
  const handleChannelTrigger = useCallback((channelIndex: number) => {
    triggerImmediate(channelIndex, 50);
  }, [triggerImmediate]);

  return (
    <div className="min-h-screen bg-sequencer-bg p-6">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          16-Step Sequencer
        </h1>
        <p className="text-gray-400">
          Real-time drum machine with Raspberry Pi GPIO control
        </p>
        
        {/* Connection status */}
        <div className="mt-4 flex items-center space-x-4 text-sm">
          <div className={`flex items-center space-x-2 ${
            isConnected ? 'text-green-400' : 'text-red-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-400' : 'bg-red-400'
            }`}></div>
            <span>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          {connectionStatus && (
            <div className={`text-sm ${
              connectionStatus.gpio_available ? 'text-blue-400' : 'text-yellow-400'
            }`}>
              GPIO: {connectionStatus.gpio_available ? 'Available' : 'Mock Mode'}
            </div>
          )}
          
          {lastError && (
            <div className="text-red-400 text-sm">
              Error: {lastError}
            </div>
          )}
        </div>
      </header>

      {/* Controls */}
      <div className="max-w-7xl mx-auto">
        <Controls
          bpm={bpm}
          isPlaying={isPlaying}
          onBpmChange={setBpm}
          onPlayToggle={togglePlayback}
        />
      </div>

      {/* Sequencer Grid - Full Width */}
      <SequencerGrid
        grid={grid}
        currentStep={currentStep}
        onPadToggle={handlePadToggle}
        onChannelTrigger={handleChannelTrigger}
      />
    </div>
  );
}

export default App;
