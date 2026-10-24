const ADMIN_EMAIL = "admin@cothom.vn";
const ADMIN_PASS = "Admin@123";
const LOW_STOCK_LIMIT = 10;
const ORDER_STATUSES = ["Mới đặt", "Đã xử lý", "Đã giao", "Đã hủy"];
// Trạng thái được phép chuyển tiếp. Đơn đã giao hoặc đã hủy thì không đổi nữa.
const NEXT_STATUS = {
  "Mới đặt": ["Đã xử lý", "Đã hủy"],
  "Đã xử lý": ["Đã giao", "Đã hủy"],
};

const demoOrders = [
  { id: "#CT-1048", customer: "Nguyễn Minh Anh", email: "minhanh@gmail.com", phone: "0901 234 567", address: "24 Nguyễn Huệ, Q.1, TP.HCM", product: "Serum Rạng Rỡ Luminous", date: "24 Thg 5, 2026", total: 890000, status: "Mới đặt", items: [{ name: "Serum Rạng Rỡ Luminous", quantity: 1, price: 890000 }] },
  { id: "#CT-1047", customer: "Trần Ngọc Mai", email: "ngocmai@gmail.com", phone: "0988 456 123", address: "18 Lê Lợi, Hải Châu, Đà Nẵng", product: "Kem Dưỡng Ẩm Hydra-Boost", date: "24 Thg 5, 2026", total: 1300000, status: "Đã giao", items: [{ name: "Kem Dưỡng Ẩm Hydra-Boost", quantity: 2, price: 650000 }] },
  { id: "#CT-1046", customer: "Lê Thanh Hà", email: "thanhha@gmail.com", phone: "0912 888 302", address: "57 Tràng Thi, Hoàn Kiếm, Hà Nội", product: "Nước Hoa Rose Oud", date: "23 Thg 5, 2026", total: 1450000, status: "Đã xử lý", items: [{ name: "Nước Hoa Rose Oud", quantity: 1, price: 1450000 }] },
  { id: "#CT-1045", customer: "Phạm Gia Hân", email: "giahan@gmail.com", phone: "0935 777 810", address: "102 Hai Bà Trưng, Cần Thơ", product: "Xịt Khoáng Cánh Hồng", date: "23 Thg 5, 2026", total: 420000, status: "Đã giao", items: [{ name: "Xịt Khoáng Cánh Hồng", quantity: 1, price: 420000 }] },
  { id: "#CT-1044", customer: "Vũ Khánh Linh", email: "", phone: "", address: "", product: "Mặt Nạ Tóc Phục Hồi", date: "22 Thg 5, 2026", total: 760000, status: "Đã hủy", items: [{ name: "Mặt Nạ Tóc Phục Hồi", quantity: 1, price: 760000 }] },
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
let receiptEditing = null;
let categoryEditing = null;
let passwordResetEmail = null;
let selectedOrderId = null;
let orderStatusFilter = "";
let inventoryCategoryFilter = "";
let orderDateFrom = "";
let orderDateTo = "";
let inventoryDateFrom = "";
let inventoryDateTo = "";
let inventoryAtDate = "";

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

  const titles = {
    overview: "Tổng quan cửa hàng",
    customers: "Khách hàng",
    types: "Loại sản phẩm",
    products: "Sản phẩm",
    receipts: "Phiếu nhập hàng",
    pricing: "Quản lý giá bán",
    orders: "Đơn hàng",
    inventory: "Tồn kho",
  };
  const searchable = ["customers", "types", "products", "receipts", "pricing", "orders", "inventory"].includes(view);
  root.innerHTML = `
    <div class="admin-shell">
      <aside class="admin-aside desk" id="admin-aside">
        <button class="admin-brand" onclick="location.href='index.html'">
          <span class="font-display" style="font-size:20px;letter-spacing:.16em">CỎ THƠM</span>
          <small>Quản trị cửa hàng</small>
        </button>
        <nav class="admin-nav">
          <p>Không gian làm việc</p>
          <button class="${view === "overview" ? "active" : ""}" onclick="setView('overview')">Tổng quan</button>
          <button class="${view === "customers" ? "active" : ""}" onclick="setView('customers')">Khách hàng</button>
          <button class="${view === "types" ? "active" : ""}" onclick="setView('types')">Loại sản phẩm</button>
          <button class="${view === "products" ? "active" : ""}" onclick="setView('products')">Sản phẩm</button>
          <button class="${view === "receipts" ? "active" : ""}" onclick="setView('receipts')">Nhập hàng</button>
          <button class="${view === "pricing" ? "active" : ""}" onclick="setView('pricing')">Giá bán</button>
          <button class="${view === "orders" ? "active" : ""}" onclick="setView('orders')">Đơn hàng</button>
          <button class="${view === "inventory" ? "active" : ""}" onclick="setView('inventory')">Tồn kho</button>
        </nav>
        <div class="admin-user">
          <p style="font-size:13px;margin-bottom:8px">An Nhiên · Quản trị viên</p>
          <button class="btn-ghost" style="color:#ccc" onclick="adminLogout()">Đăng xuất</button>
        </div>
      </aside>
      <div class="admin-main">
        <div class="admin-top">
          <div><p class="kicker">Cỏ Thơm Admin</p><h1>${titles[view]}</h1></div>
          ${searchable ? `<input aria-label="Tìm kiếm" placeholder="Tìm kiếm..." value="${query}" oninput="query=this.value;document.getElementById('admin-view').innerHTML=viewHtml()" style="margin-left:auto;max-width:260px;width:100%;border:1px solid var(--border);border-radius:12px;padding:10px 12px">` : ""}
          ${view === "products" ? `<button class="btn btn-dark" onclick="openProductForm(null)">+ Thêm sản phẩm</button>` : ""}
          ${view === "types" ? `<button class="btn btn-dark" onclick="openCategoryForm(null)">+ Thêm loại</button>` : ""}
          ${view === "receipts" ? `<button class="btn btn-dark" onclick="openReceiptForm(null)">+ Tạo phiếu nhập</button>` : ""}
        </div>
        <div id="admin-view">${viewHtml()}</div>
      </div>
    </div>
    <div id="product-modal" class="overlay ${editing === null ? "hidden" : ""}" onclick="if(event.target===this){editing=null;renderAdmin()}">
      ${editing !== null ? productFormHtml() : ""}
    </div>
    <div id="receipt-modal" class="overlay ${receiptEditing === null ? "hidden" : ""}" onclick="if(event.target===this){receiptEditing=null;renderAdmin()}">
      ${receiptEditing !== null ? receiptFormHtml() : ""}
    </div>
    ${categoryEditing !== null ? categoryFormHtml() : ""}
    ${passwordResetEmail !== null ? passwordResetFormHtml() : ""}
    ${selectedOrderId ? orderDetailsHtml(selectedOrderId) : ""}`;
}

function setView(nextView) {
  view = nextView;
  query = "";
  editing = null;
  receiptEditing = null;
  categoryEditing = null;
  passwordResetEmail = null;
  selectedOrderId = null;
  orderDateFrom = "";
  orderDateTo = "";
  inventoryDateFrom = "";
  inventoryDateTo = "";
  inventoryAtDate = "";
  renderAdmin();
}

function adminLogin(e) {
  e.preventDefault();
  const form = new FormData(e.target);
  if (form.get("email").toLowerCase() !== ADMIN_EMAIL || form.get("password") !== ADMIN_PASS) {
    toast("Sai tài khoản quản trị");
    return;
  }
  sessionStorage.setItem(KEYS.admin, "yes");
  setUser({ name: "An Nhiên (Admin)", email: ADMIN_EMAIL, role: "admin" });
  renderAdmin();
}

function adminLogout() {
  sessionStorage.removeItem(KEYS.admin);
  localStorage.removeItem(KEYS.user);
  renderAdmin();
}

function viewHtml() {
  if (view === "overview") return overviewHtml();
  if (view === "customers") return customersHtml();
  if (view === "types") return categoriesHtml();
  if (view === "products") return productsHtml();
  if (view === "receipts") return receiptsHtml();
  if (view === "pricing") return pricingHtml();
  if (view === "orders") return ordersHtml();
  return inventoryHtml();
}

function overviewHtml() {
  const products = loadProducts();
  const orders = ordersForAdmin();
  const activeOrders = orders.filter((order) => order.status !== "Đã hủy");
  const revenue = activeOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  return `
    <div class="stats">
      <article class="stat"><p class="muted">Doanh thu đơn hiện có</p><h3>${money(revenue)}</h3><small class="muted">Không tính đơn đã hủy</small></article>
      <article class="stat"><p class="muted">Đơn hàng</p><h3>${orders.length}</h3><small class="muted">${getOrders().length} đơn phát sinh trên cửa hàng</small></article>
      <article class="stat"><p class="muted">Sản phẩm</p><h3>${products.filter((p) => !p.hidden).length}</h3><small class="muted">đang hiển thị</small></article>
      <article class="stat"><p class="muted">Sắp hết hàng</p><h3>${products.filter((p) => p.stock <= LOW_STOCK_LIMIT && !p.hidden).length}</h3><small class="muted">còn ${LOW_STOCK_LIMIT} món trở xuống</small></article>
    </div>
    <article class="stat" style="margin-top:18px">
      <h2 class="font-display">Cảnh báo sắp hết hàng</h2>
      ${products.filter((p) => p.stock <= LOW_STOCK_LIMIT && !p.hidden).length
        ? `<div class="table-wrap" style="margin-top:12px">${productStockTable(products.filter((p) => p.stock <= LOW_STOCK_LIMIT && !p.hidden))}</div>`
        : `<p class="muted" style="margin-top:12px">Không có sản phẩm nào sắp hết hàng.</p>`}
    </article>
    <div style="margin-top:18px"><h2 class="font-display" style="margin-bottom:12px">Đơn hàng gần đây</h2>${orderTable(orders.slice(0, 5))}</div>`;
}

function orderDateISO(order) {
  if (order.dateISO) return order.dateISO;
  const match = String(order.date || "").match(/(\d{1,2})\s+Thg\s+(\d{1,2}),?\s+(\d{4})/i);
  if (match) return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  const date = new Date(order.date);
  return Number.isNaN(date.getTime()) ? "" : dateToISO(date);
}

function ordersForAdmin() {
  const overrides = readStored(KEYS.adminOrderOverrides, {});
  const live = getOrders().map((order) => ({
    ...order,
    customer: order.name,
    product: (order.items && order.items[0] && order.items[0].name) || "Đơn mới",
    dateISO: orderDateISO(order),
    status: orderStatus(order.status),
    isLive: true,
  }));
  const examples = demoOrders.map((order) => ({
    ...order,
    dateISO: orderDateISO(order),
    status: orderStatus(overrides[order.id] || order.status),
    isLive: false,
  }));
  return [...live, ...examples];
}

function orderTable(list) {
  return `<div class="table-wrap"><table>
    <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Sản phẩm</th><th>Ngày đặt</th><th>Tổng</th><th>Trạng thái</th><th></th></tr></thead>
    <tbody>${list.map((order) => `<tr>
      <td><b>${order.id}</b></td><td>${order.customer || order.name || "—"}<div class="muted">${order.email || ""}</div></td>
      <td>${order.product || (order.items || []).map((item) => item.name).join(", ") || "—"}</td><td>${order.date}</td>
      <td>${money(order.total)}</td><td><span class="status ${statusClass(order.status)}">${order.status}</span></td>
      <td><button class="btn-ghost" onclick="openOrderDetails('${order.id}')">Chi tiết</button></td>
    </tr>`).join("") || `<tr><td colspan="7" class="muted">Chưa có đơn hàng phù hợp.</td></tr>`}</tbody>
  </table></div>`;
}

function ordersHtml() {
  const orders = ordersForAdmin().filter((order) => {
    const text = `${order.id} ${order.customer || order.name || ""} ${order.product || ""}`.toLowerCase();
    const date = orderDateISO(order);
    return text.includes(query.toLowerCase())
      && (!orderDateFrom || date >= orderDateFrom)
      && (!orderDateTo || date <= orderDateTo)
      && (!orderStatusFilter || order.status === orderStatusFilter);
  });
  return `<div class="admin-filters">
    <label>Từ ngày <input type="date" value="${orderDateFrom}" onchange="orderDateFrom=this.value;document.getElementById('admin-view').innerHTML=viewHtml()"></label>
    <label>Đến ngày <input type="date" value="${orderDateTo}" onchange="orderDateTo=this.value;document.getElementById('admin-view').innerHTML=viewHtml()"></label>
    <label>Trạng thái <select onchange="orderStatusFilter=this.value;document.getElementById('admin-view').innerHTML=viewHtml()">
      <option value="">Tất cả trạng thái</option>${ORDER_STATUSES.map((status) => `<option ${orderStatusFilter === status ? "selected" : ""}>${status}</option>`).join("")}
    </select></label>
    <button class="btn-outline" onclick="orderDateFrom='';orderDateTo='';orderStatusFilter='';renderAdmin()">Xóa bộ lọc</button>
  </div>${orderTable(orders)}`;
}

function updateOrderStatus(id, status) {
  const current = ordersForAdmin().find((item) => item.id === id);
  const allowed = current ? NEXT_STATUS[current.status] || [] : [];
  if (!allowed.includes(status)) {
    toast("Không thể chuyển đơn sang trạng thái này");
    return;
  }
  const orders = getOrders();
  const order = orders.find((item) => item.id === id);
  if (order) {
    order.status = status;
    // Hàng đã trừ kho lúc khách đặt, nên hủy đơn thì trả hàng về kho.
    if (status === "Đã hủy") returnOrderStock(order);
    saveOrders(orders);
  } else {
    // Đơn mẫu không nằm trong localStorage nên chỉ lưu trạng thái mới.
    const overrides = readStored(KEYS.adminOrderOverrides, {});
    overrides[id] = status;
    writeStored(KEYS.adminOrderOverrides, overrides);
  }
  toast("Đã cập nhật trạng thái đơn hàng");
  renderAdmin();
}

function returnOrderStock(order) {
  const products = loadProducts();
  const movements = readStored(KEYS.stockMovements, []);
  for (const item of order.items || []) {
    const product = products.find((entry) => String(entry.id) === String(item.productId));
    if (!product) continue;
    product.stock += Number(item.quantity || 0);
    movements.unshift({
      id: "ADJ-" + Date.now() + "-" + item.productId,
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      type: "Hoàn đơn",
      date: todayISO(),
      reference: order.id,
    });
  }
  saveProducts(products);
  writeStored(KEYS.stockMovements, movements);
}

function openOrderDetails(id) {
  selectedOrderId = id;
  renderAdmin();
}

function orderDetailsHtml(id) {
  const order = ordersForAdmin().find((item) => item.id === id);
  if (!order) return "";
  return `<div class="overlay" onclick="if(event.target===this){selectedOrderId=null;renderAdmin()}"><div class="modal wide">
    <div class="row-head"><h2 class="font-display">Chi tiết đơn ${order.id}</h2><button class="btn-ghost" onclick="selectedOrderId=null;renderAdmin()">Đóng</button></div>
    <div class="two-col"><div><p><b>Khách hàng:</b> ${order.customer || order.name || "—"}</p><p><b>Email:</b> ${order.email || "—"}</p>
      <p><b>Số điện thoại:</b> ${order.phone || "—"}</p><p><b>Địa chỉ:</b> ${order.address || "—"}</p></div>
      <div><p><b>Ngày đặt:</b> ${order.date}</p><p><b>Thanh toán:</b> ${order.payment || "—"}</p>
      <p><b>Trạng thái:</b> <span class="status ${statusClass(order.status)}">${order.status}</span></p><p><b>Tổng cộng:</b> ${money(order.total)}</p></div></div>
    <div class="table-wrap" style="margin-top:16px"><table><thead><tr><th>Sản phẩm</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
      <tbody>${(order.items || []).map((item) => `<tr><td>${item.name || getProductById(item.productId)?.name || "Sản phẩm"}</td><td>${item.quantity}</td><td>${money(item.price)}</td><td>${money(item.price * item.quantity)}</td></tr>`).join("")}</tbody>
    </table></div>
    ${orderStatusFormHtml(order)}
  </div></div>`;
}

function orderStatusFormHtml(order) {
  const nextStatuses = NEXT_STATUS[order.status];
  if (!nextStatuses) {
    return `<p class="muted" style="margin-top:16px">Đơn hàng ${order.status.toLowerCase()} nên không thể cập nhật tình trạng nữa.</p>`;
  }
  return `<div class="admin-filters" style="margin-top:16px">
    <label>Cập nhật tình trạng
      <select id="next-status">${nextStatuses.map((status) => `<option>${status}</option>`).join("")}</select>
    </label>
    <button class="btn btn-rose" onclick="updateOrderStatus('${order.id}', document.getElementById('next-status').value)">Cập nhật</button>
  </div>`;
}

function getCustomers() {
  const accounts = readStored(KEYS.customerAccounts, []);
  const orders = [...getOrders(), ...demoOrders];
  const customers = [...demoCustomers];
  const user = getUser();
  if (user && user.email) customers.push({ ...user, joined: "Tài khoản hiện tại" });
  accounts.forEach((account) => customers.push({ ...account, joined: "Tài khoản cửa hàng" }));
  orders.forEach((order) => {
    if (order.email || order.name) customers.push({
      id: order.id,
      name: order.name || order.customer,
      email: order.email || "",
      phone: order.phone || "",
      address: order.address || "",
      joined: order.date || "",
    });
  });
  const unique = new Map();
  customers.forEach((customer) => {
    const key = (customer.email || customer.phone || customer.name || customer.id).toLowerCase();
    const prior = unique.get(key) || {};
    unique.set(key, { ...prior, ...customer });
  });
  return [...unique.values()];
}

function customersHtml() {
  const flags = readStored(KEYS.customerFlags, {});
  const list = getCustomers().filter((customer) =>
    `${customer.name || ""} ${customer.email || ""} ${customer.phone || ""}`.toLowerCase().includes(query.toLowerCase())
  );
  return `<div class="table-wrap"><table><thead><tr><th>Mã</th><th>Tên khách hàng</th><th>Email / SĐT</th><th>Địa chỉ</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
    <tbody>${list.map((customer, index) => {
      const email = (customer.email || "").toLowerCase();
      const locked = Boolean(flags[email] && flags[email].locked);
      return `<tr><td>${customer.id || `KH-${String(index + 1).padStart(3, "0")}`}</td>
        <td><b>${customer.name || "—"}</b></td><td>${email || "—"}<div class="muted">${customer.phone || ""}</div></td>
        <td>${customer.address || "—"}</td><td><span class="status ${locked ? "st-cancel" : "st-done"}">${locked ? "Đã khóa" : "Hoạt động"}</span></td>
        <td>${email ? `<button class="btn-ghost" onclick="toggleCustomerLock('${email}')">${locked ? "Mở khóa" : "Khóa"}</button>` : ""}
          ${email ? `<button class="btn-ghost" onclick="openPasswordReset('${email}')">Reset mật khẩu</button>` : ""}</td></tr>`;
    }).join("") || `<tr><td colspan="6" class="muted">Không tìm thấy khách hàng.</td></tr>`}</tbody></table></div>`;
}

function toggleCustomerLock(email) {
  const flags = readStored(KEYS.customerFlags, {});
  flags[email] = { ...(flags[email] || {}), locked: !(flags[email] && flags[email].locked) };
  writeStored(KEYS.customerFlags, flags);
  toast(flags[email].locked ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản");
  renderAdmin();
}

function openPasswordReset(email) {
  passwordResetEmail = email;
  renderAdmin();
}

function passwordResetFormHtml() {
  return `<div class="overlay" onclick="if(event.target===this){passwordResetEmail=null;renderAdmin()}"><div class="modal">
    <h2 class="font-display">Đặt lại mật khẩu</h2><p class="muted">${passwordResetEmail}</p>
    <form onsubmit="resetCustomerPassword(event)">
      <div class="field"><label>Mật khẩu mới</label><input name="password" type="password" minlength="6" required></div>
      <div class="actions"><button class="btn btn-rose" type="submit">Lưu mật khẩu</button><button class="btn-outline" type="button" onclick="passwordResetEmail=null;renderAdmin()">Hủy</button></div>
    </form></div></div>`;
}

function resetCustomerPassword(e) {
  e.preventDefault();
  const password = new FormData(e.target).get("password").toString();
  if (password.length < 6) {
    toast("Mật khẩu phải có ít nhất 6 ký tự");
    return;
  }
  const accounts = readStored(KEYS.customerAccounts, []);
  const email = passwordResetEmail;
  const customer = getCustomers().find((item) => item.email === email) || {};
  const account = accounts.find((item) => item.email === email) || { email, name: customer.name || email.split("@")[0] };
  account.password = password;
  writeStored(KEYS.customerAccounts, [account, ...accounts.filter((item) => item.email !== email)]);
  toast("Đã đặt lại mật khẩu");
  passwordResetEmail = null;
  renderAdmin();
}

function categoriesHtml() {
  const categories = getCategoryList(true).filter((category) =>
    `${category.label} ${category.id}`.toLowerCase().includes(query.toLowerCase())
  );
  const products = loadProducts();
  return `<div class="table-wrap"><table><thead><tr><th>Loại sản phẩm</th><th>Số sản phẩm</th><th>Hiển thị</th><th>Thao tác</th></tr></thead>
    <tbody>${categories.map((category) => `<tr><td><b>${category.label}</b><div class="muted">${category.id}${category.builtIn ? " · Mặc định" : ""}</div></td>
      <td>${products.filter((product) => product.category === category.id).length}</td>
      <td><span class="status ${category.deleted || category.hidden ? "st-cancel" : "st-done"}">${category.deleted ? "Đã xóa" : category.hidden ? "Đang ẩn" : "Đang hiển thị"}</span></td>
      <td><div class="admin-row-actions">${category.deleted ? `<button class="btn-ghost" onclick="restoreCategory('${category.id}')">Khôi phục</button>` : `<button class="btn-ghost" onclick="openCategoryForm('${category.id}')">Sửa</button>
        <button class="btn-ghost" onclick="toggleCategory('${category.id}')">${category.hidden ? "Hiện" : "Ẩn"}</button>
        <button class="btn-ghost" onclick="deleteCategory('${category.id}')">Xóa</button>`}</div></td></tr>`).join("")}</tbody></table></div>
    <p class="muted" style="margin-top:12px">Không thể xóa loại đang có sản phẩm; hãy chuyển sản phẩm sang loại khác trước.</p>`;
}

function categorySlug(label) {
  return label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function openCategoryForm(id) {
  const category = id ? getCategoryList(true).find((item) => item.id === id) : null;
  categoryEditing = { id: id || "", label: category ? category.label : "" };
  renderAdmin();
}

function categoryFormHtml() {
  const isNew = !categoryEditing.id;
  return `<div class="overlay" onclick="if(event.target===this){categoryEditing=null;renderAdmin()}"><div class="modal">
    <h2 class="font-display">${isNew ? "Thêm loại sản phẩm" : "Sửa loại sản phẩm"}</h2>
    <form onsubmit="saveCategory(event)"><div class="field"><label>Tên loại</label><input name="label" value="${categoryEditing.label}" required></div>
      <div class="actions"><button class="btn btn-rose" type="submit">Lưu</button><button class="btn-outline" type="button" onclick="categoryEditing=null;renderAdmin()">Hủy</button></div>
    </form></div></div>`;
}

function saveCategory(e) {
  e.preventDefault();
  const label = new FormData(e.target).get("label").toString().trim();
  const id = categoryEditing.id;
  if (!id) {
    const newId = categorySlug(label);
    if (!newId || getCategoryList(true).some((category) => category.id === newId)) {
      toast("Tên loại không hợp lệ hoặc đã tồn tại");
      return;
    }
    const custom = readStored(KEYS.categories, []);
    custom.push({ id: newId, label, image: CATEGORY_META.Skincare.image, tagline: "Khám phá bộ sưu tập" });
    writeStored(KEYS.categories, custom);
    toast("Đã thêm loại sản phẩm");
  } else if (CATEGORIES.includes(id)) {
    const labels = readStored(KEYS.categoryLabels, {});
    labels[id] = label;
    writeStored(KEYS.categoryLabels, labels);
  } else {
    const custom = readStored(KEYS.categories, []);
    const target = custom.find((item) => item.id === id);
    if (!target) {
      toast("Không tìm thấy loại sản phẩm");
      return;
    }
    target.label = label;
    writeStored(KEYS.categories, custom);
  }
  if (id) toast("Đã cập nhật loại sản phẩm");
  categoryEditing = null;
  renderAdmin();
}

function toggleCategory(id) {
  const hidden = readStored(KEYS.categoryHidden, {});
  hidden[id] = !hidden[id];
  writeStored(KEYS.categoryHidden, hidden);
  toast(hidden[id] ? "Đã ẩn loại sản phẩm" : "Đã hiển thị loại sản phẩm");
  renderAdmin();
}

function deleteCategory(id) {
  if (loadProducts().some((product) => product.category === id)) {
    toast("Loại này còn sản phẩm; hãy chuyển sản phẩm trước khi xóa.");
    return;
  }
  if (!confirm("Xóa loại sản phẩm này?")) return;
  if (CATEGORIES.includes(id)) {
    const deleted = readStored(KEYS.categoryDeleted, {});
    deleted[id] = true;
    writeStored(KEYS.categoryDeleted, deleted);
  } else {
    writeStored(KEYS.categories, readStored(KEYS.categories, []).filter((category) => category.id !== id));
  }
  const hidden = readStored(KEYS.categoryHidden, {});
  delete hidden[id];
  writeStored(KEYS.categoryHidden, hidden);
  toast("Đã xóa loại sản phẩm");
  renderAdmin();
}

function restoreCategory(id) {
  const deleted = readStored(KEYS.categoryDeleted, {});
  delete deleted[id];
  writeStored(KEYS.categoryDeleted, deleted);
  toast("Đã khôi phục loại sản phẩm");
  renderAdmin();
}

function productsHtml() {
  const list = loadProducts().filter((product) =>
    `${product.name} ${product.brand} ${product.sku}`.toLowerCase().includes(query.toLowerCase())
  );
  return `<div class="table-wrap"><table><thead><tr><th>Sản phẩm</th><th>SKU</th><th>Danh mục</th><th>Giá bán</th><th>Tồn kho</th><th>Trạng thái</th><th></th></tr></thead>
    <tbody>${list.map((product) => `<tr><td><b>${product.name}</b><div class="muted">${product.brand}</div></td><td>${product.sku}</td>
      <td>${categoryLabel(product.category)}</td><td>${money(product.price)}</td><td>${product.stock}</td>
      <td><span class="status ${product.hidden ? "st-cancel" : "st-done"}">${product.hidden ? "Đang ẩn" : "Đang bán"}</span></td>
      <td><div class="admin-row-actions"><button class="btn-ghost" onclick="openProductForm('${product.id}')">Sửa</button>
        <button class="btn-ghost" onclick="toggleProductVisibility('${product.id}')">${product.hidden ? "Hiện" : "Ẩn"}</button>
        <button class="btn-ghost" onclick="deleteProduct('${product.id}')">Xóa</button></div></td></tr>`).join("") || `<tr><td colspan="7" class="muted">Không tìm thấy sản phẩm.</td></tr>`}</tbody></table></div>`;
}

function openProductForm(id) {
  editing = id ? getProductById(id) : "new";
  renderAdmin();
}

function productFormHtml() {
  const isNew = editing === "new";
  const product = isNew ? { name: "", brand: "", category: "Skincare", sku: "", price: 0, costPrice: "", marginPercent: "", stock: 0, description: "" } : editing;
  if (!product) return "";
  return `<div class="modal wide"><h2 class="font-display">${isNew ? "Thêm sản phẩm" : "Sửa sản phẩm"}</h2>
    <form onsubmit="saveProduct(event)">
      <div class="two-col"><div class="field"><label>Tên sản phẩm</label><input name="name" value="${product.name}" required></div>
      <div class="field"><label>Thương hiệu</label><input name="brand" value="${product.brand}" required></div>
      <div class="field"><label>Mã SKU</label><input name="sku" value="${product.sku}" required></div>
      <div class="field"><label>Loại sản phẩm</label><select name="category">${getCategoryList(true).map((category) => `<option value="${category.id}" ${product.category === category.id ? "selected" : ""}>${category.label}</option>`).join("")}</select></div>
      <div class="field"><label>Giá vốn (VND)</label><input name="costPrice" type="number" min="0" value="${product.costPrice || ""}"></div>
      <div class="field"><label>Biên lợi nhuận riêng (%)</label><input name="marginPercent" type="number" min="0" step="0.1" value="${product.marginPercent ?? ""}" placeholder="Dùng mức mặc định của loại"></div>
      <div class="field"><label>Giá bán (VND)</label><input name="price" type="number" min="0" value="${product.price}" required></div>
      <div class="field"><label>${isNew ? "Tồn kho ban đầu" : "Tồn kho hiện tại"}</label><input name="stock" type="number" min="0" value="${product.stock}" ${isNew ? "" : "readonly"} required>
        ${isNew ? "" : `<small class="muted">Tồn kho chỉ thay đổi qua phiếu nhập và đơn hàng.</small>`}</div></div>
      <div class="field"><label>Mô tả</label><textarea name="description" rows="3">${product.description || ""}</textarea></div>
      <div class="actions"><button class="btn btn-rose" type="submit">Lưu sản phẩm</button><button class="btn-outline" type="button" onclick="editing=null;renderAdmin()">Hủy</button></div>
    </form></div>`;
}

function saveProduct(e) {
  e.preventDefault();
  const form = new FormData(e.target);
  const list = loadProducts();
  const draft = {
    name: form.get("name").toString().trim(),
    brand: form.get("brand").toString().trim(),
    sku: form.get("sku").toString().trim(),
    category: form.get("category"),
    price: Number(form.get("price")),
    costPrice: Number(form.get("costPrice")) || 0,
    marginPercent: form.get("marginPercent") === "" ? null : Number(form.get("marginPercent")),
    stock: Number(form.get("stock")),
    description: form.get("description"),
  };
  if (draft.price < 0 || draft.stock < 0 || draft.costPrice < 0 || (draft.marginPercent !== null && draft.marginPercent < 0)) {
    toast("Giá, tồn kho và biên lợi nhuận không được âm");
    return;
  }
  if (isNewProduct()) {
    const newProduct = { ...draft, id: "p" + Date.now(), images: DEFAULT_PRODUCTS[0].images, rating: 0, reviews: 0, ingredients: "", directions: "", tags: [] };
    list.unshift(newProduct);
    if (newProduct.stock > 0) {
      const movements = readStored(KEYS.stockMovements, []);
      movements.unshift({
        id: "OPEN-" + newProduct.id,
        productId: newProduct.id,
        productName: newProduct.name,
        quantity: newProduct.stock,
        type: "Tồn đầu kỳ",
        date: todayISO(),
        reference: newProduct.sku,
      });
      writeStored(KEYS.stockMovements, movements);
    }
    toast("Đã thêm sản phẩm");
  } else {
    const index = list.findIndex((product) => product.id === editing.id);
    if (index < 0) {
      toast("Không tìm thấy sản phẩm cần cập nhật");
      return;
    }
    draft.stock = list[index].stock;
    list[index] = { ...list[index], ...draft };
    toast("Đã cập nhật sản phẩm");
  }
  saveProducts(list);
  editing = null;
  renderAdmin();
}

function isNewProduct() {
  return editing === "new";
}

function toggleProductVisibility(id) {
  const products = loadProducts();
  const product = products.find((item) => String(item.id) === String(id));
  if (!product) return;
  product.hidden = !product.hidden;
  saveProducts(products);
  toast(product.hidden ? "Đã ẩn sản phẩm" : "Đã hiển thị sản phẩm");
  renderAdmin();
}

function deleteProduct(id) {
  const product = getProductById(id);
  if (!product || !confirm(`Xóa “${product.name}”?`)) return;
  saveProducts(loadProducts().filter((item) => String(item.id) !== String(id)));
  toast("Đã xóa sản phẩm");
  renderAdmin();
}

function receiptsHtml() {
  const receipts = readStored(KEYS.receipts, []).filter((receipt) =>
    `${receipt.id} ${receipt.date} ${receipt.status}`.toLowerCase().includes(query.toLowerCase())
  );
  return `<div class="table-wrap"><table><thead><tr><th>Mã phiếu</th><th>Ngày nhập</th><th>Sản phẩm</th><th>Tổng số lượng</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
    <tbody>${receipts.map((receipt) => `<tr><td><b>${receipt.id}</b></td><td>${receipt.date}</td>
      <td>${receipt.items.map((item) => `${item.name} × ${item.quantity}`).join("<br>")}</td>
      <td>${receipt.items.reduce((sum, item) => sum + Number(item.quantity), 0)}</td>
      <td><span class="status ${receipt.status === "Hoàn thành" ? "st-done" : "st-wait"}">${receipt.status}</span></td>
      <td>${receipt.status === "Nháp" ? `<div class="admin-row-actions"><button class="btn-ghost" onclick="openReceiptForm('${receipt.id}')">Sửa</button><button class="btn-ghost" onclick="completeReceipt('${receipt.id}')">Hoàn thành</button><button class="btn-ghost" onclick="deleteReceipt('${receipt.id}')">Xóa</button></div>` : `<span class="muted">Đã ghi nhận kho</span>`}</td></tr>`).join("") || `<tr><td colspan="6" class="muted">Chưa có phiếu nhập hàng.</td></tr>`}</tbody></table></div>
    <p class="muted" style="margin-top:12px">Phiếu nháp có thể sửa; phiếu đã hoàn thành được khóa để bảo toàn lịch sử tồn kho.</p>`;
}

function openReceiptForm(id) {
  const receipts = readStored(KEYS.receipts, []);
  receiptEditing = id ? receipts.find((receipt) => receipt.id === id && receipt.status === "Nháp") : {
    id: "",
    date: todayISO(),
    items: [{ productId: loadProducts()[0]?.id || "", quantity: 1, costPrice: 0 }],
  };
  if (!receiptEditing) {
    toast("Chỉ có thể sửa phiếu nhập đang ở trạng thái nháp");
    return;
  }
  renderAdmin();
}

function receiptFormHtml() {
  const lines = receiptEditing.items.map(receiptLineHtml).join("");
  return `<div class="modal wide"><h2 class="font-display">${receiptEditing.id ? "Sửa phiếu nhập" : "Tạo phiếu nhập"}</h2>
    <form onsubmit="saveReceipt(event)">
      <div class="field"><label>Ngày nhập</label><input name="date" type="date" value="${receiptEditing.date}" required></div>
      <div id="receipt-lines">${lines}</div>
      <button class="btn-outline" type="button" onclick="addReceiptLine()">+ Thêm sản phẩm</button>
      <p class="muted" style="margin-top:10px">Không quản lý nhà cung cấp. Chỉ ghi nhận ngày nhập, giá vốn và số lượng.</p>
      <div class="actions"><button class="btn btn-rose" type="submit">Lưu phiếu nháp</button><button class="btn-outline" type="button" onclick="receiptEditing=null;renderAdmin()">Hủy</button></div>
    </form></div>`;
}

function receiptLineHtml(item) {
  return `<div class="receipt-line admin-filters">
    <label>Sản phẩm<select name="productId" required>${loadProducts().map((product) => `<option value="${product.id}" ${String(item.productId) === String(product.id) ? "selected" : ""}>${product.name}</option>`).join("")}</select></label>
    <label>Số lượng<input name="quantity" type="number" min="1" value="${item.quantity}" required></label>
    <label>Giá nhập<input name="costPrice" type="number" min="0" value="${item.costPrice}" required></label>
    <button class="btn-ghost" type="button" onclick="removeReceiptLine(this)">Xóa</button>
  </div>`;
}

function addReceiptLine() {
  const product = loadProducts()[0];
  if (!product) {
    toast("Hãy tạo sản phẩm trước khi lập phiếu nhập");
    return;
  }
  document.getElementById("receipt-lines").insertAdjacentHTML("beforeend", receiptLineHtml({ productId: product.id, quantity: 1, costPrice: product.costPrice || 0 }));
}

function removeReceiptLine(button) {
  const lines = document.querySelectorAll(".receipt-line");
  if (lines.length <= 1) {
    toast("Phiếu nhập cần có ít nhất một sản phẩm");
    return;
  }
  button.closest(".receipt-line").remove();
}

function saveReceipt(e) {
  e.preventDefault();
  const form = e.target;
  const productsById = new Map(loadProducts().map((product) => [String(product.id), product]));
  const items = [...form.querySelectorAll(".receipt-line")].map((line) => {
    const productId = line.querySelector('[name="productId"]').value;
    const product = productsById.get(String(productId));
    return {
      productId,
      name: product ? product.name : "",
      quantity: Number(line.querySelector('[name="quantity"]').value),
      costPrice: Number(line.querySelector('[name="costPrice"]').value),
    };
  });
  if (items.some((item) => !item.name || item.quantity <= 0 || item.costPrice < 0)) {
    toast("Vui lòng kiểm tra sản phẩm, số lượng và giá nhập");
    return;
  }
  const receipts = readStored(KEYS.receipts, []);
  const receipt = {
    id: receiptEditing.id || "PN-" + Date.now().toString().slice(-8),
    date: new FormData(form).get("date"),
    status: "Nháp",
    items,
  };
  const existing = receipts.findIndex((item) => item.id === receipt.id);
  if (existing >= 0) receipts[existing] = receipt;
  else receipts.unshift(receipt);
  writeStored(KEYS.receipts, receipts);
  receiptEditing = null;
  toast("Đã lưu phiếu nhập nháp");
  renderAdmin();
}

function completeReceipt(id) {
  const receipts = readStored(KEYS.receipts, []);
  const receipt = receipts.find((item) => item.id === id);
  if (!receipt || receipt.status !== "Nháp") return;
  if (!confirm(`Hoàn thành phiếu ${id} và cộng hàng vào kho?`)) return;
  const products = loadProducts();
  const movements = readStored(KEYS.stockMovements, []);
  for (const item of receipt.items) {
    const product = products.find((entry) => String(entry.id) === String(item.productId));
    if (!product) {
      toast(`Không tìm thấy sản phẩm "${item.name}". Phiếu chưa được hoàn thành.`);
      return;
    }
  }
  for (const item of receipt.items) {
    const product = products.find((entry) => String(entry.id) === String(item.productId));
    product.stock += Number(item.quantity);
    product.costPrice = Number(item.costPrice);
    movements.unshift({
      id: `${id}-${item.productId}`,
      productId: product.id,
      productName: product.name,
      quantity: Number(item.quantity),
      type: "Nhập hàng",
      date: receipt.date,
      reference: id,
    });
  }
  receipt.status = "Hoàn thành";
  receipt.completedAt = new Date().toISOString();
  saveProducts(products);
  writeStored(KEYS.stockMovements, movements);
  writeStored(KEYS.receipts, receipts);
  toast("Đã hoàn thành phiếu nhập và cập nhật tồn kho");
  renderAdmin();
}

function deleteReceipt(id) {
  const receipts = readStored(KEYS.receipts, []);
  const receipt = receipts.find((item) => item.id === id);
  if (!receipt || receipt.status !== "Nháp" || !confirm(`Xóa phiếu nháp ${id}?`)) return;
  writeStored(KEYS.receipts, receipts.filter((item) => item.id !== id));
  toast("Đã xóa phiếu nhập nháp");
  renderAdmin();
}

function pricingHtml() {
  const categories = getCategoryList(true);
  const margins = readStored(KEYS.categoryMargins, {});
  const products = loadProducts().filter((product) =>
    `${product.name} ${product.sku} ${categoryLabel(product.category)}`.toLowerCase().includes(query.toLowerCase())
  );
  return `<article class="stat"><h2 class="font-display">Biên lợi nhuận mặc định theo loại</h2>
    <form onsubmit="saveCategoryMargins(event)"><div class="admin-margin-grid">${categories.map((category) => `<label>${category.label}
      <span><input name="${category.id}" type="number" min="0" step="0.1" value="${margins[category.id] ?? 30}"> %</span></label>`).join("")}</div>
      <button class="btn btn-rose" type="submit" style="margin-top:12px">Lưu biên lợi nhuận</button>
    </form><p class="muted" style="margin-top:8px">Tỷ lệ mặc định áp dụng cho sản phẩm chưa có tỷ lệ riêng; giá bán đề xuất = giá vốn × (1 + tỷ lệ).</p>
  </article>
  <div class="table-wrap" style="margin-top:18px"><table><thead><tr><th>Sản phẩm / loại</th><th>Giá vốn</th><th>Biên LN</th><th>Giá bán</th><th>Giá đề xuất</th><th></th></tr></thead>
    <tbody>${products.map((product) => {
      const margin = product.marginPercent ?? margins[product.category] ?? 30;
      const suggested = product.costPrice ? Math.round(product.costPrice * (1 + Number(margin) / 100)) : null;
      return `<tr><td><b>${product.name}</b><div class="muted">${categoryLabel(product.category)}</div></td><td>${product.costPrice ? money(product.costPrice) : "Chưa nhập"}</td>
        <td>${margin}%${product.marginPercent !== null && product.marginPercent !== undefined ? " · Riêng" : " · Mặc định"}</td><td>${money(product.price)}</td>
        <td>${suggested === null ? "Cần nhập giá vốn" : money(suggested)}</td>
        <td><div class="admin-row-actions"><button class="btn-ghost" onclick="applyProductMargin('${product.id}')">Áp dụng giá đề xuất</button><button class="btn-ghost" onclick="openProductForm('${product.id}')">Sửa giá vốn</button></div></td></tr>`;
    }).join("") || `<tr><td colspan="6" class="muted">Không có sản phẩm phù hợp.</td></tr>`}</tbody></table></div>`;
}

function saveCategoryMargins(e) {
  const form = new FormData(e.target);
  const margins = {};
  for (const [category, value] of form.entries()) {
    const percent = Number(value);
    if (percent < 0 || !Number.isFinite(percent)) {
      toast("Biên lợi nhuận phải là số không âm");
      return;
    }
    margins[category] = percent;
  }
  writeStored(KEYS.categoryMargins, margins);
  toast("Đã lưu biên lợi nhuận mặc định");
  document.getElementById("admin-view").innerHTML = viewHtml();
}

function applyProductMargin(id) {
  const products = loadProducts();
  const product = products.find((item) => String(item.id) === String(id));
  if (!product || !product.costPrice) {
    toast("Hãy nhập giá vốn trước khi áp dụng giá đề xuất");
    return;
  }
  const margins = readStored(KEYS.categoryMargins, {});
  const percent = product.marginPercent ?? margins[product.category] ?? 30;
  product.price = Math.round(product.costPrice * (1 + Number(percent) / 100));
  saveProducts(products);
  toast("Đã cập nhật giá bán đề xuất");
  document.getElementById("admin-view").innerHTML = viewHtml();
}

function productStockTable(products) {
  return `<table><thead><tr><th>Sản phẩm</th><th>Loại</th><th>Tồn kho</th><th>Cảnh báo</th></tr></thead><tbody>
    ${products.map((product) => `<tr><td>${product.name}</td><td>${categoryLabel(product.category)}</td><td>${product.stock}</td><td><span class="status st-wait">Sắp hết hàng</span></td></tr>`).join("")}</tbody></table>`;
}

// Nhập hàng và hoàn đơn làm tăng tồn, xuất bán làm giảm tồn.
function movementChange(movement) {
  return (movement.type === "Xuất bán" ? -1 : 1) * Number(movement.quantity || 0);
}

// Tồn cuối một ngày = tồn hiện tại trừ đi các phát sinh xảy ra sau ngày đó.
function stockOnDate(product, date, movements) {
  return movements
    .filter((movement) => String(movement.productId) === String(product.id) && movement.date > date)
    .reduce((stock, movement) => stock - movementChange(movement), Number(product.stock || 0));
}

function matchesQuery(product) {
  return `${product.name} ${product.sku}`.toLowerCase().includes(query.toLowerCase());
}

// "2026-10-24" → "24/10/2026"
function formatISODate(iso) {
  return iso.split("-").reverse().join("/");
}

function inventoryHtml() {
  const products = loadProducts();
  const categories = getCategoryList(true);
  const allMovements = readStored(KEYS.stockMovements, []);
  const movements = allMovements.filter((movement) => {
    const product = products.find((item) => String(item.id) === String(movement.productId));
    const date = movement.date || "";
    return (!inventoryCategoryFilter || (product && product.category === inventoryCategoryFilter))
      && (!inventoryDateFrom || date >= inventoryDateFrom)
      && (!inventoryDateTo || date <= inventoryDateTo)
      && `${movement.productName} ${movement.type} ${movement.reference}`.toLowerCase().includes(query.toLowerCase());
  });
  const stockProducts = products.filter((product) => !inventoryCategoryFilter || product.category === inventoryCategoryFilter);
  const low = stockProducts.filter((product) => product.stock <= LOW_STOCK_LIMIT && !product.hidden);
  const summary = stockProducts.map((product) => {
    const productMovements = allMovements.filter((movement) => String(movement.productId) === String(product.id));
    const periodMovements = productMovements.filter((movement) =>
      (!inventoryDateFrom || movement.date >= inventoryDateFrom)
      && (!inventoryDateTo || movement.date <= inventoryDateTo)
    );
    const quantityIn = periodMovements
      .filter((movement) => movement.type === "Nhập hàng" || movement.type === "Hoàn đơn")
      .reduce((sum, movement) => sum + Number(movement.quantity || 0), 0);
    const quantityOut = periodMovements
      .filter((movement) => movement.type === "Xuất bán")
      .reduce((sum, movement) => sum + Number(movement.quantity || 0), 0);
    const closingStock = inventoryDateTo ? stockOnDate(product, inventoryDateTo, allMovements) : Number(product.stock || 0);
    // Tồn đầu kỳ + Nhập − Xuất = Tồn cuối kỳ
    const openingStock = closingStock - quantityIn + quantityOut;
    return { product, openingStock, quantityIn, quantityOut, closingStock };
  }).filter((item) => matchesQuery(item.product));
  const atDate = inventoryAtDate || todayISO();
  const stockAtDate = stockProducts.filter(matchesQuery).map((product) => ({ product, stock: stockOnDate(product, atDate, allMovements) }));
  return `<div class="admin-filters">
    <label>Loại sản phẩm <select onchange="inventoryCategoryFilter=this.value;document.getElementById('admin-view').innerHTML=viewHtml()"><option value="">Tất cả loại</option>
      ${categories.map((category) => `<option value="${category.id}" ${inventoryCategoryFilter === category.id ? "selected" : ""}>${category.label}</option>`).join("")}</select></label>
    <label>Từ ngày <input type="date" value="${inventoryDateFrom}" onchange="inventoryDateFrom=this.value;document.getElementById('admin-view').innerHTML=viewHtml()"></label>
    <label>Đến ngày <input type="date" value="${inventoryDateTo}" onchange="inventoryDateTo=this.value;document.getElementById('admin-view').innerHTML=viewHtml()"></label>
    <button class="btn-outline" onclick="inventoryCategoryFilter='';inventoryDateFrom='';inventoryDateTo='';renderAdmin()">Xóa bộ lọc</button>
  </div>
  <div class="stats" style="margin:14px 0"><article class="stat"><p class="muted">Sản phẩm theo bộ lọc</p><h3>${stockProducts.length}</h3></article>
    <article class="stat"><p class="muted">Tổng số lượng tồn</p><h3>${stockProducts.reduce((sum, product) => sum + Number(product.stock || 0), 0)}</h3></article>
    <article class="stat"><p class="muted">Sắp hết hàng</p><h3>${low.length}</h3></article></div>
  <article class="stat"><h2 class="font-display">Cảnh báo sản phẩm sắp hết</h2>${low.length ? `<div class="table-wrap" style="margin-top:12px">${productStockTable(low)}</div>` : `<p class="muted" style="margin-top:8px">Không có sản phẩm sắp hết hàng.</p>`}</article>
  <h2 class="font-display" style="margin:18px 0 10px">Tồn kho theo loại tại một thời điểm</h2>
  <div class="admin-filters">
    <label>Tại ngày <input type="date" value="${atDate}" max="${todayISO()}" onchange="inventoryAtDate=this.value;document.getElementById('admin-view').innerHTML=viewHtml()"></label>
  </div>
  <div class="table-wrap"><table><thead><tr><th>Sản phẩm</th><th>Loại</th><th>Tồn cuối ngày ${formatISODate(atDate)}</th><th>Tình trạng</th></tr></thead>
    <tbody>${stockAtDate.map(({ product, stock }) => `<tr><td>${product.name}</td><td>${categoryLabel(product.category)}</td><td>${stock}</td>
      <td>${stock <= LOW_STOCK_LIMIT ? `<span class="status st-wait">Sắp hết hàng</span>` : `<span class="status st-done">Còn hàng</span>`}</td></tr>`).join("") || `<tr><td colspan="4" class="muted">Không có sản phẩm phù hợp.</td></tr>`}</tbody></table></div>
  <h2 class="font-display" style="margin:18px 0 10px">Nhập – xuất – tồn theo thời gian</h2>
  <p class="muted" style="margin-bottom:10px">Chọn "Từ ngày" – "Đến ngày" ở bộ lọc phía trên. Gõ tên sản phẩm vào ô tìm kiếm để xem một sản phẩm.</p>
  <div class="table-wrap"><table><thead><tr><th>Sản phẩm</th><th>Loại</th><th>Tồn đầu kỳ</th><th>Nhập trong kỳ</th><th>Xuất trong kỳ</th><th>Tồn cuối kỳ</th></tr></thead>
    <tbody>${summary.map(({ product, openingStock, quantityIn, quantityOut, closingStock }) => `<tr><td>${product.name}</td><td>${categoryLabel(product.category)}</td><td>${openingStock}</td><td>${quantityIn}</td><td>${quantityOut}</td><td>${closingStock}</td></tr>`).join("") || `<tr><td colspan="6" class="muted">Không có sản phẩm phù hợp.</td></tr>`}</tbody></table></div>
  <h3 class="font-display" style="margin:18px 0 10px">Chi tiết giao dịch kho</h3>
  <div class="table-wrap"><table><thead><tr><th>Ngày</th><th>Sản phẩm</th><th>Loại giao dịch</th><th>Số lượng</th><th>Mã tham chiếu</th></tr></thead>
    <tbody>${movements.map((movement) => `<tr><td>${movement.date}</td><td>${movement.productName}</td><td>${movement.type}</td><td>${movement.type === "Xuất bán" ? "−" : "+"}${movement.quantity}</td><td>${movement.reference || "—"}</td></tr>`).join("") || `<tr><td colspan="5" class="muted">Chưa có giao dịch kho trong khoảng thời gian này.</td></tr>`}</tbody></table></div>`;
}

renderAdmin();
