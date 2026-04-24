import requests
import json

BASE_URL = "http://localhost:8093/api"
EMAIL = "orhanguzell@gmail.com"
PASSWORD = "admin123"

def login():
    url = f"{BASE_URL}/auth/token"
    print(f"Logging in to {url}...")
    try:
        resp = requests.post(url, json={"email": EMAIL, "password": PASSWORD, "grant_type": "password"})
        resp.raise_for_status()
        data = resp.json()
        print("Login successful.")
        return data.get("access_token")
    except Exception as e:
        print(f"Login failed: {e}")
        if 'resp' in locals():
            print(resp.text)
        return None

def test_reports(token):
    headers = {"Authorization": f"Bearer {token}"}
    
    endpoints = [
        "/admin/reports/kpi",
        "/admin/reports/users-performance",
        "/admin/reports/locations"
    ]
    
    for ep in endpoints:
        url = f"{BASE_URL}{ep}"
        print(f"\nTesting {url}...")
        try:
            resp = requests.get(url, headers=headers)
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list):
                    print(f"Success. Returned {len(data)} rows.")
                    if len(data) > 0:
                        print(f"Sample: {data[0]}")
                else:
                    print(f"Success. Data: {data}")
            else:
                print(f"Error: {resp.text}")
        except Exception as e:
            print(f"Request failed: {e}")

if __name__ == "__main__":
    token = login()
    if token:
        test_reports(token)
