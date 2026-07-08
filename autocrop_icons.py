import os
import glob
from PIL import Image

def autocrop_image(input_path):
    print(f"Cropping {input_path}")
    img = Image.open(input_path).convert("RGBA")
    bbox = img.getbbox()
    if bbox:
        # getbbox returns (left, upper, right, lower)
        img = img.crop(bbox)
        # also add a small padding so it doesn't touch the edges completely
        width, height = img.size
        # create a square image based on the max dimension
        max_dim = max(width, height)
        # add 10% padding
        padded_dim = int(max_dim * 1.1)
        new_img = Image.new("RGBA", (padded_dim, padded_dim), (0, 0, 0, 0))
        # paste cropped image into the center of new_img
        x_offset = (padded_dim - width) // 2
        y_offset = (padded_dim - height) // 2
        new_img.paste(img, (x_offset, y_offset))
        new_img.save(input_path, "PNG")
        print(f"  Cropped and padded {input_path}")
    else:
        print(f"  Empty image {input_path}")

def main():
    icons = glob.glob("public/icons/*.png")
    for icon in icons:
        autocrop_image(icon)
    # Also crop the logo
    if os.path.exists("public/logo.png"):
        autocrop_image("public/logo.png")

if __name__ == "__main__":
    main()
