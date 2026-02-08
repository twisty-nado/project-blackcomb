import os
import json

def generate_wallpaper_data(base_path):
    wallpaper_data = []
    
    for folder in sorted(os.listdir(base_path)):
        folder_path = os.path.join(base_path, folder)
        
        if not os.path.isdir(folder_path):
            continue
        
        wallpapers = []
        for file in sorted(os.listdir(folder_path)):
            if file.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                wallpapers.append({
                    "name": file,
                    "path": f"/resources/wallpapers/{folder}/{file}"
                })
        
        if wallpapers:
            wallpaper_data.append({
                "section": folder,
                "wallpapers": wallpapers
            })
    
    return wallpaper_data

wallpapers_dir = "C:/Users/twisty/Desktop/Other files/7/resources/wallpapers"
data = generate_wallpaper_data(wallpapers_dir)

js_output = "const wallpaperData = " + json.dumps(data, indent=4) + ";"

with open("wallpaper_data.txt", "w") as f:
    f.write(js_output)

print("wallpaper data generated! check wallpaper_data.txt")
print(f"found {len(data)} sections with {sum(len(s['wallpapers']) for s in data)} total wallpapers")
