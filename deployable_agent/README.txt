# Server-Guard Deployable Agent
# ==============================
# Copy this folder to any server you want to monitor

# 1. Install dependencies
pip install -r requirements.txt

# 2. Run the agent (standalone mode)
python server_guard_agent.py --port 8006

# 3. Or connect to your central Server-Guard
python server_guard_agent.py --port 8006 --central-server http://your-server:8001

# 4. Test if it's working
curl http://localhost:8006/api/health
