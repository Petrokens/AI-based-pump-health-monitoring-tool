#!/bin/bash
# Setup script for Pump Health Monitoring Tool (Unix/Linux/macOS)
# For Windows, see QUICKSTART.md for manual setup instructions

echo "======================================"
echo "Pump Health Monitoring Tool - Setup"
echo "======================================"
echo ""

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*|Darwin*)
        echo "Detected OS: ${OS}"
        ;;
    MINGW*|MSYS*|CYGWIN*)
        echo "⚠️  Windows detected. Please use manual setup from QUICKSTART.md"
        exit 1
        ;;
    *)
        echo "⚠️  Unknown OS: ${OS}"
        echo "Continuing with Unix-like setup..."
        ;;
esac
echo ""

# Check Python version
echo "[1/5] Checking Python version..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python version: $python_version"
echo "✅ Python found"
echo ""

# Create virtual environment
echo "[2/5] Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi
echo ""

# Activate virtual environment
echo "[3/5] Activating virtual environment..."
source venv/bin/activate
echo "✅ Virtual environment activated"
echo ""

# Install dependencies
echo "[4/5] Installing dependencies..."
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo "✅ Dependencies installed"
echo ""

# Run main pipeline
echo "[5/5] Running initial setup (generating data and training models)..."
python3 main.py
echo ""

echo "======================================"
echo "✅ Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Activate virtual environment: source venv/bin/activate"
echo "2. Launch dashboard: streamlit run src/dashboard.py"
echo "3. Or explore notebooks: jupyter notebook notebooks/"
echo ""
echo "For more information, see QUICKSTART.md"
echo "======================================"
