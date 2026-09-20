import os
import uvicorn

raw_port = os.environ.get("PORT", "8000")
try:
    port = int(raw_port)
except (ValueError, TypeError):
    port = 8000

print(f"[NAV Backend] Starting Uvicorn on 0.0.0.0:{port}")
uvicorn.run("main:app", host="0.0.0.0", port=port, proxy_headers=True, forwarded_allow_ips="*")
