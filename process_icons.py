import os
import glob
from PIL import Image

def process_image(input_path, output_path):
    print(f"Processing {input_path} -> {output_path}")
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    newData = []
    # Replace near-black with transparent
    for item in datas:
        if item[0] < 30 and item[1] < 30 and item[2] < 30:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)

    img.putdata(newData)
    
    # Crop to bounding box
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(output_path, "PNG")

brain_dir = "/Users/kutluhangil/.gemini/antigravity-ide/brain/c5370555-a96d-4745-84d3-898e946b6cae"
out_dir = "public/icons"
os.makedirs(out_dir, exist_ok=True)

# Find all new icons
for file_path in glob.glob(os.path.join(brain_dir, "*.png")):
    filename = os.path.basename(file_path)
    # E.g. icon_search_12345.png -> search.png
    if filename.startswith("icon_"):
        parts = filename.split("_")
        # Find the last part which is the timestamp
        # The name is between "icon_" and the timestamp
        name_parts = parts[1:-1]
        if name_parts:
            name = "-".join(name_parts)
            out_path = os.path.join(out_dir, f"{name}.png")
            process_image(file_path, out_path)
    elif filename.startswith("logo_retrograde"):
        out_path = os.path.join("public", "logo.png")
        process_image(file_path, out_path)

print("Done processing images.")
