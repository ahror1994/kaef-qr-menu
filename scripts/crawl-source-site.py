#!/usr/bin/env python3
"""Crawl https://qr.kaef-nch.ru/ and extract structured menu data + assets.

Outputs:
  docs/source-routes.json     - pages/routes found on the source site
  docs/source-elements.json   - element inventory (categories, products, UI parts)
  docs/source-assets.json     - asset map (source URL -> local path)
  public/source-assets/       - downloaded images, fonts, icons
  data/source-menu.json       - structured menu used by the seed script

The script treats everything on the source site as data only.
"""
import json
import os
import re
import sys
import urllib.parse
import urllib.request

BASE = "https://qr.kaef-nch.ru"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = {"User-Agent": "Mozilla/5.0 (site-migration audit script)"}


def fetch(url: str, binary: bool = False):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    return data if binary else data.decode("utf-8", errors="replace")


def local_path_for(url: str) -> str:
    p = urllib.parse.urlparse(url).path.lstrip("/")
    if "uploads/" in p:
        p = "uploads/" + p.split("uploads/", 1)[1]
    return p


def download(url: str) -> str:
    rel = os.path.join("public", "source-assets", local_path_for(url))
    abs_path = os.path.join(ROOT, rel)
    if not os.path.exists(abs_path):
        os.makedirs(os.path.dirname(abs_path), exist_ok=True)
        try:
            data = fetch(url, binary=True)
            with open(abs_path, "wb") as f:
                f.write(data)
        except Exception as e:  # noqa: BLE001
            print(f"  ! failed {url}: {e}", file=sys.stderr)
            return ""
    return rel.replace("\\", "/")


def clean(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def main() -> None:
    html = fetch(BASE + "/")
    open(os.path.join(ROOT, "docs", "source-home.html"), "w", encoding="utf-8").write(html)

    # --- categories -------------------------------------------------------
    categories = []
    for m in re.finditer(r'<section class="section-category" id="([^"]+)">.*?<h2 class="category-title">\s*(.*?)\s*</h2>', html, re.S):
        categories.append({"slug": m.group(1), "title": clean(m.group(2))})
    cat_by_pos = {}
    # map sections in order to products inside them
    sections = re.split(r'<section class="section-category" id="', html)[1:]
    products = []
    for sec in sections:
        slug = sec.split('"', 1)[0]
        title_m = re.search(r'<h2 class="category-title">\s*(.*?)\s*</h2>', sec, re.S)
        cat_title = clean(title_m.group(1)) if title_m else slug
        for pm in re.finditer(r'<button\s+class="btn-product"(.*?)(?:/>|></button>)', sec, re.S):
            attrs = pm.group(1)

            def attr(name: str) -> str:
                am = re.search(name + r'="([^"]*)"', attrs)
                return am.group(1) if am else ""

            def attr_json(name: str):
                am = re.search(name + r"='(\[.*?\])'", attrs, re.S)
                if not am:
                    return []
                try:
                    return json.loads(am.group(1).replace("&quot;", '"'))
                except Exception:  # noqa: BLE001
                    return []

            gallery = [g["url"] for g in attr_json("data-gallery") if isinstance(g, dict) and g.get("url")]
            variations = []
            for vm in re.finditer(r'class="product-variation".*?variation-weight">\s*(.*?)\s*<.*?variation-price">\s*(.*?)\s*<', sec, re.S):
                variations.append({"weight": clean(vm.group(1)), "price": clean(vm.group(2))})
            card_ctx = sec[max(0, pm.start() - 4000) : pm.start()]
            marks = ["NEW"] if "product-mark--item" in card_ctx and 'alt="NEW"' in card_ctx[-1500:] else []
            card_img = re.search(r'<img src="([^"]+)" class="product-card--img"', sec[pm.start() - 3000 : pm.end() + 100])
            products.append({
                "postId": attr("data-post-id"),
                "categorySlug": slug,
                "categoryTitle": cat_title,
                "title": clean(attr("data-title")) or clean(attr("data-name")),
                "description": clean(attr("data-description")),
                "price": attr("data-price"),
                "weight": attr("data-weight"),
                "images": gallery or ([card_img.group(1)] if card_img else []),
                "marks": marks,
                "variations": variations,
            })

    # --- header / footer / nav -------------------------------------------
    def section(pattern: str) -> str:
        m = re.search(pattern, html, re.S)
        return m.group(0) if m else ""

    header_html = section(r"<header.*?</header>")
    footer_html = section(r"<footer.*?</footer>")
    nav_links = [{"href": a, "text": clean(t)} for a, t in re.findall(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', header_html, re.S)]
    footer_links = [{"href": a, "text": clean(t)} for a, t in re.findall(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', footer_html, re.S)]
    cat_links = [{"href": a, "text": clean(t)} for a, t in re.findall(r'class="category-link"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', html, re.S)] or \
                [{"href": a, "text": clean(t)} for a, t in re.findall(r'<a[^>]+class="category-link"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', html, re.S)]

    # --- assets -----------------------------------------------------------
    asset_urls = set()
    for u in re.findall(r'(?:src|href)="(https?://qr\.kaef-nch\.ru/[^"]+\.(?:css|js|svg|png|jpe?g|webp|woff2?|ico))"', html):
        asset_urls.add(u)
    for u in re.findall(r'url\((["\']?)(https?://[^)]+)\1\)', html):
        asset_urls.add(u[1])
    for p in products:
        for u in p["images"]:
            asset_urls.add(u)
    assets = []
    for u in sorted(asset_urls):
        local = download(u)
        assets.append({"sourceUrl": u, "localPath": "source-assets/" + local_path_for(u), "downloaded": bool(local)})

    routes = {
        "ru": "/",
        "en": "/en/",
        "zh": "/zh/",
        "categories": [c["slug"] for c in categories],
        "productPages": sorted({f"/{p['categorySlug']}/" for p in products}),
        "feeds": ["/feed/", "/comments/feed/"],
    }

    menu = {
        "site": {"title": "KAEF HOOKAH LOUNGE", "baseUrl": BASE},
        "categories": categories,
        "products": products,
        "navigation": {"header": nav_links, "footer": footer_links, "categoryLinks": cat_links},
    }
    os.makedirs(os.path.join(ROOT, "data"), exist_ok=True)
    json.dump(menu, open(os.path.join(ROOT, "data", "source-menu.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    json.dump(routes, open(os.path.join(ROOT, "docs", "source-routes.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    json.dump({
        "categories": [{"type": "section-category", "slug": c["slug"], "title": c["title"], "cmsManaged": True} for c in categories],
        "products": [{"type": "product-card", "id": p["postId"], "title": p["title"], "interactive": "modal", "cmsManaged": True} for p in products],
        "staticUi": [
            {"type": "header", "interactive": True},
            {"type": "category-carousel", "component": "swiper", "interactive": True},
            {"type": "product-modal", "component": "bootstrap-modal + fancybox + swiper", "interactive": True},
            {"type": "language-switcher", "languages": ["ru", "en", "zh"], "interactive": True},
            {"type": "footer", "cmsManaged": True},
        ],
    }, open(os.path.join(ROOT, "docs", "source-elements.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    json.dump(assets, open(os.path.join(ROOT, "docs", "source-assets.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    print(f"categories={len(categories)} products={len(products)} assets={len(assets)}")


if __name__ == "__main__":
    main()
