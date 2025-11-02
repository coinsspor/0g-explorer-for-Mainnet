#!/usr/bin/env python3
import requests
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

EXPECTED_CHAIN_ID = "0x4115"
TIMEOUT = 2
THREADS = 100  # Daha agresif
MAX_DEPTH = 5  # Daha derin

# Daha fazla Cosmos RPC
COSMOS_RPCS = [
    "http://199.254.199.233:47657",
]

def get_peers_recursive(depth=0, seen_ips=None):
    """Recursive peer discovery - daha derin"""
    if seen_ips is None:
        seen_ips = set()
    
    if depth >= MAX_DEPTH:
        return seen_ips
    
    new_ips = set()
    
    # İlk derinlikte bilinen RPC'lerden başla
    if depth == 0:
        for cosmos_rpc in COSMOS_RPCS:
            try:
                r = requests.get(f"{cosmos_rpc}/net_info", timeout=5)
                if r.status_code == 200:
                    peers = r.json().get("result", {}).get("peers", [])
                    for peer in peers:
                        ip = peer.get("remote_ip")
                        if ip and ip not in seen_ips:
                            new_ips.add(ip)
                            seen_ips.add(ip)
            except:
                continue
    
    # Her IP'nin peer'lerini al
    for ip in list(new_ips)[:50]:  # Her derinlikte max 50 IP
        for port in [26657, 14657, 16657, 36657, 46657, 56657]:
            try:
                r = requests.get(f"http://{ip}:{port}/net_info", timeout=1)
                if r.status_code == 200:
                    peers = r.json().get("result", {}).get("peers", [])
                    for peer in peers:
                        peer_ip = peer.get("remote_ip")
                        if peer_ip and peer_ip not in seen_ips:
                            seen_ips.add(peer_ip)
                    break
            except:
                continue
    
    print(f"Depth {depth}: Found {len(seen_ips)} total IPs")
    
    # Recursive call
    if len(new_ips) > 0 and depth < MAX_DEPTH:
        return get_peers_recursive(depth + 1, seen_ips)
    
    return seen_ips

def scan_ip_aggressive(ip):
    """Daha agresif port tarama"""
    found = []
    
    # Daha fazla port kombinasyonu
    ports = [
        8545, 8546,  # Standart
        10545, 11545, 12545, 13545, 14545, 15545, 16545, 17545, 18545, 19545,  # 10k
        20545, 21545, 22545, 23545, 24545, 25545, 26545, 27545, 28545, 29545,  # 20k
        30545, 31545, 32545, 33545, 34545, 35545, 36545, 37545, 38545, 39545,  # 30k
        40545, 41545, 42545, 43545, 44545, 45545, 46545, 47545, 48545, 49545,  # 40k
        50545, 51545, 52545, 53545, 54545, 55545, 56545, 57545, 58545, 59545,  # 50k
        60545, 61545, 62545, 63545, 64545, 65545,  # 60k
    ]
    
    # Ekstra portlar
    for base in [18545, 28545, 38545, 48545, 58545]:
        if base not in ports:
            ports.append(base)
    
    for port in ports:
        url = f"http://{ip}:{port}"
        try:
            start = time.time()
            r = requests.post(
                url,
                json={"jsonrpc": "2.0", "method": "eth_chainId", "params": [], "id": 1},
                timeout=TIMEOUT
            )
            latency = int((time.time() - start) * 1000)
            
            if r.status_code == 200:
                chain_id = r.json().get("result")
                if chain_id == EXPECTED_CHAIN_ID:
                    # Peer count
                    peers = 0
                    try:
                        r2 = requests.post(url, 
                            json={"jsonrpc": "2.0", "method": "net_peerCount", "params": [], "id": 1},
                            timeout=1)
                        if r2.status_code == 200:
                            peers = int(r2.json()["result"], 16)
                    except:
                        pass
                    
                    found.append({
                        "url": url,
                        "latency": latency,
                        "peers": peers
                    })
                    print(f"  ✅ {url} - {latency}ms - Peers: {peers}")
        except:
            continue
    
    return found

def main():
    print("\n" + "="*70)
    print("AGGRESSIVE SCANNER - MAXIMUM DISCOVERY")
    print("="*70 + "\n")
    
    # Deep peer discovery
    print("Phase 1: Deep peer discovery (5 levels)...")
    all_ips = get_peers_recursive()
    print(f"\n✅ Total unique IPs: {len(all_ips)}\n")
    
    # Tüm IP'leri tara
    ips_to_scan = list(all_ips)[:200]  # İlk 200 IP
    print(f"Phase 2: Scanning {len(ips_to_scan)} IPs...\n")
    
    all_rpcs = []
    
    with ThreadPoolExecutor(max_workers=THREADS) as executor:
        futures = {executor.submit(scan_ip_aggressive, ip): ip for ip in ips_to_scan}
        
        completed = 0
        for future in as_completed(futures):
            completed += 1
            results = future.result()
            all_rpcs.extend(results)
            
            if completed % 20 == 0:
                print(f"\nProgress: {completed}/{len(ips_to_scan)} - Found {len(all_rpcs)} RPCs")
    
    # Sırala
    all_rpcs.sort(key=lambda x: x['latency'])
    
    print("\n" + "="*70)
    print("RESULTS")
    print("="*70)
    print(f"\n✅ Total RPCs found: {len(all_rpcs)}")
    
    if all_rpcs:
        with open("aggressive_scan_results.txt", "w") as f:
            f.write(f"# Aggressive Scan - {len(all_rpcs)} RPCs\n")
            f.write("#" + "="*70 + "\n\n")
            for rpc in all_rpcs:
                f.write(f"{rpc['latency']:4d}ms | {rpc['url']:40} | Peers: {rpc['peers']}\n")
        
        with open("all_rpcs_combined.json", "w") as f:
            import json
            json.dump([{"url": r["url"], "latency": r["latency"], "peers": r["peers"]} 
                      for r in all_rpcs], f, indent=2)
        
        print(f"\n🏆 Top 10:")
        for i, rpc in enumerate(all_rpcs[:10], 1):
            print(f"  {i:2}. {rpc['latency']:4d}ms | {rpc['url']} | Peers: {rpc['peers']}")
        
        print(f"\n📁 Saved to:")
        print("  - aggressive_scan_results.txt")
        print("  - all_rpcs_combined.json")

if __name__ == "__main__":
    main()
