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

# Try to import RPi.GPIO library, fallback to mock for development
try:
    import RPi.GPIO as GPIO
    GPIO_AVAILABLE = True
    print("RPi.GPIO library available - using real GPIO implementation")
    
except ImportError:
    # Mock GPIO for development environments
    GPIO_AVAILABLE = False
    print("RPi.GPIO library not available - using mock implementation for development")

logger = logging.getLogger(__name__)


class MockGPIO:
    """Mock GPIO implementation for development/testing."""
    
    # Mock GPIO constants to match RPi.GPIO
    BCM = "BCM"
    OUT = "OUT"
    HIGH = 1
    LOW = 0
    
    def __init__(self):
        self.pin_states = {}
        self.mode_set = False
        
    def setmode(self, mode):
        """Mock GPIO setmode."""
        self.mode_set = True
        logger.info(f"[MOCK] GPIO mode set to {mode}")
        
    def setup(self, pin: int, mode: str):
        """Mock GPIO setup."""
        if not self.mode_set:
            logger.warning("[MOCK] GPIO mode not set, setting to BCM")
            self.setmode(self.BCM)
        self.pin_states[pin] = False
        logger.info(f"[MOCK] GPIO pin {pin} setup as {mode}")
        
    def output(self, pin: int, value: int):
        """Mock GPIO output."""
        self.pin_states[pin] = bool(value)
        logger.info(f"[MOCK] GPIO pin {pin} set to {'HIGH' if value else 'LOW'}")
        
    def cleanup(self):
        """Mock GPIO cleanup."""
        logger.info("[MOCK] GPIO cleanup")
        self.pin_states.clear()
        self.mode_set = False


class GPIOController:
    """
    Controls GPIO pins for sequencer channels.
    Maps sequencer channels (0-7) to specific GPIO pins.
    
    Signal Logic:
    - Idle state: HIGH (1)
    - Trigger state: LOW (0) - active low
    """
    
    def __init__(self, config_path: Optional[str] = None):
        self.gpio_available = GPIO_AVAILABLE
        self.gpio = GPIO if GPIO_AVAILABLE else MockGPIO()
        
        logger.info(f"Initializing GPIOController with GPIO_AVAILABLE={GPIO_AVAILABLE}")
        logger.info(f"GPIO library type: {type(self.gpio)}")
        
        self.channel_mapping = self._load_channel_mapping(config_path)
        logger.info(f"Channel mapping loaded: {self.channel_mapping}")
        
        self.initialized_pins = set()
        self.active_timers = {}  # Track active trigger timers
        self._timer_lock = threading.Lock()  # Thread safety for timers
        
        # Initialize GPIO pins
        self._initialize_gpio()
        
    def _load_channel_mapping(self, config_path: Optional[str] = None) -> Dict[int, int]:
        """Load channel-to-GPIO-pin mapping from configuration."""
        if config_path is None:
            # Default mapping if no config file provided
            logger.info("Using default channel mapping")
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
                logger.info(f"Loading channel mapping from {config_path}")
                with open(config_file, 'r') as f:
                    config = json.load(f)
                    # Convert string keys to integers
                    mapping = {int(k): v for k, v in config.get('channel_mapping', {}).items()}
                    logger.info(f"Loaded channel mapping from config: {mapping}")
                    return mapping
            else:
                logger.warning(f"Config file {config_path} not found, using default mapping")
                return self._load_channel_mapping(None)
        except Exception as e:
            logger.exception(f"Error loading config from {config_path}, using default mapping")
            return self._load_channel_mapping(None)
            
    def _initialize_gpio(self):
        """Initialize all GPIO pins as outputs and set to idle state (HIGH)."""
        logger.info("Starting GPIO initialization...")
        
        try:
            # Set GPIO mode to BCM (Broadcom pin numbering)
            if self.gpio_available:
                logger.info("Setting GPIO mode to BCM")
                self.gpio.setmode(self.gpio.BCM)
            else:
                logger.info("Using mock GPIO - setting mode to BCM")
                self.gpio.setmode(self.gpio.BCM)
            
            logger.info(f"Available GPIO constants - OUT: {getattr(self.gpio, 'OUT', 'NOT_FOUND')}, HIGH: {getattr(self.gpio, 'HIGH', 'NOT_FOUND')}, LOW: {getattr(self.gpio, 'LOW', 'NOT_FOUND')}")
            
            for channel, pin in self.channel_mapping.items():
                logger.info(f"Initializing channel {channel} -> GPIO pin {pin}")
                try:
                    logger.debug(f"Setting up GPIO pin {pin} as output...")
                    self.gpio.setup(pin, self.gpio.OUT)
                    logger.debug(f"Setting GPIO pin {pin} to HIGH (idle state)...")
                    # Set to idle state (HIGH)
                    self.gpio.output(pin, self.gpio.HIGH)
                    self.initialized_pins.add(pin)
                    logger.info(f"Successfully initialized GPIO pin {pin} for channel {channel} (set to HIGH)")
                except Exception as pin_error:
                    logger.exception(f"Failed to initialize GPIO pin {pin} for channel {channel}")
                    raise  # Re-raise to trigger outer exception handler
        except Exception as e:
            logger.exception("Error initializing GPIO - full traceback above")
            raise  # Re-raise so caller knows initialization failed
            
    def _test_pins(self):
        """Send a test signal to each pin during startup to verify functionality."""
        logger.info("Starting GPIO pin test sequence...")
        
        try:
            for channel, pin in self.channel_mapping.items():
                try:
                    # Send a short test pulse (LOW for 100ms)
                    logger.info(f"Testing pin {pin} (channel {channel})")
                    self.gpio.output(pin, self.gpio.LOW)
                    time.sleep(0.1)  # 100ms test pulse
                    self.gpio.output(pin, self.gpio.HIGH)
                    time.sleep(0.05)  # Small gap between tests
                    logger.debug(f"Pin {pin} test completed successfully")
                except Exception as pin_error:
                    logger.exception(f"Error testing GPIO pin {pin} (channel {channel})")
                    # Continue with other pins even if one fails
                
            logger.info("GPIO pin test sequence completed")
        except Exception as e:
            logger.exception("Error during GPIO pin testing")
            
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
                    logger.exception(f"Error restoring channel {channel}")
            
            timer = threading.Timer(duration / 1000.0, restore_pin)
            
            with self._timer_lock:
                self.active_timers[channel] = timer
            
            timer.start()
            
            return True
        except Exception as e:
            logger.exception(f"Error triggering channel {channel}")
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
            logger.exception(f"Error stopping channel {channel}")
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
                logger.exception(f"Error setting channel {channel} to HIGH")
                
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
            if self.gpio_available:
                logger.info("Cleaning up RPi.GPIO")
                self.gpio.cleanup()
            else:
                logger.info("Cleaning up mock GPIO")
                if hasattr(self.gpio, 'cleanup'):
                    self.gpio.cleanup()
            logger.info("GPIO cleanup completed")
        except Exception as e:
            logger.exception("Error during GPIO cleanup")
            
    def __del__(self):
        """Destructor to ensure cleanup."""
        try:
            self.cleanup()
        except Exception:
            # Silently fail in destructor to avoid issues during shutdown
            pass 