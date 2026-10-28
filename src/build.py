# Собирает страницы из шаблонов: метки [[имя|подпись|sizes]] превращаются в <img> с srcset и размерами, {{base}} — путь до корня сайта
import json, re, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
dims = json.loads((root / "dims.json").read_text(encoding="utf-8"))
PAGES = [("page.html", "index.html", ""), ("page.en.html", "en/index.html", "../")]


def render(page, base):
    def img(m):
        name, alt, *rest = m.group(1).split("|")
        sizes = rest[0] if rest and rest[0] else "(max-width: 900px) 100vw, 70vw"
        w, h = dims[name]
        lazy = "" if name == "tz-2c" else ' loading="lazy"'
        src = f"{base}img/{name}"
        return (f'<img src="{src}-s.webp" srcset="{src}-s.webp 1000w, {src}-l.webp {w}w" '
                f'sizes="{sizes}" width="{w}" height="{h}" alt="{alt}" data-full="{src}-l.webp" '
                f'style="--r:{w / h:.3f}" decoding="async"{lazy}>')
    return re.sub(r"\[\[(.+?)\]\]", img, page).replace("{{base}}", base)


for src, out, base in PAGES:
    tpl = root / "src" / src
    if not tpl.exists():
        continue
    dst = root / out
    dst.parent.mkdir(exist_ok=True)
    dst.write_text(render(tpl.read_text(encoding="utf-8"), base), encoding="utf-8")
    print("ok", out)
