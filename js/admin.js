const ADMIN_EMAIL = "admin@cothom.vn";
const ADMIN_PASS = "Admin@123";

const demoOrders = [
  { id: "#CT-1048", customer: "Nguyễn Minh Anh", product: "Serum Rạng Rỡ Luminous", date: "24 Thg 5, 2026", total: 890000, status: "Đang xử lý" },
  { id: "#CT-1047", customer: "Trần Ngọc Mai", product: "Kem Dưỡng Ẩm Hydra-Boost", date: "24 Thg 5, 2026", total: 1300000, status: "Đã giao" },
  { id: "#CT-1046", customer: "Lê Thanh Hà", product: "Nước Hoa Rose Oud", date: "23 Thg 5, 2026", total: 1450000, status: "Đang giao" },
  { id: "#CT-1045", customer: "Phạm Gia Hân", product: "Xịt Khoáng Cánh Hồng", date: "23 Thg 5, 2026", total: 420000, status: "Đã giao" },
  { id: "#CT-1044", customer: "Vũ Khánh Linh", product: "Mặt Nạ Tóc Phục Hồi", date: "22 Thg 5, 2026", total: 760000, status: "Đã hủy" },
];

const demoCustomers = [
  { id: "KH-001", name: "Nguyễn Minh Anh", email: "minhanh@gmail.com", phone: "0901 234 567", address: "24 Nguyễn Huệ, Q.1, TP.HCM", joined: "12/08/2023" },
  { id: "KH-002", name: "Trần Ngọc Mai", email: "ngocmai@gmail.com", phone: "0988 456 123", address: "18 Lê Lợi, Hải Châu, Đà Nẵng", joined: "03/11/2023" },
  { id: "KH-003", name: "Lê Thanh Hà", email: "thanhha@gmail.com", phone: "0912 888 302", address: "57 Tràng Thi, Hoàn Kiếm, Hà Nội", joined: "21/01/2024" },
  { id: "KH-004", name: "Phạm Gia Hân", email: "giahan@gmail.com", phone: "0935 777 810", address: "102 Hai Bà Trưng, Cần Thơ", joined: "10/03/2024" },
];

let view = "overview";
let query = "";
let editing = null;

function isAdmin() {
  return sessionStorage.getItem(KEYS.admin) === "yes";
}

function statusClass(s) {
  if (s === "Đã giao") return "st-done";
  if (s === "Đang giao") return "st-ship";
  if (s === "Đã hủy") return "st-cancel";
  return "st-wait";
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

  const titles = { overview: "Chào buổi sáng, An Nhiên", orders: "Đơn hàng", products: "Sản phẩm", customers: "Khách hàng" };
  root.innerHTML = `
    <div class="admin-shell">
      <aside class="admin-aside desk" id="admin-aside">
        <button class="admin-brand" onclick="location.href='index.html'">
          <span class="font-display" style="font-size:20px;letter-spacing:.16em">CỎ THƠM</span>
          <small>Quản trị cửa hàng</small>
        </button>
        <nav class="admin-nav">
          <p>Không gian làm việc</p>
          <button class="${view==='overview'?'active':''}" onclick="setView('overview')">Tổng quan</button>
          <button class="${view==='orders'?'active':''}" onclick="setView('orders')">Đơn hàng</button>
          <button class="${view==='products'?'active':''}" onclick="setView('products')">Sản phẩm</button>
          <button class="${view==='customers'?'active':''}" onclick="setView('customers')">Khách hàng</button>
        </nav>
        <div class="admin-user">
          <p style="font-size:13px;margin-bottom:8px">An Nhiên · Quản trị viên</p>
          <button class="btn-ghost" style="color:#ccc" onclick="adminLogout()">Đăng xuất</button>
        </div>
      </aside>
      <div class="admin-main">
        <div class="admin-top">
          <div>
            <p class="kicker">Cỏ Thơm Admin</p>
            <h1>${titles[view]}</h1>
          </div>
          <input placeholder="Tìm kiếm nhanh..." value="${query}" oninput="query=this.value; renderAdmin()" style="margin-left:auto;max-width:280px;width:100%;border:1px solid var(--border);border-radius:12px;padding:10px 12px">
          ${view === "products" ? `<button class="btn btn-dark" onclick="openProductForm(null)">+ Thêm sản phẩm</button>` : ""}
        </div>
        <div id="admin-view">${viewHtml()}</div>
      </div>
    </div>
    <div id="product-modal" class="overlay ${editing === null ? "hidden" : ""}" onclick="if(event.target===this){editing=null;renderAdmin()}">
      ${editing !== null ? productFormHtml() : ""}
    </div>`;
}

function setView(v) {
  view = v;
  query = "";
  editing = null;
  renderAdmin();
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
  if (view === "products") return productsHtml();
  return customersHtml();
}

function overviewHtml() {
  const live = getOrders();
  const allOrders = [
    ...live.map((o) => ({ id: o.id, customer: o.name, product: (o.items[0] && o.items[0].name) || "Đơn mới", date: o.date, total: o.total, status: o.status })),
    ...demoOrders,
  ];
  const products = loadProducts();
  return `
    <div class="stats">
      <article class="stat"><p class="muted">Doanh thu</p><h3>321.000.000₫</h3><small class="muted">+12,5% so với tháng trước</small></article>
      <article class="stat"><p class="muted">Đơn hàng</p><h3>248</h3><small class="muted">32 đơn hôm nay</small></article>
      <article class="stat"><p class="muted">Khách hàng</p><h3>1.429</h3><small class="muted">86 khách mới</small></article>
      <article class="stat"><p class="muted">Sắp hết hàng</p><h3>${products.filter((p) => p.stock < 10).length}</h3><small class="muted">dưới 10 món</small></article>
    </div>
    <div class="two-col" style="margin-top:18px">
      <article class="stat">
        <h2 class="font-display">Tổng quan doanh thu</h2>
        <p class="muted" style="margin-bottom:12px">7 ngày gần nhất</p>
        <div class="chart">
          <svg viewBox="0 0 600 180" preserveAspectRatio="none">
            <path d="M0 145 C65 128 70 105 120 116 S205 82 250 94 S330 40 375 60 S455 42 490 50 S560 8 600 18 L600 180 L0 180Z" fill="rgba(196,120,138,.22)"/>
            <path d="M0 145 C65 128 70 105 120 116 S205 82 250 94 S330 40 375 60 S455 42 490 50 S560 8 600 18" fill="none" stroke="#b56f7e" stroke-width="3"/>
          </svg>
        </div>
      </article>
      <article class="stat">
        <h2 class="font-display">Bán chạy nhất</h2>
        ${products.slice(0, 4).map((p, i) => `<div class="cart-item" style="grid-template-columns:48px 1fr auto;padding:8px 0;border:none">
          <img src="${p.images[0]}" style="width:48px;height:48px;border-radius:10px">
          <div><b>${p.name}</b><div class="muted">${62 - i * 9} đã bán</div></div>
          <div>${money(p.price)}</div>
        </div>`).join("")}
      </article>
    </div>
    <div style="margin-top:18px">${orderTable(allOrders.slice(0, 5))}</div>`;
}

function ordersHtml() {
  const live = getOrders().map((o) => ({
    id: o.id,
    customer: o.name,
    product: (o.items[0] && o.items[0].name) || "Đơn mới",
    date: o.date,
    total: o.total,
    status: o.status,
  }));
  const list = [...live, ...demoOrders].filter((o) => (o.id + o.customer + o.product).toLowerCase().includes(query.toLowerCase()));
  return orderTable(list);
}

function orderTable(list) {
  return `<div class="table-wrap"><table>
    <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Sản phẩm</th><th>Ngày</th><th>Tổng</th><th>Trạng thái</th></tr></thead>
    <tbody>${list.map((o) => `<tr>
      <td><b>${o.id}</b></td><td>${o.customer}</td><td>${o.product}</td><td>${o.date}</td>
      <td>${money(o.total)}</td><td><span class="status ${statusClass(o.status)}">${o.status}</span></td>
    </tr>`).join("")}</tbody>
  </table></div>`;
}

function productsHtml() {
  const list = loadProducts().filter((p) => (p.name + p.brand + p.sku).toLowerCase().includes(query.toLowerCase()));
  return `<div class="table-wrap"><table>
    <thead><tr><th>Sản phẩm</th><th>SKU</th><th>Danh mục</th><th>Giá</th><th>Kho</th><th></th></tr></thead>
    <tbody>${list.map((p) => `<tr>
      <td><b>${p.name}</b><div class="muted">${p.brand}</div></td>
      <td>${p.sku}</td><td>${CATEGORY_LABELS[p.category] || p.category}</td>
      <td>${money(p.price)}</td><td>${p.stock}</td>
      <td>
        <button class="btn-ghost" onclick="openProductForm('${p.id}')">Sửa</button>
        <button class="btn-ghost" onclick="deleteProduct('${p.id}')">Xóa</button>
      </td>
    </tr>`).join("")}</tbody>
  </table></div>`;
}

function customersHtml() {
  const live = getOrders().map((o, i) => ({ id: "LIVE-" + o.id, name: o.name, email: "—", phone: o.phone, address: o.address, joined: o.date }));
  const list = [...live, ...demoCustomers].filter((c) => (c.name + c.email + c.phone).toLowerCase().includes(query.toLowerCase()));
  return `<div class="table-wrap"><table>
    <thead><tr><th>Mã</th><th>Tên</th><th>Email / SĐT</th><th>Địa chỉ</th><th>Tham gia</th></tr></thead>
    <tbody>${list.map((c) => `<tr>
      <td>${c.id}</td><td>${c.name}</td><td>${c.email}<div class="muted">${c.phone}</div></td>
      <td>${c.address}</td><td>${c.joined}</td>
    </tr>`).join("")}</tbody>
  </table></div>`;
}

function openProductForm(id) {
  editing = id ? getProductById(id) : "new";
  renderAdmin();
}

function productFormHtml() {
  const p = editing === "new" ? { name: "", brand: "", category: "Skincare", sku: "", price: 0, stock: 0, description: "" } : editing;
  return `<div class="modal">
    <h2 class="font-display">${editing === "new" ? "Thêm sản phẩm" : "Sửa sản phẩm"}</h2>
    <form onsubmit="saveProduct(event)">
      <div class="field"><label>Tên</label><input name="name" value="${p.name}" required></div>
      <div class="field"><label>Thương hiệu</label><input name="brand" value="${p.brand}" required></div>
      <div class="field"><label>SKU</label><input name="sku" value="${p.sku}" required></div>
      <div class="field"><label>Danh mục</label>
        <select name="category">${CATEGORIES.map((c) => `<option ${p.category===c?'selected':''} value="${c}">${CATEGORY_LABELS[c]}</option>`).join("")}</select>
      </div>
      <div class="field"><label>Giá (VND)</label><input name="price" type="number" value="${p.price}" required></div>
      <div class="field"><label>Tồn kho</label><input name="stock" type="number" value="${p.stock}" required></div>
      <div class="field"><label>Mô tả</label><textarea name="description" rows="3">${p.description || ""}</textarea></div>
      <div class="actions">
        <button class="btn btn-rose" type="submit">Lưu</button>
        <button class="btn-outline" type="button" onclick="editing=null;renderAdmin()">Hủy</button>
      </div>
    </form>
  </div>`;
}

function saveProduct(e) {
  e.preventDefault();
  const f = new FormData(e.target);
  const list = loadProducts();
  const draft = {
    name: f.get("name"),
    brand: f.get("brand"),
    sku: f.get("sku"),
    category: f.get("category"),
    price: Number(f.get("price")),
    stock: Number(f.get("stock")),
    description: f.get("description"),
  };
  if (editing === "new") {
    list.unshift({
      ...draft,
      id: "p" + Date.now(),
      images: DEFAULT_PRODUCTS[0].images,
      rating: 0,
      reviews: 0,
      ingredients: "",
      directions: "",
      tags: [],
    });
    toast("Đã thêm sản phẩm");
  } else {
    const i = list.findIndex((p) => p.id === editing.id);
    if (i >= 0) list[i] = { ...list[i], ...draft };
    toast("Đã cập nhật sản phẩm");
  }
  saveProducts(list);
  editing = null;
  renderAdmin();
}

function deleteProduct(id) {
  const p = getProductById(id);
  if (!p || !confirm('Xóa “' + p.name + '”?')) return;
  saveProducts(loadProducts().filter((x) => x.id !== id));
  toast("Đã xóa sản phẩm");
  renderAdmin();
}

renderAdmin();
