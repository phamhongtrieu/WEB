const ADMIN_EMAIL = "admin@cothom.vn";
const ADMIN_PASS = "Admin@123";
const ADMIN_NAME = "An Nhiên";

const ORDER_STATUSES = ["Mới đặt", "Đã xử lý", "Đã giao", "Đã hủy"];
// Delivered and cancelled are final; stock leaves the warehouse when an order becomes "Đã giao".
const NEXT_STATUSES = { "Mới đặt": ["Đã xử lý", "Đã hủy"], "Đã xử lý": ["Đã giao", "Đã hủy"], "Đã giao": [], "Đã hủy": [] };
const DEFAULT_PROFIT = 30;
const DEFAULT_MIN_STOCK = 10;

function statusClass(s) {
  if (s === "Đã giao") return "st-done";
  if (s === "Đã xử lý") return "st-ship";
  if (s === "Đã hủy") return "st-cancel";
  return "st-wait";
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => "&#" + c.charCodeAt(0) + ";");
}

function readJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    if (v) return JSON.parse(v);
  } catch (e) {}
  return fallback;
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function fmtDate(iso, withTime) {
  const d = new Date(iso);
  return withTime ? d.toLocaleString("vi-VN") : d.toLocaleDateString("vi-VN");
}

// Text inputs instead of <input type=date>, whose display format follows the browser locale (often mm/dd/yyyy).
// "dd/mm/yyyy" or "dd/mm/yyyy hh:mm" → local Date; a date alone means start (or end) of that day. null = not a real date.
function parseDMY(s, endOfDay) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/.exec(s.trim());
  if (!m) return null;
  const date = new Date(+m[3], m[2] - 1, +m[1]);
  if (date.getDate() !== +m[1] || date.getMonth() !== m[2] - 1) return null;
  if (m[4] !== undefined) {
    if (+m[4] > 23 || +m[5] > 59) return null;
    date.setHours(+m[4], +m[5], 59, 999);
  } else if (endOfDay) date.setHours(23, 59, 59, 999);
  return date;
}

function fmtDMY(d) {
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Read-only dd/mm/yyyy box that opens the browser's own calendar (a hidden native input) on click.
function dateField(id, label, date, withTime) {
  const iso = date ? date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0") : "";
  return `<div class="field"><label>${label}</label>
    <div class="date-pick">
      <input id="${id}" readonly placeholder="${withTime ? "dd/mm/yyyy hh:mm" : "dd/mm/yyyy"}" value="${date ? fmtDMY(date) : ""}"
        onclick="this.nextElementSibling.showPicker()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.nextElementSibling.showPicker()}">
      <input type="${withTime ? "datetime-local" : "date"}" value="${iso}" tabindex="-1" aria-hidden="true" oninput="pickDate(this)">
    </div>
  </div>`;
}

// Runs before the filter container's oninput, so the re-render already sees the new text.
function pickDate(native) {
  const [d, t] = native.value.split("T");
  native.previousElementSibling.value = d ? d.split("-").reverse().join("/") + (t ? " " + t.slice(0, 5) : "") : "";
}

// undefined = empty, null = invalid (input turns red), otherwise the Date.
function readDate(id, endOfDay) {
  const el = document.getElementById(id);
  const date = el.value.trim() ? parseDMY(el.value, endOfDay) : undefined;
  el.style.borderColor = date === null ? "#b23b3b" : "";
  return date;
}

const DATE_HINT = `<p class="muted">Ngày không hợp lệ — nhập theo dạng dd/mm/yyyy.</p>`;

/* ---------- Orders ---------- */

// [id, customer, phone, address, placed at (local), status, [[productId, qty], ...]]
const DEMO_ORDERS = [
  ["CT-1040", "Nguyễn Minh Anh", "0901 234 567", "24 Nguyễn Huệ, Q.1, TP.HCM", "2026-08-04T09:20", "Đã giao", [["1", 2], ["3", 1]]],
  ["CT-1041", "Trần Ngọc Mai", "0988 456 123", "18 Lê Lợi, Hải Châu, Đà Nẵng", "2026-08-19T14:05", "Đã giao", [["2", 1], ["5", 2]]],
  ["CT-1042", "Lê Thanh Hà", "0912 888 302", "57 Tràng Thi, Hoàn Kiếm, Hà Nội", "2026-09-02T10:40", "Đã hủy", [["12", 1]]],
  ["CT-1043", "Phạm Gia Hân", "0935 777 810", "102 Hai Bà Trưng, Cần Thơ", "2026-09-15T16:30", "Đã giao", [["8", 1], ["9", 2]]],
  ["CT-1044", "Vũ Khánh Linh", "0977 120 456", "9 Trần Phú, Nha Trang", "2026-09-28T11:10", "Đã giao", [["12", 1], ["6", 1]]],
  ["CT-1045", "Nguyễn Minh Anh", "0901 234 567", "24 Nguyễn Huệ, Q.1, TP.HCM", "2026-10-06T08:55", "Đã giao", [["2", 2], ["4", 1]]],
  ["CT-1046", "Lê Thanh Hà", "0912 888 302", "57 Tràng Thi, Hoàn Kiếm, Hà Nội", "2026-10-12T19:15", "Đã xử lý", [["13", 1]]],
  ["CT-1047", "Trần Ngọc Mai", "0988 456 123", "18 Lê Lợi, Hải Châu, Đà Nẵng", "2026-10-16T13:00", "Đã xử lý", [["10", 1], ["11", 1]]],
  ["CT-1048", "Phạm Gia Hân", "0935 777 810", "102 Hai Bà Trưng, Cần Thơ", "2026-10-18T20:45", "Mới đặt", [["1", 1], ["7", 1]]],
];

// Seeds demo orders (kept apart from customer orders so shoppers don't see them) and a stock log matching current stock.
function seedAdminData() {
  if (localStorage.getItem(KEYS.demoOrders)) return;
  const products = loadProducts();
  const byId = (id) => products.find((p) => String(p.id) === id);
  const orders = DEMO_ORDERS.map(([id, name, phone, address, at, status, lines]) => {
    const items = lines.filter(([pid]) => byId(pid)).map(([pid, quantity]) => ({ productId: pid, quantity, name: byId(pid).name, price: byId(pid).price }));
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = subtotal >= FREE_SHIP_MIN ? 0 : SHIP_FEE;
    const createdAt = new Date(at).toISOString();
    const updatedAt = status === "Mới đặt" ? createdAt : new Date(new Date(at).getTime() + 86400000).toISOString();
    return { id, name, phone, address, payment: "COD", items, subtotal, shipping, total: subtotal + shipping, status, createdAt, updatedAt };
  });

  const log = [];
  products.forEach((p) => {
    const pid = String(p.id);
    const delivered = orders.filter((o) => o.status === "Đã giao").flatMap((o) => o.items.filter((i) => i.productId === pid).map((i) => ({ o, i })));
    const exported = delivered.reduce((s, x) => s + x.i.quantity, 0);
    const second = Math.floor(p.stock / 2);
    const first = p.stock + exported - second; // >= exported, so the running balance never goes negative
    if (first) log.push({ productId: pid, qty: first, refType: "Phiếu nhập", refId: "PN-001", at: new Date("2026-07-01T08:00").toISOString() });
    if (second) log.push({ productId: pid, qty: second, refType: "Phiếu nhập", refId: "PN-002", at: new Date("2026-09-01T08:00").toISOString() });
    delivered.forEach(({ o, i }) => log.push({ productId: pid, qty: -i.quantity, refType: "Đơn hàng", refId: o.id, at: o.updatedAt }));
  });
  log.sort((a, b) => a.at.localeCompare(b.at));
  const balance = {};
  log.forEach((e) => {
    balance[e.productId] = (balance[e.productId] || 0) + e.qty;
    e.type = e.qty > 0 ? "Nhập" : "Xuất";
    e.after = balance[e.productId];
  });

  writeJSON(KEYS.stockLog, log);
  writeJSON(KEYS.demoOrders, orders);
}

function parseVNDate(s) {
  const [d, m, y] = String(s).split("/").map(Number);
  return new Date(y, m - 1, d).toISOString();
}

// Older storefront orders only have "dd/mm/yyyy" and the old "Đang xử lý" status.
function normalizeOrder(o) {
  const createdAt = o.createdAt || parseVNDate(o.date);
  return { ...o, createdAt, updatedAt: o.updatedAt || createdAt, status: ORDER_STATUSES.includes(o.status) ? o.status : "Mới đặt" };
}

function adminOrders() {
  seedAdminData();
  return [...getOrders(), ...readJSON(KEYS.demoOrders, [])].map(normalizeOrder).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function findOrder(id) {
  return adminOrders().find((o) => o.id === id);
}

function patchOrder(id, patch) {
  for (const key of [KEYS.orders, KEYS.demoOrders]) {
    const list = readJSON(key, []);
    const i = list.findIndex((o) => o.id === id);
    if (i >= 0) {
      list[i] = { ...normalizeOrder(list[i]), ...patch };
      writeJSON(key, list);
      return;
    }
  }
}

// Returns an error message, or "" on success.
function updateOrderStatus(id, status) {
  const order = findOrder(id);
  if (!order || !NEXT_STATUSES[order.status].includes(status)) return "Không thể chuyển sang trạng thái này";
  const now = new Date().toISOString();
  if (status === "Đã giao") {
    const products = loadProducts();
    const lines = order.items.map((i) => ({ i, p: products.find((p) => String(p.id) === String(i.productId)) }));
    const short = lines.find(({ i, p }) => !p || p.stock < i.quantity);
    if (short) return "Không đủ tồn kho cho " + short.i.name;
    const log = stockLog();
    lines.forEach(({ i, p }) => {
      p.stock -= i.quantity;
      log.push({ productId: String(p.id), type: "Xuất", qty: -i.quantity, after: p.stock, refType: "Đơn hàng", refId: order.id, at: now });
    });
    saveProducts(products);
    writeJSON(KEYS.stockLog, log);
  }
  patchOrder(id, { status, updatedAt: now });
  return "";
}

/* ---------- Stock ---------- */

function stockLog() {
  seedAdminData();
  return readJSON(KEYS.stockLog, []);
}

function minStock(p) {
  return p.minStock ?? DEFAULT_MIN_STOCK;
}

// Stock at a moment = current stock minus every change logged after it.
function stockAt(p, time, log) {
  return log.filter((e) => e.productId === String(p.id) && new Date(e.at) > time).reduce((s, e) => s - e.qty, p.stock);
}

/* ---------- Pricing ---------- */

function categoryProfits() {
  return readJSON(KEYS.pricing, {});
}

function profitOf(p, cats) {
  return p.profitPct ?? cats[p.category] ?? DEFAULT_PROFIT;
}

// Completed imports set the real cost; seed products without one get it back-computed from their price.
function costOf(p) {
  return p.cost ?? Math.round(p.price / (1 + DEFAULT_PROFIT / 100) / 1000) * 1000;
}

function salePrice(cost, pct) {
  return Math.round((cost * (1 + pct / 100)) / 1000) * 1000;
}

/* ---------- Import receipts (phiếu nhập) ---------- */

const IMPORT_DRAFT = "Chưa hoàn thành";
const IMPORT_DONE = "Đã hoàn thành";

// First run: turn the seeded stock-log imports into completed receipts, plus one draft to try editing.
function getImports() {
  const saved = readJSON(KEYS.imports, null);
  if (saved) return saved;
  const products = loadProducts();
  const costById = (id) => {
    const p = products.find((x) => String(x.id) === id);
    return p ? costOf(p) : 0;
  };
  const byId = {};
  const seeded = stockLog().filter((e) => e.refType === "Phiếu nhập");
  seeded.forEach((e) => {
    byId[e.refId] = byId[e.refId] || { id: e.refId, date: e.at, status: IMPORT_DONE, completedAt: e.at, items: [] };
    byId[e.refId].items.push({ productId: e.productId, qty: e.qty, cost: costById(e.productId) });
  });
  const list = Object.values(byId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  list.push({
    id: nextImportId(list),
    date: today.toISOString(),
    status: IMPORT_DRAFT,
    completedAt: null,
    // Only products from the seeded log, so a product the admin just created isn't pulled into the sample draft.
    items: [...new Set(seeded.map((e) => e.productId))].slice(0, 2).map((id) => ({ productId: id, qty: 10, cost: costById(id) })),
  });
  writeJSON(KEYS.imports, list);
  return list;
}

function nextImportId(list) {
  return "PN-" + String(list.reduce((m, r) => Math.max(m, parseInt(r.id.slice(3)) || 0), 0) + 1).padStart(3, "0");
}

function importTotal(r) {
  return r.items.reduce((s, i) => s + i.qty * i.cost, 0);
}

// Returns an error message, or "" when the receipt is valid.
function validateImport(r) {
  if (!r.date || new Date(r.date) > new Date()) return "Ngày nhập không được ở tương lai";
  if (!r.items.length) return "Phiếu nhập phải có ít nhất một sản phẩm";
  const seen = new Set();
  for (const i of r.items) {
    const p = getProductById(i.productId);
    if (!p) return "Có dòng chưa chọn sản phẩm hợp lệ";
    if (seen.has(String(i.productId))) return p.name + " bị trùng dòng";
    seen.add(String(i.productId));
    if (!Number.isInteger(i.qty) || i.qty < 1) return "Số lượng của " + p.name + " phải là số nguyên ≥ 1";
    if (!(i.cost > 0)) return "Giá nhập của " + p.name + " phải lớn hơn 0";
  }
  return "";
}

function saveImport(r) {
  const list = getImports();
  const i = list.findIndex((x) => x.id === r.id);
  if (i >= 0 && list[i].status === IMPORT_DONE) return "Phiếu đã hoàn thành, không thể sửa";
  if (i >= 0) list[i] = r;
  else list.unshift(r);
  writeJSON(KEYS.imports, list);
  return "";
}

// Completing adds stock, logs the import, and updates cost (weighted average) and selling price.
function completeImport(r) {
  const err = validateImport(r) || saveImport(r);
  if (err) return err;
  const products = loadProducts();
  const cats = categoryProfits();
  const log = stockLog();
  const day = new Date(r.date);
  const now = new Date();
  const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();
  r.items.forEach((i) => {
    const p = products.find((x) => String(x.id) === String(i.productId));
    const before = Math.max(p.stock, 0);
    p.cost = Math.round((before * costOf(p) + i.qty * i.cost) / (before + i.qty));
    p.stock += i.qty;
    p.price = salePrice(p.cost, profitOf(p, cats));
    log.push({ productId: String(p.id), type: "Nhập", qty: i.qty, after: p.stock, refType: "Phiếu nhập", refId: r.id, at });
  });
  saveProducts(products);
  writeJSON(KEYS.stockLog, log);
  const list = getImports();
  list[list.findIndex((x) => x.id === r.id)] = { ...r, status: IMPORT_DONE, completedAt: now.toISOString() };
  writeJSON(KEYS.imports, list);
  return "";
}

/* ---------- Admin UI ---------- */

const ADMIN_NAV = [
  ["overview", "Tổng quan"],
  ["customers", "Khách hàng"],
  ["products", "Sản phẩm"],
  ["imports", "Phiếu nhập"],
  ["pricing", "Giá bán"],
  ["orders", "Đơn hàng"],
  ["inventory", "Tồn kho"],
];
const VIEW_TITLES = {
  overview: "Tổng quan",
  customers: "Khách hàng",
  products: "Sản phẩm",
  imports: "Phiếu nhập",
  import: "Chi tiết phiếu nhập",
  pricing: "Giá bán",
  orders: "Đơn hàng",
  order: "Chi tiết đơn hàng",
  inventory: "Tồn kho",
};
// Detail views highlight their list in the sidebar.
const NAV_PARENT = { order: "orders", import: "imports" };

let view = VIEW_TITLES[params().get("view")] ? params().get("view") : "overview";
let detailId = params().get("id");
let query = "";
let editing = null;

function greeting() {
  const h = new Date().getHours();
  return "Chào buổi " + (h < 11 ? "sáng" : h < 13 ? "trưa" : h < 18 ? "chiều" : "tối") + ", " + ADMIN_NAME;
}

function isAdmin() {
  return sessionStorage.getItem(KEYS.admin) === "yes";
}

function renderAdmin() {
  const root = document.getElementById("admin-root");
  if (!isAdmin()) {
    root.innerHTML = `<div class="admin-login">
      <div class="modal">
        <p class="kicker">Cỏ Thơm</p>
        <h2 class="font-display">Đăng nhập quản trị</h2>
        <p class="muted" style="margin-bottom:12px">admin@cothom.vn / Admin@123</p>
        <form onsubmit="adminLogin(event)">
          <div class="field"><label>Email</label><input name="email" type="email" required></div>
          <div class="field"><label>Mật khẩu</label><input name="password" type="password" required></div>
          <button class="btn btn-rose" style="width:100%" type="submit">Đăng nhập</button>
        </form>
        <button class="btn-ghost" style="margin-top:10px" onclick="location.href='index.html'">← Về cửa hàng</button>
      </div>
    </div>`;
    return;
  }

  const activeNav = NAV_PARENT[view] || view;
  root.innerHTML = `
    <div class="admin-shell">
      <aside class="admin-aside desk" id="admin-aside">
        <button class="admin-brand" onclick="location.href='index.html'">
          <span class="font-display" style="font-size:20px;letter-spacing:.16em">CỎ THƠM</span>
          <small>Quản trị cửa hàng</small>
        </button>
        <nav class="admin-nav">
          <p>Không gian làm việc</p>
          ${ADMIN_NAV.map(([key, label]) => `<button class="${activeNav === key ? "active" : ""}" onclick="setView('${key}')">${label}</button>`).join("")}
        </nav>
        <div class="admin-user">
          <p style="font-size:13px;margin-bottom:8px">${ADMIN_NAME} · Quản trị viên</p>
          <button class="btn-ghost" style="color:#ccc" onclick="adminLogout()">Đăng xuất</button>
        </div>
      </aside>
      <div class="admin-main">
        <div class="admin-top">
          <div>
            <p class="kicker">Cỏ Thơm Admin</p>
            <h1>${view === "overview" ? greeting() : VIEW_TITLES[view]}</h1>
          </div>
          ${["overview", "products", "customers"].includes(view) ? `<input placeholder="Tìm kiếm nhanh..." value="${query}" oninput="query=this.value; renderAdmin()" style="margin-left:auto;max-width:280px;width:100%;border:1px solid var(--border);border-radius:12px;padding:10px 12px">` : ""}
          ${view === "products" ? `<button class="btn btn-dark" onclick="openProductForm(null)">+ Thêm sản phẩm</button>` : ""}
          ${view === "imports" ? `<button class="btn btn-dark" style="margin-left:auto" onclick="setView('import')">+ Tạo phiếu nhập</button>` : ""}
        </div>
        <div id="admin-view">${viewHtml()}</div>
      </div>
    </div>
    <div id="product-modal" class="overlay ${editing === null ? "hidden" : ""}" onclick="if(event.target===this){editing=null;renderAdmin()}">
      ${editing !== null ? productFormHtml() : ""}
    </div>`;

  // Views with filters render their tables separately so typing in a filter keeps focus.
  if (view === "orders") renderOrderList();
  if (view === "order") renderOrderDetail();
  if (view === "imports") renderImportList();
  if (view === "import") renderImportForm();
  if (view === "pricing") renderPricing();
  if (view === "inventory") renderInventory();
}

function setView(v, id) {
  view = v;
  detailId = id || null;
  query = "";
  editing = null;
  importDraft = null;
  renderAdmin();
  window.scrollTo(0, 0);
}

function adminLogin(e) {
  e.preventDefault();
  const f = new FormData(e.target);
  if (f.get("email").toLowerCase() !== ADMIN_EMAIL || f.get("password") !== ADMIN_PASS) {
    toast("Sai tài khoản quản trị");
    return;
  }
  sessionStorage.setItem(KEYS.admin, "yes");
  renderAdmin();
}

function adminLogout() {
  sessionStorage.removeItem(KEYS.admin);
  renderAdmin();
}

function viewHtml() {
  if (view === "overview") return overviewHtml();
  if (view === "orders") return ordersHtml();
  if (view === "order") return `<button class="btn-ghost" style="margin-bottom:16px" onclick="setView('orders')">← Danh sách đơn hàng</button><div id="order-detail"></div>`;
  if (view === "products") return productsHtml();
  if (view === "imports") return importsHtml();
  if (view === "import") return `<button class="btn-ghost" style="margin-bottom:16px" onclick="setView('imports')">← Danh sách phiếu nhập</button><div id="import-form"></div>`;
  if (view === "pricing") return pricingHtml();
  if (view === "inventory") return inventoryHtml();
  return customersHtml();
}

function overviewHtml() {
  const orders = adminOrders();
  const allOrders = orders.map((o) => ({ id: o.id, customer: esc(o.name), product: (o.items[0] && o.items[0].name) || "Đơn mới", date: fmtDate(o.createdAt), total: o.total, status: o.status }));
  const products = loadProducts();
  // "Đã bán" counts delivered orders only, matching the stock leaving the warehouse.
  const sold = {};
  orders.filter((o) => o.status === "Đã giao").forEach((o) => o.items.forEach((i) => (sold[i.productId] = (sold[i.productId] || 0) + i.quantity)));
  const bestSellers = products.filter((p) => sold[p.id]).sort((a, b) => sold[b.id] - sold[a.id]).slice(0, 4);

  // Revenue = every order that wasn't cancelled, counted on the day it was placed.
  const now = new Date();
  const paid = orders.filter((o) => o.status !== "Đã hủy");
  const revenueBetween = (from, to) => paid.filter((o) => new Date(o.createdAt) >= from && new Date(o.createdAt) < to).reduce((s, o) => s + o.total, 0);
  const dayStartOf = (offset) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonth = revenueBetween(monthStart, dayStartOf(1));
  const lastMonth = revenueBetween(new Date(now.getFullYear(), now.getMonth() - 1, 1), monthStart);
  const change = lastMonth
    ? `${thisMonth >= lastMonth ? "+" : ""}${((thisMonth - lastMonth) / lastMonth * 100).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}% so với tháng trước`
    : "Tháng trước chưa có doanh thu";
  const ordersToday = orders.filter((o) => new Date(o.createdAt) >= dayStartOf(0)).length;
  const customers = getCustomers();
  const newCustomers = customers.filter((c) => new Date(c.createdAt) >= monthStart).length;
  const days = Array.from({ length: 7 }, (_, i) => ({ label: fmtDMY(dayStartOf(i - 6)).slice(0, 5), total: revenueBetween(dayStartOf(i - 6), dayStartOf(i - 5)) }));
  const maxDay = Math.max(1, ...days.map((d) => d.total));

  return `
    <div class="stats">
      <article class="stat"><p class="muted">Doanh thu tháng này</p><h3>${money(thisMonth)}</h3><small class="muted">${change}</small></article>
      <article class="stat"><p class="muted">Đơn hàng</p><h3>${orders.length}</h3><small class="muted">${ordersToday} đơn hôm nay</small></article>
      <article class="stat"><p class="muted">Khách hàng</p><h3>${customers.length}</h3><small class="muted">${newCustomers} khách mới tháng này</small></article>
      <article class="stat"><p class="muted">Sắp hết hàng</p><h3>${products.filter((p) => p.stock <= minStock(p)).length}</h3><small class="muted">tồn ≤ mức cảnh báo</small></article>
    </div>
    <div class="two-col" style="margin-top:18px">
      <article class="stat">
        <h2 class="font-display">Tổng quan doanh thu</h2>
        <p class="muted" style="margin-bottom:12px">7 ngày gần nhất · tổng ${money(days.reduce((s, d) => s + d.total, 0))} · không tính đơn hủy</p>
        <div class="bars">${days.map((d) => `<div class="bar-col" title="${d.label}: ${money(d.total)}">
          <small>${d.total ? (d.total / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + "tr" : ""}</small>
          <div class="bar-track"><div class="bar" style="height:${(d.total / maxDay) * 100}%"></div></div>
          <small class="muted">${d.label}</small>
        </div>`).join("")}</div>
      </article>
      <article class="stat">
        <h2 class="font-display">Bán chạy nhất</h2>
        ${bestSellers.map((p) => `<div class="cart-item" style="grid-template-columns:48px 1fr auto;padding:8px 0;border:none">
          <img src="${esc((p.images && p.images[0]) || "")}" style="width:48px;height:48px;border-radius:10px">
          <div><b>${esc(p.name)}</b><div class="muted">${sold[p.id]} đã bán</div></div>
          <div>${money(p.price)}</div>
        </div>`).join("") || `<p class="muted" style="margin-top:12px">Chưa có đơn hàng đã giao.</p>`}
      </article>
    </div>
    <div style="margin-top:18px">${orderTable(allOrders.slice(0, 5))}</div>`;
}

function orderTable(list) {
  return `<div class="table-wrap"><table>
    <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Sản phẩm</th><th>Ngày</th><th>Tổng</th><th>Trạng thái</th></tr></thead>
    <tbody>${list.map((o) => `<tr>
      <td style="white-space:nowrap"><button class="btn-ghost" onclick="setView('order', '${o.id}')"><b>${o.id}</b></button></td><td>${o.customer}</td><td>${o.product}</td><td>${o.date}</td>
      <td>${money(o.total)}</td><td><span class="status ${statusClass(o.status)}">${o.status}</span></td>
    </tr>`).join("")}</tbody>
  </table></div>`;
}

/* ----- Đơn hàng ----- */

function ordersHtml() {
  return `<div class="admin-filters" oninput="renderOrderList()">
      ${dateField("f-from", "Từ ngày")}
      ${dateField("f-to", "Đến ngày")}
      <div class="field"><label>Trạng thái</label>
        <select id="f-status"><option value="">Tất cả</option>${ORDER_STATUSES.map((s) => `<option>${s}</option>`).join("")}</select>
      </div>
      <div class="field"><label>Tìm kiếm</label><input id="f-q" placeholder="Mã đơn, tên, SĐT"></div>
      <button class="btn-outline" onclick="setView('orders')">Xóa lọc</button>
    </div>
    <div id="order-list"></div>`;
}

function renderOrderList() {
  const from = readDate("f-from");
  const to = readDate("f-to", true);
  const status = document.getElementById("f-status").value;
  const q = document.getElementById("f-q").value.trim().toLowerCase();
  if (from === null || to === null) {
    document.getElementById("order-list").innerHTML = DATE_HINT;
    return;
  }
  const list = adminOrders().filter((o) => {
    const at = new Date(o.createdAt);
    return (!from || at >= from) && (!to || at <= to) && (!status || o.status === status) &&
      (o.id + " " + o.name + " " + o.phone).toLowerCase().includes(q);
  });
  document.getElementById("order-list").innerHTML = `
    <p class="muted" style="margin-bottom:10px">${list.length} đơn hàng · Tổng ${money(list.reduce((s, o) => s + o.total, 0))}</p>
    <div class="table-wrap"><table>
      <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Ngày đặt</th><th>Số SP</th><th>Tổng tiền</th><th>Trạng thái</th><th></th></tr></thead>
      <tbody>${list.length ? list.map((o) => `<tr>
        <td style="white-space:nowrap"><b>${o.id}</b></td>
        <td>${esc(o.name)}<div class="muted">${esc(o.phone)}</div></td>
        <td>${fmtDate(o.createdAt, true)}</td>
        <td>${o.items.reduce((s, i) => s + i.quantity, 0)}</td>
        <td>${money(o.total)}</td>
        <td><span class="status ${statusClass(o.status)}">${o.status}</span></td>
        <td><button class="btn-ghost" onclick="setView('order', '${o.id}')">Xem chi tiết →</button></td>
      </tr>`).join("") : `<tr><td colspan="7" class="muted">Không có đơn hàng phù hợp.</td></tr>`}</tbody>
    </table></div>`;
}

function renderOrderDetail() {
  const o = findOrder(detailId);
  const el = document.getElementById("order-detail");
  if (!o) {
    el.innerHTML = `<p class="muted">Không tìm thấy đơn hàng “${esc(detailId)}”.</p>`;
    return;
  }
  const next = NEXT_STATUSES[o.status];
  el.innerHTML = `
    <div class="two-col">
      <article class="stat">
        <p class="kicker">Đơn ${o.id}</p>
        <p><span class="status ${statusClass(o.status)}">${o.status}</span></p>
        <div class="line"><span class="muted">Khách hàng</span><span>${esc(o.name)}</span></div>
        <div class="line"><span class="muted">Số điện thoại</span><span>${esc(o.phone)}</span></div>
        <div class="line"><span class="muted">Địa chỉ giao</span><span>${esc(o.address)}</span></div>
        <div class="line"><span class="muted">Thanh toán</span><span>${o.payment === "Bank" ? "Chuyển khoản" : "Khi nhận hàng"}</span></div>
        <div class="line"><span class="muted">Ngày đặt</span><span>${fmtDate(o.createdAt, true)}</span></div>
        <div class="line"><span class="muted">Cập nhật lần cuối</span><span>${fmtDate(o.updatedAt, true)}</span></div>
      </article>
      <article class="stat">
        <h2 class="font-display" style="font-size:22px">Cập nhật tình trạng</h2>
        ${next.length ? `
          <div class="field"><label>Chuyển sang</label>
            <select id="next-status">${next.map((s) => `<option>${s}</option>`).join("")}</select>
          </div>
          <button class="btn btn-rose" onclick="applyStatus()">Cập nhật</button>
          <p class="muted" style="margin-top:10px;font-size:12px">Hàng được trừ khỏi kho khi đơn chuyển sang “Đã giao”.</p>`
        : `<p class="muted" style="margin-top:8px">Đơn đã ${o.status === "Đã giao" ? "giao" : "hủy"} — không thể đổi trạng thái.</p>`}
      </article>
    </div>
    <div class="table-wrap" style="margin-top:18px"><table>
      <thead><tr><th>Sản phẩm</th><th>Số lượng</th><th>Giá bán lúc đặt</th><th>Thành tiền</th></tr></thead>
      <tbody>${o.items.map((i) => `<tr>
        <td><b>${esc(i.name)}</b></td><td>${i.quantity}</td><td>${money(i.price)}</td><td>${money(i.price * i.quantity)}</td>
      </tr>`).join("")}</tbody>
    </table></div>
    <article class="stat" style="margin-top:18px;max-width:380px;margin-left:auto">
      <div class="line"><span>Tạm tính</span><span>${money(o.subtotal)}</span></div>
      <div class="line"><span>Vận chuyển</span><span>${o.shipping ? money(o.shipping) : "Miễn phí"}</span></div>
      <div class="line total"><span>Tổng</span><span>${money(o.total)}</span></div>
    </article>`;
}

function applyStatus() {
  const status = document.getElementById("next-status").value;
  if (!confirm("Chuyển đơn " + detailId + " sang “" + status + "”?")) return;
  const err = updateOrderStatus(detailId, status);
  toast(err || "Đã cập nhật trạng thái");
  renderOrderDetail();
}

/* ----- Sản phẩm ----- */

function productsHtml() {
  const list = loadProducts().filter((p) => (p.name + p.brand + p.sku).toLowerCase().includes(query.toLowerCase()));
  return `<div class="table-wrap"><table>
    <thead><tr><th>Hình</th><th>Sản phẩm</th><th>Mã</th><th>Loại</th><th>Giá bán</th><th>Tồn</th><th>Hiển thị</th><th></th></tr></thead>
    <tbody>${list.map((p) => `<tr>
      <td><img src="${esc((p.images && p.images[0]) || "")}" alt="" style="width:44px;height:44px;object-fit:cover;border-radius:8px;background:var(--beige)"></td>
      <td><b>${esc(p.name)}</b><div class="muted">${esc(p.brand)}</div></td>
      <td>${esc(p.sku)}</td><td>${CATEGORY_LABELS[p.category] || esc(p.category)}</td>
      <td>${money(p.price)}</td><td>${p.stock}</td>
      <td>${p.hidden ? `<span class="status st-cancel">Đang ẩn</span>` : `<span class="status st-done">Đang hiện</span>`}</td>
      <td style="white-space:nowrap">
        <button class="btn-ghost" onclick="openProductForm('${p.id}')">Sửa</button>
        <button class="btn-ghost" onclick="setHidden('${p.id}', ${!p.hidden})">${p.hidden ? "Hiện" : "Ẩn"}</button>
        <button class="btn-ghost" onclick="deleteProduct('${p.id}')">Xóa</button>
      </td>
    </tr>`).join("")}</tbody>
  </table></div>`;
}

function openProductForm(id) {
  editing = id ? getProductById(id) : "new";
  renderAdmin();
}

function productFormHtml() {
  const isNew = editing === "new";
  const p = isNew ? { category: CATEGORIES[0], sku: "", name: "", brand: "", images: [], description: "", minStock: DEFAULT_MIN_STOCK, hidden: true } : editing;
  const img = (p.images && p.images[0]) || "";
  return `<div class="modal">
    <h2 class="font-display">${isNew ? "Thêm sản phẩm" : "Sửa sản phẩm"}</h2>
    <form onsubmit="saveProduct(event)">
      <div class="field"><label>Loại sản phẩm</label>
        <select name="category">${CATEGORIES.map((c) => `<option ${p.category === c ? "selected" : ""} value="${c}">${CATEGORY_LABELS[c]}</option>`).join("")}</select>
      </div>
      <div class="field"><label>Mã sản phẩm</label><input name="sku" value="${esc(p.sku)}" required></div>
      <div class="field"><label>Tên sản phẩm</label><input name="name" value="${esc(p.name)}" required></div>
      <div class="field"><label>Thương hiệu</label><input name="brand" value="${esc(p.brand)}"></div>
      <div class="field"><label>Hình ảnh</label>
        <input name="image" id="p-image" value="${esc(img)}" placeholder="Dán link ảnh hoặc chọn file bên dưới" required oninput="document.getElementById('p-preview').src=this.value">
        <input type="file" accept="image/*" onchange="pickProductImage(this)" style="margin-top:8px;border:none;padding:0">
        <img id="p-preview" src="${esc(img)}" alt="" style="margin-top:8px;width:96px;height:96px;object-fit:cover;border-radius:12px;background:var(--beige)">
      </div>
      <div class="field"><label>Mô tả</label><textarea name="description" rows="3">${esc(p.description)}</textarea></div>
      <div class="field"><label>Mức cảnh báo tồn</label><input name="minStock" type="number" min="0" step="1" value="${minStock(p)}" required></div>
      <label style="display:flex;gap:8px;align-items:center;margin:12px 0"><input type="checkbox" name="visible" ${p.hidden ? "" : "checked"}> Hiển thị trên cửa hàng</label>
      <p class="muted" style="font-size:12px;margin-bottom:12px">${isNew
        ? "Sản phẩm mới có tồn kho 0 và giá 0 — hãy nhập hàng ở Phiếu nhập rồi mới bật hiển thị."
        : `Giá bán ${money(p.price)} · Tồn ${p.stock} — cập nhật qua Phiếu nhập và Giá bán.`}</p>
      <div class="actions">
        <button class="btn btn-rose" type="submit">Lưu</button>
        <button class="btn-outline" type="button" onclick="editing=null;renderAdmin()">Hủy</button>
      </div>
    </form>
  </div>`;
}

function pickProductImage(input) {
  const file = input.files[0];
  if (!file) return;
  // Images are stored inside localStorage (about 5MB in total), so keep them small.
  if (file.size > 300 * 1024) {
    toast("Ảnh tối đa 300KB");
    input.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById("p-image").value = reader.result;
    document.getElementById("p-preview").src = reader.result;
  };
  reader.readAsDataURL(file);
}

function saveProduct(e) {
  e.preventDefault();
  const f = new FormData(e.target);
  const list = loadProducts();
  const isNew = editing === "new";
  const sku = f.get("sku").trim();
  if (list.some((p) => (isNew || String(p.id) !== String(editing.id)) && p.sku.toLowerCase() === sku.toLowerCase())) {
    toast("Mã sản phẩm đã tồn tại");
    return;
  }
  const image = f.get("image").trim();
  const draft = {
    category: f.get("category"),
    sku,
    name: f.get("name").trim(),
    brand: f.get("brand").trim(),
    description: f.get("description").trim(),
    minStock: Number(f.get("minStock")),
    hidden: !f.get("visible"),
  };
  if (isNew) {
    list.unshift({ ...draft, id: "p" + Date.now(), images: [image], price: 0, cost: 0, stock: 0, rating: 0, reviews: 0, ingredients: "", directions: "", tags: [] });
    toast("Đã thêm sản phẩm");
  } else {
    const i = list.findIndex((p) => String(p.id) === String(editing.id));
    if (i >= 0) list[i] = { ...list[i], ...draft, images: [image, ...(list[i].images || []).slice(1)] };
    toast("Đã cập nhật sản phẩm");
  }
  saveProducts(list);
  editing = null;
  renderAdmin();
}

function setHidden(id, hidden) {
  const list = loadProducts();
  const p = list.find((x) => String(x.id) === String(id));
  if (!p) return;
  p.hidden = hidden;
  saveProducts(list);
  toast(hidden ? "Đã ẩn sản phẩm khỏi cửa hàng" : "Sản phẩm đã hiện trên cửa hàng");
  renderAdmin();
}

// Products already imported or ordered can only be hidden, so receipts, orders and stock history stay intact.
function productInUse(id) {
  id = String(id);
  const inItems = (items) => items.some((i) => String(i.productId) === id);
  return stockLog().some((e) => e.productId === id) || getImports().some((r) => inItems(r.items)) || adminOrders().some((o) => inItems(o.items));
}

function deleteProduct(id) {
  const p = getProductById(id);
  if (!p) return;
  if (productInUse(id)) {
    if (p.hidden) toast("Sản phẩm đã có phiếu nhập / đơn hàng nên không thể xóa");
    else if (confirm("“" + p.name + "” đã có phiếu nhập hoặc đơn hàng nên không thể xóa. Ẩn sản phẩm khỏi cửa hàng?")) setHidden(id, true);
    return;
  }
  if (!confirm("Xóa vĩnh viễn “" + p.name + "”?")) return;
  saveProducts(loadProducts().filter((x) => String(x.id) !== String(id)));
  toast("Đã xóa sản phẩm");
  renderAdmin();
}

/* ----- Khách hàng ----- */

function customersHtml() {
  const list = getCustomers().filter((c) => (c.id + c.name + c.email + c.phone).toLowerCase().includes(query.toLowerCase()));
  return `<div class="table-wrap"><table>
    <thead><tr><th>Mã</th><th>Họ tên</th><th>Email / SĐT</th><th>Địa chỉ</th><th>Ngày đăng ký</th><th>Trạng thái</th><th></th></tr></thead>
    <tbody>${list.length ? list.map((c) => `<tr>
      <td>${esc(c.id)}</td><td><b>${esc(c.name)}</b></td><td>${esc(c.email)}<div class="muted">${esc(c.phone) || "—"}</div></td>
      <td>${esc(c.address) || "—"}</td><td>${fmtDate(c.createdAt)}</td>
      <td><span class="status ${c.status === "Bị khóa" ? "st-low" : "st-done"}">${c.status}</span></td>
      <td style="white-space:nowrap">
        <button class="btn-ghost" onclick="resetPassword('${c.id}')">Reset mật khẩu</button>
        <button class="btn-ghost" onclick="toggleLock('${c.id}')">${c.status === "Bị khóa" ? "Mở khóa" : "Khóa"}</button>
      </td>
    </tr>`).join("") : `<tr><td colspan="7" class="muted">Không có khách hàng phù hợp.</td></tr>`}</tbody>
  </table></div>`;
}

function updateCustomer(id, patch) {
  const list = getCustomers();
  const c = list.find((x) => x.id === id);
  if (c) Object.assign(c, patch);
  saveCustomers(list);
}

function resetPassword(id) {
  const c = getCustomers().find((x) => x.id === id);
  if (!c || !confirm("Đặt lại mật khẩu của " + c.email + " về “" + RESET_PASSWORD + "”?")) return;
  updateCustomer(id, { password: RESET_PASSWORD });
  toast("Đã đặt lại mật khẩu của " + c.email + " thành “" + RESET_PASSWORD + "”");
}

function toggleLock(id) {
  const c = getCustomers().find((x) => x.id === id);
  if (!c) return;
  const lock = c.status !== "Bị khóa";
  if (!confirm((lock ? "Khóa" : "Mở khóa") + " tài khoản " + c.email + "?")) return;
  updateCustomer(id, { status: lock ? "Bị khóa" : ACTIVE_STATUS });
  toast(lock ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản");
  renderAdmin();
}

/* ----- Phiếu nhập ----- */

function importsHtml() {
  return `<div class="admin-filters" oninput="renderImportList()">
      ${dateField("f-from", "Từ ngày")}
      ${dateField("f-to", "Đến ngày")}
      <div class="field"><label>Trạng thái</label>
        <select id="f-status"><option value="">Tất cả</option><option>${IMPORT_DRAFT}</option><option>${IMPORT_DONE}</option></select>
      </div>
      <div class="field"><label>Tìm kiếm</label><input id="f-q" placeholder="Mã phiếu hoặc tên sản phẩm"></div>
      <button class="btn-outline" onclick="setView('imports')">Xóa lọc</button>
    </div>
    <div id="import-list"></div>`;
}

function renderImportList() {
  const el = document.getElementById("import-list");
  const from = readDate("f-from");
  const to = readDate("f-to", true);
  if (from === null || to === null) {
    el.innerHTML = DATE_HINT;
    return;
  }
  const status = document.getElementById("f-status").value;
  const q = document.getElementById("f-q").value.trim().toLowerCase();
  const products = loadProducts();
  const nameOf = (id) => (products.find((p) => String(p.id) === String(id)) || {}).name || "";
  const list = getImports()
    .filter((r) => {
      const d = new Date(r.date);
      return (!from || d >= from) && (!to || d <= to) && (!status || r.status === status) &&
        (r.id + " " + r.items.map((i) => nameOf(i.productId)).join(" ")).toLowerCase().includes(q);
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  el.innerHTML = `<p class="muted" style="margin-bottom:10px">${list.length} phiếu nhập · Tổng ${money(list.reduce((s, r) => s + importTotal(r), 0))}</p>
    <div class="table-wrap"><table>
      <thead><tr><th>Mã phiếu</th><th>Ngày nhập</th><th>Số mặt hàng</th><th>Tổng SL</th><th>Tổng tiền</th><th>Trạng thái</th><th>Ngày hoàn thành</th><th></th></tr></thead>
      <tbody>${list.length ? list.map((r) => `<tr>
        <td style="white-space:nowrap"><b>${r.id}</b></td><td>${fmtDate(r.date)}</td><td>${r.items.length}</td>
        <td>${r.items.reduce((s, i) => s + i.qty, 0)}</td><td>${money(importTotal(r))}</td>
        <td><span class="status ${r.status === IMPORT_DONE ? "st-done" : "st-wait"}">${r.status}</span></td>
        <td>${r.completedAt ? fmtDate(r.completedAt, true) : "—"}</td>
        <td><button class="btn-ghost" onclick="setView('import', '${r.id}')">${r.status === IMPORT_DONE ? "Xem →" : "Sửa →"}</button></td>
      </tr>`).join("") : `<tr><td colspan="8" class="muted">Không có phiếu nhập phù hợp.</td></tr>`}</tbody>
    </table></div>`;
}

let importDraft = null;

function makeImportDraft(id) {
  const list = getImports();
  if (id) {
    const found = list.find((r) => r.id === id);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return { id: nextImportId(list), date: today.toISOString(), status: IMPORT_DRAFT, completedAt: null, items: [] };
}

function renderImportForm() {
  if (!importDraft) importDraft = makeImportDraft(detailId);
  const el = document.getElementById("import-form");
  const r = importDraft;
  if (!r) {
    el.innerHTML = `<p class="muted">Không tìm thấy phiếu nhập “${esc(detailId)}”.</p>`;
    return;
  }
  const done = r.status === IMPORT_DONE;
  const products = loadProducts();
  const nameOf = (id) => { const p = products.find((x) => String(x.id) === String(id)); return p ? p.sku + " · " + p.name : "(đã xóa)"; };
  el.innerHTML = `
    <div class="admin-filters">
      <div class="field"><label>Mã phiếu</label><input value="${r.id}" readonly></div>
      ${done ? `<div class="field"><label>Ngày nhập</label><input value="${fmtDate(r.date)}" readonly></div>` : dateField("imp-date", "Ngày nhập", new Date(r.date))}
      <div class="field"><label>Trạng thái</label><p style="padding-top:10px"><span class="status ${done ? "st-done" : "st-wait"}">${r.status}</span></p></div>
      ${done ? `<div class="field"><label>Ngày hoàn thành</label><input value="${fmtDate(r.completedAt, true)}" readonly></div>` : ""}
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Sản phẩm</th><th>Số lượng</th><th>Giá nhập</th><th>Thành tiền</th>${done ? "" : "<th></th>"}</tr></thead>
      <tbody>${r.items.map((i, idx) => done ? `<tr>
          <td><b>${esc(nameOf(i.productId))}</b></td><td>${i.qty}</td><td>${money(i.cost)}</td><td>${money(i.qty * i.cost)}</td>
        </tr>` : `<tr>
          <td><select class="cell-input" style="width:260px" onchange="setImportProduct(${idx}, this.value)">${products.map((p) => `<option value="${p.id}" ${String(p.id) === String(i.productId) ? "selected" : ""}>${esc(p.sku)} · ${esc(p.name)}</option>`).join("")}</select></td>
          <td><input class="cell-input" type="number" min="1" step="1" value="${i.qty}" oninput="setImportLine(${idx}, 'qty', this.value)"></td>
          <td><input class="cell-input" style="width:130px" type="number" min="0" step="1000" value="${i.cost}" oninput="setImportLine(${idx}, 'cost', this.value)"></td>
          <td id="line-total-${idx}">${money(i.qty * i.cost)}</td>
          <td><button class="btn-ghost" onclick="removeImportLine(${idx})">Xóa</button></td>
        </tr>`).join("") || `<tr><td colspan="5" class="muted">Chưa có sản phẩm nào — bấm “+ Thêm sản phẩm”.</td></tr>`}
        <tr><td colspan="3"><b>Tổng cộng</b></td><td colspan="2"><b id="import-total">${money(importTotal(r))}</b></td></tr>
      </tbody>
    </table></div>
    ${done ? "" : `<div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn-outline" onclick="addImportLine()">+ Thêm sản phẩm</button>
      <button class="btn btn-dark" onclick="submitImport(false)">Lưu phiếu</button>
      <button class="btn btn-rose" onclick="submitImport(true)">Hoàn thành phiếu</button>
    </div>
    <p class="muted" style="margin-top:10px;font-size:12px">Chỉ sửa được khi phiếu chưa hoàn thành. Khi hoàn thành: cộng tồn kho, tính lại giá vốn (bình quân) và giá bán.</p>`}`;
}

// Keeps the picked date when the form re-renders after adding / removing a line.
function captureImportDate() {
  const d = document.getElementById("imp-date") && readDate("imp-date");
  if (d) importDraft.date = d.toISOString();
}

function setImportLine(idx, key, value) {
  const line = importDraft.items[idx];
  line[key] = Number(value);
  document.getElementById("line-total-" + idx).textContent = money(line.qty * line.cost);
  document.getElementById("import-total").textContent = money(importTotal(importDraft));
}

function setImportProduct(idx, productId) {
  captureImportDate();
  importDraft.items[idx] = { ...importDraft.items[idx], productId, cost: costOf(getProductById(productId)) };
  renderImportForm();
}

function addImportLine() {
  captureImportDate();
  const used = new Set(importDraft.items.map((i) => String(i.productId)));
  const p = loadProducts().find((x) => !used.has(String(x.id)));
  if (!p) {
    toast("Phiếu đã có đủ tất cả sản phẩm");
    return;
  }
  importDraft.items.push({ productId: String(p.id), qty: 1, cost: costOf(p) });
  renderImportForm();
}

function removeImportLine(idx) {
  captureImportDate();
  importDraft.items.splice(idx, 1);
  renderImportForm();
}

function submitImport(complete) {
  const d = readDate("imp-date");
  if (!d) {
    toast("Hãy chọn ngày nhập");
    return;
  }
  importDraft.date = d.toISOString();
  const invalid = validateImport(importDraft);
  if (invalid) {
    toast(invalid);
    return;
  }
  if (complete && !confirm("Hoàn thành phiếu " + importDraft.id + "? Sau khi hoàn thành sẽ không sửa được nữa.")) return;
  const err = complete ? completeImport(importDraft) : saveImport(importDraft);
  if (err) {
    toast(err);
    return;
  }
  toast(complete ? "Đã hoàn thành phiếu nhập, tồn kho đã cập nhật" : "Đã lưu phiếu nhập");
  setView("imports");
}

/* ----- Giá bán ----- */

function pricingHtml() {
  return `<p class="muted">Giá bán = Giá vốn × (1 + % lợi nhuận), làm tròn đến 1.000₫. Sản phẩm có % riêng sẽ dùng % riêng, còn lại dùng % của loại.</p>
    <div style="margin-top:12px"><button class="btn btn-rose" onclick="savePricing()">Lưu & áp dụng giá mới</button></div>
    <section class="admin-section">
      <h2 class="font-display">% lợi nhuận theo loại</h2>
      <p class="muted">Áp dụng cho các sản phẩm không đặt % riêng.</p>
      <div id="cat-table"></div>
    </section>
    <section class="admin-section">
      <h2 class="font-display">Tra cứu giá vốn, % lợi nhuận, giá bán theo sản phẩm</h2>
      <p class="muted">Nhập % riêng cho từng sản phẩm, để trống để dùng % của loại.</p>
      <div class="admin-filters" oninput="renderPriceTable()">
        <div class="field"><label>Loại</label>
          <select id="f-cat"><option value="">Tất cả</option>${CATEGORIES.map((c) => `<option value="${c}">${CATEGORY_LABELS[c]}</option>`).join("")}</select>
        </div>
        <div class="field"><label>Tìm kiếm</label><input id="f-q" placeholder="Tên hoặc mã sản phẩm"></div>
      </div>
      <div id="price-table"></div>
    </section>`;
}

function renderPricing() {
  renderCategoryTable();
  renderPriceTable();
}

function renderCategoryTable() {
  const cats = categoryProfits();
  const products = loadProducts();
  document.getElementById("cat-table").innerHTML = `<div class="table-wrap"><table style="min-width:520px">
    <thead><tr><th>Loại sản phẩm</th><th>Số sản phẩm</th><th>% lợi nhuận mặc định</th></tr></thead>
    <tbody>${CATEGORIES.map((c) => `<tr>
      <td><b>${CATEGORY_LABELS[c]}</b></td>
      <td>${products.filter((p) => p.category === c).length}</td>
      <td><input class="cell-input" type="number" min="0" step="0.5" data-cat="${c}" value="${cats[c] ?? DEFAULT_PROFIT}"> %</td>
    </tr>`).join("")}</tbody>
  </table></div>`;
}

function renderPriceTable() {
  const cats = categoryProfits();
  const cat = document.getElementById("f-cat").value;
  const q = document.getElementById("f-q").value.trim().toLowerCase();
  const list = loadProducts().filter((p) => (!cat || p.category === cat) && (p.name + " " + p.sku).toLowerCase().includes(q));
  document.getElementById("price-table").innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Mã</th><th>Sản phẩm</th><th>Loại</th><th>Giá vốn</th><th>% lợi nhuận riêng</th><th>% áp dụng</th><th>Giá bán</th></tr></thead>
    <tbody>${list.length ? list.map((p) => {
      const pct = profitOf(p, cats);
      return `<tr>
        <td>${esc(p.sku)}</td><td><b>${esc(p.name)}</b></td><td>${CATEGORY_LABELS[p.category] || esc(p.category)}</td>
        <td>${money(costOf(p))}</td>
        <td><input class="cell-input" type="number" min="0" step="0.5" data-pid="${p.id}" value="${p.profitPct ?? ""}" placeholder="theo loại"> %</td>
        <td>${pct}%${p.profitPct == null ? ' <span class="muted">(loại)</span>' : ""}</td>
        <td><b>${money(salePrice(costOf(p), pct))}</b></td>
      </tr>`;
    }).join("") : `<tr><td colspan="7" class="muted">Không có sản phẩm phù hợp.</td></tr>`}</tbody>
  </table></div>`;
}

// Saves category % and per-product % (blank = follow category), then rewrites every selling price.
function savePricing() {
  const inputs = [...document.querySelectorAll("[data-cat], [data-pid]")];
  if (inputs.some((el) => el.value !== "" && !(Number(el.value) >= 0))) {
    toast("% lợi nhuận phải là số không âm");
    return;
  }
  const cats = categoryProfits();
  document.querySelectorAll("[data-cat]").forEach((el) => (cats[el.dataset.cat] = el.value === "" ? DEFAULT_PROFIT : Number(el.value)));
  const products = loadProducts();
  document.querySelectorAll("[data-pid]").forEach((el) => {
    const p = products.find((x) => String(x.id) === el.dataset.pid);
    if (p) p.profitPct = el.value === "" ? null : Number(el.value);
  });
  products.forEach((p) => {
    p.cost = costOf(p); // pin cost before the price changes, otherwise the back-computed cost would drift
    p.price = salePrice(p.cost, profitOf(p, cats));
  });
  writeJSON(KEYS.pricing, cats);
  saveProducts(products);
  toast("Đã lưu và cập nhật giá bán");
  renderPricing();
}

/* ----- Tồn kho ----- */

function inventoryHtml() {
  const today = new Date();
  return `<div class="admin-filters" oninput="renderInventory()">
      <div class="field"><label>Loại sản phẩm</label>
        <select id="f-cat"><option value="">Tất cả</option>${CATEGORIES.map((c) => `<option value="${c}">${CATEGORY_LABELS[c]}</option>`).join("")}</select>
      </div>
      <div class="field"><label>Sản phẩm</label><input id="f-prod" placeholder="Tên hoặc mã sản phẩm"></div>
    </div>
    <section class="admin-section" style="margin-top:12px">
      <h2 class="font-display">Tra cứu tồn kho</h2>
      <p class="muted">Để trống thời điểm để xem tồn kho hiện tại. Dòng tô đỏ là sản phẩm có tồn ≤ mức cảnh báo.</p>
      <div class="admin-filters" oninput="renderStock()">
        ${dateField("f-at", "Tại thời điểm", null, true)}
      </div>
      <div id="stock-table"></div>
    </section>
    <section class="admin-section">
      <h2 class="font-display">Nhập – Xuất – Tồn</h2>
      <p class="muted">Tồn cuối kỳ = Tồn đầu kỳ + Nhập − Xuất trong khoảng thời gian.</p>
      <div class="admin-filters" oninput="renderLedger()">
        ${dateField("f-from", "Từ ngày", new Date(today.getFullYear(), today.getMonth(), 1))}
        ${dateField("f-to", "Đến ngày", today)}
      </div>
      <div id="ledger-table"></div>
    </section>`;
}

function renderInventory() {
  renderStock();
  renderLedger();
}

function stockBadge(qty, min) {
  if (qty <= 0) return `<span class="status st-low">Hết hàng</span>`;
  if (qty <= min) return `<span class="status st-low">Sắp hết</span>`;
  if (qty <= min * 1.5) return `<span class="status st-wait">Cần theo dõi</span>`;
  return `<span class="status st-done">Còn hàng</span>`;
}

function inventoryProducts() {
  const cat = document.getElementById("f-cat").value;
  const q = document.getElementById("f-prod").value.trim().toLowerCase();
  return loadProducts().filter((p) => (!cat || p.category === cat) && (p.name + " " + p.sku).toLowerCase().includes(q));
}

function renderStock() {
  const at = readDate("f-at", true);
  if (at === null) {
    document.getElementById("stock-table").innerHTML = DATE_HINT;
    return;
  }
  const time = at || new Date();
  const log = stockLog();
  const rows = inventoryProducts().map((p) => ({ p, qty: stockAt(p, time, log) })).sort((a, b) => a.qty - minStock(a.p) - (b.qty - minStock(b.p)));
  const low = rows.filter((r) => r.qty <= minStock(r.p)).length;
  document.getElementById("stock-table").innerHTML = `
    <p class="muted" style="margin-bottom:10px">Tồn kho lúc ${time.toLocaleString("vi-VN")} · <b style="color:#b23b3b">${low} sản phẩm sắp hết / hết hàng</b></p>
    <div class="table-wrap"><table>
      <thead><tr><th>Mã</th><th>Sản phẩm</th><th>Loại</th><th>Tồn kho</th><th>Mức cảnh báo</th><th>Tình trạng</th></tr></thead>
      <tbody>${rows.map(({ p, qty }) => `<tr class="${qty <= minStock(p) ? "row-low" : ""}">
        <td>${esc(p.sku)}</td><td><b>${esc(p.name)}</b></td><td>${CATEGORY_LABELS[p.category] || esc(p.category)}</td>
        <td><b>${qty}</b></td><td>${minStock(p)}</td><td>${stockBadge(qty, minStock(p))}</td>
      </tr>`).join("")}</tbody>
    </table></div>`;
}

function renderLedger() {
  const start = readDate("f-from");
  const end = readDate("f-to", true);
  const el = document.getElementById("ledger-table");
  if (!start || !end || start > end) {
    el.innerHTML = `<p class="muted">Chọn khoảng thời gian hợp lệ (từ ngày ≤ đến ngày).</p>`;
    return;
  }
  const log = stockLog();
  const rows = inventoryProducts().map((p) => {
    const inRange = log.filter((e) => e.productId === String(p.id) && new Date(e.at) >= start && new Date(e.at) <= end);
    const opening = stockAt(p, new Date(start.getTime() - 1), log);
    const imported = inRange.filter((e) => e.qty > 0).reduce((s, e) => s + e.qty, 0);
    const exported = inRange.filter((e) => e.qty < 0).reduce((s, e) => s - e.qty, 0);
    const closing = opening + imported - exported;
    console.assert(closing === stockAt(p, end, log), "Nhập-Xuất-Tồn lệch", p.id);
    return { p, opening, imported, exported, closing };
  });
  const sum = (k) => rows.reduce((s, r) => s + r[k], 0);
  el.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Mã</th><th>Sản phẩm</th><th>Tồn đầu kỳ</th><th>Nhập</th><th>Xuất</th><th>Tồn cuối kỳ</th></tr></thead>
    <tbody>${rows.map((r) => `<tr class="${r.closing <= minStock(r.p) ? "row-low" : ""}">
      <td>${esc(r.p.sku)}</td><td><b>${esc(r.p.name)}</b></td>
      <td>${r.opening}</td><td style="color:#2f7a4a">+${r.imported}</td><td style="color:#b23b3b">−${r.exported}</td><td><b>${r.closing}</b></td>
    </tr>`).join("")}
    <tr><td colspan="2"><b>Tổng cộng</b></td><td><b>${sum("opening")}</b></td><td><b>+${sum("imported")}</b></td><td><b>−${sum("exported")}</b></td><td><b>${sum("closing")}</b></td></tr>
    </tbody>
  </table></div>`;
}

renderAdmin();
