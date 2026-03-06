from PIL import Image
import glob

def make_white_transparent(image_path):
    img = Image.open(image_path)
    img = img.convert("RGBA")
    datas = img.getdata()
    
    newData = []
    # threshold for "white"
    for item in datas:
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(image_path, "PNG")
    print(f"Processed {image_path}")

for file in glob.glob("farm_*.png"):
    make_white_transparent(file)
