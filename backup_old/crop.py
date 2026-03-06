from PIL import Image
import sys

try:
    img = Image.open('/home/aldohuizinga/website/huis.jpg')
    width, height = img.size
    
    # The text is at the top left. Let's crop the top 12% of the image.
    crop_amount = int(height * 0.15)
    
    # Calculate the area to crop (left, top, right, bottom)
    area = (0, crop_amount, width, height)
    
    cropped_img = img.crop(area).convert('RGB')
    cropped_img.save('/home/aldohuizinga/website/huis.jpg')
    print("Image cropped successfully.")
except Exception as e:
    print(f"Error: {e}")
