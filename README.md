# 16-Step Sequencer Web Application

A real-time music production web application designed for Raspberry Pi GPIO control. This browser-based drum machine features an intuitive 8×16 grid interface where each row represents a different instrument/sound and each column represents 1/8th of a musical beat.

![16-Step Sequencer Interface](preview.png)

## Features

- **8×16 Grid Interface** - Visual sequencer with 8 channels and 16 steps
- **Real-time GPIO Control** - Direct Raspberry Pi GPIO pin triggering
- **Precise Timing** - Web Audio API for millisecond-precision scheduling
- **Live Performance** - Keyboard controls (Q-I keys) for real-time triggering
- **Variable BPM** - Configurable tempo from 80-200 BPM
- **WebSocket Communication** - Low-latency real-time communication
- **Responsive Design** - Works on desktop, tablet, and mobile devices

## Architecture

### Frontend (React + TypeScript + Tailwind CSS)
- React 19 with TypeScript for type safety
- Tailwind CSS for responsive, modern UI design
- Custom hooks for state management (useSequencer, useWebSocket)
- Web Audio API for precise timing engine
- Real-time WebSocket communication

### Backend (Python + Starlette + GPIO)
- Python with Starlette ASGI framework
- WebSocket handler for real-time communication
- GPIO controller with channel-to-pin mapping
- Mock GPIO support for development environments
- Static file serving for React production build

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Python 3.12+ and Poetry
- For Raspberry Pi: GPIO library access

### 1. Clone and Setup

```bash
git clone <repository-url>
cd pysequencer
```

### 2. Install Frontend Dependencies

```bash
cd frontend
pnpm install
pnpm run build
cd ..
```

### 3. Install Backend Dependencies

```bash
cd backend
poetry install
cd ..
```

### 4. Run the Application

```bash
cd backend
poetry run pysequencer
```

The application will be available at `http://localhost:8000`

## Usage

### Playback Controls
- **Spacebar**: Play/Stop sequencer
- **BPM Input**: Adjust tempo (80-200 BPM)
- **Visual Feedback**: Current step highlighted during playback

### Programming Patterns
- **Cmd+Click** (Mac) or **Ctrl+Click** (Windows/Linux): Toggle pad on/off
- **Grid Layout**: 8 rows (channels) × 16 columns (steps)
- **Each Row**: Different instrument (Kick, Snare, Hi-Hat, etc.)
- **Each Column**: 16th note timing

### Live Performance
- **Q-W-E-R-T-Y-U-I**: Trigger channels 0-7 immediately
- **Direct Pad Click**: Trigger channel without toggling
- **Real-time Control**: Works during sequence playback

## GPIO Configuration

Default GPIO pin mapping (Raspberry Pi):

| Channel | Instrument | GPIO Pin |
|---------|------------|----------|
| 0 (Q)   | Kick       | 18       |
| 1 (W)   | Snare      | 19       |
| 2 (E)   | Hi-Hat     | 20       |
| 3 (R)   | Open Hat   | 21       |
| 4 (T)   | Crash      | 22       |
| 5 (Y)   | Ride       | 23       |
| 6 (U)   | Clap       | 24       |
| 7 (I)   | Perc       | 25       |

### Custom GPIO Mapping

Edit `backend/config/gpio_mapping.json`:

```json
{
  "channel_mapping": {
    "0": 18,
    "1": 19,
    "2": 20,
    "3": 21,
    "4": 22,
    "5": 23,
    "6": 24,
    "7": 25
  },
  "trigger_duration_ms": 50
}
```

## Development

### Frontend Development

```bash
cd frontend
pnpm run dev
```

Runs Vite development server with hot reload at `http://localhost:5173`

### Backend Development

```bash
cd backend
poetry run pysequencer
```

Runs backend server with auto-reload enabled.

### Testing

The application includes mock GPIO functionality for development on non-Raspberry Pi systems. When running without GPIO hardware, you'll see "Mock Mode" in the connection status.

## Raspberry Pi Deployment

### 1. GPIO Permissions

Add your user to the GPIO group:

```bash
sudo usermod -a -G gpio $USER
sudo reboot
```

### 2. System Service (Optional)

Create `/etc/systemd/system/sequencer.service`:

```ini
[Unit]
Description=16-Step Sequencer
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/pysequencer/backend
ExecStart=/home/pi/.local/bin/poetry run pysequencer
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable sequencer.service
sudo systemctl start sequencer.service
```

## API Reference

### WebSocket Messages

#### Client → Server

- **`gpio_trigger`**: Trigger multiple channels
  ```json
  {
    "type": "gpio_trigger",
    "data": {
      "channels": [0, 1, 2],
      "duration": 50
    }
  }
  ```

- **`immediate_trigger`**: Trigger single channel
  ```json
  {
    "type": "immediate_trigger",
    "data": {
      "channel": 0,
      "duration": 50
    }
  }
  ```

#### Server → Client

- **`connection_status`**: Initial connection info
- **`gpio_trigger_response`**: Trigger confirmation
- **`error`**: Error messages

### HTTP Endpoints

- **`GET /`**: Serve React application
- **`GET /health`**: Health check
- **`WS /ws`**: WebSocket connection

## Technical Specifications

- **Timing Precision**: Web Audio API provides sub-millisecond accuracy
- **Latency**: Sub-50ms pad-to-GPIO response time
- **Grid Size**: 8 channels × 16 steps (128 total pads)
- **BPM Range**: 80-200 BPM
- **Step Resolution**: 16th notes (1/4 beat per step)
- **Trigger Duration**: Configurable (default 50ms)

## Troubleshooting

### Common Issues

1. **"GPIO library not available"**
   - Expected on non-Raspberry Pi systems
   - Application runs in mock mode for development

2. **WebSocket connection failed**
   - Check backend server is running
   - Verify port 8000 is not blocked

3. **Frontend build errors**
   - Ensure Node.js 18+ is installed
   - Clear node_modules and reinstall: `rm -rf node_modules && pnpm install`

4. **Backend dependency issues**
   - Ensure Poetry is installed: `pip install poetry`
   - Reinstall dependencies: `cd backend && poetry install`

5. **Timing accuracy issues**
   - Web Audio API requires user interaction to start
   - Click play button to initialize audio context

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on both development and Raspberry Pi environments
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with React 19, TypeScript, and Tailwind CSS
- Backend powered by Starlette and Python
- Timing engine based on Web Audio API
- Designed for Raspberry Pi GPIO integration 