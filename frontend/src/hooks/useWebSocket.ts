import { useState, useEffect, useRef, useCallback } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import type { WebSocketMessage, GPIOCommand, ImmediateTrigger, ConnectionStatus, ErrorMessage } from '../types/sequencer';

export interface WebSocketOptions {
  url?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

export const useSequencerWebSocket = (options: WebSocketOptions = {}) => {
  const {
    url = `ws://${window.location.hostname}:${window.location.port || '8000'}/ws`,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  
  const messageHandlersRef = useRef<Map<string, (data: any) => void>>(new Map());

  const {
    sendJsonMessage,
    lastJsonMessage,
    readyState,
    getWebSocket
  } = useWebSocket(url, {
    onOpen: () => {
      setLastError(null);
      onConnect?.();
    },
    onClose: () => {
      setConnectionStatus(null);
      onDisconnect?.();
    },
    onError: () => {
      const errorMessage = 'WebSocket connection error';
      setLastError(errorMessage);
      onError?.(errorMessage);
    },
    shouldReconnect: () => true,
    reconnectAttempts: 1,
    reconnectInterval: 3000,
  });

  // Convert WebSocket ready state to boolean
  const isConnected = readyState === ReadyState.OPEN;

  // Handle incoming messages
  useEffect(() => {
    if (lastJsonMessage) {
      handleMessage(lastJsonMessage as WebSocketMessage);
    }
  }, [lastJsonMessage]);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    try {
      switch (message.type) {
        case 'connection_status':
          setConnectionStatus(message.data as ConnectionStatus);
          break;
        case 'error':
          const error = message.data as ErrorMessage;
          setLastError(error.error);
          onError?.(error.error);
          break;
      }

      const handler = messageHandlersRef.current.get(message.type);
      if (handler) {
        handler(message.data);
      }
    } catch (error) {
      const errorMessage = `Error handling message: ${error}`;
      setLastError(errorMessage);
      onError?.(errorMessage);
    }
  }, [onError]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (!isConnected) {
      const errorMessage = 'WebSocket not connected';
      setLastError(errorMessage);
      return false;
    }

    try {
      sendJsonMessage(message);
      return true;
    } catch (error) {
      const errorMessage = `Failed to send message: ${error}`;
      setLastError(errorMessage);
      onError?.(errorMessage);
      return false;
    }
  }, [isConnected, sendJsonMessage, onError]);

  const triggerGPIO = useCallback((channels: number[], duration: number = 50) => {
    const command: GPIOCommand = { channels, duration };
    return sendMessage({
      type: 'gpio_trigger',
      data: command
    });
  }, [sendMessage]);

  const triggerImmediate = useCallback((channel: number, duration: number = 50) => {
    const trigger: ImmediateTrigger = { channel, duration };
    return sendMessage({
      type: 'immediate_trigger',
      data: trigger
    });
  }, [sendMessage]);

  const stopChannels = useCallback((channels?: number[]) => {
    return sendMessage({
      type: 'stop_channels',
      data: { channels: channels || [] }
    });
  }, [sendMessage]);

  const ping = useCallback(() => {
    return sendMessage({
      type: 'ping',
      data: { timestamp: Date.now() }
    });
  }, [sendMessage]);

  const onMessage = useCallback((messageType: string, handler: (data: any) => void) => {
    messageHandlersRef.current.set(messageType, handler);

    return () => {
      messageHandlersRef.current.delete(messageType);
    };
  }, []);

  // Manual connection controls (using the library's WebSocket instance)
  const connect = useCallback(() => {
    // The library handles reconnection automatically
    // This is mainly for explicit reconnection requests
    const ws = getWebSocket();
    if (ws && ws.readyState === WebSocket.CLOSED) {
      // The library will handle reconnection
    }
  }, [getWebSocket]);

  const disconnect = useCallback(() => {
    const ws = getWebSocket();
    if (ws) {
      ws.close(1000, 'Manual disconnect');
    }
  }, [getWebSocket]);

  return {
    isConnected,
    connectionStatus,
    lastError,
    connect,
    disconnect,
    sendMessage,
    onMessage,
    triggerGPIO,
    triggerImmediate,
    stopChannels,
    ping
  };
}; 