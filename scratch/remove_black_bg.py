import sys
from PIL import Image

def remove_black_bg(input_path, output_path):
    try:
        # Open the image
        img = Image.open(input_path)
        img = img.convert("RGBA")
        
        datas = img.getdata()
        newData = []
        
        for item in datas:
            # If pixel is very close to black (R < 15, G < 15, B < 15)
            # This threshold handles slight compression artifacts beautifully
            if item[0] < 15 and item[1] < 15 and item[2] < 15:
                # Set pixel to fully transparent
                newData.append((0, 0, 0, 0))
            else:
                newData.append(item)
                
        img.putdata(newData)
        img.save(output_path, "PNG")
        print(f"Successfully processed {input_path} -> {output_path}")
    except Exception as e:
        print(f"Error processing {input_path}: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 remove_black_bg.py <input> <output>")
        sys.exit(1)
    remove_black_bg(sys.argv[1], sys.argv[2])
