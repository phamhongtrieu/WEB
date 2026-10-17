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

const ORDER_STATUSES = ["Mới đặt", "Đang xử lý", "Đang giao", "Đã giao", "Đã hủy"];
let view = "overview";
let query = "";
let editing = null;
let modalType = "";
let selectedOrder = null;
let orderStatusFilter = "";
let orderFrom = "";
let orderTo = "";
let inventoryCategory = "";
let inventoryAt = new Date().toISOString().slice(0, 10);
let movementFrom = "";
let movementTo = "";

function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

function isAdmin() {
  return sessionStorage.getItem(KEYS.admin) === "yes";
}

function statusClass(status) {
  if (status === "Đã giao") return "st-done";
  if (status === "Đang giao") return "st-ship";
  if (status === "Đã hủy") return "st-cancel";
  return "st-wait";
}

function dateKey(value) {
  if (!value) return "";
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const numeric = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (numeric) return `${numeric[3]}-${numeric[2].padStart(2, "0")}-${numeric[1].padStart(2, "0")}`;
  const localized = text.match(/^(\d{1,2}) Thg (\d{1,2}), (\d{4})$/);
  if (localized) return `${localized[3]}-${localized[2].padStart(2, "0")}-${localized[1].padStart(2, "0")}`;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function formatDate(value) {
  const key = dateKey(value);
  if (!key) return escapeHtml(value || "—");
  return new Date(`${key}T00:00:00`).toLocaleDateString("vi-VN");
}

function renderAdmin() {
  const root = document.getElementById("admin-root");
  if (!isAdmin()) {
    root.innerHTML = `<div class="admin-login">
      <div class="modal">
        <p class="kicker">Cỏ Thơm</p>
        <h2 class="font-display">Đăng nhập quản trị</h2>
        <p class="muted" style="margin-bottom:12px">Tài khoản demo: admin@cothom.vn / Admin@123</p>
        <form onsubmit="adminLogin(event)">
          <div class="field"><label>Email</label><input name="email" type="email" required autocomplete="username"></div>
          <div class="field"><label>Mật khẩu</label><input name="password" type="password" required autocomplete="current-password"></div>
          <button class="btn btn-rose" style="width:100%" type="submit">Đăng nhập</button>
        </form>
        <button class="btn-ghost" style="margin-top:10px" onclick="location.href='index.html'">← Về cửa hàng</button>
      </div>
    </div>`;
    return;
  }

  const titles = {
    overview: "Tổng quan", orders: "Đơn hàng", products: "Sản phẩm",
    categories: "Danh mục", customers: "Khách hàng", receipts: "Phiếu nhập",
    pricing: "Giá bán & lợi nhuận", inventory: "Tồn kho",
  };
  root.innerHTML = `
    <div class="admin-shell">
      <aside class="admin-aside desk" id="admin-aside">
        <button class="admin-brand" onclick="location.href='index.html'">
          <span class="font-display" style="font-size:20px;letter-spacing:.16em">CỎ THƠM</span>
          <small>Quản trị cửa hàng</small>
        </button>
        <nav class="admin-nav">
          <p>Không gian làm việc</p>
          ${Object.entries(titles).map(([id, title]) => `<button class="${view === id ? "active" : ""}" onclick="setView('${id}')">${title}</button>`).join("")}
        </nav>
        <div class="admin-user">
          <p style="font-size:13px;margin-bottom:8px">An Nhiên · Quản trị viên</p>
          <button class="btn-ghost" style="color:#ccc" onclick="adminLogout()">Đăng xuất</button>
        </div>
      </aside>
      <div class="admin-main">
        <div class="admin-top">
          <div><p class="kicker">Cỏ Thơm Admin</p><h1>${titles[view]}</h1></div>
          ${["orders", "products", "customers", "receipts", "inventory"].includes(view) ? `<input placeholder="Tìm kiếm..." aria-label="Tìm kiếm" value="${escapeHtml(query)}" oninput="query=this.value; renderAdmin()" style="margin-left:auto;max-width:280px;width:100%;border:1px solid var(--border);border-radius:12px;padding:10px 12px">` : ""}
          ${view === "products" ? `<button class="btn btn-dark" onclick="openProductForm(null)">+ Thêm sản phẩm</button>` : ""}
          ${view === "receipts" ? `<button class="btn btn-dark" onclick="openReceiptForm(null)">+ Tạo phiếu nhập</button>` : ""}
        </div>
        <div id="admin-view">${viewHtml()}</div>
      </div>
    </div>
    ${modalHtml()}`;
}

function setView(nextView) {
  view = nextView;
  query = "";
  editing = null;
  modalType = "";
  selectedOrder = null;
  renderAdmin();
}

function adminLogin(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  if (form.get("email").toString().trim().toLowerCase() !== ADMIN_EMAIL || form.get("password") !== ADMIN_PASS) {
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
  const renderers = {
    overview: overviewHtml, orders: ordersHtml, products: productsHtml,
    categories: categoriesHtml, customers: customersHtml, receipts: receiptsHtml,
    pricing: pricingHtml, inventory: inventoryHtml,
  };
  return renderers[view]();
}

function overviewHtml() {
  const orders = getOrders();
  const products = loadProducts();
  const revenue = orders.filter((order) => order.status !== "Đã hủy").reduce((sum, order) => sum + Number(order.total || 0), 0);
  const lowStock = products.filter((product) => !product.hidden && Number(product.stock) < 10).length;
  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((order) => dateKey(order.date) === today).length;
  const expiring = expiringReceiptItems().length;
  return `<div class="stats">
    <article class="stat"><p class="muted">Doanh thu đơn thực</p><h3>${money(revenue)}</h3><small class="muted">Không tính đơn đã hủy</small></article>
    <article class="stat"><p class="muted">Đơn hàng</p><h3>${orders.length}</h3><small class="muted">${todayOrders} đơn hôm nay</small></article>
    <article class="stat"><p class="muted">Khách hàng</p><h3>${getCustomerRows().length}</h3><small class="muted">Bao gồm tài khoản demo</small></article>
    <article class="stat"><p class="muted">Sắp hết hàng</p><h3>${lowStock}</h3><small class="muted">${expiring} lô sắp hết hạn</small></article>
  </div>
  <div class="stat" style="margin-top:18px"><h2 class="font-display">Đơn hàng gần đây</h2><div style="margin-top:12px">${orderTable(orders.slice(0, 5), false)}</div></div>`;
}

function ordersHtml() {
  const list = getOrders().filter((order) => {
    const text = [order.id, order.name, order.email, ...(order.items || []).map((item) => item.name)].join(" ").toLowerCase();
    const key = dateKey(order.date);
    return text.includes(query.toLowerCase())
      && (!orderStatusFilter || order.status === orderStatusFilter)
      && (!orderFrom || (key && key >= orderFrom))
      && (!orderTo || (key && key <= orderTo));
  });
  return `<div class="filters">
    <label>Trạng thái <select onchange="orderStatusFilter=this.value;renderAdmin()"><option value="">Tất cả</option>${ORDER_STATUSES.map((status) => `<option ${orderStatusFilter === status ? "selected" : ""}>${status}</option>`).join("")}</select></label>
    <label>Từ ngày <input type="date" value="${orderFrom}" onchange="orderFrom=this.value;renderAdmin()"></label>
    <label>Đến ngày <input type="date" value="${orderTo}" onchange="orderTo=this.value;renderAdmin()"></label>
    <button class="btn-outline" onclick="orderStatusFilter='';orderFrom='';orderTo='';renderAdmin()">Xóa lọc</button>
  </div>${orderTable(list, true)}`;
}

function orderTable(list, withActions) {
  return `<div class="table-wrap"><table>
    <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Sản phẩm</th><th>Ngày</th><th>Tổng</th><th>Trạng thái</th>${withActions ? "<th>Thao tác</th>" : ""}</tr></thead>
    <tbody>${list.length ? list.map((order) => `<tr>
      <td><button class="btn-ghost" onclick="showOrderDetails('${escapeHtml(order.id)}')"><b>${escapeHtml(order.id)}</b></button></td>
      <td>${escapeHtml(order.name || order.customer || "—")}</td>
      <td>${escapeHtml(order.product || (order.items || []).map((item) => item.name).join(", ") || "Đơn mới")}</td>
      <td>${formatDate(order.date)}</td><td>${money(order.total)}</td>
      <td><span class="status ${statusClass(order.status)}">${escapeHtml(order.status)}</span></td>
      ${withActions ? `<td><select aria-label="Cập nhật trạng thái đơn ${escapeHtml(order.id)}" onchange="updateOrderStatus('${escapeHtml(order.id)}',this.value)">${ORDER_STATUSES.map((status) => `<option ${order.status === status ? "selected" : ""}>${status}</option>`).join("")}</select></td>` : ""}
    </tr>`).join("") : `<tr><td colspan="${withActions ? 7 : 6}" class="muted">Không có đơn hàng phù hợp.</td></tr>`}</tbody>
  </table></div>`;
}

function showOrderDetails(id) {
  selectedOrder = getOrders().find((order) => order.id === id) || null;
  if (!selectedOrder) {
    toast("Không tìm thấy đơn hàng.");
    return;
  }
  modalType = "order";
  renderAdmin();
}

function updateOrderStatus(id, status) {
  if (!ORDER_STATUSES.includes(status)) return;
  const orders = getOrders();
  const order = orders.find((item) => item.id === id);
  if (!order) return;
  if (status === "Đã hủy" && order.status !== "Đã hủy" && !order.inventoryReturned) {
    const products = loadProducts();
    if ((order.items || []).some((item) => !products.some((product) => product.id === item.productId))) {
      toast("Không thể hoàn kho: đơn hàng có sản phẩm không còn tồn tại.");
      return;
    }
    (order.items || []).forEach((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product) return;
      product.stock = Number(product.stock || 0) + Number(item.quantity || 0);
      recordStockMovement({ productId: product.id, quantity: Number(item.quantity || 0), type: "Hoàn đơn", reference: order.id });
    });
    saveProducts(products);
    order.inventoryReturned = true;
  } else if (order.status === "Đã hủy" && status !== "Đã hủy" && order.inventoryReturned) {
    const products = loadProducts();
    if ((order.items || []).some((item) => !products.some((product) => product.id === item.productId))) {
      toast("Không thể xuất kho lại: đơn hàng có sản phẩm không còn tồn tại.");
      return;
    }
    (order.items || []).forEach((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product) return;
      product.stock = Math.max(0, Number(product.stock || 0) - Number(item.quantity || 0));
      recordStockMovement({ productId: product.id, quantity: -Number(item.quantity || 0), type: "Tái xử lý đơn", reference: order.id });
    });
    saveProducts(products);
    order.inventoryReturned = false;
  }
  order.status = status;
  saveOrders(orders);
  toast("Đã cập nhật trạng thái đơn hàng");
  renderAdmin();
}

function productsHtml() {
  const list = loadProducts().filter((product) => {
    const searchable = [product.name, product.brand, product.sku, CATEGORY_LABELS[product.category]].join(" ").toLowerCase();
    return searchable.includes(query.toLowerCase());
  });
  return `<div class="table-wrap"><table>
    <thead><tr><th>Sản phẩm</th><th>SKU</th><th>Danh mục</th><th>Giá bán</th><th>Kho</th><th>Hiển thị</th><th>Thao tác</th></tr></thead>
    <tbody>${list.length ? list.map((product) => `<tr>
      <td><b>${escapeHtml(product.name)}</b><div class="muted">${escapeHtml(product.brand)}</div></td>
      <td>${escapeHtml(product.sku)}</td><td>${escapeHtml(CATEGORY_LABELS[product.category] || product.category)}</td>
      <td>${money(product.price)}</td><td>${Number(product.stock || 0)}</td><td>${product.hidden ? "Đang ẩn" : "Đang bán"}</td>
      <td><button class="btn-ghost" onclick="openProductForm('${escapeHtml(product.id)}')">Sửa</button>
      <button class="btn-ghost" onclick="toggleProductVisibility('${escapeHtml(product.id)}')">${product.hidden ? "Hiện" : "Ẩn"}</button>
      <button class="btn-ghost" onclick="deleteProduct('${escapeHtml(product.id)}')">Xóa</button></td>
    </tr>`).join("") : `<tr><td colspan="7" class="muted">Không có sản phẩm phù hợp.</td></tr>`}</tbody>
  </table></div>`;
}

function categoriesHtml() {
  const categories = loadCategories();
  return `<form class="admin-inline-form" onsubmit="addCategory(event)">
    <div class="field"><label>Tên danh mục mới</label><input name="name" required maxlength="50"></div>
    <button class="btn btn-rose" type="submit">Thêm danh mục</button>
  </form>
  <div class="table-wrap"><table><thead><tr><th>Mã</th><th>Tên</th><th>Số sản phẩm</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>
    ${categories.map((category) => `<tr><td>${escapeHtml(category.id)}</td><td>${escapeHtml(category.name)}</td>
      <td>${loadProducts().filter((product) => product.category === category.id).length}</td><td>${category.hidden ? "Đang ẩn" : "Đang hiển thị"}</td>
      <td><button class="btn-ghost" onclick="editCategory('${escapeHtml(category.id)}')">Sửa tên</button>
      <button class="btn-ghost" onclick="toggleCategoryVisibility('${escapeHtml(category.id)}')">${category.hidden ? "Hiện" : "Ẩn"}</button>
      <button class="btn-ghost" onclick="deleteCategory('${escapeHtml(category.id)}')">Xóa</button></td></tr>`).join("")}
  </tbody></table></div>`;
}

function slugify(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function addCategory(event) {
  event.preventDefault();
  const name = new FormData(event.target).get("name").toString().trim();
  const categories = loadCategories();
  const id = slugify(name);
  if (!/^[\p{L}\p{N}\s-]+$/u.test(name) || !id || categories.some((category) => category.id === id || category.name.toLowerCase() === name.toLowerCase())) {
    toast("Tên danh mục đã tồn tại hoặc không hợp lệ.");
    return;
  }
  categories.push({ id, name, hidden: false, meta: { image: CATEGORY_META.Skincare.image, tagline: name } });
  saveCategories(categories);
  event.target.reset();
  toast("Đã thêm danh mục");
  renderAdmin();
}

function editCategory(id) {
  const categories = loadCategories();
  const category = categories.find((item) => item.id === id);
  if (!category) return;
  const name = prompt("Tên danh mục mới:", category.name);
  if (name === null) return;
  const trimmed = name.trim();
  if (!/^[\p{L}\p{N}\s-]+$/u.test(trimmed) || categories.some((item) => item.id !== id && item.name.toLowerCase() === trimmed.toLowerCase())) {
    toast("Tên danh mục không hợp lệ hoặc đã được sử dụng.");
    return;
  }
  category.name = trimmed;
  category.meta = { ...(category.meta || {}), tagline: trimmed };
  saveCategories(categories);
  toast("Đã cập nhật danh mục");
  renderAdmin();
}

function deleteCategory(id) {
  if (loadProducts().some((product) => product.category === id)) {
    toast("Không thể xóa danh mục đang được dùng bởi sản phẩm.");
    return;
  }
  if (!confirm("Xóa danh mục này?")) return;
  saveCategories(loadCategories().filter((category) => category.id !== id));
  toast("Đã xóa danh mục");
  renderAdmin();
}

function toggleCategoryVisibility(id) {
  const categories = loadCategories();
  const category = categories.find((item) => item.id === id);
  if (!category) return;
  if (!category.hidden && categories.filter((item) => !item.hidden).length <= 1) {
    toast("Cần giữ lại ít nhất một danh mục hiển thị.");
    return;
  }
  category.hidden = !category.hidden;
  saveCategories(categories);
  toast(category.hidden ? "Đã ẩn danh mục khỏi cửa hàng" : "Đã hiện danh mục");
  renderAdmin();
}

function customersHtml() {
  const list = getCustomerRows().filter((customer) =>
    [customer.id, customer.name, customer.email, customer.phone].join(" ").toLowerCase().includes(query.toLowerCase()));
  return `<p class="muted" style="margin-bottom:12px">Tài khoản đăng ký thật được lưu trong trình duyệt; danh sách mẫu chỉ để minh họa.</p>
  <div class="table-wrap"><table><thead><tr><th>Mã</th><th>Khách hàng</th><th>Email / SĐT</th><th>Địa chỉ</th><th>Tham gia</th><th>Tài khoản</th><th>Thao tác</th></tr></thead><tbody>
    ${list.length ? list.map((customer) => `<tr><td>${escapeHtml(customer.id)}</td><td>${escapeHtml(customer.name)}</td>
      <td>${escapeHtml(customer.email)}<div class="muted">${escapeHtml(customer.phone || "—")}</div></td>
      <td>${escapeHtml(customer.address || "—")}</td><td>${escapeHtml(customer.joined || "—")}</td>
      <td>${customer.locked ? "Đã khóa" : "Hoạt động"}${customer.demo && !customer.password ? '<div class="muted">Tài khoản mẫu</div>' : ""}</td>
      <td>      <button class="btn-ghost" onclick="resetCustomerPassword('${encodeURIComponent(customer.email)}')">Đặt lại mật khẩu</button>
      <button class="btn-ghost" onclick="toggleCustomerLock('${encodeURIComponent(customer.email)}')">${customer.locked ? "Mở khóa" : "Khóa"}</button></td></tr>`).join("") : `<tr><td colspan="7" class="muted">Không có khách hàng phù hợp.</td></tr>`}
  </tbody></table></div>`;
}

function getCustomerRows() {
  const accounts = getCustomerAccounts();
  const known = new Set(accounts.map((customer) => customer.email.toLowerCase()));
  const rows = [...accounts];
  demoCustomers.filter((customer) => !known.has(customer.email.toLowerCase())).forEach((customer) => {
    rows.push({ ...customer, demo: true, locked: false });
    known.add(customer.email.toLowerCase());
  });
  getOrders().forEach((order) => {
    const email = (order.email || "").toLowerCase();
    if (!email || known.has(email)) return;
    rows.push({
      id: "ORDER-" + order.id, name: order.name, email, phone: order.phone,
      address: order.address, joined: order.date, locked: false, orderCustomer: true,
    });
    known.add(email);
  });
  return rows;
}

function ensureManagedCustomer(email) {
  const normalizedEmail = email.toLowerCase();
  const accounts = getCustomerAccounts();
  let customer = accounts.find((item) => item.email.toLowerCase() === normalizedEmail);
  if (!customer) {
    const demo = demoCustomers.find((item) => item.email.toLowerCase() === normalizedEmail);
    const order = getOrders().find((item) => (item.email || "").toLowerCase() === normalizedEmail);
    const source = demo || (order ? {
      id: "KH-" + Date.now(), name: order.name, email: normalizedEmail, phone: order.phone,
      address: order.address, joined: order.date,
    } : null);
    if (!source) return { accounts, customer: null };
    customer = { ...source, demo: Boolean(demo), locked: false, password: "" };
    accounts.push(customer);
  }
  return { accounts, customer };
}

function resetCustomerPassword(email) {
  email = decodeURIComponent(email);
  const password = prompt("Nhập mật khẩu mới (ít nhất 6 ký tự):");
  if (password === null) return;
  if (password.length < 6) {
    toast("Mật khẩu phải có ít nhất 6 ký tự.");
    return;
  }
  const { accounts, customer } = ensureManagedCustomer(email);
  if (!customer) return;
  customer.password = password;
  customer.locked = false;
  saveCustomerAccounts(accounts);
  toast("Đã đặt lại mật khẩu và mở khóa tài khoản");
  renderAdmin();
}

function toggleCustomerLock(email) {
  email = decodeURIComponent(email);
  const { accounts, customer } = ensureManagedCustomer(email);
  if (!customer) return;
  customer.locked = !customer.locked;
  saveCustomerAccounts(accounts);
  toast(customer.locked ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản");
  renderAdmin();
}

function openProductForm(id) {
  editing = id ? getProductById(id) : "new";
  modalType = "product";
  renderAdmin();
}

function productFormHtml() {
  const product = editing === "new" ? {
    name: "", brand: "", category: CATEGORIES[0], sku: "", price: 0, costPrice: 0, stock: 0,
    description: "", images: [DEFAULT_PRODUCTS[0].images[0]], expiryDate: "", hidden: false,
  } : editing;
  if (!product) return "";
  return `<div class="modal wide"><h2 class="font-display">${editing === "new" ? "Thêm sản phẩm" : "Sửa sản phẩm"}</h2>
    <form onsubmit="saveProduct(event)">
      <div class="admin-form-grid">
        <div class="field"><label>Tên</label><input name="name" value="${escapeHtml(product.name)}" required></div>
        <div class="field"><label>Thương hiệu</label><input name="brand" value="${escapeHtml(product.brand)}" required></div>
        <div class="field"><label>SKU</label><input name="sku" value="${escapeHtml(product.sku)}" required></div>
        <div class="field"><label>Danh mục</label><select name="category">${CATEGORIES.map((category) => `<option value="${escapeHtml(category)}" ${product.category === category ? "selected" : ""}>${escapeHtml(CATEGORY_LABELS[category])}</option>`).join("")}</select></div>
        <div class="field"><label>Giá vốn (VND)</label><input name="costPrice" type="number" min="0" value="${product.costPrice == null ? "" : Number(product.costPrice)}" required></div>
        <div class="field"><label>Giá bán (VND)</label><input name="price" type="number" min="0" value="${Number(product.price || 0)}" required></div>
        <div class="field"><label>Tồn kho</label><input name="stock" type="number" min="0" step="1" value="${Number(product.stock || 0)}" required></div>
        <div class="field"><label>Ngày hết hạn (nếu có)</label><input name="expiryDate" type="date" value="${escapeHtml(product.expiryDate || "")}"></div>
      </div>
      <div class="field"><label>URL hình ảnh (nhiều ảnh, phân cách bằng dấu phẩy)</label><input name="images" value="${escapeHtml((product.images || []).join(", "))}"></div>
      <div class="field"><label>Mô tả</label><textarea name="description" rows="3">${escapeHtml(product.description || "")}</textarea></div>
      <label class="admin-check"><input name="hidden" type="checkbox" ${product.hidden ? "checked" : ""}> Ẩn khỏi cửa hàng</label>
      <div class="actions"><button class="btn btn-rose" type="submit">Lưu</button><button class="btn-outline" type="button" onclick="closeAdminModal()">Hủy</button></div>
    </form>
  </div>`;
}

function saveProduct(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const list = loadProducts();
  const stock = Number(form.get("stock"));
  const costPrice = Number(form.get("costPrice"));
  const price = Number(form.get("price"));
  if ([stock, costPrice, price].some((number) => !Number.isInteger(number) || number < 0)) {
    toast("Giá và tồn kho phải là số nguyên không âm.");
    return;
  }
  const images = form.get("images").toString().split(",").map((url) => url.trim())
    .filter((url) => /^(https?:\/\/|\/|\.\/)/i.test(url) && !/[\r\n]/.test(url));
  const draft = {
    name: form.get("name").toString().trim(),
    brand: form.get("brand").toString().trim(),
    sku: form.get("sku").toString().trim(),
    category: form.get("category").toString(),
    price, costPrice, stock,
    description: form.get("description").toString().trim(),
    images: images.length ? images : [DEFAULT_PRODUCTS[0].images[0]],
    expiryDate: form.get("expiryDate").toString(),
    hidden: form.get("hidden") === "on",
  };
  if (list.some((item) => item.sku.toLowerCase() === draft.sku.toLowerCase() && (!editing || editing === "new" || item.id !== editing.id))) {
    toast("SKU này đã được sử dụng.");
    return;
  }
  if (editing === "new") {
    const product = { ...draft, id: "p" + Date.now(), rating: 0, reviews: 0, ingredients: "", directions: "", tags: [] };
    list.unshift(product);
    if (stock) recordStockMovement({ productId: product.id, quantity: stock, type: "Tồn ban đầu", reference: "Tạo sản phẩm" });
    toast("Đã thêm sản phẩm");
  } else {
    const index = list.findIndex((item) => item.id === editing.id);
    if (index < 0) {
      toast("Không tìm thấy sản phẩm để cập nhật.");
      return;
    }
    const delta = draft.stock - Number(list[index].stock || 0);
    list[index] = { ...list[index], ...draft };
    if (delta) recordStockMovement({ productId: list[index].id, quantity: delta, type: "Điều chỉnh tồn", reference: "Cập nhật sản phẩm" });
    toast("Đã cập nhật sản phẩm");
  }
  saveProducts(list);
  modalType = "";
  editing = null;
  renderAdmin();
}

function toggleProductVisibility(id) {
  const products = loadProducts();
  const product = products.find((item) => item.id === id);
  if (!product) return;
  product.hidden = !product.hidden;
  saveProducts(products);
  toast(product.hidden ? "Đã ẩn sản phẩm" : "Đã hiện sản phẩm");
  renderAdmin();
}

function deleteProduct(id) {
  const product = getProductById(id);
  if (!product || !confirm(`Xóa “${product.name}”?`)) return;
  saveProducts(loadProducts().filter((item) => item.id !== id));
  toast("Đã xóa sản phẩm");
  renderAdmin();
}

function openReceiptForm(id) {
  const receipts = readStoredList(KEYS.receipts);
  editing = id ? receipts.find((receipt) => receipt.id === id) : "new";
  if (id && (!editing || editing.status === "Hoàn tất")) {
    toast("Chỉ có thể sửa phiếu nhập chưa hoàn tất.");
    return;
  }
  modalType = "receipt";
  renderAdmin();
}

function receiptFormHtml() {
  const receipt = editing === "new" ? { date: new Date().toISOString().slice(0, 10), note: "", items: [{}] } : editing;
  if (!receipt) return "";
  return `<div class="modal wide"><h2 class="font-display">${editing === "new" ? "Tạo phiếu nhập" : "Sửa phiếu nhập"} ${editing === "new" ? "" : escapeHtml(receipt.id)}</h2>
    <form onsubmit="saveReceipt(event)">
      <div class="field"><label>Ngày nhập</label><input type="date" name="date" value="${escapeHtml(receipt.date)}" required></div>
      <div id="receipt-lines">${receipt.items.map(receiptLineHtml).join("")}</div>
      <button type="button" class="btn-outline" onclick="addReceiptLine()">+ Thêm sản phẩm vào phiếu</button>
      <div class="field"><label>Ghi chú</label><textarea name="note" rows="2">${escapeHtml(receipt.note || "")}</textarea></div>
      <div class="actions"><button class="btn btn-rose" type="submit">Lưu phiếu</button><button class="btn-outline" type="button" onclick="closeAdminModal()">Hủy</button></div>
    </form>
  </div>`;
}

function receiptLineHtml(item) {
  const products = loadProducts();
  return `<div class="receipt-line">
    <label>Sản phẩm<select name="productId" required>${products.map((product) => `<option value="${escapeHtml(product.id)}" ${item.productId === product.id ? "selected" : ""}>${escapeHtml(product.name)} (${escapeHtml(product.sku)})</option>`).join("")}</select></label>
    <label>Số lượng<input name="quantity" type="number" min="1" step="1" value="${Number(item.quantity || 1)}" required></label>
    <label>Giá nhập / sản phẩm<input name="costPrice" type="number" min="0" value="${Number(item.costPrice || 0)}" required></label>
    <label>Hạn sử dụng<input name="expiryDate" type="date" value="${escapeHtml(item.expiryDate || "")}"></label>
    <button type="button" class="btn-ghost" onclick="this.parentElement.remove()" aria-label="Xóa dòng nhập">Xóa dòng</button>
  </div>`;
}

function addReceiptLine() {
  document.getElementById("receipt-lines").insertAdjacentHTML("beforeend", receiptLineHtml({}));
}

function saveReceipt(event) {
  event.preventDefault();
  const form = event.target;
  const items = Array.from(form.querySelectorAll(".receipt-line")).map((line) => ({
    productId: line.querySelector('[name="productId"]').value,
    quantity: Number(line.querySelector('[name="quantity"]').value),
    costPrice: Number(line.querySelector('[name="costPrice"]').value),
    expiryDate: line.querySelector('[name="expiryDate"]').value,
  }));
  if (!items.length || items.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1 || !Number.isFinite(item.costPrice) || item.costPrice < 0)) {
    toast("Phiếu nhập cần ít nhất một dòng hợp lệ; số lượng phải là số nguyên dương.");
    return;
  }
  const receipts = readStoredList(KEYS.receipts);
  const fields = new FormData(form);
  const receipt = {
    id: editing === "new" ? "PN-" + Date.now() : editing.id,
    date: fields.get("date").toString(),
    note: fields.get("note").toString().trim(),
    items,
    status: "Chờ nhập",
    updatedAt: new Date().toISOString(),
  };
  if (editing === "new") receipts.unshift(receipt);
  else {
    const index = receipts.findIndex((item) => item.id === editing.id);
    if (index < 0 || receipts[index].status === "Hoàn tất") {
      toast("Phiếu nhập đã hoàn tất hoặc không còn tồn tại.");
      return;
    }
    receipts[index] = receipt;
  }
  localStorage.setItem(KEYS.receipts, JSON.stringify(receipts));
  modalType = "";
  editing = null;
  toast("Đã lưu phiếu nhập");
  renderAdmin();
}

function receiptsHtml() {
  const receipts = readStoredList(KEYS.receipts).filter((receipt) =>
    [receipt.id, receipt.note, ...(receipt.items || []).map((item) => getProductById(item.productId)?.name || "")].join(" ").toLowerCase().includes(query.toLowerCase()));
  return `<div class="table-wrap"><table><thead><tr><th>Mã phiếu</th><th>Ngày nhập</th><th>Sản phẩm</th><th>Tổng số lượng</th><th>Thành tiền</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>
    ${receipts.length ? receipts.map((receipt) => {
      const quantity = receipt.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      const total = receipt.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.costPrice || 0), 0);
      const description = receipt.items.map((item) => `${getProductById(item.productId)?.name || "Sản phẩm đã xóa"} × ${item.quantity}`).join(", ");
      return `<tr><td><b>${escapeHtml(receipt.id)}</b><div class="muted">${escapeHtml(receipt.note || "")}</div></td><td>${formatDate(receipt.date)}</td>
        <td>${escapeHtml(description)}</td><td>${quantity}</td><td>${money(total)}</td><td>${escapeHtml(receipt.status)}</td><td>
        ${receipt.status !== "Hoàn tất" ? `<button class="btn-ghost" onclick="openReceiptForm('${escapeHtml(receipt.id)}')">Sửa</button><button class="btn-ghost" onclick="completeReceipt('${escapeHtml(receipt.id)}')">Hoàn tất</button><button class="btn-ghost" onclick="deleteReceipt('${escapeHtml(receipt.id)}')">Xóa</button>` : "—"}</td></tr>`;
    }).join("") : `<tr><td colspan="7" class="muted">Chưa có phiếu nhập.</td></tr>`}
  </tbody></table></div>`;
}

function completeReceipt(id) {
  const receipts = readStoredList(KEYS.receipts);
  const receipt = receipts.find((item) => item.id === id);
  if (!receipt || receipt.status === "Hoàn tất") return;
  const products = loadProducts();
  for (const line of receipt.items) {
    const product = products.find((item) => item.id === line.productId);
    if (!product) {
      toast(`Không tìm thấy sản phẩm trong phiếu: ${line.productId}`);
      return;
    }
  }
  receipt.items.forEach((line) => {
    const product = products.find((item) => item.id === line.productId);
    const oldStock = Number(product.stock || 0);
    const newStock = oldStock + Number(line.quantity);
    product.costPrice = product.costPrice == null
      ? Number(line.costPrice)
      : Math.round((Number(product.costPrice) * oldStock + Number(line.costPrice) * Number(line.quantity)) / newStock);
    product.stock = newStock;
    recordStockMovement({ productId: product.id, quantity: Number(line.quantity), type: "Nhập hàng", reference: receipt.id, date: receipt.date });
  });
  receipt.status = "Hoàn tất";
  receipt.completedAt = new Date().toISOString();
  saveProducts(products);
  localStorage.setItem(KEYS.receipts, JSON.stringify(receipts));
  toast("Đã hoàn tất phiếu nhập và cộng tồn kho");
  renderAdmin();
}

function deleteReceipt(id) {
  const receipts = readStoredList(KEYS.receipts);
  const receipt = receipts.find((item) => item.id === id);
  if (!receipt || receipt.status === "Hoàn tất" || !confirm("Xóa phiếu nhập chưa hoàn tất?")) return;
  localStorage.setItem(KEYS.receipts, JSON.stringify(receipts.filter((item) => item.id !== id)));
  toast("Đã xóa phiếu nhập");
  renderAdmin();
}

function marginSettings() {
  try {
    const settings = JSON.parse(localStorage.getItem(KEYS.margins) || "{}");
    return settings && typeof settings === "object" ? settings : {};
  } catch (error) {
    console.error("Không thể đọc cài đặt lợi nhuận.", error);
    return {};
  }
}

function pricingHtml() {
  const margins = marginSettings();
  return `<p class="muted" style="margin-bottom:14px">Tỷ lệ lợi nhuận tính trên giá vốn. Có thể đặt tỷ lệ riêng cho sản phẩm hoặc dùng tỷ lệ mặc định theo danh mục.</p>
    <div class="table-wrap"><table><thead><tr><th>Sản phẩm</th><th>Danh mục</th><th>Giá vốn</th><th>% lợi nhuận</th><th>Giá bán hiện tại</th><th>Giá gợi ý</th><th>Thao tác</th></tr></thead><tbody>
    ${loadProducts().map((product) => {
      const margin = margins.products && margins.products[product.id] !== undefined
        ? Number(margins.products[product.id])
        : Number(margins.categories && margins.categories[product.category] !== undefined ? margins.categories[product.category] : 30);
      const suggested = product.costPrice == null ? null : Math.round(Number(product.costPrice) * (1 + margin / 100));
      return `<tr><td><b>${escapeHtml(product.name)}</b><div class="muted">${escapeHtml(product.sku)}</div></td>
        <td>${escapeHtml(CATEGORY_LABELS[product.category] || product.category)}</td><td>${product.costPrice === undefined || product.costPrice === null ? "Chưa nhập" : money(product.costPrice)}</td>
        <td><input aria-label="Tỷ lệ lợi nhuận ${escapeHtml(product.name)}" type="number" min="0" step="0.1" value="${margin}" id="margin-${escapeHtml(product.id)}" style="width:90px">%</td>
        <td>${money(product.price)}</td><td>${suggested == null ? "Chưa nhập giá vốn" : money(suggested)}</td><td>
        <button class="btn-ghost" onclick="saveProductMargin('${escapeHtml(product.id)}')">Lưu tỷ lệ</button>
        <button class="btn-ghost" onclick="applyProductPrice('${escapeHtml(product.id)}')">Áp dụng giá</button></td></tr>`;
    }).join("") || `<tr><td colspan="7">Chưa có sản phẩm.</td></tr>`}
    </tbody></table></div>
    <h2 class="font-display" style="margin:22px 0 10px">Tỷ lệ mặc định theo danh mục</h2>
    <div class="table-wrap"><table><thead><tr><th>Danh mục</th><th>Tỷ lệ lợi nhuận (%)</th><th></th></tr></thead><tbody>
    ${loadCategories().map((category) => `<tr><td>${escapeHtml(category.name)}</td><td><input type="number" min="0" step="0.1" id="category-margin-${escapeHtml(category.id)}" value="${Number(margins.categories && margins.categories[category.id] !== undefined ? margins.categories[category.id] : 30)}"></td><td><button class="btn-ghost" onclick="saveCategoryMargin('${escapeHtml(category.id)}')">Lưu tỷ lệ</button></td></tr>`).join("")}
    </tbody></table></div>`;
}

function saveProductMargin(id) {
  const input = document.getElementById(`margin-${id}`);
  const margin = Number(input.value);
  if (!Number.isFinite(margin) || margin < 0) {
    toast("Tỷ lệ lợi nhuận phải là số không âm.");
    return;
  }
  const settings = marginSettings();
  settings.products = { ...(settings.products || {}), [id]: margin };
  localStorage.setItem(KEYS.margins, JSON.stringify(settings));
  toast("Đã lưu tỷ lệ lợi nhuận");
  renderAdmin();
}

function saveCategoryMargin(id) {
  const margin = Number(document.getElementById(`category-margin-${id}`).value);
  if (!Number.isFinite(margin) || margin < 0) {
    toast("Tỷ lệ lợi nhuận phải là số không âm.");
    return;
  }
  const settings = marginSettings();
  settings.categories = { ...(settings.categories || {}), [id]: margin };
  localStorage.setItem(KEYS.margins, JSON.stringify(settings));
  toast("Đã lưu tỷ lệ mặc định");
  renderAdmin();
}

function applyProductPrice(id) {
  const input = document.getElementById(`margin-${id}`);
  const margin = Number(input.value);
  const products = loadProducts();
  const product = products.find((item) => item.id === id);
  if (!product || product.costPrice == null || !Number.isFinite(margin) || margin < 0) {
    toast("Không thể tính giá bán từ dữ liệu hiện tại.");
    return;
  }
  product.price = Math.round(Number(product.costPrice || 0) * (1 + margin / 100));
  const settings = marginSettings();
  settings.products = { ...(settings.products || {}), [id]: margin };
  localStorage.setItem(KEYS.margins, JSON.stringify(settings));
  saveProducts(products);
  toast("Đã cập nhật giá bán theo giá vốn");
  renderAdmin();
}

function expiringReceiptItems() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + 30);
  const cutoffKey = cutoff.toISOString().slice(0, 10);
  return readStoredList(KEYS.receipts).filter((receipt) => receipt.status === "Hoàn tất")
    .flatMap((receipt) => receipt.items.map((item) => ({ ...item, receiptId: receipt.id, receiptDate: receipt.date })))
    .filter((item) => item.expiryDate && item.expiryDate >= new Date().toISOString().slice(0, 10)
      && item.expiryDate <= cutoffKey && Number(getProductById(item.productId)?.stock || 0) > 0);
}

function inventoryHtml() {
  const products = loadProducts().filter((product) => {
    const searchable = [product.name, product.sku, product.brand].join(" ").toLowerCase();
    return (!inventoryCategory || product.category === inventoryCategory) && searchable.includes(query.toLowerCase());
  });
  const movements = readStoredList(KEYS.stockMovements).filter((movement) => {
    const product = getProductById(movement.productId);
    const key = dateKey(movement.date);
    return (!inventoryCategory || product?.category === inventoryCategory)
      && (!movementFrom || (key && key >= movementFrom))
      && (!movementTo || (key && key <= movementTo));
  });
  const alerts = expiringReceiptItems();
  const movementTotals = products.map((product) => {
    const productMovements = movements.filter((movement) => movement.productId === product.id);
    return {
      product,
      incoming: productMovements.filter((movement) => Number(movement.quantity) > 0).reduce((sum, movement) => sum + Number(movement.quantity), 0),
      outgoing: productMovements.filter((movement) => Number(movement.quantity) < 0).reduce((sum, movement) => sum + Math.abs(Number(movement.quantity)), 0),
    };
  });
  return `<div class="filters">
    <label>Danh mục <select onchange="inventoryCategory=this.value;renderAdmin()"><option value="">Tất cả</option>${loadCategories().map((category) => `<option value="${escapeHtml(category.id)}" ${inventoryCategory === category.id ? "selected" : ""}>${escapeHtml(category.name)}</option>`).join("")}</select></label>
    <label>Tồn kho tại ngày <input type="date" value="${inventoryAt}" max="${new Date().toISOString().slice(0, 10)}" onchange="inventoryAt=this.value;renderAdmin()"></label>
    <label>Lịch sử từ <input type="date" value="${movementFrom}" onchange="movementFrom=this.value;renderAdmin()"></label>
    <label>Đến <input type="date" value="${movementTo}" onchange="movementTo=this.value;renderAdmin()"></label>
  </div>
  <h2 class="font-display" style="margin:18px 0 10px">Tồn kho theo sản phẩm</h2>
  <div class="table-wrap"><table><thead><tr><th>Sản phẩm</th><th>Danh mục</th><th>Tồn hiện tại</th><th>Tồn tại ngày chọn</th><th>Cảnh báo</th></tr></thead><tbody>
  ${products.map((product) => {
    const after = readStoredList(KEYS.stockMovements).filter((movement) => movement.productId === product.id && dateKey(movement.date) > inventoryAt).reduce((sum, movement) => sum + Number(movement.quantity || 0), 0);
    const expiry = product.expiryDate || readStoredList(KEYS.receipts).filter((receipt) => receipt.status === "Hoàn tất").flatMap((receipt) => receipt.items).filter((item) => item.productId === product.id && item.expiryDate).map((item) => item.expiryDate).sort()[0];
    const nearExpiry = expiry && expiry >= new Date().toISOString().slice(0, 10) && expiry <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    return `<tr><td><b>${escapeHtml(product.name)}</b></td><td>${escapeHtml(CATEGORY_LABELS[product.category] || product.category)}</td>
      <td>${Number(product.stock || 0)}</td><td>${Math.max(0, Number(product.stock || 0) - after)}</td>
      <td>${Number(product.stock || 0) < 10 ? '<span class="status st-wait">Sắp hết hàng</span> ' : ""}${nearExpiry ? `<span class="status st-cancel">Sắp hết hạn ${formatDate(expiry)}</span>` : ""}</td></tr>`;
  }).join("") || `<tr><td colspan="5">Không có sản phẩm.</td></tr>`}
  </tbody></table></div>
  <h2 class="font-display" style="margin:22px 0 10px">Cảnh báo hạn sử dụng (30 ngày)</h2>
  <div class="table-wrap"><table><thead><tr><th>Sản phẩm</th><th>Phiếu nhập</th><th>Ngày hết hạn</th><th>Số lượng nhập</th></tr></thead><tbody>
  ${alerts.length ? alerts.map((item) => `<tr><td>${escapeHtml(getProductById(item.productId)?.name || "Sản phẩm đã xóa")}</td><td>${escapeHtml(item.receiptId)}</td><td>${formatDate(item.expiryDate)}</td><td>${Number(item.quantity)}</td></tr>`).join("") : '<tr><td colspan="4" class="muted">Không có lô hàng sắp hết hạn đã được khai báo.</td></tr>'}
  </tbody></table></div>
  <h2 class="font-display" style="margin:22px 0 10px">Tổng nhập – xuất theo khoảng thời gian</h2>
  <div class="table-wrap"><table><thead><tr><th>Sản phẩm</th><th>Đã nhập</th><th>Đã xuất</th><th>Tồn hiện tại</th></tr></thead><tbody>
  ${movementTotals.map(({ product, incoming, outgoing }) => `<tr><td>${escapeHtml(product.name)}</td><td>${incoming}</td><td>${outgoing}</td><td>${Number(product.stock || 0)}</td></tr>`).join("") || '<tr><td colspan="4">Không có sản phẩm phù hợp.</td></tr>'}
  </tbody></table></div>
  <h2 class="font-display" style="margin:22px 0 10px">Lịch sử nhập – xuất – điều chỉnh</h2>
  <div class="table-wrap"><table><thead><tr><th>Ngày</th><th>Sản phẩm</th><th>Loại</th><th>Số lượng (+ nhập / − xuất)</th><th>Mã tham chiếu</th></tr></thead><tbody>
  ${movements.length ? movements.map((movement) => `<tr><td>${formatDate(movement.date)}</td><td>${escapeHtml(getProductById(movement.productId)?.name || "Sản phẩm đã xóa")}</td><td>${escapeHtml(movement.type)}</td><td>${Number(movement.quantity) > 0 ? "+" : ""}${Number(movement.quantity)}</td><td>${escapeHtml(movement.reference || "—")}</td></tr>`).join("") : '<tr><td colspan="5" class="muted">Chưa có lịch sử kho trong khoảng thời gian này.</td></tr>'}
  </tbody></table></div>`;
}

function modalHtml() {
  if (!modalType) return "";
  let content = "";
  if (modalType === "product") content = productFormHtml();
  if (modalType === "receipt") content = receiptFormHtml();
  if (modalType === "order" && selectedOrder) content = `<div class="modal wide">
    <h2 class="font-display">Chi tiết đơn ${escapeHtml(selectedOrder.id)}</h2>
    <p><b>Khách hàng:</b> ${escapeHtml(selectedOrder.name || "—")} · ${escapeHtml(selectedOrder.email || "")}</p>
    <p><b>Điện thoại:</b> ${escapeHtml(selectedOrder.phone || "—")}</p><p><b>Địa chỉ:</b> ${escapeHtml(selectedOrder.address || "—")}</p>
    <p><b>Thanh toán:</b> ${escapeHtml(selectedOrder.payment || "—")} · <b>Ngày:</b> ${formatDate(selectedOrder.date)}</p>
    <div class="table-wrap" style="margin:14px 0"><table><thead><tr><th>Sản phẩm</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>
      ${(selectedOrder.items || []).map((item) => `<tr><td>${escapeHtml(item.name || getProductById(item.productId)?.name || "Sản phẩm")}</td><td>${Number(item.quantity)}</td><td>${money(item.price)}</td><td>${money(Number(item.quantity) * Number(item.price))}</td></tr>`).join("")}
    </tbody></table></div>
    <p>Tạm tính ${money(selectedOrder.subtotal)} · Phí giao hàng ${money(selectedOrder.shipping)} · <b>Tổng ${money(selectedOrder.total)}</b></p>
    <div class="actions"><button class="btn-outline" onclick="closeAdminModal()">Đóng</button></div>
  </div>`;
  return `<div class="overlay" onclick="if(event.target===this)closeAdminModal()">${content}</div>`;
}

function closeAdminModal() {
  modalType = "";
  editing = null;
  selectedOrder = null;
  renderAdmin();
}

renderAdmin();
