from PIL import Image
import glob
import os

def remove_white_bg(image_path):
    img = Image.open(image_path).convert("RGBA")
    datas = img.getdata()
    newData = []
    
    for item in datas:
        r, g, b, a = item
        if r > 230 and g > 230 and b > 230:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(image_path, "PNG")
    print(f"Processed {image_path}")

for file in glob.glob("/home/aldohuizinga/website/farm_*.png"):
    remove_white_bg(file)
for file in glob.glob("/home/aldohuizinga/Erven_Meeander_Webiste/farm_*.png"):
    remove_white_bg(file)
