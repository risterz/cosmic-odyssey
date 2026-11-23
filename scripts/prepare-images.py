from PIL import Image
from pathlib import Path

root = Path(__file__).resolve().parents[1]
images = root / 'public' / 'images'

# NASA's untethered EVA photograph: isolate the astronaut against its black sky.
im = Image.open(images / 'astronaut-source.jpg').convert('RGB')
# Limit the mask to the top third so Earth's horizon cannot enter the crop.
search = im.copy()
search.paste((0, 0, 0), (0, int(im.height * 0.34), im.width, im.height))
gray = search.convert('L')
mask = gray.point(lambda value: 255 if value > 24 else 0)
box = mask.getbbox()
if box is None:
    raise RuntimeError('Astronaut subject not found')
astronaut = im.crop(box)
alpha = astronaut.convert('L').point(lambda value: max(0, min(255, int((value - 2) * 8))))
astronaut.putalpha(alpha)
astronaut.thumbnail((900, 1200), Image.Resampling.LANCZOS)
astronaut.save(images / 'astronaut.png', optimize=True)

# Resize locally hosted astronomical imagery to sensible display sizes.
for name in ['andromeda', 'galaxy', 'nebula', 'deep-space', 'spiral']:
    source = images / f'{name}.jpg'
    image = Image.open(source).convert('RGB')
    image.thumbnail((2000, 1400), Image.Resampling.LANCZOS)
    image.save(images / f'{name}.webp', 'WEBP', quality=88, method=6)

print('Prepared astronaut cutout and compressed space imagery.')
