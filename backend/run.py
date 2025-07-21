#!/usr/bin/env python3
"""
Simple runner script for the 16-step sequencer.
This allows running the application directly with Python without Poetry.

Usage:
    python run.py

Environment Variables:
    HOST: Server host (default: 0.0.0.0)
    PORT: Server port (default: 8000)
"""

import sys
import os
from pathlib import Path

# Add the src directory to Python path so we can import pysequencer
backend_dir = Path(__file__).parent
src_dir = backend_dir / "src"
sys.path.insert(0, str(src_dir))

# Now we can import and run the main function
try:
    from pysequencer.main import main
    
    if __name__ == "__main__":
        print("Starting 16-step sequencer...")
        print(f"Python path includes: {src_dir}")
        main()
        
except ImportError as e:
    print(f"Error importing pysequencer: {e}")
    print(f"Make sure you're running this from the backend directory")
    print(f"Current working directory: {os.getcwd()}")
    print(f"Expected src directory: {src_dir}")
    sys.exit(1)
except Exception as e:
    print(f"Error starting application: {e}")
    sys.exit(1) 