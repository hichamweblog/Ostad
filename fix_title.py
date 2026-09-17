import json

with open('metadata.json', 'r') as f:
    metadata = json.load(f)

metadata['name'] = "معين الأستاذ"

with open('metadata.json', 'w') as f:
    json.dump(metadata, f, ensure_ascii=False, indent=2)

