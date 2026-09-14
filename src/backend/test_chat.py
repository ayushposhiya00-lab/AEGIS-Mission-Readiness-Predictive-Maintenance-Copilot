import sys
import os
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print("--- Testing /api/chat/status ---")
status_res = client.get("/api/chat/status")
print("Status:", status_res.status_code, status_res.json())

print("\n--- Testing /api/chat with Hinglish query ---")
hinglish_res = client.post("/api/chat", json={"message": "V-102 critical condition me kyu he? kya problem hai?"})
print("Hinglish response status:", hinglish_res.status_code)
data = hinglish_res.json()
print("Source:", data.get("source"))
print("Detected Language:", data.get("detectedLanguage"))
print("Highlight Asset IDs:", data.get("highlightAssetIds"))
print("Reply sample:\n", data.get("reply")[:300], "...")

print("\n--- Testing /api/chat with English query ---")
eng_res = client.post("/api/chat", json={"message": "Which assets are critical across the fleet and what are the failure causes?"})
print("English response status:", eng_res.status_code)
eng_data = eng_res.json()
print("Source:", eng_data.get("source"))
print("Detected Language:", eng_data.get("detectedLanguage"))
print("Reply sample:\n", eng_data.get("reply")[:300], "...")
