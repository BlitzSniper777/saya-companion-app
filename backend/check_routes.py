import json

d = json.load(open('openapi.json'))
print(f"Total paths: {len(d['paths'])}")
gift_voice_paths = [k for k in d['paths'].keys() if 'gift' in k.lower() or 'voice' in k.lower()]
print(f"Gift/Voice paths: {gift_voice_paths}")
all_paths = list(d['paths'].keys())
print(f"All paths: {all_paths}")
