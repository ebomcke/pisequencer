"""
GPIO Controller for Raspberry Pi hardware integration.
Handles channel-to-pin mapping and GPIO pin activation.
"""

import os
import json
import logging
import threading
import time
from typing import Dict, List, Optional
from pathlib import Path

# Try to import gpio library, fallback to mock for development
try:
    import gpio as GPIO
    GPIO_AVAILABLE = True
    print("GPIO library available - using real GPIO implementation")
    
except ImportError:
    # Mock GPIO for development environments
    GPIO_AVAILABLE = False
    print("GPIO library not available - using mock implementation for development")

logger = logging.getLogger(__name__)


class MockGPIO:
    """Mock GPIO implementation for development/testing."""
    
    # Mock GPIO constants
    OUT = "OUT"
    HIGH = True
    LOW = False
    
    def __init__(self):
        self.pin_states = {}
        
    def setup(self, pin: int, mode: str):
        """Mock GPIO setup."""
        self.pin_states[pin] = False
        logger.info(f"[MOCK] GPIO pin {pin} setup as {mode}")
        
    def output(self, pin: int, value: bool):
        """Mock GPIO output."""
        self.pin_states[pin] = value
        logger.info(f"[MOCK] GPIO pin {pin} set to {'HIGH' if value else 'LOW'}")
        
    def cleanup(self):
        """Mock GPIO cleanup."""
        logger.info("[MOCK] GPIO cleanup")
        self.pin_states.clear()


class GPIOController:
    """
    Controls GPIO pins for sequencer channels.
    Maps sequencer channels (0-7) to specific GPIO pins.
    
    Signal Logic:
    - Idle state: HIGH
    - Trigger state: LOW (active low)
    """
    
    def __init__(self, config_path: Optional[str] = None):
        self.gpio_available = GPIO_AVAILABLE
        self.gpio = GPIO if GPIO_AVAILABLE else MockGPIO()
        self.channel_mapping = self._load_channel_mapping(config_path)
        self.initialized_pins = set()
        self.active_timers = {}  # Track active trigger timers
        self._timer_lock = threading.Lock()  # Thread safety for timers
        
        # Initialize GPIO pins
        self._initialize_gpio()
        
        # Test all pins during startup
        self._test_pins()
        
    def _load_channel_mapping(self, config_path: Optional[str] = None) -> Dict[int, int]:
        """Load channel-to-GPIO-pin mapping from configuration."""
        if config_path is None:
            # Default mapping if no config file provided
            return {
                0: 2,
                1: 3,
                2: 4,
                3: 17,
                4: 27,
                5: 22,
                6: 10,
                7: 9
            }
            
        try:
            config_file = Path(config_path)
            if config_file.exists():
                with open(config_file, 'r') as f:
                    config = json.load(f)
                    # Convert string keys to integers
                    return {int(k): v for k, v in config.get('channel_mapping', {}).items()}
            else:
                logger.warning(f"Config file {config_path} not found, using default mapping")
                return self._load_channel_mapping(None)
        except Exception as e:
            logger.error(f"Error loading config: {e}, using default mapping")
            return self._load_channel_mapping(None)
            
    def _initialize_gpio(self):
        """Initialize all GPIO pins as outputs and set to idle state (HIGH)."""
        try:
            for channel, pin in self.channel_mapping.items():
                self.gpio.setup(pin, self.gpio.OUT)
                # Set to idle state (HIGH)
                self.gpio.output(pin, self.gpio.HIGH)
                self.initialized_pins.add(pin)
                logger.info(f"Initialized GPIO pin {pin} for channel {channel} (set to HIGH)")
        except Exception as e:
            logger.error(f"Error initializing GPIO: {e}")
            
    def _test_pins(self):
        """Send a test signal to each pin during startup to verify functionality."""
        logger.info("Starting GPIO pin test sequence...")
        
        try:
            for channel, pin in self.channel_mapping.items():
                # Send a short test pulse (LOW for 100ms)
                logger.info(f"Testing pin {pin} (channel {channel})")
                self.gpio.output(pin, self.gpio.LOW)
                time.sleep(0.1)  # 100ms test pulse
                self.gpio.output(pin, self.gpio.HIGH)
                time.sleep(0.05)  # Small gap between tests
                
            logger.info("GPIO pin test sequence completed successfully")
        except Exception as e:
            logger.error(f"Error during GPIO pin testing: {e}")
            
    def trigger_channel(self, channel: int, duration: int = 50) -> bool:
        """
        Trigger a single channel for specified duration.
        Sets pin LOW for the duration, then restores to HIGH.
        
        Args:
            channel: Channel number (0-7)
            duration: Trigger duration in milliseconds
            
        Returns:
            bool: True if successful, False otherwise
        """
        if channel not in self.channel_mapping:
            logger.error(f"Invalid channel: {channel}")
            return False
            
        pin = self.channel_mapping[channel]
        
        try:
            # Cancel any existing timer for this channel
            with self._timer_lock:
                if channel in self.active_timers:
                    self.active_timers[channel].cancel()
                    del self.active_timers[channel]
            
            # Set pin LOW (trigger state)
            self.gpio.output(pin, self.gpio.LOW)
            logger.debug(f"Channel {channel} (pin {pin}) triggered LOW for {duration}ms")
            
            # Create timer to restore HIGH state after duration
            def restore_pin():
                try:
                    self.gpio.output(pin, self.gpio.HIGH)
                    logger.debug(f"Channel {channel} (pin {pin}) restored to HIGH")
                    with self._timer_lock:
                        if channel in self.active_timers:
                            del self.active_timers[channel]
                except Exception as e:
                    logger.error(f"Error restoring channel {channel}: {e}")
            
            timer = threading.Timer(duration / 1000.0, restore_pin)
            
            with self._timer_lock:
                self.active_timers[channel] = timer
            
            timer.start()
            
            return True
        except Exception as e:
            logger.error(f"Error triggering channel {channel}: {e}")
            return False
            
    def trigger_channels(self, channels: List[int], duration: int = 50) -> Dict[int, bool]:
        """
        Trigger multiple channels simultaneously.
        
        Args:
            channels: List of channel numbers to trigger
            duration: Trigger duration in milliseconds
            
        Returns:
            dict: Channel -> success status mapping
        """
        results = {}
        
        # Trigger all channels
        for channel in channels:
            results[channel] = self.trigger_channel(channel, duration)
            
        return results
        
    def stop_channel(self, channel: int) -> bool:
        """
        Stop/release a channel immediately (set pin HIGH - idle state).
        Cancels any active timer for this channel.
        
        Args:
            channel: Channel number (0-7)
            
        Returns:
            bool: True if successful, False otherwise
        """
        if channel not in self.channel_mapping:
            logger.error(f"Invalid channel: {channel}")
            return False
            
        pin = self.channel_mapping[channel]
        
        try:
            # Cancel any active timer
            with self._timer_lock:
                if channel in self.active_timers:
                    self.active_timers[channel].cancel()
                    del self.active_timers[channel]
            
            # Set to idle state (HIGH)
            self.gpio.output(pin, self.gpio.HIGH)
            logger.debug(f"Channel {channel} (pin {pin}) stopped (set to HIGH)")
            return True
        except Exception as e:
            logger.error(f"Error stopping channel {channel}: {e}")
            return False
            
    def stop_all_channels(self):
        """Stop all channels immediately (set all pins HIGH - idle state)."""
        # Cancel all active timers
        with self._timer_lock:
            for timer in self.active_timers.values():
                timer.cancel()
            self.active_timers.clear()
        
        # Set all pins to idle state
        for channel in self.channel_mapping.keys():
            if channel not in self.channel_mapping:
                continue
            pin = self.channel_mapping[channel]
            try:
                self.gpio.output(pin, self.gpio.HIGH)
                logger.debug(f"Channel {channel} (pin {pin}) set to HIGH")
            except Exception as e:
                logger.error(f"Error setting channel {channel} to HIGH: {e}")
                
    def is_available(self) -> bool:
        """Check if GPIO is available."""
        return self.gpio_available
        
    def get_channel_mapping(self) -> Dict[int, int]:
        """Get the current channel-to-pin mapping."""
        return self.channel_mapping.copy()
        
    def get_active_channels(self) -> List[int]:
        """Get list of currently active (triggered) channels."""
        with self._timer_lock:
            return list(self.active_timers.keys())
        
    def cleanup(self):
        """Cleanup GPIO resources and cancel all active timers."""
        try:
            # Cancel all active timers
            with self._timer_lock:
                for timer in self.active_timers.values():
                    timer.cancel()
                self.active_timers.clear()
            
            # Set all pins to idle state (HIGH)
            self.stop_all_channels()
            
            # Cleanup GPIO library
            if hasattr(self.gpio, 'cleanup'):
                self.gpio.cleanup()
            logger.info("GPIO cleanup completed")
        except Exception as e:
            logger.error(f"Error during GPIO cleanup: {e}")
            
    def __del__(self):
        """Destructor to ensure cleanup."""
        self.cleanup() 