import urllib.request
import re
import json

folders = {
  "3AS": {
    "url": "https://drive.google.com/drive/folders/1GvjsQ7qk3HX__zQRdtOcIg_5aDtiBV6x",
    "id": "1GvjsQ7qk3HX__zQRdtOcIg_5aDtiBV6x",
    "name": "3AS"
  },
  "1AS_ARTS": {
    "url": "https://drive.google.com/drive/folders/1cZafSF9222nKUrMtTiZRA1yESmhsvNC8",
    "id": "1cZafSF9222nKUrMtTiZRA1yESmhsvNC8",
    "name": "1AS_ARTS"
  },
  "1AS_SCIENCE": {
    "url": "https://drive.google.com/drive/folders/1logOtIyCEYQ3KVsSeZfJQCtytyvp3IAR",
    "id": "1logOtIyCEYQ3KVsSeZfJQCtytyvp3IAR",
    "name": "1AS_SCIENCE"
  },
  "2AS": {
    "url": "https://drive.google.com/drive/folders/1ftZf-IjNulR2jFwtujHdbH39wdRdYjmC",
    "id": "1ftZf-IjNulR2jFwtujHdbH39wdRdYjmC",
    "name": "2AS"
  }
}

headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
all_data = {}

for level, info in folders.items():
    print(f"Fetching {level}...")
    req = urllib.request.Request(info["url"], headers=headers)
    html = urllib.request.urlopen(req).read().decode("utf-8")
    
    raw_html = html.replace("\\x22", '"').replace("\\x5b", '[').replace("\\x5d", ']').replace("\\/", "/")
    
    pattern = re.compile(r'\["([a-zA-Z0-9_-]{25,})",\["([a-zA-Z0-9_-]{25,})"\]\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"')
    matches = pattern.findall(raw_html)
    
    files = []
    seen = set()
    for file_id, parent_id, name, mime in matches:
        if file_id not in seen and not name.startswith("http"):
            seen.add(file_id)
            # clean unicode escaped arabic if any
            clean_name = name
            try:
                clean_name = name.encode('utf-8').decode('unicode_escape')
            except Exception:
                pass
            files.append({
                "id": file_id,
                "parentId": parent_id,
                "name": clean_name,
                "mimeType": mime,
                "viewUrl": f"https://drive.google.com/file/d/{file_id}/view?usp=sharing",
                "previewUrl": f"https://drive.google.com/file/d/{file_id}/preview",
                "downloadUrl": f"https://drive.google.com/uc?export=download&id={file_id}"
            })
            
    print(f"Level: {level} -> Found {len(files)} files")
    for f in files[:3]:
        print("   Sample:", f["name"], f["id"])
    all_data[level] = files

with open("extracted_drive_files.json", "w", encoding="utf-8") as f:
    json.dump(all_data, f, ensure_ascii=False, indent=2)

print("Saved to extracted_drive_files.json successfully!")
