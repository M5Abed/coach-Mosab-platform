import urllib.request
import json

url = "https://aykiykjhuamibjyfypeo.supabase.co/storage/v1/bucket"
anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5a2l5a2podWFtaWJqeWZ5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzg1MzEsImV4cCI6MjA5NTkxNDUzMX0.bX1WQxXupL1txgOg-VIznPCjLfdLiI-9a1zTBExWnig"

try:
    req = urllib.request.Request(
        url,
        headers={
            "apikey": anon_key,
            "Authorization": f"Bearer {anon_key}"
        },
        method="GET"
    )
    with urllib.request.urlopen(req) as response:
        res = json.loads(response.read().decode())
        print("Storage buckets:", res)
except Exception as e:
    print("Failed to list buckets:", e)
