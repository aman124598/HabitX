from PIL import Image, ImageDraw, ImageFont

def create_icon():
    # Create a 1024x1024 image with black background
    img = Image.new('RGB', (1024, 1024), color='black')
    d = ImageDraw.Draw(img)
    
    # Draw a big red H
    # Since we can't easily rely on system fonts being consistent, 
    # we'll draw a geometric H manually to be safe and dependency-free regarding fonts.
    
    # Coordinates for H
    # Vertical bars
    rect_left = [(256, 128), (384, 896)]
    rect_right = [(640, 128), (768, 896)]
    # Cross bar
    rect_mid = [(384, 448), (640, 576)]
    
    red_color = (220, 38, 38) # #DC2626
    
    d.rectangle(rect_left, fill=red_color)
    d.rectangle(rect_right, fill=red_color)
    d.rectangle(rect_mid, fill=red_color)
    
    # Save as PNG
    img.save('assets/images/icon.png')
    print("Icon generated successfully at assets/images/icon.png")

if __name__ == "__main__":
    try:
        create_icon()
    except ImportError:
        print("Pillow not installed, trying to install...")
        import subprocess
        subprocess.check_call(["pip", "install", "Pillow"])
        create_icon()
