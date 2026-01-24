
import os
import platform
import subprocess
from datetime import datetime
from typing import Dict, List, Any
from dataclasses import dataclass

# In-Memory State for Demo (Since we can't easily modify Colab Host Network)
blocked_ips = set()
isolated_services = set()
throttled_ips = {}
action_log = []

@dataclass
class ActionResult:
    action_type: str
    status: str
    target: str
    message: str
    executed_at: str

# --- ACTION EXECUTORS ---

def execute_block_ip(target: str) -> ActionResult:
    # In a real server, this would run: sudo iptables -A INPUT -s {target} -j DROP
    blocked_ips.add(target)
    return ActionResult(
        action_type="block_ip",
        status="success",
        target=target,
        message=f"✅ IP {target} has been added to the Blacklist (Firewall Rule Applied).",
        executed_at=datetime.utcnow().isoformat()
    )

def execute_isolate_service(target: str) -> ActionResult:
    # In real server: docker network disconnect {target}
    isolated_services.add(target)
    return ActionResult(
        action_type="isolate_service",
        status="success",
        target=target,
        message=f"🔒 Service '{target}' has been quarantined from the network.",
        executed_at=datetime.utcnow().isoformat()
    )

def execute_throttle(target: str) -> ActionResult:
    throttled_ips[target] = 10 # Limit to 10 req/min
    return ActionResult(
        action_type="throttle",
        status="success",
        target=target,
        message=f"⚠️ Traffic from {target} is now throttled to 10 req/min.",
        executed_at=datetime.utcnow().isoformat()
    )

# --- PLAYBOOK ROUTER ---

def run_playbook(alert: dict) -> List[ActionResult]:
    results = []
    severity = alert.get("severity", "low")
    rule_id = alert.get("rule_id", "")

    # Extract Target (IP or Service)
    evidence = alert.get("evidence", {})
    # Try to find an IP in the evidence, otherwise use 'unknown'
    target_ip = evidence.get("source_ip") or alert.get("source_ip")
    target_service = evidence.get("service") or alert.get("service")

    # LOGIC: Define response based on Threat Type

    # 1. Critical Attacks (SQLi, Brute Force, High ML Confidence) -> BLOCK
    if severity == "critical" or "sqli" in rule_id or "brute_force" in rule_id:
        if target_ip:
            results.append(execute_block_ip(target_ip))

    # 2. Resource Exhaustion (DDoS, High CPU) -> THROTTLE
    elif severity == "high" or "cpu" in rule_id or "ddos" in rule_id:
        if target_ip:
            results.append(execute_throttle(target_ip))

    # 3. Service Anomalies (Agri/Health Mismatch) -> ISOLATE
    elif "physics" in rule_id or "iomt" in rule_id:
        if target_service:
            results.append(execute_isolate_service(target_service))

    # Log actions
    for r in results:
        action_log.append(r)

    return results

def get_action_log():
    return action_log
