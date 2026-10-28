# Собирает index.html из src/page.html: метки [[имя|подпись|sizes]] превращаются в <img> с srcset и размерами
import json, re, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
dims = json.loads((root / "dims.json").read_text(encoding="utf-8"))
page = (root / "src" / "page.html").read_text(encoding="utf-8")


def img(m):
    name, alt, *rest = m.group(1).split("|")
    sizes = rest[0] if rest and rest[0] else "(max-width: 900px) 100vw, 70vw"
    w, h = dims[name]
    lazy = "" if name == "tz-2c" else ' loading="lazy"'
    return (f'<img src="img/{name}-s.webp" srcset="img/{name}-s.webp 1000w, img/{name}-l.webp {w}w" '
            f'sizes="{sizes}" width="{w}" height="{h}" alt="{alt}" data-full="img/{name}-l.webp" '
            f'style="--r:{w / h:.3f}" decoding="async"{lazy}>')


(root / "index.html").write_text(re.sub(r"\[\[(.+?)\]\]", img, page), encoding="utf-8")
print("ok")
