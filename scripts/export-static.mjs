#!/usr/bin/env node
/**
 * Генерирует сайт + админ-панель для GitHub Pages.
 * Данные меню живут в menu.json ветки gh-pages; админка (/admin/) правит его
 * через GitHub Contents API (токен хранится только в браузере администратора).
 * Использование: node scripts/export-static.mjs <output-dir>
 */
import fs from "fs";
import path from "path";

const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")).replace(/[/\\]scripts$/, "");
const outDir = process.argv[2] || path.join(ROOT, "static-export");
const OWNER = "ahror1994";
const REPO = "kaef-qr-menu";
const BRANCH = "gh-pages";

const source = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "source-menu.json"), "utf-8"));
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

// --- menu.json (редактируемый формат) ---
const menu = {
  version: 2,
  site: {
    title: "KAEF HOOKAH LOUNGE — QR MENU",
    description: "От фирменных кальянов до изысканных блюд и закусок. Каждая подача — это настроение и стиль.",
    logo: "./source-assets/uploads/2025/04/logo.svg",
    copyright: "KAEF HOOKAH LOUNGE",
    year: "2026",
    socials: [{ label: "Telegram", url: "https://t.me/ricardo_quattro" }],
  },
  categories: source.categories.map((c, i) => ({ slug: c.slug, title: c.title, sort: i + 1, visible: true })),
  products: source.products.map((p) => ({
    id: p.postId || Math.random().toString(36).slice(2, 10),
    categorySlug: p.categorySlug,
    title: p.title,
    description: p.description,
    price: Number(p.price) || 0,
    weight: p.weight,
    image: p.images[0] ? toLocal(p.images[0]) : "",
    gallery: p.images.slice(1).map(toLocal),
    marks: p.marks ?? [],
    visible: true,
  })),
};
function toLocal(url) {
  const m = String(url || "").match(/uploads\/(.+)$/);
  return m ? `./source-assets/uploads/${m[1]}` : url || "";
}

const css = fs.readFileSync(path.join(ROOT, "app", "globals.css"), "utf-8").replace(/\/source-assets\//g, "../source-assets/");

// --- assets/app.js: рендер меню из menu.json ---
const appJs = `
const priceFmt = (p) => Number(p).toLocaleString("ru-RU") + " ₽";
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

async function boot() {
  const menu = await fetch("./menu.json?t=" + Date.now()).then((r) => r.json());
  document.title = menu.site.title;
  const logo = document.getElementById("logo");
  logo.src = menu.site.logo; logo.alt = menu.site.title;
  document.getElementById("footer-year").textContent = menu.site.year;
  document.getElementById("footer-copy").textContent = menu.site.copyright;
  document.getElementById("footer-links").innerHTML = menu.site.socials
    .map((s) => '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.label) + "</a>").join("");

  const cats = menu.categories.filter((c) => c.visible !== false).sort((a, b) => (a.sort || 0) - (b.sort || 0));
  const nav = document.getElementById("nav");
  const main = document.getElementById("main");
  nav.innerHTML = cats.map((c) => '<a href="#' + esc(c.slug) + '" class="category-link" data-cat="' + esc(c.slug) + '">' + esc(c.title) + "</a>").join("");
  nav.addEventListener("click", (e) => {
    const a = e.target.closest(".category-link");
    if (a) { e.preventDefault(); document.getElementById(a.dataset.cat)?.scrollIntoView({ behavior: "smooth" }); }
  });

  main.innerHTML = cats.map((c) => {
    const items = menu.products.filter((p) => p.categorySlug === c.slug && p.visible !== false);
    const cards = items.map((p) => cardHtml(p)).join("");
    return '<section class="section-category" id="' + esc(c.slug) + '"><div class="container"><div class="row"><div class="col-12"><h2 class="category-title">' + esc(c.title) + '</h2></div></div><div class="row">' + cards + "</div></div></section>";
  }).join("");

  main.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-product]");
    if (btn) openModal(menu.products.find((p) => p.id === btn.dataset.product));
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest(".modal-overlay")) closeModal();
    const dot = e.target.closest("[data-dot]");
    if (dot) {
      const ov = dot.closest(".modal-overlay");
      ov.querySelector(".modal-product--image").src = ov._imgs[Number(dot.dataset.dot)];
      ov.querySelectorAll("[data-dot]").forEach((d) => d.classList.toggle("active", d === dot));
    }
  });
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeModal());

  const links = [...nav.querySelectorAll(".category-link")];
  const obs = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting)
      links.forEach((a) => a.classList.toggle("active", a.dataset.cat === en.target.id));
  }, { rootMargin: "-30% 0px -60% 0px" });
  main.querySelectorAll(".section-category").forEach((s) => obs.observe(s));
}

function cardHtml(p) {
  const img = p.image || (p.gallery || [])[0];
  const marks = (p.marks || []).length ? '<div class="product-mark">' + esc(p.marks[0]) + "</div>" : "";
  if (!img) {
    return '<div class="col-lg-4 col-md-4 col-sm-6 mb-4"><div class="product-card product-card--type-string"><div class="product-card--body">' +
      '<h3 class="product-title" data-product="' + esc(p.id) + '"><span>' + esc(p.title) + "</span></h3>" +
      '<div class="product-meta"><div class="product-price">' + priceFmt(p.price) + "</div>" +
      (p.weight ? '<div class="product-weight">' + esc(p.weight) + "</div>" : "") + "</div></div></div></div>";
  }
  return '<div class="col-lg-3 col-md-4 col-sm-6 mb-4"><div class="product-card product-card--type-gallery">' +
    '<div class="product-card--image">' + marks + '<img src="' + esc(img) + '" class="product-card--img" alt="' + esc(p.title) + '" loading="lazy"></div>' +
    '<div class="product-card--body"><h3 class="product-title">' + esc(p.title) + "</h3>" +
    (p.description ? '<div class="product-description">' + esc(p.description) + "</div>" : "") +
    '<div class="product-card--footer"><div class="product-meta"><div class="product-price">' + priceFmt(p.price) + "</div>" +
    (p.weight ? '<div class="product-weight">' + esc(p.weight) + "</div>" : "") + "</div>" +
    '<button class="btn-product" data-product="' + esc(p.id) + '" aria-label="Подробнее: ' + esc(p.title) + '">' +
    '<svg viewBox="0 0 28 28" fill="none"><path d="M8 20L20 8M20 8H10M20 8V18" stroke="#3F2F27" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
    "</button></div></div></div></div>";
}

function openModal(p) {
  if (!p) return;
  const imgs = (p.gallery || []).concat(p.image ? [p.image] : []);
  const list = imgs.length ? imgs : ["../source-assets/img-placeholder.svg"];
  const ov = document.createElement("div");
  ov.className = "modal-overlay";
  ov._imgs = list;
  ov.innerHTML = '<div class="modal-content"><div class="modal-gallery">' +
    '<button class="btn-close btn-close-modal" aria-label="Закрыть"><svg viewBox="0 0 20 20" fill="none"><path d="M5 5L15 15M15 5L5 15" stroke="#3F2F27" stroke-width="2" stroke-linecap="round"/></svg></button>' +
    ((p.marks || []).length ? '<div class="product-mark">' + esc(p.marks[0]) + "</div>" : "") +
    '<img class="modal-product--image" src="' + esc(list[0]) + '" alt="">' +
    (list.length > 1 ? '<div class="gallery-dots">' + list.map((_, i) => '<button data-dot="' + i + '" class="' + (i ? "" : "active") + '"></button>').join("") + "</div>" : "") +
    '</div><div class="modal-body"><div class="product-info"><h3 class="modal-title">' + esc(p.title) + "</h3>" +
    (p.description ? '<div class="modal-description">' + esc(p.description) + "</div>" : "") +
    '<div class="product-meta"><div class="product-weight">' + esc(p.weight || "") + '</div><div class="product-price">' + priceFmt(p.price) + "</div></div>" +
    "</div></div></div>";
  document.body.appendChild(ov);
  document.body.style.overflow = "hidden";
}
function closeModal() {
  const ov = document.querySelector(".modal-overlay");
  if (ov) { ov.remove(); document.body.style.overflow = ""; }
}
boot();
`;

// --- assets/admin.js: админка на GitHub Contents API ---
const adminJs = `
const OWNER = "${OWNER}", REPO = "${REPO}", BRANCH = "${BRANCH}";
const $ = (s) => document.querySelector(s);
let menu = null;
let token = sessionStorage.getItem("gh_token") || "";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const api = (url, opts = {}) => fetch(url, { ...opts, headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json", ...(opts.headers || {}) } });

if (token) start(); else showLogin();

function showLogin() {
  $("#login").style.display = "";
  $("#app").style.display = "none";
}
async function start() {
  $("#login").style.display = "none";
  $("#app").style.display = "";
  try {
    menu = await fetch("../menu.json?t=" + Date.now()).then((r) => r.json());
  } catch { alert("Не удалось загрузить menu.json"); return; }
  renderCats(); renderProducts(); renderSite();
}
$("#login-btn").onclick = async () => {
  token = $("#token").value.trim();
  const r = await api("https://api.github.com/repos/" + OWNER + "/" + REPO);
  if (!r.ok) { $("#login-err").textContent = "Токен не принят GitHub: " + (await r.json()).message; return; }
  sessionStorage.setItem("gh_token", token);
  start();
};
$("#logout").onclick = () => { sessionStorage.removeItem("gh_token"); location.reload(); };

function renderSite() {
  $("#f-title").value = menu.site.title; $("#f-copy").value = menu.site.copyright; $("#f-year").value = menu.site.year;
  $("#f-logo").value = menu.site.logo;
  $("#f-socials").value = (menu.site.socials || []).map((s) => s.label + " | " + s.url).join("\\n");
}
function collectSite() {
  menu.site.title = $("#f-title").value; menu.site.copyright = $("#f-copy").value; menu.site.year = $("#f-year").value;
  menu.site.logo = $("#f-logo").value;
  menu.site.socials = $("#f-socials").value.split("\\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const [label, ...rest] = l.split("|"); return { label: label.trim(), url: rest.join("|").trim() };
  });
}
function renderCats() {
  $("#cats").innerHTML = menu.categories.sort((a, b) => (a.sort || 0) - (b.sort || 0)).map((c, i) =>
    '<tr><td><input data-ci="' + i + '" data-k="title" value="' + esc(c.title) + '"></td>' +
    '<td><input data-ci="' + i + '" data-k="slug" value="' + esc(c.slug) + '"></td>' +
    '<td><input data-ci="' + i + '" data-k="sort" type="number" value="' + (c.sort || 0) + '" style="width:70px"></td>' +
    '<td><input data-ci="' + i + '" data-k="visible" type="checkbox" ' + (c.visible !== false ? "checked" : "") + "></td>" +
    '<td><button class="btn btn-sm btn-danger" data-delcat="' + esc(c.slug) + '">Удалить</button></td></tr>').join("");
  document.querySelectorAll("[data-ci]").forEach((inp) => inp.onchange = () => {
    const c = menu.categories[Number(inp.dataset.ci)];
    c[inp.dataset.k] = inp.type === "checkbox" ? inp.checked : (inp.dataset.k === "sort" ? Number(inp.value) : inp.value);
  });
  document.querySelectorAll("[data-delcat]").forEach((b) => b.onclick = () => {
    if (!confirm("Удалить категорию и её блюда?")) return;
    menu.products = menu.products.filter((p) => p.categorySlug !== b.dataset.delcat);
    menu.categories = menu.categories.filter((c) => c.slug !== b.dataset.delcat);
    renderCats(); renderProducts();
  });
}
$("#addcat").onclick = () => {
  const slug = prompt("Slug категории (латиницей, например napitki):");
  if (!slug) return;
  menu.categories.push({ slug, title: slug, sort: menu.categories.length + 1, visible: true });
  renderCats();
};
function renderProducts(filter = "") {
  const f = filter.toLowerCase();
  $("#prods").innerHTML = menu.products
    .filter((p) => !f || (p.title + " " + p.description).toLowerCase().includes(f))
    .map((p, i) => {
      const gi = menu.products.indexOf(p);
      return '<tr><td>' + (p.image ? '<img class="thumb" src="' + esc(p.image) + '">' : "") + "</td>" +
        '<td><input data-pi="' + gi + '" data-k="title" value="' + esc(p.title) + '"></td>' +
        '<td style="font-size:12px">' + esc(p.categorySlug) + "</td>" +
        '<td><input data-pi="' + gi + '" data-k="price" type="number" value="' + p.price + '" style="width:90px"></td>' +
        '<td><input data-pi="' + gi + '" data-k="weight" value="' + esc(p.weight) + '" style="width:90px"></td>' +
        '<td><input data-pi="' + gi + '" data-k="image" value="' + esc(p.image) + '" style="min-width:180px"></td>' +
        '<td><input data-pi="' + gi + '" data-k="marksStr" value="' + esc((p.marks || []).join(",")) + '" style="width:70px"></td>' +
        '<td><input data-pi="' + gi + '" data-k="visible" type="checkbox" ' + (p.visible !== false ? "checked" : "") + "></td>" +
        '<td><button class="btn btn-sm" data-editp="' + gi + '">Описание</button> <button class="btn btn-sm btn-danger" data-delp="' + gi + '">✕</button></td></tr>';
    }).join("");
  document.querySelectorAll("[data-pi]").forEach((inp) => inp.onchange = () => {
    const p = menu.products[Number(inp.dataset.pi)];
    const k = inp.dataset.k;
    if (k === "marksStr") p.marks = inp.value.split(",").map((s) => s.trim()).filter(Boolean);
    else if (k === "price") p.price = Number(inp.value) || 0;
    else if (k === "visible") p.visible = inp.checked;
    else p[k] = inp.value;
  });
  document.querySelectorAll("[data-editp]").forEach((b) => b.onclick = () => {
    const p = menu.products[Number(b.dataset.editp)];
    p.description = prompt("Описание блюда:", p.description) ?? p.description;
  });
  document.querySelectorAll("[data-delp]").forEach((b) => b.onclick = () => {
    if (!confirm("Удалить блюдо?")) return;
    menu.products.splice(Number(b.dataset.delp), 1);
    renderProducts($("#search").value);
  });
}
$("#search").oninput = (e) => renderProducts(e.target.value);
$("#addprod").onclick = () => {
  const title = prompt("Название блюда:");
  if (!title) return;
  const categorySlug = prompt("Slug категории (один из: " + menu.categories.map((c) => c.slug).join(", ") + "):", menu.categories[0]?.slug);
  if (!categorySlug) return;
  const price = Number(prompt("Цена:", "0") || 0);
  menu.products.push({ id: Date.now().toString(36), categorySlug, title, description: "", price, weight: "", image: "", gallery: [], marks: [], visible: true });
  renderProducts();
};
$("#save").onclick = async () => {
  collectSite();
  $("#status").textContent = "Сохраняем…";
  const meta = await api("https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/menu.json?ref=" + BRANCH).then((r) => r.json());
  const r = await api("https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/menu.json", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Update menu from admin panel (" + new Date().toLocaleString("ru-RU") + ")",
      branch: BRANCH,
      sha: meta.sha,
      content: btoa(unescape(encodeURIComponent(JSON.stringify(menu, null, 2)))),
    }),
  });
  if (r.ok) $("#status").textContent = "Сохранено! Сайт обновится через ~1 минуту.";
  else $("#status").textContent = "Ошибка: " + JSON.stringify(await r.json());
};
`;

// --- index.html (публичная часть) ---
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(path.join(outDir, "assets", "admin"), { recursive: true });
fs.mkdirSync(path.join(outDir, "admin"), { recursive: true });
fs.writeFileSync(path.join(outDir, "menu.json"), JSON.stringify(menu, null, 2));
fs.writeFileSync(path.join(outDir, "assets", "style.css"), css);
fs.writeFileSync(path.join(outDir, "assets", "app.js"), appJs);
fs.writeFileSync(path.join(outDir, "assets", "admin", "admin.js"), adminJs);
fs.writeFileSync(path.join(outDir, ".nojekyll"), "");
fs.cpSync(path.join(ROOT, "public", "source-assets"), path.join(outDir, "source-assets"), { recursive: true });

fs.writeFileSync(path.join(outDir, "index.html"), `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(menu.site.title)}</title>
<meta name="description" content="${esc(menu.site.description)}">
<link rel="stylesheet" href="./assets/style.css">
</head>
<body>
<header class="header">
  <div class="container header--box">
    <div class="logo-box"><img id="logo" src="" class="logo-img" alt=""></div>
  </div>
</header>
<div class="category-header">
  <div class="container"><nav class="category-carousel" id="nav" aria-label="Категории меню"></nav></div>
</div>
<main id="main"></main>
<footer class="footer">
  <div class="container"><div class="row align-items-center"><div class="col-12">
    <div class="footer-links" id="footer-links"></div>
    <div class="copyright">© <span id="footer-year"></span> <span id="footer-copy"></span></div>
  </div></div></div>
</footer>
<script src="./assets/app.js"></script>
</body>
</html>
`);

fs.writeFileSync(path.join(outDir, "admin", "index.html"), `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Админ-панель — ${esc(menu.site.title)}</title>
<link rel="stylesheet" href="../assets/style.css">
<style>
.adm { max-width: 1200px; margin: 0 auto; padding: 24px 16px 64px; }
.adm h1 { font-size: 24px; margin-bottom: 16px; }
.adm h2 { font-size: 18px; margin: 20px 0 8px; }
.login-box { max-width: 460px; margin: 80px auto; background: #fff; border-radius: 16px; padding: 28px; }
.login-box p { font-size: 14px; color: rgb(93,71,58); }
.login-box a { color: #1e40af; }
#admindocs { font-size: 13px; color: rgb(93,71,58); background: rgb(252,245,235); border-radius: 12px; padding: 12px 14px; margin-bottom: 16px; line-height: 1.5; }
</style>
</head>
<body>
<div class="adm">
  <div id="login" class="login-box" style="display:none">
    <h1>Админ-панель</h1>
    <p>Введите GitHub-токен с правом на изменение репозитория <b>${OWNER}/${REPO}</b>.
       Создать: <a href="https://github.com/settings/tokens/new?scopes=repo&amp;description=kaef-menu-admin" target="_blank">github.com/settings/tokens</a> (галочка repo, срок действия выберите сами).</p>
    <label class="field">Токен <input id="token" type="password"></label>
    <div class="admin-message error" id="login-err" style="display:none"></div>
    <button class="btn" id="login-btn">Войти</button>
  </div>
  <div id="app" style="display:none">
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <h1>Админ-панель</h1>
      <button class="btn" id="save">💾 Сохранить и опубликовать</button>
      <button class="btn btn-danger" id="logout">Выйти</button>
      <span id="status"></span>
    </div>
    <div id="admindocs">Изменения сохраняются прямо в GitHub (ветка gh-pages) и появляются на сайте через ~1 минуту.
      Изображения добавляются ссылкой на URL (например, уже загруженные в папку source-assets или любой хостинг картинок).</div>

    <h2>Настройки сайта</h2>
    <div class="admin-card" style="background:rgb(249,249,249)">
      <label class="field">Название <input id="f-title"></label>
      <label class="field">Копирайт <input id="f-copy"></label>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <label class="field" style="flex:1;min-width:100px">Год <input id="f-year" style="width:100px"></label>
        <label class="field" style="flex:2">Логотип (URL) <input id="f-logo"></label>
      </div>
      <label class="field">Соцсети и ссылки (строки вида: Telegram | https://t.me/...) <textarea id="f-socials" rows="3"></textarea></label>
    </div>

    <h2>Категории</h2>
    <button class="btn btn-sm" id="addcat">+ Категория</button>
    <table class="admin-table" id="cats-table">
      <thead><tr><th>Название</th><th>Slug</th><th>Сорт.</th><th>Вид</th><th></th></tr></thead>
      <tbody id="cats"></tbody>
    </table>

    <h2>Блюда</h2>
    <div style="display:flex;gap:8px;margin:8px 0;flex-wrap:wrap">
      <button class="btn btn-sm" id="addprod">+ Блюдо</button>
      <input id="search" placeholder="Поиск…" style="padding:6px 10px;border-radius:8px;border:1px solid #e5e2df">
    </div>
    <table class="admin-table">
      <thead><tr><th></th><th>Название</th><th>Категория</th><th>Цена</th><th>Вес</th><th>Фото (URL)</th><th>Метка</th><th>Вид</th><th></th></tr></thead>
      <tbody id="prods"></tbody>
    </table>
  </div>
</div>
<script src="../assets/admin/admin.js"></script>
</body>
</html>
`);

console.log(`Сайт+админка для GitHub Pages: ${outDir}`);
console.log(`категорий: ${menu.categories.length}, блюд: ${menu.products.length}`);
