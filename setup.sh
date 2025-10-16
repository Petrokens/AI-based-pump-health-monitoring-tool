#!/bin/bash

# Setup script for Pump Health Monitoring Tool

echo "=========================================="
echo "Pump Health Monitoring Tool - Setup"
echo "=========================================="

# Check Python version
echo "Checking Python version..."
python3 --version

# Create virtual environment (optional)
echo ""
echo "Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Virtual environment created."
else
    echo "Virtual environment already exists."
fi

# Activate virtual environment
echo ""
echo "To activate the virtual environment, run:"
echo "  source venv/bin/activate"

# Install dependencies
echo ""
echo "Installing dependencies..."
pip install -r requirements.txt

# Create necessary directories
echo ""
echo "Creating directories..."
mkdir -p data/raw data/processed src/models

# Run tests
echo ""
echo "Running tests..."
python tests/test_data_loader.py

echo ""
echo "=========================================="
echo "Setup complete!"
echo "=========================================="
echo ""
echo "To train the model, run:"
echo "  cd src && python train_model.py"
echo ""
echo "To start the dashboard, run:"
echo "  cd src && streamlit run dashboard.py"
