#!/usr/bin/env node
/**
 * Генерирует статическую копию меню для GitHub Pages (только просмотр, без админки).
 * Использование: node scripts/export-static.mjs <output-dir>
 * Источник данных: data/source-menu.json + public/source-assets.
 */
import fs from "fs";
import path from "path";

const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")).replace(/[/\\]scripts$/, "");
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "source-menu.json"), "utf-8"));
const outDir = process.argv[2] || path.join(ROOT, "static-export");

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const priceFmt = (p) => `${Number(p).toLocaleString("ru-RU")} ₽`;

const catBySlug = new Map(data.categories.map((c) => [c.slug, c.title]));
const byCat = new Map();
for (const p of data.products) {
  if (!byCat.has(p.categorySlug)) byCat.set(p.categorySlug, []);
  byCat.get(p.categorySlug).push(p);
}

const toLocal = (url) => {
  if (!url) return "";
  const m = String(url).match(/uploads\/(.+)$/);
  return m ? `./source-assets/uploads/${m[1]}` : "";
};

const cards = [];
const modalData = [];
for (const [slug, products] of byCat) {
  cards.push(`  <section class="section-category" id="${esc(slug)}">
    <div class="container"><div class="row"><div class="col-12"><h2 class="category-title">${esc(catBySlug.get(slug))}</h2></div></div>
    <div class="row">`);
  for (const p of products) {
    const img = toLocal(p.images[0]);
    const isString = !img;
    const id = p.postId;
    modalData.push({
      id, title: p.title, description: p.description, price: p.price, weight: p.weight,
      images: p.images.map(toLocal).filter(Boolean),
    });
    if (isString) {
      cards.push(`      <div class="col-lg-4 col-md-4 col-sm-6 mb-4">
        <div class="product-card product-card--type-string">
          <div class="product-card--body">
            <h3 class="product-title" data-product="${id}"><span>${esc(p.title)}</span></h3>
            <div class="product-meta"><div class="product-price">${priceFmt(p.price)}</div>${p.weight ? `<div class="product-weight">${esc(p.weight)}</div>` : ""}</div>
          </div>
        </div>
      </div>`);
    } else {
      cards.push(`      <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
        <div class="product-card product-card--type-gallery">
          <div class="product-card--image">
            ${p.marks?.length ? '<div class="product-mark">NEW</div>' : ""}
            <img src="${img}" class="product-card--img" alt="${esc(p.title)}" loading="lazy">
          </div>
          <div class="product-card--body">
            <h3 class="product-title">${esc(p.title)}</h3>
            <div class="product-description">${esc(p.description)}</div>
            <div class="product-card--footer">
              <div class="product-meta"><div class="product-price">${priceFmt(p.price)}</div>${p.weight ? `<div class="product-weight">${esc(p.weight)}</div>` : ""}</div>
              <button class="btn-product" data-product="${id}" aria-label="Подробнее: ${esc(p.title)}">
                <svg viewBox="0 0 28 28" fill="none"><path d="M8 20L20 8M20 8H10M20 8V18" stroke="#3F2F27" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>`);
    }
  }
  cards.push("    </div></div>\n  </section>");
}

const navChips = data.categories
  .map((c) => `<a href="#${esc(c.slug)}" class="category-link" data-cat="${esc(c.slug)}">${esc(c.title)}</a>`)
  .join("\n          ");

const js = `
const PRODUCTS = ${JSON.stringify(Object.fromEntries(modalData.map((p) => [p.id, p])))};
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-product]");
  if (btn) { openModal(PRODUCTS[btn.dataset.product]); return; }
  if (e.target.closest(".modal-overlay")) closeModal();
  if (e.target.closest(".btn-close-modal")) closeModal();
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
function openModal(p) {
  if (!p) return;
  const imgs = p.images.length ? p.images : ["./source-assets/img-placeholder.svg"];
  const ov = document.createElement("div");
  ov.className = "modal-overlay";
  ov.innerHTML = \`<div class="modal-content">
    <div class="modal-gallery">
      <button class="btn-close btn-close-modal" aria-label="Закрыть"><svg viewBox="0 0 20 20" fill="none"><path d="M5 5L15 15M15 5L5 15" stroke="#3F2F27" stroke-width="2" stroke-linecap="round"/></svg></button>
      <img class="modal-product--image" src="\${imgs[0]}" alt="">
      \${imgs.length > 1 ? '<div class="gallery-dots">' + imgs.map((_, i) => '<button data-dot="' + i + '" class="' + (i ? "" : "active") + '"></button>').join("") + "</div>" : ""}
    </div>
    <div class="modal-body"><div class="product-info">
      <h3 class="modal-title">\${p.title}</h3>
      <div class="modal-description">\${p.description || ""}</div>
      <div class="product-meta"><div class="product-weight">\${p.weight || ""}</div><div class="product-price">\${Number(p.price).toLocaleString("ru-RU")} ₽</div></div>
    </div></div>
  </div>\`;
  document.body.appendChild(ov);
  document.body.style.overflow = "hidden";
  ov.addEventListener("click", (ev) => {
    const dot = ev.target.closest("[data-dot]");
    if (dot) {
      ov.querySelector(".modal-product--image").src = imgs[Number(dot.dataset.dot)];
      ov.querySelectorAll("[data-dot]").forEach((d) => d.classList.toggle("active", d === dot));
    }
  });
}
function closeModal() {
  const ov = document.querySelector(".modal-overlay");
  if (ov) { ov.remove(); document.body.style.overflow = ""; }
}
// scroll-spy + плавный скролл
const links = [...document.querySelectorAll(".category-link")];
links.forEach((a) => a.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById(a.dataset.cat)?.scrollIntoView({ behavior: "smooth" });
}));
const obs = new IntersectionObserver((entries) => {
  for (const en of entries) if (en.isIntersecting) {
    links.forEach((a) => a.classList.toggle("active", a.dataset.cat === en.target.id));
  }
}, { rootMargin: "-30% 0px -60% 0px" });
document.querySelectorAll(".section-category").forEach((s) => obs.observe(s));
`;

const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KAEF HOOKAH LOUNGE — QR MENU</title>
<meta name="description" content="От фирменных кальянов до изысканных блюд и закусок. Каждая подача — это настроение и стиль.">
<style>
${fs.readFileSync(path.join(ROOT, "app", "globals.css"), "utf-8").replace(/\/source-assets\//g, "./source-assets/")}
</style>
</head>
<body>
<header class="header">
  <div class="container header--box">
    <div class="logo-box"><img src="./source-assets/uploads/2025/04/logo.svg" alt="KAEF HOOKAH LOUNGE" class="logo-img"></div>
  </div>
</header>
<div class="category-header">
  <div class="container">
    <nav class="category-carousel" aria-label="Категории меню">
          ${navChips}
    </nav>
  </div>
</div>
<main>
${cards.join("\n")}
</main>
<footer class="footer">
  <div class="container"><div class="row align-items-center"><div class="col-12">
    <div class="footer-links"><a href="https://t.me/ricardo_quattro" target="_blank" rel="noopener">Telegram</a></div>
    <div class="copyright">© 2026 KAEF HOOKAH LOUNGE</div>
  </div></div></div>
</footer>
<script>${js}</script>
</body>
</html>
`;

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "index.html"), html);
fs.cpSync(path.join(ROOT, "public", "source-assets"), path.join(outDir, "source-assets"), { recursive: true });
fs.writeFileSync(path.join(outDir, ".nojekyll"), "");
console.log(`Статическое меню: ${outDir} (index.html, ${data.categories.length} категорий, ${data.products.length} блюд)`);
