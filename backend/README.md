# PySequencer Backend

16-step sequencer backend with WebSocket communication for real-time GPIO control on Raspberry Pi.

## Features

- WebSocket-based real-time communication
- GPIO control for hardware triggers
- Health check endpoint
- Static file serving for React frontend
- CORS enabled for cross-origin requests

## Installation Methods

### Method 1: Poetry (Recommended for Development)

```bash
# Install dependencies
poetry install

# Run the application
poetry run pysequencer
```

### Method 2: Pip + Direct Python (Recommended for Raspberry Pi)

```bash
# Install dependencies
pip install -r requirements.txt

# Run the application
python run.py
```

## Environment Variables

- `HOST`: Server host (default: `0.0.0.0`)
- `PORT`: Server port (default: `8000`)

## Usage Examples

### Basic Usage
```bash
python run.py
```

### Custom Host and Port
```bash
HOST=192.168.1.100 PORT=3000 python run.py
```

### With Poetry
```bash
poetry run pysequencer
```

## API Endpoints

- `GET /health` - Health check endpoint
- `WebSocket /ws` - Real-time sequencer communication

## GPIO Configuration

GPIO channel mapping is configured in `config/gpio_mapping.json`. The application will automatically detect if GPIO is available and configure accordingly.

## Frontend Integration

The backend serves the React frontend from the `../web` directory when built. To build the frontend:

```bash
cd ../frontend
npm run build:deploy
```

## Development

### Running in Development Mode
```bash
# With Poetry
poetry run pysequencer

# With Python directly
python run.py
```

The server runs with hot reload enabled in development mode.

### Logs

The application uses structured logging with INFO level by default. Logs include:
- GPIO controller status
- WebSocket connections
- Server startup information
- Error handling

## Raspberry Pi Deployment

For Raspberry Pi deployment, use the pip method:

1. Install Python 3.11+
2. Install dependencies: `pip install -r requirements.txt`
3. Run: `python run.py`

The application will automatically detect GPIO availability and configure accordingly.
