import json
import requests

def test_send_data():
    URL = "http://localhost:3000/api/sensor"
    expected_statuses = [201]*8 + [400, 400]
    with open("tests/sensor_data.jsonl") as file:
        for idx, line in enumerate(file):
            if not line.strip():
                continue
            resp = requests.post(URL, json=json.loads(line))
            assert resp.status_code == expected_statuses[idx], f"Line {idx+1}: Expected {expected_statuses[idx]}, got {resp.status_code}"
