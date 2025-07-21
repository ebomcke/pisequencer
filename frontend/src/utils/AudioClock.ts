export class AudioClock {
  private audioContext: AudioContext | null = null;
  private isRunning = false;
  private bpm = 120;
  private currentStep = 0;
  private totalSteps = 16;
  private animationFrameId: number | null = null;
  
  // Timing
  private startTime = 0;
  private nextStepTime = 0;
  private stepDuration = 0; // Duration of one step in seconds
  
  // Callbacks
  private onStepCallback?: (step: number) => void;

  constructor() {}

  /**
   * Initialize the audio context
   */
  async initialize(): Promise<boolean> {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      if (this.audioContext.state !== 'running') {
        console.error('Audio context failed to start');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      return false;
    }
  }

  /**
   * Calculate the duration of one step in seconds
   */
  private calculateStepDuration(): number {
    // Each step is 1/16th of a beat (16th note)
    // 60 seconds / BPM = seconds per beat
    // seconds per beat / 4 = seconds per 16th note
    return (60.0 / this.bpm) / 4;
  }

  /**
   * Main timing loop - checks if it's time for the next step
   */
  private checkTiming = (): void => {
    if (!this.isRunning || !this.audioContext) {
      return;
    }

    const currentTime = this.audioContext.currentTime;

    // Check if it's time for the next step
    if (currentTime >= this.nextStepTime) {
      this.triggerStep();
      
      // Calculate next step time
      this.nextStepTime += this.stepDuration;
    }

    // Continue checking
    this.animationFrameId = requestAnimationFrame(this.checkTiming);
  };

  /**
   * Trigger a step and advance the counter
   */
  private triggerStep(): void {
    // Call the step callback
    this.onStepCallback?.(this.currentStep);
    
    // Advance to next step
    this.currentStep = (this.currentStep + 1) % this.totalSteps;
  }

  /**
   * Start the audio clock
   */
  async start(bpm: number = 120, startStep: number = 0): Promise<boolean> {
    if (this.isRunning) {
      return true;
    }

    const initialized = await this.initialize();
    if (!initialized) {
      console.error('Failed to initialize audio clock');
      return false;
    }

    this.bpm = Math.max(80, Math.min(200, bpm));
    this.currentStep = startStep;
    this.isRunning = true;

    // Calculate timing
    this.stepDuration = this.calculateStepDuration();
    this.startTime = this.audioContext!.currentTime;
    this.nextStepTime = this.startTime + this.stepDuration; // First step happens after one duration

    // Start timing loop
    this.checkTiming();
    
    return true;
  }

  /**
   * Stop the audio clock
   */
  stop(): void {
    this.isRunning = false;
    
    // Stop animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Reset step
    this.currentStep = 0;
  }

  /**
   * Update BPM during playback
   */
  setBpm(bpm: number): void {
    const clampedBpm = Math.max(80, Math.min(200, bpm));
    
    if (clampedBpm === this.bpm) {
      return;
    }

    this.bpm = clampedBpm;
    
    if (this.isRunning && this.audioContext) {
      // Recalculate step duration
      const oldStepDuration = this.stepDuration;
      this.stepDuration = this.calculateStepDuration();
      
      // Adjust the next step time to maintain sync
      const currentTime = this.audioContext.currentTime;
      const timeUntilNextStep = this.nextStepTime - currentTime;
      const adjustmentFactor = this.stepDuration / oldStepDuration;
      
      this.nextStepTime = currentTime + (timeUntilNextStep * adjustmentFactor);
    }
  }

  /**
   * Set callback for step events
   */
  onStep(callback: (step: number) => void): void {
    this.onStepCallback = callback;
  }

  /**
   * Get current clock state
   */
  getState() {
    return {
      isRunning: this.isRunning,
      currentStep: this.currentStep,
      bpm: this.bpm,
      audioContextState: this.audioContext?.state || 'not-initialized',
      stepDuration: this.stepDuration,
      nextStepTime: this.nextStepTime,
      currentTime: this.audioContext?.currentTime || 0
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop();
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
} 