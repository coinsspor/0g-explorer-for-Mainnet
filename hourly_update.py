#!/usr/bin/env python3
import json
import time
from datetime import datetime
import subprocess
import shutil
import os

def run_scanner():
    """aggressive_scanner.py'yi çalıştır"""
    print(f"[{datetime.now()}] Starting RPC scan...")
    
    try:
        # Scanner'ı çalıştır
        result = subprocess.run(['python3', 'aggressive_scanner.py'], 
                              capture_output=True, text=True, timeout=600)
        
        if result.returncode == 0:
            print(f"[{datetime.now()}] Scan completed successfully")
            
            # JSON'u public klasöre kopyala
            with open('all_rpcs_combined.json', 'r') as f:
                rpcs = json.load(f)
            
            # Site için formatla
            site_data = {
                "network": "0G Mainnet",
                "chainId": "0x4115",
                "lastUpdate": datetime.now().isoformat(),
                "totalRpcs": len(rpcs),
                "rpcs": rpcs
            }
            
            # Public klasöre kaydet
            with open('/root/yeniexplorer2/public/rpc_data.json', 'w') as f:
                json.dump(site_data, f, indent=2)
            
            # Nginx için web erişilebilir dizine kopyala
            nginx_dir = '/var/www/0g-data'
            if not os.path.exists(nginx_dir):
                os.makedirs(nginx_dir, exist_ok=True)
                os.chmod(nginx_dir, 0o755)
            
            # Dosyayı nginx dizinine kopyala
            nginx_file = os.path.join(nginx_dir, 'rpc_data.json')
            with open(nginx_file, 'w') as f:
                json.dump(site_data, f, indent=2)
            
            # İzinleri ayarla
            os.chmod(nginx_file, 0o644)
            
            print(f"[{datetime.now()}] Updated {len(rpcs)} RPCs to public folder")
            print(f"[{datetime.now()}] Also copied to nginx directory: {nginx_file}")
            return True
        else:
            print(f"[{datetime.now()}] Scanner failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"[{datetime.now()}] Error: {e}")
        return False

if __name__ == "__main__":
    run_scanner()