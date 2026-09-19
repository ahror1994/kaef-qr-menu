
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
