# Task List: 16-step sequencer web

## Overview
This task list implements the 16-step sequencer web application for Raspberry Pi GPIO control, following the 5-phase implementation plan outlined in the technical blueprint. The project delivers a real-time music sequencer with React frontend (Tailwind CSS, custom hooks, Web Audio API timing) and Python backend (Starlette, WebSocket, GPIO integration). Each task maps to specific acceptance criteria from the PRD and maintains the minimal, performance-focused architecture required for Raspberry Pi deployment.

## Relevant Files
- `backend/src/pysequencer/main.py` – Starlette ASGI application entry point
- `backend/src/pysequencer/websocket_handler.py` – WebSocket communication handler
- `backend/src/pysequencer/gpio_controller.py` – GPIO hardware abstraction layer
- `backend/src/pysequencer/channel_mapper.py` – Channel-to-GPIO-pin mapping
- `backend/src/pysequencer/command_processor.py` – Multi-channel GPIO trigger processor
- `backend/config/gpio_mapping.json` – GPIO pin configuration file
- `frontend/src/App.tsx` – Main application with keyboard event handling
- `frontend/src/components/SequencerGrid.tsx` – 8×16 grid container component
- `frontend/src/components/Pad.tsx` – Reusable interactive pad component
- `frontend/src/components/Controls.tsx` – BPM input and playback controls
- `frontend/src/hooks/useSequencer.ts` – Sequencer state management hook
- `frontend/src/hooks/useWebSocket.ts` – WebSocket communication hook
- `frontend/src/utils/AudioScheduler.ts` – Web Audio API timing engine
- `frontend/src/types/sequencer.ts` – TypeScript interface definitions
- `frontend/tailwind.config.js` – Tailwind CSS configuration
- `backend/tests/test_gpio_controller.py` – GPIO controller unit tests
- `backend/tests/test_websocket_handler.py` – WebSocket handler unit tests
- `frontend/src/__tests__/useSequencer.test.ts` – Sequencer hook unit tests
- `frontend/src/__tests__/Pad.test.tsx` – Pad component unit tests

## Tasks

### 1.0 Core Infrastructure Setup
- [ ] 1.1 Install and configure Tailwind CSS in React project
- [ ] 1.2 Create TypeScript interfaces for sequencer state and GPIO commands
- [ ] 1.3 Set up basic SequencerGrid component with 8×16 layout
- [ ] 1.4 Create reusable Pad component with click handling
- [ ] 1.5 Implement useSequencer hook for grid state management
- [ ] 1.6 Initialize Starlette ASGI application with WebSocket support
- [ ] 1.7 Create GPIO controller with basic channel mapping
- [ ] 1.8 Set up development environment with mock GPIO for testing

### 2.0 Real-time Communication
- [ ] 2.1 Implement useWebSocket hook with connection management
- [ ] 2.2 Create WebSocket handler in Python backend
- [ ] 2.3 Define WebSocket message protocol for GPIO commands
- [ ] 2.4 Test basic pad-to-GPIO communication flow
- [ ] 2.5 Add simultaneous multi-channel trigger support
- [ ] 2.6 Implement WebSocket connection status handling
- [ ] 2.7 Add automatic reconnection logic with exponential backoff
- [ ] 2.8 Create error handling for GPIO permission issues

### 3.0 Timing and Playback Engine
- [ ] 3.1 Integrate Web Audio API for high-resolution timing
- [ ] 3.2 Create AudioScheduler utility for precise BPM timing
- [ ] 3.3 Implement sequence playback with column highlighting
- [ ] 3.4 Add BPM configuration component (80-200 range)
- [ ] 3.5 Create start/stop sequence controls
- [ ] 3.6 Add continuous loop playback functionality
- [ ] 3.7 Implement sequence restart from beginning when stopped
- [ ] 3.8 Test timing accuracy across different BPM settings

### 4.0 User Interactions
- [ ] 4.1 Add keyboard event handling at app level (Q-I keys)
- [ ] 4.2 Map keyboard keys to 8 sequencer channels
- [ ] 4.3 Implement Command+click modifier detection in Pad components
- [ ] 4.4 Add immediate GPIO triggering for live keyboard play
- [ ] 4.5 Create visual feedback for pad activation states
- [ ] 4.6 Add visual feedback for current playback column
- [ ] 4.7 Implement visual feedback for keyboard key presses
- [ ] 4.8 Test all interaction methods (mouse, keyboard, modifiers)

### 5.0 Production Deployment
- [ ] 5.1 Configure Starlette StaticFiles for React build serving
- [ ] 5.2 Create production build scripts for frontend
- [ ] 5.3 Set up GPIO channel-to-pin mapping configuration
- [ ] 5.4 Add environment variable configuration for Pi deployment
- [ ] 5.5 Create Raspberry Pi GPIO permissions setup documentation
- [ ] 5.6 Implement basic error logging and health monitoring
- [ ] 5.7 Create systemd service configuration for auto-start
- [ ] 5.8 Test complete system on target Raspberry Pi hardware

## Notes
- Unit tests should be created alongside each component and service
- Use `npm test` for frontend testing and `pytest` for backend testing
- Mock GPIO library in development environment to prevent hardware dependencies
- Follow React Testing Library patterns for component tests
- Ensure Web Audio API requires user interaction before starting audio context
- Keep backend minimal - all timing calculations handled in frontend
- Test WebSocket communication thoroughly before hardware integration
- Document GPIO pin assignments clearly for hardware setup
- Verify Tailwind CSS classes work correctly across different screen sizes
- Maintain single bundle approach for optimal Pi performance 