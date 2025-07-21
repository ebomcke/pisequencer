# Product Requirements Document: 16-Step Sequencer Web App

## 1. Overview & Vision

The 16-Step Sequencer is a real-time music production web application designed specifically for Raspberry Pi deployment with GPIO hardware control. This browser-based drum machine features an intuitive 8×16 grid interface where each row represents a different instrument/sound (mapped to GPIO pins) and each column represents 1/8th of a musical beat. Users can create rhythmic patterns by toggling pads on/off, with real-time visual feedback during playback and precise timing control via configurable BPM settings (80-200 BPM).

The application emphasizes simplicity and performance, utilizing a minimal Python backend for GPIO control and a React frontend that handles all timing calculations and user interactions. This architecture ensures optimal performance on resource-constrained Raspberry Pi hardware while providing professional-quality music sequencing capabilities.

## 2. Problem Statement

Musicians and electronic music producers need an affordable, portable, and easy-to-use drum machine/sequencer solution that can integrate with hardware setups. Traditional hardware sequencers are expensive and often lack the flexibility of software, while existing software solutions typically don't provide direct hardware integration with GPIO-controlled devices.

The current gap in the market is for a lightweight, web-based sequencer that can run on inexpensive hardware (Raspberry Pi) while providing real-time, low-latency control of external hardware through GPIO pins. This solution needs to be accessible via any web browser while maintaining the tactile, immediate response that musicians expect from hardware drum machines.

## 3. Target Users

### Primary Users:
- **Electronic music producers** seeking affordable hardware integration solutions
- **DIY musicians** building custom instrument setups with Raspberry Pi
- **Music educators** teaching rhythm and sequencing concepts with hands-on hardware
- **Prototype developers** creating custom music hardware with web-based interfaces

### User Needs:
- Immediate, tactile response to pad interactions
- Visual feedback for sequence playback and timing
- Reliable, low-latency hardware control
- Simple, intuitive interface that doesn't require extensive learning
- Portable solution that runs on inexpensive hardware

## 4. Core Requirements

### 4.1 Functional Requirements

**Grid Interface:**
- 8×16 grid of interactive pads (128 total pads)
- Visual distinction between active/inactive pads
- Real-time visual feedback during sequence playback
- Command+click toggle functionality for individual pads

**Input Controls:**
- Keyboard control using Q-W-E-R-T-Y-U-I keys for 8 channels
- Mouse/trackpad interaction for pad activation
- BPM configuration input (range: 80-200 BPM)
- Start/Stop playback controls

**Sequencer Engine:**
- Continuous loop playback of programmed sequences
- Real-time column highlighting during playback
- Simultaneous multi-channel GPIO triggering
- Restart from beginning when stopped and restarted

**Hardware Integration:**
- Direct GPIO pin control via Raspberry Pi
- Configurable channel-to-GPIO-pin mapping
- Simple digital on/off trigger signals
- Real-time WebSocket communication for immediate response

### 4.2 Non-Functional Requirements

**Performance:**
- Sub-50ms latency for pad-to-GPIO response (acceptable latency)
- Stable timing accuracy for musical applications
- Minimal CPU usage on Raspberry Pi hardware
- Single-bundle frontend for fast local loading

**Reliability:**
- Consistent timing across all BPM settings
- Stable WebSocket connections
- Graceful handling of hardware connection issues
- Simple error propagation without aggressive handling

**Usability:**
- Intuitive interface requiring no manual or training
- Responsive design for various screen sizes
- Clear visual feedback for all interactions
- Accessible via standard web browsers

## 5. User Stories & Acceptance Criteria

### Epic 1: Grid Pattern Programming
**As a** musician
**I want** to program drum patterns by clicking pads in an 8×16 grid
**So that** I can create rhythmic sequences for my music

**Acceptance Criteria:**
- [ ] Display 8×16 grid with clearly defined rows and columns
- [ ] Toggle pad state with mouse click + Command key
- [ ] Visual distinction between active (on) and inactive (off) pads
- [ ] Each row maps to a different instrument/GPIO channel
- [ ] Each column represents 1/8th beat timing

### Epic 2: Real-time Playback
**As a** musician
**I want** to play back my programmed sequences with visual feedback
**So that** I can hear and see my patterns in action

**Acceptance Criteria:**
- [ ] Start/stop controls for sequence playback
- [ ] Current column highlighted during playback
- [ ] Continuous loop playback until stopped
- [ ] Sequence restarts from beginning when restarted
- [ ] Configurable BPM between 80-200

### Epic 3: Hardware Control
**As a** hardware enthusiast
**I want** my sequence to trigger GPIO pins on my Raspberry Pi
**So that** I can control external hardware instruments

**Acceptance Criteria:**
- [ ] Real-time GPIO pin activation based on sequence
- [ ] Simultaneous multi-channel triggering support
- [ ] Simple channel-to-GPIO-pin mapping configuration
- [ ] Digital on/off signals only (no PWM/analog)
- [ ] WebSocket-based communication for low latency

### Epic 4: Keyboard Control
**As a** performer
**I want** to trigger sounds using keyboard keys (Q-I)
**So that** I can play instruments live while programming

**Acceptance Criteria:**
- [ ] Q-W-E-R-T-Y-U-I keys mapped to 8 channels
- [ ] Immediate GPIO trigger on key press
- [ ] Key presses work independently of sequence playback
- [ ] App-level keyboard event handling
- [ ] Visual feedback when keys are pressed

## 6. Technical Considerations

### Frontend Architecture:
- **Framework:** React 19 with TypeScript and Vite bundling
- **Styling:** Tailwind CSS for rapid, responsive design
- **Component Structure:** Reusable Pad components for grid efficiency
- **State Management:** Custom hooks (useSequencer, useWebSocket)
- **Timing Engine:** Web Audio API for millisecond-precision scheduling
- **Communication:** WebSocket-only for all backend communication

### Backend Architecture:
- **Framework:** Python with Starlette ASGI and uvicorn server
- **GPIO Control:** Python gpio library for Raspberry Pi integration
- **API Design:** WebSocket-only communication (no REST endpoints)
- **Static Serving:** Starlette StaticFiles middleware for React build
- **Hardware Abstraction:** Simple dictionary mapping channels to GPIO pins

### System Integration:
- **Deployment:** Single server on Raspberry Pi serving both frontend and GPIO control
- **Timing Responsibility:** Frontend handles all BPM calculations and sequencing logic
- **Error Handling:** Minimal backend error handling, direct error propagation
- **Performance:** Single bundle frontend, minimal backend processing

## 7. Success Metrics

### Technical Performance:
- **Latency:** Pad-to-GPIO response under 50ms average
- **Timing Accuracy:** Sequence timing variance under 5ms at all BPM settings
- **Resource Usage:** CPU usage under 25% on Raspberry Pi 4 during playback
- **Reliability:** 99%+ uptime during continuous use sessions

### User Experience:
- **Learning Time:** New users can create basic patterns within 5 minutes
- **Responsiveness:** All UI interactions feel immediate (no perceived lag)
- **Visual Clarity:** Users can easily identify active pads and current playback position
- **Hardware Integration:** Reliable GPIO triggering without missed beats

### Development Goals:
- **Code Maintainability:** Clean component separation with reusable Pad components
- **Deployment Simplicity:** Single-command deployment to Raspberry Pi
- **Future Extensibility:** Easy addition of new features without architectural changes
- **Hardware Flexibility:** Simple reconfiguration of GPIO pin assignments 