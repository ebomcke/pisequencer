"""
WebSocket handler for real-time communication between frontend and GPIO controller.
Handles sequencer commands and provides immediate response.
"""

import json
import logging
import asyncio
import uuid
from typing import Dict, Any, Optional
from starlette.websockets import WebSocket, WebSocketDisconnect

from .gpio_controller import GPIOController

logger = logging.getLogger(__name__)


class WebSocketHandler:
    """Handles WebSocket connections and GPIO commands."""
    
    def __init__(self, gpio_controller: GPIOController):
        self.gpio_controller = gpio_controller
        self.active_connections: Dict[str, WebSocket] = {}
        
    async def handle_websocket(self, websocket: WebSocket):
        """Handle incoming WebSocket connections."""
        connection_id = str(uuid.uuid4())
        
        try:
            await websocket.accept()
            self.active_connections[connection_id] = websocket
            
            logger.info(f"WebSocket connection established: {connection_id}")
            
            # Send initial connection status
            await self._send_connection_status(websocket)
            
            # Main message loop
            while True:
                try:
                    data = await websocket.receive_text()
                    message = json.loads(data)
                    await self._process_message(websocket, message)
                    
                except WebSocketDisconnect:
                    logger.info(f"WebSocket client disconnected: {connection_id}")
                    break
                    
                except Exception as e:
                    logger.error(f"Error in WebSocket message loop: {e}")
                    await self._send_error(websocket, f"Server error: {str(e)}")
                    break
                    
        except WebSocketDisconnect:
            logger.info(f"WebSocket connection closed during handshake: {connection_id}")
        except Exception as e:
            logger.error(f"WebSocket connection error: {e}")
        finally:
            if connection_id in self.active_connections:
                del self.active_connections[connection_id]
                
    async def _process_message(self, websocket: WebSocket, message: Dict[str, Any]):
        """Process incoming WebSocket message."""
        try:
            message_type = message.get('type')
            data = message.get('data', {})
            
            if message_type == 'gpio_trigger':
                await self._handle_gpio_trigger(websocket, data)
            elif message_type == 'immediate_trigger':
                await self._handle_immediate_trigger(websocket, data)
            elif message_type == 'stop_channels':
                await self._handle_stop_channels(websocket, data)
            elif message_type == 'ping':
                await self._handle_ping(websocket)
            else:
                await self._send_error(websocket, f"Unknown message type: {message_type}")
                
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            await self._send_error(websocket, f"Error processing message: {str(e)}")
            
    async def _handle_gpio_trigger(self, websocket: WebSocket, data: Dict[str, Any]):
        """Handle GPIO trigger command for multiple channels."""
        try:
            channels = data.get('channels', [])
            duration = data.get('duration', 50)
            
            if not isinstance(channels, list):
                await self._send_error(websocket, "Channels must be a list")
                return
                
            if not channels:
                return
                
            results = self.gpio_controller.trigger_channels(channels, duration)
            
            response = {
                'type': 'gpio_trigger_response',
                'data': {
                    'channels': channels,
                    'duration': duration,
                    'results': results,
                    'success': all(results.values())
                }
            }
            await websocket.send_text(json.dumps(response))
            
            if duration > 0:
                asyncio.create_task(self._delayed_stop(channels, duration))
                
        except Exception as e:
            logger.error(f"Error handling GPIO trigger: {e}")
            await self._send_error(websocket, f"GPIO trigger error: {str(e)}")
            
    async def _handle_immediate_trigger(self, websocket: WebSocket, data: Dict[str, Any]):
        """Handle immediate trigger for single channel."""
        try:
            channel = data.get('channel')
            duration = data.get('duration', 50)
            
            if channel is None:
                await self._send_error(websocket, "Channel is required")
                return
                
            success = self.gpio_controller.trigger_channel(channel, duration)
            
            response = {
                'type': 'immediate_trigger_response',
                'data': {
                    'channel': channel,
                    'duration': duration,
                    'success': success
                }
            }
            await websocket.send_text(json.dumps(response))
            
            if duration > 0 and success:
                asyncio.create_task(self._delayed_stop([channel], duration))
                
        except Exception as e:
            logger.error(f"Error handling immediate trigger: {e}")
            await self._send_error(websocket, f"Immediate trigger error: {str(e)}")
            
    async def _handle_stop_channels(self, websocket: WebSocket, data: Dict[str, Any]):
        """Handle stop channels command."""
        try:
            channels = data.get('channels', [])
            
            if not channels:
                self.gpio_controller.stop_all_channels()
            else:
                for channel in channels:
                    self.gpio_controller.stop_channel(channel)
                    
            response = {
                'type': 'stop_channels_response',
                'data': {
                    'channels': channels if channels else 'all',
                    'success': True
                }
            }
            await websocket.send_text(json.dumps(response))
            
        except Exception as e:
            logger.error(f"Error stopping channels: {e}")
            await self._send_error(websocket, f"Stop channels error: {str(e)}")
            
    async def _handle_ping(self, websocket: WebSocket):
        """Handle ping message."""
        try:
            response = {
                'type': 'pong',
                'data': {
                    'timestamp': asyncio.get_event_loop().time()
                }
            }
            await websocket.send_text(json.dumps(response))
        except Exception as e:
            logger.error(f"Error handling ping: {e}")
        
    async def _delayed_stop(self, channels: list, delay_ms: int):
        """Stop channels after specified delay."""
        try:
            delay_seconds = delay_ms / 1000.0
            await asyncio.sleep(delay_seconds)
            
            for channel in channels:
                self.gpio_controller.stop_channel(channel)
                
        except Exception as e:
            logger.error(f"Error in delayed stop: {e}")
            
    async def _send_connection_status(self, websocket: WebSocket):
        """Send connection status to client."""
        try:
            status = {
                'type': 'connection_status',
                'data': {
                    'connected': True,
                    'gpio_available': self.gpio_controller.is_available(),
                    'channel_mapping': self.gpio_controller.get_channel_mapping()
                }
            }
            
            await websocket.send_text(json.dumps(status))
            
        except Exception as e:
            logger.error(f"Error sending connection status: {e}")
            raise
            
    async def _send_error(self, websocket: WebSocket, error_message: str, channel: Optional[int] = None):
        """Send error message to client."""
        try:
            error = {
                'type': 'error',
                'data': {
                    'error': error_message,
                    'channel': channel
                }
            }
            await websocket.send_text(json.dumps(error))
        except Exception as e:
            logger.error(f"Error sending error message: {e}")
            
    async def broadcast_message(self, message: Dict[str, Any]):
        """Broadcast message to all connected clients."""
        if not self.active_connections:
            return
            
        message_text = json.dumps(message)
        disconnected = []
        
        for connection_id, websocket in self.active_connections.items():
            try:
                await websocket.send_text(message_text)
            except Exception as e:
                logger.error(f"Error broadcasting to {connection_id}: {e}")
                disconnected.append(connection_id)
                
        for connection_id in disconnected:
            if connection_id in self.active_connections:
                del self.active_connections[connection_id] 