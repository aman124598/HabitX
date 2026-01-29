from PIL import Image, ImageDraw, ImageFont
import os
import platform

def create_icon():
    # User requested: "keep the background red and habit written inside it in white"
    # Also "keep the font more bold and fancy keep rounded corners"
    
    red_color = (220, 38, 38) # #DC2626
    
    # Create a 1024x1024 image with transparent background (RGBA)
    img = Image.new('RGBA', (1024, 1024), color=(0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    
    # Draw a rounded rectangle for the background
    # Using a slightly smaller box or full bleed? 
    # Usually icons are full squares, but "keep rounded corners" suggests they want the shape to be rounded 
    # and the corners transparent.
    # Let's do a filled rounded rectangle.
    
    # Radius for 1024px icon. iOS squircle is complex, but standard rounding 
    # usually looks good around 15-20% of width. 
    radius = 180 
    
    d.rounded_rectangle([(0, 0), (1024, 1024)], radius=radius, fill=red_color)
    
    text = "Habit"
    
    # Attempt to load a BOLD and FANCY font
    font = None
    font_size = 350 # Start large
    
    # List of fonts to try (prioritizing bold/fancy)
    # Windows paths usually need checking. Filenames are often case-insensitive in Windows but Python string is literal.
    # List of fonts to try (prioritizing bold/fancy)
    # Windows paths usually need checking. Filenames are often case-insensitive in Windows but Python string is literal.
    font_candidates = [
        "georgiab.ttf", # Georgia Bold (Classy Serif, Bold)
        "cambriab.ttf", # Cambria Bold
        "constanb.ttf", # Constantia Bold
        "timesbd.ttf",  # Times New Roman Bold (Classic Serif)
        "courbd.ttf",   # Courier New Bold (Code style?) - maybe not fancy.
        "arialbd.ttf",  # Arial Bold (Fallback)
        "impact.ttf",   # Impact (Thick/Bold)
        "verdanab.ttf", # Verdana Bold
    ]
    
    # Try to load fonts
    for font_name in font_candidates:
        try:
            # Try loading directly (works if in system path or mapped)
            font = ImageFont.truetype(font_name, font_size)
            print(f"Used font: {font_name}")
            break
        except IOError:
            # Try Windows absolute path
            try:
                font = ImageFont.truetype(f"C:\\Windows\\Fonts\\{font_name}", font_size)
                print(f"Used C:\\Windows\\Fonts\\{font_name}")
                break
            except IOError:
                continue
            
    if font is None:
        print("Could not load preferred fonts. Using default.")
        font = ImageFont.load_default()
            
    # Center the text
    if font:
        left, top, right, bottom = d.textbbox((0, 0), text, font=font)
        text_width = right - left
        text_height = bottom - top
        
        # Position
        x = (1024 - text_width) / 2
        y = (1024 - text_height) / 2
        
        # Draw text
        d.text((x, y - top), text, fill="white", font=font)

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
