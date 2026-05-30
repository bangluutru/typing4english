import sys
from PIL import Image

def remove_white_bg_floodfill(input_path, output_path):
    try:
        # Load image and convert to RGBA
        img = Image.open(input_path)
        img = img.convert("RGBA")
        width, height = img.size
        
        # Load pixel map
        pixels = img.load()
        
        # We will do a Breadth-First Search (BFS) to find all connected background pixels
        # that are very close to white (R > 240, G > 240, B > 240)
        visited = set()
        
        # Start seeds from all outer edges of the image
        queue = []
        for x in range(width):
            queue.append((x, 0))
            queue.append((x, height - 1))
        for y in range(height):
            queue.append((0, y))
            queue.append((width - 1, y))
            
        # De-duplicate queue
        queue = list(set(queue))
        bg_points = set()
        
        while queue:
            x, y = queue.pop(0)
            if (x, y) in visited:
                continue
            visited.add((x, y))
            
            r, g, b, a = pixels[x, y]
            
            # If the pixel is very close to white, it is part of the background
            if r > 240 and g > 240 and b > 240:
                bg_points.add((x, y))
                
                # Check 4-way neighbors
                for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                        queue.append((nx, ny))
                        
        # Convert all discovered background pixels to 100% transparent
        for x, y in bg_points:
            pixels[x, y] = (0, 0, 0, 0)
            
        # Save as transparent PNG
        img.save(output_path, "PNG")
        print(f"Successfully processed {input_path} -> {output_path} with flood fill")
    except Exception as e:
        print(f"Error processing {input_path}: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 remove_white_bg.py <input> <output>")
        sys.exit(1)
    remove_white_bg_floodfill(sys.argv[1], sys.argv[2])
