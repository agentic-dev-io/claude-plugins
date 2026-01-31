#!/bin/bash
# Start the Anthropic-to-Ollama proxy in background
cd /opt/ollama-proxy
python3 -m uvicorn anthro_to_openai_proxy:app --host 0.0.0.0 --port 8080 &
PROXY_PID=$!

# Wait for proxy to be ready
sleep 2

echo "Proxy running on http://localhost:8080"
echo "Claude Code configured to use local Ollama via proxy"
echo ""

# Start interactive shell or run command
if [ $# -eq 0 ]; then
    exec bash
else
    exec "$@"
fi
