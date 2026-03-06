import os
import glob
import shutil

src_dir = "/home/aldohuizinga/.gemini/antigravity/brain/588ed4db-e623-4d32-a0c2-0c458e3bf754"
dest_dir1 = "/home/aldohuizinga/website"
dest_dir2 = "/home/aldohuizinga/Erven_Meeander_Webiste"

images = ["farm_barn", "farm_tractor", "farm_tree_oak", "farm_tree_pine"]

for img in images:
    pattern = os.path.join(src_dir, f"{img}_*.png")
    matches = glob.glob(pattern)
    if matches:
        latest = sorted(matches)[-1]
        shutil.copy(latest, os.path.join(dest_dir1, f"{img}.png"))
        shutil.copy(latest, os.path.join(dest_dir2, f"{img}.png"))
        print(f"Copied {img}")
    else:
        print(f"Not found: {img}")
