from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
import math

SIZE = 1024
SS = 4  # Super-sampling factor

def _aa_rounded_rect(size, radius, fill):
    """Create a rounded rectangle with 4× supersampling."""
    big = Image.new("RGBA", (size * SS, size * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(big)
    d.rounded_rectangle(
        [(0, 0), (size * SS, size * SS)],
        radius=radius * SS,
        fill=fill,
    )
    return big.resize((size, size), Image.LANCZOS)

def _save_variants(img, base_name, splash_bg):
    """Save standard icon variants (icon, adaptive-icon, favicon, splash)."""
    # 1. Main Icon
    path_icon = f"assets/images/{base_name}.png"
    img.save(path_icon)
    print(f"  ✓ {path_icon}")

    # 2. Adaptive Icon (Foreground)
    path_adaptive = f"assets/images/adaptive-{base_name}.png"
    if base_name == "icon": path_adaptive = "assets/images/adaptive-icon.png" # Standard name override
    img.save(path_adaptive)
    print(f"  ✓ {path_adaptive}")

    # 3. Favicon
    fav = img.resize((48, 48), Image.LANCZOS)
    path_fav = f"assets/images/favicon-{base_name}.png" 
    if base_name == "icon": path_fav = "assets/images/favicon.png" # Standard name override
    fav.save(path_fav)
    print(f"  ✓ {path_fav}")

    # 4. Splash Screen
    splash = Image.new("RGBA", (SIZE * 2, SIZE * 2), (*splash_bg, 255))
    offset = ((SIZE * 2 - SIZE) // 2, (SIZE * 2 - SIZE) // 2)
    splash.paste(img, offset, img)
    path_splash = f"assets/images/splash-{base_name}.png"
    if base_name == "icon": path_splash = "assets/images/splash.png" # Standard name override
    splash.save(path_splash)
    print(f"  ✓ {path_splash}")


# ── 1. RED MINIMALIST (Current / Latest) ──────────────────────
def create_red_minimalist():
    print("\nGenerating [PRIMARY] Red Minimalist Icon ('icon.png') …")
    RADIUS = 220
    BG_COLOR = (220, 38, 38) # #DC2626 Red
    WHITE = (255, 255, 255)

    img = _aa_rounded_rect(SIZE, RADIUS, (*BG_COLOR, 255))
    d = ImageDraw.Draw(img)

    # Geometric H
    h_width = 440
    h_height = 500
    stem_width = 110
    cx, cy = SIZE // 2, SIZE // 2

    # Left Stem
    x1 = cx - h_width // 2
    y1 = cy - h_height // 2
    d.rectangle([x1, y1, x1 + stem_width, y1 + h_height], fill=WHITE)
    
    # Right Stem
    x2 = cx + h_width // 2 - stem_width
    y2 = cy - h_height // 2
    d.rectangle([x2, y2, x2 + stem_width, y2 + h_height], fill=WHITE)
    
    # Crossbar
    bar_height = 90
    bx1 = x1 + stem_width
    by1 = cy - bar_height // 2
    bx2 = x2
    by2 = cy + bar_height // 2
    d.rectangle([bx1, by1, bx2, by2], fill=WHITE)
    
    _save_variants(img, "icon", splash_bg=BG_COLOR)


# ── 2. PURPLE GRADIENT (Previous Modern) ──────────────────────
def create_purple_modern():
    print("\nGenerating [BACKUP] Purple Gradient Icon ('icon-modern.png') …")
    RADIUS = 200
    PURPLE_DARK = (126, 34, 206)
    PURPLE_LIGHT = (168, 85, 247)
    CYAN_ACCENT = (6, 182, 212)
    WHITE = (255, 255, 255)

    # detailed gradient logic omitted for brevity, approximating with solid fill
    # actually, why not include the full gradient logic if we want to restore it perfectly?
    # Let's do a simple vertical gradient approximation
    
    img = Image.new("RGBA", (SIZE, SIZE), (0,0,0,0))
    
    # Create gradient background
    grad = Image.new("RGBA", (SIZE, SIZE))
    for y in range(SIZE):
        t = y / SIZE
        r = int(PURPLE_DARK[0] + (PURPLE_LIGHT[0] - PURPLE_DARK[0]) * t)
        g = int(PURPLE_DARK[1] + (PURPLE_LIGHT[1] - PURPLE_DARK[1]) * t)
        b = int(PURPLE_DARK[2] + (PURPLE_LIGHT[2] - PURPLE_DARK[2]) * t)
        for x in range(SIZE):
             grad.putpixel((x, y), (r, g, b, 255))

    # Mask to rounded rect
    mask = Image.new("L", (SIZE, SIZE), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([(0, 0), (SIZE, SIZE)], radius=RADIUS, fill=255)
    img.paste(grad, (0, 0), mask)

    d = ImageDraw.Draw(img)

    # Stylised H ( Pillars + Crossbar )
    h_w, h_h = 420, 480
    h_x = (SIZE - h_w) // 2
    h_y = (SIZE - h_h) // 2 - 40
    bar_w = 72
    bar_r = 18

    # Left
    d.rounded_rectangle([(h_x, h_y), (h_x + bar_w, h_y + h_h)], radius=bar_r, fill=WHITE)
    # Right
    d.rounded_rectangle([(h_x + h_w - bar_w, h_y), (h_x + h_w, h_y + h_h)], radius=bar_r, fill=WHITE)
    # Cross
    cross_y = h_y + (h_h - bar_w) // 2
    d.rounded_rectangle([(h_x, cross_y), (h_x + h_w, cross_y + bar_w)], radius=bar_r, fill=WHITE)

    # Checkmark
    check_cx = h_x + h_w - 30
    check_cy = h_y + h_h - 60
    # Simple checkmark lines
    check_w = 52
    pts = [
        (check_cx - 60, check_cy), 
        (check_cx - 20, check_cy + 40), 
        (check_cx + 80, check_cy - 55)
    ]
    d.line(pts, fill=CYAN_ACCENT, width=check_w, joint="curve")
    
    # Text "HabitX"
    # Fallback if no font
    try:
        font = ImageFont.truetype("arialbd.ttf", 96)
    except:
        font = ImageFont.load_default()
        
    label = "HabitX"
    bbox = d.textbbox((0, 0), label, font=font)
    lw = bbox[2] - bbox[0]
    lh = bbox[3] - bbox[1]
    lx = (SIZE - lw) // 2
    ly = h_y + h_h + 36
    d.text((lx, ly), label, fill=(*WHITE, 230), font=font)

    _save_variants(img, "icon-modern", splash_bg=PURPLE_DARK)


# ── 3. DARK SYMBOLIC (Previous Minimalist) ────────────────────
def create_dark_symbolic():
    print("\nGenerating [BACKUP] Dark Symbolic Icon ('icon-dark.png') …")
    RADIUS = 220
    BG_COLOR = (15, 23, 42) # Slate 900
    ACCENT = (168, 85, 247)
    WHITE = (255, 255, 255)

    img = _aa_rounded_rect(SIZE, RADIUS, (*BG_COLOR, 255))
    d = ImageDraw.Draw(img)

    cx, cy = SIZE // 2, SIZE // 2
    ring_r = 300
    ring_w = 40

    # Circle Ring
    # Outer circle
    d.ellipse([(cx - ring_r, cy - ring_r), (cx + ring_r, cy + ring_r)], fill=(*WHITE, 50))
    # Inner punch-out (draw bg color on top)
    inner_r = ring_r - ring_w
    d.ellipse([(cx - inner_r, cy - inner_r), (cx + inner_r, cy + inner_r)], fill=(*BG_COLOR, 255))

    # Checkmark inside
    check_pts = [
        (cx - 140, cy + 10),
        (cx - 30,  cy + 130),
        (cx + 160, cy - 110),
    ]
    d.line(check_pts, fill=WHITE, width=56, joint="curve")
    
    # Dot at top
    dot_r = 32
    dot_cy = cy - ring_r + ring_w // 2
    d.ellipse([(cx, dot_cy - dot_r), (cx + dot_r * 2, dot_cy + dot_r)], fill=ACCENT) # Fixed offset in original

    # Correct dot
    d.ellipse([(cx - dot_r, dot_cy - dot_r), (cx + dot_r, dot_cy + dot_r)], fill=ACCENT)

    _save_variants(img, "icon-dark", splash_bg=BG_COLOR)


if __name__ == "__main__":
    try:
        from PIL import Image  # noqa: F811
    except ImportError:
        import subprocess, sys
        subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])

    create_red_minimalist()  # Main (overwrites icon.png)
    create_purple_modern()   # Backup (saves icon-modern.png)
    create_dark_symbolic()   # Backup (saves icon-dark.png)
    
    print("\nDone! All variants generated.")
