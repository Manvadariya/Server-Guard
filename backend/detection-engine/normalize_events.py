import json
import uuid
import datetime
import dateutil.parser

def normalize_event(raw_event):
    """
    Takes a raw dictionary and attempts to map it to a TelemetryEvent structure.
    """
    
    # 1. ID
    event_id = raw_event.get("event_id") or str(uuid.uuid4())
    
    # 2. Source IP (look for common variations)
    source_ip = (
        raw_event.get("source_ip") or 
        raw_event.get("ip") or 
        raw_event.get("ip_address") or 
        raw_event.get("src_ip") or 
        "0.0.0.0"
    )

    # 3. Timestamp (handle ISO strings, integers, etc.)
    raw_time = (
        raw_event.get("timestamp") or 
        raw_event.get("time") or 
        raw_event.get("date") or 
        datetime.datetime.utcnow().isoformat()
    )
    
    timestamp_int = 0
    try:
        if isinstance(raw_time, int) or isinstance(raw_time, float):
            timestamp_int = int(raw_time)
        else:
            # Parse string to datetime
            dt = dateutil.parser.parse(str(raw_time))
            timestamp_int = int(dt.timestamp())
    except Exception:
        timestamp_int = int(datetime.datetime.utcnow().timestamp())
        
    # 4. Event Type
    event_type = (
        raw_event.get("event_type") or 
        raw_event.get("type") or 
        raw_event.get("alert") or 
        raw_event.get("action") or 
        "unknown_event"
    )

    # 5. Domain & Service
    domain = raw_event.get("domain", "general")
    service = raw_event.get("service", "unknown")

    # 6. Payload - everything else goes here
    # We'll start with the raw event as payload and remove the fields we promoted
    payload = raw_event.copy()
    keys_to_remove = ["event_id", "source_ip", "ip", "ip_address", "src_ip", 
                      "timestamp", "time", "date", "event_type", "type", "alert", 
                      "action", "domain", "service"]
    for k in keys_to_remove:
        payload.pop(k, None)

    return {
        "event_id": event_id,
        "source_ip": source_ip,
        "domain": domain,
        "service": service,
        "event_type": event_type,
        "payload": payload,
        "timestamp": timestamp_int,
        "received_at": datetime.datetime.now(datetime.timezone.utc).isoformat() + "Z"
    }

def main():
    input_file = "raw_events.json"
    output_file = "clean_events.json"
    
    print(f"Reading from {input_file}...")
    try:
        with open(input_file, "r") as f:
            raw_data = json.load(f)
            
        if not isinstance(raw_data, list):
            raw_data = [raw_data]
            
        clean_events = []
        for item in raw_data:
            clean = normalize_event(item)
            clean_events.append(clean)
            
        print(f"Normalized {len(clean_events)} events.")
        
        with open(output_file, "w") as f:
            json.dump(clean_events, f, indent=2)
            
        print(f"Wrote to {output_file}")
        
    except FileNotFoundError:
        print(f"Error: {input_file} not found.")
    except json.JSONDecodeError:
        print(f"Error: {input_file} is not valid JSON.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
