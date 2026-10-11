"""Regenerate the flat TajwidLens application mark without external services."""
from pathlib import Path
from io import BytesIO
from PIL import Image
import cairosvg

root = Path(__file__).resolve().parents[1]
out = root / 'public'
out.mkdir(exist_ok=True)
svg = '''<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<rect width="512" height="512" rx="100" fill="#153B32"/>
<path d="M105 155 C166 132 209 145 256 175 C303 145 346 132 407 155 L407 366 C347 342 302 349 256 382 C210 349 165 342 105 366 Z" fill="none" stroke="#F6F0DF" stroke-width="24" stroke-linejoin="round"/>
<path d="M256 177 V383" stroke="#F6F0DF" stroke-width="21" stroke-linecap="round"/>
<circle cx="349" cy="253" r="61" fill="#153B32" stroke="#D4B875" stroke-width="22"/>
<path d="M395 299 L439 343" stroke="#D4B875" stroke-width="22" stroke-linecap="round"/>
</svg>'''
(out/'tajwidlens-mark.svg').write_text(svg, encoding='utf8')
def png(size):
    return Image.open(BytesIO(cairosvg.svg2png(bytestring=svg.encode(), output_width=size, output_height=size))).convert('RGBA')
for size in (16,32,96,192,512):
    png(size).save(out/f'favicon-{size}x{size}.png', optimize=True)
png(180).save(out/'apple-touch-icon.png', optimize=True)
for size in (192,512):
    png(size).save(out/f'android-chrome-{size}x{size}.png', optimize=True)
png(256).save(out/'favicon.ico', format='ICO', sizes=[(16,16),(32,32),(48,48),(64,64),(128,128),(256,256)])
print('TajwidLens brand assets created')
