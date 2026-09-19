
const OWNER = "ahror1994", REPO = "kaef-qr-menu", BRANCH = "gh-pages";
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
  $("#f-socials").value = (menu.site.socials || []).map((s) => s.label + " | " + s.url).join("\n");
}
function collectSite() {
  menu.site.title = $("#f-title").value; menu.site.copyright = $("#f-copy").value; menu.site.year = $("#f-year").value;
  menu.site.logo = $("#f-logo").value;
  menu.site.socials = $("#f-socials").value.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
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
