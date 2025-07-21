"""
Main application entry point for the 16-step sequencer.
Provides WebSocket communication for real-time GPIO control.
"""

from starlette.applications import Starlette
from starlette.routing import Route, WebSocketRoute, Mount
from starlette.staticfiles import StaticFiles
from starlette.responses import JSONResponse
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
import uvicorn
import os
import logging
from pathlib import Path

from .websocket_handler import WebSocketHandler
from .gpio_controller import GPIOController

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize GPIO controller
try:
    gpio_controller = GPIOController()
    logger.info(f"GPIO Controller initialized successfully - GPIO available: {gpio_controller.is_available()}")
except Exception as e:
    logger.error(f"Failed to initialize GPIO controller: {e}")
    raise

# Initialize WebSocket handler
try:
    ws_handler = WebSocketHandler(gpio_controller)
    logger.info("WebSocket handler initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize WebSocket handler: {e}")
    raise


async def health_check(request):
    """Basic health check endpoint."""
    try:
        gpio_status = gpio_controller.is_available()
        channel_mapping = gpio_controller.get_channel_mapping()
        
        return JSONResponse({
            "status": "healthy",
            "gpio_available": gpio_status,
            "channel_count": len(channel_mapping),
            "channels": list(channel_mapping.keys()),
            "version": "1.0.0"
        })
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse({
            "status": "error",
            "error": str(e),
            "version": "1.0.0"
        }, status_code=500)


# Define routes
routes = [
    Route("/health", health_check, methods=["GET"]),
    WebSocketRoute("/ws", ws_handler.handle_websocket),
]

# Add static file serving for React frontend from root-level web folder
frontend_build_path = Path(__file__).parent.parent.parent.parent / "web"

logger.info(f"Frontend build path: {frontend_build_path}")
logger.info(f"Frontend build exists: {frontend_build_path.exists()}")

if frontend_build_path.exists():
    # Serve static files from React build
    routes.append(Mount("/assets", StaticFiles(directory=frontend_build_path / "assets"), name="static"))
    # Serve index.html for all other routes (SPA routing)
    routes.append(Mount("/", StaticFiles(directory=frontend_build_path, html=True), name="frontend"))
    logger.info("Added frontend static file routes")
else:
    logger.warning("Frontend build directory not found - static files will not be served")
    logger.warning(f"To build frontend: cd frontend && npm run build:deploy")

# Middleware
middleware = [
    Middleware(
        CORSMiddleware,
        allow_origins=["*"],  # In production, specify your domain
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
]

# Create Starlette application
app = Starlette(
    debug=False,
    routes=routes,
    middleware=middleware,
)

logger.info("Starlette application created successfully")


def main():
    """Entry point for running the application."""
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    
    logger.info(f"Starting 16-step sequencer server on {host}:{port}")
    logger.info(f"GPIO available: {gpio_controller.is_available()}")
    logger.info(f"Channel mapping: {gpio_controller.get_channel_mapping()}")
    logger.info(f"Frontend build path: {frontend_build_path}")
    logger.info(f"Frontend build exists: {frontend_build_path.exists()}")
    
    if not frontend_build_path.exists():
        logger.info("To build frontend for deployment: cd frontend && npm run build:deploy")
    
    try:
        uvicorn.run(
            "pysequencer.main:app",
            host=host,
            port=port,
            reload=False,
            log_level="info",
            access_log=True,
        )
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        raise


if __name__ == "__main__":
    main() 