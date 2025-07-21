import { useState, useCallback, useRef, useEffect } from 'react';
import type { SequencerState } from '../types/sequencer';
import { AudioClock } from '../utils/AudioClock';

export const useSequencer = () => {
  // Initialize 8x16 grid with all pads off
  const initializeGrid = (): boolean[][] => {
    return Array(8).fill(null).map(() => Array(16).fill(false));
  };

  const [state, setState] = useState<SequencerState>({
    grid: initializeGrid(),
    isPlaying: false,
    currentStep: 0,
    bpm: 120
  });

  // Audio clock for precise timing
  const clockRef = useRef<AudioClock | null>(null);
  const onStepCallbackRef = useRef<((step: number) => void) | null>(null);

  // Initialize audio clock
  useEffect(() => {
    clockRef.current = new AudioClock();

    // Set up step callback
    clockRef.current.onStep((step: number) => {
      setState(prev => ({ ...prev, currentStep: step }));
      onStepCallbackRef.current?.(step);
    });

    return () => {
      clockRef.current?.destroy();
    };
  }, []);

  // Toggle a specific pad on/off
  const togglePad = useCallback((channelIndex: number, stepIndex: number) => {
    setState(prev => {
      const newGrid = prev.grid.map((row, rowIndex) =>
        rowIndex === channelIndex
          ? row.map((pad, padIndex) =>
              padIndex === stepIndex ? !pad : pad
            )
          : row
      );
      return { ...prev, grid: newGrid };
    });
  }, []);

  // Clear all pads
  const clearGrid = useCallback(() => {
    setState(prev => ({
      ...prev,
      grid: initializeGrid()
    }));
  }, []);

  // Clear specific channel
  const clearChannel = useCallback((channelIndex: number) => {
    setState(prev => {
      const newGrid = prev.grid.map((row, rowIndex) =>
        rowIndex === channelIndex ? Array(16).fill(false) : row
      );
      return { ...prev, grid: newGrid };
    });
  }, []);

  // Set BPM with validation
  const setBpm = useCallback((bpm: number) => {
    const clampedBpm = Math.max(80, Math.min(200, bpm));
    setState(prev => ({ ...prev, bpm: clampedBpm }));
    
    // Update clock BPM if running
    if (clockRef.current) {
      clockRef.current.setBpm(clampedBpm);
    }
  }, []);

  // Get active channels for current step
  const getActiveChannels = useCallback((stepIndex: number): number[] => {
    return state.grid
      .map((row, channelIndex) => row[stepIndex] ? channelIndex : -1)
      .filter(channelIndex => channelIndex !== -1);
  }, [state.grid]);

  // Start playback
  const play = useCallback(async () => {
    if (state.isPlaying || !clockRef.current) return;

    const started = await clockRef.current.start(state.bpm, 0);
    if (started) {
      setState(prev => ({ ...prev, isPlaying: true, currentStep: 0 }));
    } else {
      console.error('Failed to start audio clock');
    }
  }, [state.isPlaying, state.bpm]);

  // Stop playback
  const stop = useCallback(() => {
    if (!state.isPlaying || !clockRef.current) return;

    clockRef.current.stop();
    setState(prev => ({ ...prev, isPlaying: false, currentStep: 0 }));
  }, [state.isPlaying]);

  // Toggle play/stop
  const togglePlayback = useCallback(() => {
    if (state.isPlaying) {
      stop();
    } else {
      play();
    }
  }, [state.isPlaying, play, stop]);

  // Set step callback for external handling (e.g., GPIO triggers)
  const setStepCallback = useCallback((callback: (step: number) => void) => {
    onStepCallbackRef.current = callback;
  }, []);

  // Calculate step duration in milliseconds
  const getStepDuration = useCallback((): number => {
    return (60000 / state.bpm) / 4;
  }, [state.bpm]);

  // Get clock state for debugging
  const getClockState = useCallback(() => {
    return clockRef.current?.getState() || null;
  }, []);

  return {
    // State
    grid: state.grid,
    isPlaying: state.isPlaying,
    currentStep: state.currentStep,
    bpm: state.bpm,
    
    // Actions
    togglePad,
    clearGrid,
    clearChannel,
    setBpm,
    togglePlayback,
    play,
    stop,
    
    // Utilities
    getActiveChannels,
    getStepDuration,
    setStepCallback,
    getClockState
  };
}; 