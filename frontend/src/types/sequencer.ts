export interface SequencerState {
  grid: boolean[][];     // 8x16 grid of pad states
  isPlaying: boolean;    // Playback state
  currentStep: number;   // Current column (0-15)
  bpm: number;          // Beats per minute (80-200)
}

export interface GPIOCommand {
  channels: number[];    // Array of channel IDs to trigger
  duration: number;      // Trigger duration in milliseconds
}

export interface ImmediateTrigger {
  channel: number;       // Single channel ID for immediate trigger
  duration: number;      // Trigger duration in milliseconds
}

export interface ConnectionStatus {
  connected: boolean;    // WebSocket connection status
  gpio_available: boolean; // GPIO hardware availability
}

export interface ErrorMessage {
  error: string;         // Error description
  channel?: number;      // Optional channel if error is channel-specific
}

export interface StopChannelsCommand {
  channels: number[];    // Channels to stop, empty array for all
}

export interface PingMessage {
  // Empty ping message
}

export interface WebSocketMessage {
  type: 'gpio_trigger' | 'immediate_trigger' | 'connection_status' | 'error' | 'stop_channels' | 'ping' | 'gpio_trigger_response' | 'immediate_trigger_response' | 'stop_channels_response' | 'pong';
  data: GPIOCommand | ImmediateTrigger | ConnectionStatus | ErrorMessage | StopChannelsCommand | PingMessage | any;
}

export interface PadProps {
  isActive: boolean;
  isCurrentStep: boolean;
  channelIndex: number;
  stepIndex: number;
  onToggle: (channelIndex: number, stepIndex: number) => void;
  onTrigger: (channelIndex: number) => void;
}

export interface ControlsProps {
  bpm: number;
  isPlaying: boolean;
  onBpmChange: (bpm: number) => void;
  onPlayToggle: () => void;
}

export interface SequencerGridProps {
  grid: boolean[][];
  currentStep: number;
  onPadToggle: (channelIndex: number, stepIndex: number) => void;
  onChannelTrigger: (channelIndex: number) => void;
}

// Configuration types
export interface ChannelMapping {
  [channelIndex: string]: number; // Channel index to GPIO pin mapping
}

export interface SequencerConfig {
  channelMapping: ChannelMapping;
  defaultBpm: number;
  triggerDuration: number; // Default trigger duration in ms
} 