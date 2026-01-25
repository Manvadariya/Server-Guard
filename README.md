# 🛡️ Server Guard
### ML-Driven Cyber-Resilient Server Security Platform


## 📖 Overview
**Server Guard** is an automated **SOAR** (Security Orchestration, Automation, and Response) platform designed to shift server security from passive monitoring to active defense. 

Unlike traditional tools that alert you *after* a breach, Server Guard monitors system telemetry in real-time, leveraging **Machine Learning** to intercept SQL Injection attacks before they execute, visualized through a high-performance SOC-style dashboard.

---

## 🚀 Key Features
*   **⚡ Active Defense:** Real-time threat detection and mitigation.
*   **📊 Live Telemetry:** Continuous monitoring of CPU, RAM, and Disk via a custom Python agent.
*   **🧠 AI-Powered Detection:** 
    *   **Random Forest Classifier** trained on malicious HTTP payloads.
    *   **TF-IDF Vectorization** for instant SQL Injection (SQLi) identification.
*   **🚨 Smart Alerting:** Automated detection of resource exhaustion (e.g., CPU > 90%).
*   **🖥️ Unified Dashboard:** A sleek React-based Dark Mode UI combining performance metrics with security logs.

---

## 🏗️ Architecture
The system utilizes a scalable **Agent → AI → Dashboard** pipeline:

1.  **Watchdog Agent (Python):** Deployed on target servers; collects `psutil` metrics every 2 seconds.
2.  **Backend Core (FastAPI):**
    *   **Ingestion Engine:** High-speed telemetry processing.
    *   **Inference Engine:** Runs payloads through the ML model.
    *   **Rule Engine:** Evaluates system health thresholds.
3.  **Dashboard (React):** Real-time visualization and critical alert broadcasting.

---

## 🛠️ Tech Stack

| Category | Tools |
| :--- | :--- |
| **Backend** | Python, FastAPI, Uvicorn |
| **Frontend** | React.js, Chart.js, Axios |
| **Machine Learning** | Scikit-learn, Pandas, NumPy |
| **Monitoring** | Psutil |

---


## 🔮 Roadmap
- **Phase 0:** Basic Model Training
- **Phase 1:** Watchdog Agent & Telemetry Ingestion
- **Phase 2:** Rule-based Resource Detection
- **Phase 3:** AI Model Integration (SQLi Detection)
- **Phase 4:** Real-time React Dashboard
-  **Phase 5:** Automated IP blocking (Firewall integration)
-  **Phase 6:** Expansion to XSS and DDoS pattern detection


WorkFlow 

![alt text](image.png)