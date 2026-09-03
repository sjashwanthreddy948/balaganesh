import sys

try:
    from PIL import Image
    print("PIL is installed")

    # Load original red stamp image
    img = Image.open('public/images/bala-ganesh-stamp.png').convert('RGBA')
    datas = img.getdata()

    # Target Blue: Royal Blue (#0c1e54 or #1034a6 or #0a2569)
    # Target RGB: (12, 30, 84) or (16, 42, 110)
    target_r = 12
    target_g = 34
    target_b = 96

    new_data = []
    for item in datas:
        r, g, b, a = item
        # If pixel is transparent, keep transparent
        if a < 10:
            new_data.append((0, 0, 0, 0))
            continue

        # Check if pixel is background (near white or light)
        if r > 240 and g > 240 and b > 240:
            new_data.append((255, 255, 255, 0)) # Make background completely transparent
            continue

        # Red ink pixel: r is significantly higher than g and b, or general ink
        # Calculate ink intensity: how dark / colored is the ink
        # For red ink, red is bright or dark red.
        # Ink coverage can be measured by darkness or red dominance:
        # In a white-background stamp: darkness = 255 - min(r, g, b)
        # If background is already transparent:
        redness = r - max(g, b)
        if redness > 20:
            # It's red ink!
            # Use red component or alpha to blend blue
            ink_strength = a / 255.0 * (1.0 - (min(g, b) / 255.0))
            # Keep the texture and grunge of the stamp
            # Blend between target blue and darker navy
            br = int(target_r + (r - 180) * 0.1) if r > 180 else target_r
            bg = int(target_g + g * 0.1)
            bb = int(target_b + (255 - r) * 0.2)
            new_a = int(min(255, max(0, a * (1.0 if redness > 40 else redness / 40.0))))
            new_data.append((target_r, target_g, target_b, a))
        elif a > 20 and (r < 220 or g < 220 or b < 220):
            # Anti-aliased / grunge edge
            new_data.append((target_r, target_g, target_b, a))
        else:
            new_data.append((0, 0, 0, 0))

    img.putdata(new_data)
    img.save('public/images/bala-ganesh-stamp-blue.png', 'PNG')
    print("Saved blue stamp to public/images/bala-ganesh-stamp-blue.png successfully!")

except Exception as e:
    print(f"Error: {e}")
