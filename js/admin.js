/* =====================================================================
   TRANG QUẢN TRỊ — giao diện viết sẵn trong admin.html.
   File này chỉ: đổ dữ liệu vào các bảng (<tbody>), ẩn/hiện tab và cửa sổ, xử lý khi bấm nút.
   Mục lục (Ctrl+F theo số mục, ví dụ "== 3."):
     0. Cấu hình và dữ liệu mẫu        5. Loại sản phẩm
     1. Đăng nhập, chuyển tab          6. Sản phẩm
     2. Tổng quan                      7. Nhập hàng (phiếu nhập)
     3. Đơn hàng                       8. Giá bán
     4. Khách hàng                     9. Tồn kho
   ===================================================================== */

/* == 0. CẤU HÌNH VÀ DỮ LIỆU MẪU ======================================== */
const ADMIN_EMAIL = "admin@cothom.vn";
const ADMIN_PASS = "Admin@123";
const LOW_STOCK_LIMIT = 10; // mức cảnh báo mặc định khi sản phẩm chưa đặt mức riêng
const RESET_PASSWORD = "1";
const DEFAULT_MARGIN = 30;

// Bước kế tiếp khi bấm "Duyệt". Đơn đã giao hoặc đã hủy thì không đổi được nữa (không quay lại).
const NEXT_STEP = {
  "Mới đặt": "Đã xử lý",
  "Đã xử lý": "Đã giao",
};

const demoOrders = [
  { id: "CT-1048", customer: "Nguyễn Minh Anh", email: "minhanh@gmail.com", phone: "0901 234 567", address: "24 Nguyễn Huệ, Q.1, TP.HCM", product: "Serum Rạng Rỡ Luminous", date: "24 Thg 5, 2026", total: 890000, status: "Mới đặt", items: [{ name: "Serum Rạng Rỡ Luminous", quantity: 1, price: 890000 }] },
  { id: "CT-1047", customer: "Trần Ngọc Mai", email: "ngocmai@gmail.com", phone: "0988 456 123", address: "18 Lê Lợi, Hải Châu, Đà Nẵng", product: "Kem Dưỡng Ẩm Hydra-Boost", date: "24 Thg 5, 2026", total: 1300000, status: "Đã giao", items: [{ name: "Kem Dưỡng Ẩm Hydra-Boost", quantity: 2, price: 650000 }] },
  { id: "CT-1046", customer: "Lê Thanh Hà", email: "thanhha@gmail.com", phone: "0912 888 302", address: "57 Tràng Thi, Hoàn Kiếm, Hà Nội", product: "Nước Hoa Rose Oud", date: "23 Thg 5, 2026", total: 1450000, status: "Đã xử lý", items: [{ name: "Nước Hoa Rose Oud", quantity: 1, price: 1450000 }] },
  { id: "CT-1045", customer: "Phạm Gia Hân", email: "giahan@gmail.com", phone: "0935 777 810", address: "102 Hai Bà Trưng, Cần Thơ", product: "Xịt Khoáng Cánh Hồng", date: "23 Thg 5, 2026", total: 420000, status: "Đã giao", items: [{ name: "Xịt Khoáng Cánh Hồng", quantity: 1, price: 420000 }] },
  { id: "CT-1044", customer: "Vũ Khánh Linh", email: "", phone: "", address: "", product: "Mặt Nạ Tóc Phục Hồi", date: "22 Thg 5, 2026", total: 760000, status: "Đã hủy", items: [{ name: "Mặt Nạ Tóc Phục Hồi", quantity: 1, price: 760000 }] },
];

const demoCustomers = [
  { id: "KH-001", name: "Nguyễn Minh Anh", email: "minhanh@gmail.com", phone: "0901 234 567", address: "24 Nguyễn Huệ, Q.1, TP.HCM" },
  { id: "KH-002", name: "Trần Ngọc Mai", email: "ngocmai@gmail.com", phone: "0988 456 123", address: "18 Lê Lợi, Hải Châu, Đà Nẵng" },
  { id: "KH-003", name: "Lê Thanh Hà", email: "thanhha@gmail.com", phone: "0912 888 302", address: "57 Tràng Thi, Hoàn Kiếm, Hà Nội" },
  { id: "KH-004", name: "Phạm Gia Hân", email: "giahan@gmail.com", phone: "0935 777 810", address: "102 Hai Bà Trưng, Cần Thơ" },
];

let currentTab = "overview";
let editingProductId = null;   // null = thêm mới
let editingCategoryId = null;  // null = thêm mới
let editingReceiptId = null;   // null = tạo phiếu mới

function lowStockLimit(product) {
  return product.minStock ?? LOW_STOCK_LIMIT;
}

function isLowStock(product) {
  return product.stock <= lowStockLimit(product);
}

// Lấy giá trị một ô nhập trong admin.html theo id.
function valueOf(id) {
  return document.getElementById(id).value;
}

function setText(id, text) {
  document.getElementById(id).textContent = text;
}

/* == 1. ĐĂNG NHẬP, CHUYỂN TAB, CỬA SỔ ================================= */

function isAdmin() {
  return sessionStorage.getItem(KEYS.admin) === "yes";
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
  showAdminPage();
}

function adminLogout() {
  sessionStorage.removeItem(KEYS.admin);
  localStorage.removeItem(KEYS.user);
  document.getElementById("admin-page").classList.add("hidden");
  document.getElementById("login-page").classList.remove("hidden");
}

function showAdminPage() {
  document.getElementById("login-page").classList.add("hidden");
  document.getElementById("admin-page").classList.remove("hidden");
  showTab(currentTab);
}

// Ẩn mọi <section class="tab">, chỉ hiện tab được chọn rồi đổ dữ liệu vào tab đó.
function showTab(name) {
  currentTab = name;
  document.querySelectorAll(".tab").forEach((section) => section.classList.add("hidden"));
  const section = document.getElementById("tab-" + name);
  section.classList.remove("hidden");
  setText("page-title", section.dataset.title);
  document.querySelectorAll(".admin-nav button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === name);
  });
  refresh();
}

// Vẽ lại tab đang mở (gọi sau mỗi lần thêm / sửa / xóa dữ liệu).
function refresh() {
  if (currentTab === "overview") renderOverview();
  if (currentTab === "customers") renderCustomers();
  if (currentTab === "types") renderCategories();
  if (currentTab === "products") renderProducts();
  if (currentTab === "receipts") renderReceipts();
  if (currentTab === "pricing") renderPricing();
  if (currentTab === "orders") renderOrders();
  if (currentTab === "inventory") renderInventory();
}

function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
}

function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

// Ô type="date" hiện theo ngôn ngữ máy (có máy là mm/dd/yyyy), nên ô chữ đứng trước nó hiển thị dd/mm/yyyy.
function showDate(dateInput) {
  dateInput.previousElementSibling.value = formatDate(dateInput.value);
}

function setDate(id, iso) {
  const input = document.getElementById(id);
  input.value = iso;
  showDate(input);
}

// Nút "Xóa bộ lọc": làm trống mọi ô trong thanh lọc của tab.
function clearFilters(tab) {
  document.querySelectorAll(`#tab-${tab} .admin-filters input, #tab-${tab} .admin-filters select`).forEach((field) => {
    field.value = "";
  });
  refresh();
}

// Đổ danh sách loại sản phẩm vào một ô <select>, giữ nguyên lựa chọn đang có.
function fillCategoryOptions(select, firstOption) {
  const selected = select.value;
  select.innerHTML = firstOption + getCategoryList(true)
    .map((category) => `<option value="${category.id}">${category.label}</option>`)
    .join("");
  select.value = selected;
}

function emptyRow(columns, text) {
  return `<tr><td colspan="${columns}" class="muted">${text}</td></tr>`;
}

/* == 2. TỔNG QUAN ===================================================== */

function renderOverview() {
  const products = loadProducts();
  const orders = ordersForAdmin();
  const revenue = orders
    .filter((order) => order.status !== "Đã hủy")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);
  const low = products.filter((product) => isLowStock(product) && !product.hidden);

  setText("stat-revenue", money(revenue));
  setText("stat-orders", orders.length);
  setText("stat-shop-orders", getOrders().length);
  setText("stat-products", products.filter((product) => !product.hidden).length);
  setText("stat-low", low.length);
  document.getElementById("overview-low-body").innerHTML =
    low.map(lowStockRowHtml).join("") || emptyRow(5, "Không có sản phẩm nào sắp hết hàng.");
  document.getElementById("overview-orders-body").innerHTML =
    orders.slice(0, 5).map(orderRowHtml).join("") || emptyRow(7, "Chưa có đơn hàng.");
}

/* == 3. ĐƠN HÀNG ====================================================== */

function orderDateISO(order) {
  if (order.dateISO) return order.dateISO;
  const match = String(order.date || "").match(/(\d{1,2})\s+Thg\s+(\d{1,2}),?\s+(\d{4})/i);
  if (match) return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  const date = new Date(order.date);
  return Number.isNaN(date.getTime()) ? "" : dateToISO(date);
}

// Đơn khách đặt trên cửa hàng + đơn mẫu.
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

function orderRowHtml(order) {
  return `<tr>
    <td><b>${order.id}</b></td>
    <td>${order.customer || order.name || "—"}<div class="muted">${order.email || ""}</div></td>
    <td>${order.product || "—"}</td>
    <td>${formatDate(order.dateISO)}</td>
    <td>${money(order.total)}</td>
    <td><span class="status ${statusClass(order.status)}">${order.status}</span></td>
    <td><div class="admin-row-actions">
      ${orderActionsHtml(order)}
      <button class="btn-ghost" onclick="openOrderDetails('${order.id}')">Chi tiết</button>
    </div></td>
  </tr>`;
}

function renderOrders() {
  const search = valueOf("orders-search").toLowerCase();
  const from = valueOf("orders-from");
  const to = valueOf("orders-to");
  const status = valueOf("orders-status");
  const orders = ordersForAdmin().filter((order) =>
    `${order.id} ${order.customer || order.name || ""} ${order.product || ""}`.toLowerCase().includes(search)
    && (!from || order.dateISO >= from)
    && (!to || order.dateISO <= to)
    && (!status || order.status === status)
  );
  document.getElementById("orders-body").innerHTML =
    orders.map(orderRowHtml).join("") || emptyRow(7, "Chưa có đơn hàng phù hợp.");
}

function orderActionsHtml(order) {
  const next = NEXT_STEP[order.status];
  if (!next) return "";
  return `<button class="btn-ghost" onclick="changeOrderStatus('${order.id}', '${next}')">Duyệt</button>
    <button class="btn-ghost" onclick="changeOrderStatus('${order.id}', 'Đã hủy')">Hủy</button>`;
}

function changeOrderStatus(id, status) {
  if (!confirm(`Chuyển đơn ${id} sang "${status}"?\nSau khi chuyển sẽ không quay lại trạng thái trước được.`)) return;
  updateOrderStatus(id, status);
}

function updateOrderStatus(id, status) {
  const current = ordersForAdmin().find((item) => item.id === id);
  const next = current && NEXT_STEP[current.status];
  if (!next || (status !== next && status !== "Đã hủy")) {
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
  refresh();
  if (!document.getElementById("order-modal").classList.contains("hidden")) openOrderDetails(id);
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

// Điền thông tin đơn vào cửa sổ "Chi tiết đơn" trong admin.html rồi mở cửa sổ.
function openOrderDetails(id) {
  const order = ordersForAdmin().find((item) => item.id === id);
  if (!order) return;
  setText("order-id", order.id);
  setText("order-customer", order.customer || order.name || "—");
  setText("order-email", order.email || "—");
  setText("order-phone", order.phone || "—");
  setText("order-address", order.address || "—");
  setText("order-date", formatDate(order.dateISO));
  setText("order-payment", order.payment || "—");
  setText("order-status", order.status);
  document.getElementById("order-status").className = "status " + statusClass(order.status);
  setText("order-total", money(order.total));
  document.getElementById("order-items-body").innerHTML = (order.items || []).map((item) => `<tr>
    <td>${item.name || "Sản phẩm"}</td>
    <td>${item.quantity}</td>
    <td>${money(item.price)}</td>
    <td>${money(item.price * item.quantity)}</td>
  </tr>`).join("");
  document.getElementById("order-actions").innerHTML = NEXT_STEP[order.status]
    ? `<b>Cập nhật tình trạng:</b> ${orderActionsHtml(order)}`
    : `<p class="muted">Đơn hàng ${order.status.toLowerCase()} nên không thể cập nhật tình trạng nữa.</p>`;
  openModal("order-modal");
}

/* == 4. KHÁCH HÀNG ==================================================== */

// Khách mẫu + tài khoản đã đăng ký trên cửa hàng (trùng email thì gộp làm một).
function getCustomers() {
  const accounts = readStored(KEYS.customerAccounts, []);
  const customers = [...demoCustomers];
  accounts.forEach((account) => {
    const index = customers.findIndex((customer) => customer.email === account.email);
    if (index >= 0) customers[index] = { ...customers[index], ...account };
    else customers.push({ ...account, id: "KH-" + String(customers.length + 1).padStart(3, "0") });
  });
  return customers;
}

function renderCustomers() {
  const search = valueOf("customers-search").toLowerCase();
  const flags = readStored(KEYS.customerFlags, {});
  const list = getCustomers().filter((customer) =>
    `${customer.name || ""} ${customer.email || ""} ${customer.phone || ""}`.toLowerCase().includes(search)
  );
  document.getElementById("customers-body").innerHTML = list.map((customer) => {
    const email = customer.email.toLowerCase();
    const locked = Boolean(flags[email] && flags[email].locked);
    return `<tr>
      <td>${customer.id}</td>
      <td><b>${customer.name || "—"}</b></td>
      <td>${email}<div class="muted">${customer.phone || ""}</div></td>
      <td>${customer.address || "—"}</td>
      <td><span class="status ${locked ? "st-cancel" : "st-done"}">${locked ? "Đã khóa" : "Đang hoạt động"}</span></td>
      <td><div class="admin-row-actions">
        <button class="btn-ghost" onclick="toggleCustomerLock('${email}')">${locked ? "Mở khóa" : "Khóa"}</button>
        <button class="btn-ghost" onclick="resetCustomerPassword('${email}')">Reset mật khẩu</button>
      </div></td>
    </tr>`;
  }).join("") || emptyRow(6, "Không tìm thấy khách hàng.");
}

function toggleCustomerLock(email) {
  const flags = readStored(KEYS.customerFlags, {});
  flags[email] = { ...(flags[email] || {}), locked: !(flags[email] && flags[email].locked) };
  writeStored(KEYS.customerFlags, flags);
  toast(flags[email].locked ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản");
  refresh();
}

// Khách mẫu chưa có tài khoản thì tạo tài khoản mới để đăng nhập được bằng mật khẩu "1".
function resetCustomerPassword(email) {
  if (!confirm(`Đặt lại mật khẩu của ${email} về "${RESET_PASSWORD}"?`)) return;
  const accounts = readStored(KEYS.customerAccounts, []);
  const customer = getCustomers().find((item) => item.email === email);
  const account = accounts.find((item) => item.email === email)
    || { email, name: customer.name, phone: customer.phone || "", address: customer.address || "" };
  account.password = RESET_PASSWORD;
  writeStored(KEYS.customerAccounts, [account, ...accounts.filter((item) => item.email !== email)]);
  toast(`Đã đặt lại mật khẩu của ${email} thành "${RESET_PASSWORD}"`);
}

/* == 5. LOẠI SẢN PHẨM ================================================= */

function renderCategories() {
  const search = valueOf("types-search").toLowerCase();
  const products = loadProducts();
  const categories = getCategoryList(true).filter((category) =>
    `${category.label} ${category.id}`.toLowerCase().includes(search)
  );
  document.getElementById("types-body").innerHTML = categories.map((category) => {
    const status = category.deleted ? "Đã xóa" : category.hidden ? "Đang ẩn" : "Đang hiển thị";
    const actions = category.deleted
      ? `<button class="btn-ghost" onclick="restoreCategory('${category.id}')">Khôi phục</button>`
      : `<button class="btn-ghost" onclick="openCategoryForm('${category.id}')">Sửa</button>
         <button class="btn-ghost" onclick="toggleCategory('${category.id}')">${category.hidden ? "Hiện" : "Ẩn"}</button>
         <button class="btn-ghost" onclick="deleteCategory('${category.id}')">Xóa</button>`;
    return `<tr>
      <td><b>${category.label}</b><div class="muted">${category.id}${category.builtIn ? " · Mặc định" : ""}</div></td>
      <td>${products.filter((product) => product.category === category.id).length}</td>
      <td><span class="status ${category.deleted || category.hidden ? "st-cancel" : "st-done"}">${status}</span></td>
      <td><div class="admin-row-actions">${actions}</div></td>
    </tr>`;
  }).join("") || emptyRow(4, "Không tìm thấy loại sản phẩm.");
}

function categorySlug(label) {
  return label.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function openCategoryForm(id) {
  editingCategoryId = id;
  const category = id ? getCategoryList(true).find((item) => item.id === id) : null;
  setText("category-title", id ? "Sửa loại sản phẩm" : "Thêm loại sản phẩm");
  document.getElementById("category-form").elements.label.value = category ? category.label : "";
  openModal("category-modal");
}

function saveCategory(e) {
  e.preventDefault();
  const label = new FormData(e.target).get("label").toString().trim();
  const id = editingCategoryId;
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
    toast("Đã cập nhật loại sản phẩm");
  } else {
    const custom = readStored(KEYS.categories, []);
    const target = custom.find((item) => item.id === id);
    if (!target) {
      toast("Không tìm thấy loại sản phẩm");
      return;
    }
    target.label = label;
    writeStored(KEYS.categories, custom);
    toast("Đã cập nhật loại sản phẩm");
  }
  closeModal("category-modal");
  refresh();
}

function toggleCategory(id) {
  const hidden = readStored(KEYS.categoryHidden, {});
  hidden[id] = !hidden[id];
  writeStored(KEYS.categoryHidden, hidden);
  toast(hidden[id] ? "Đã ẩn loại sản phẩm" : "Đã hiển thị loại sản phẩm");
  refresh();
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
  refresh();
}

function restoreCategory(id) {
  const deleted = readStored(KEYS.categoryDeleted, {});
  delete deleted[id];
  writeStored(KEYS.categoryDeleted, deleted);
  toast("Đã khôi phục loại sản phẩm");
  refresh();
}

/* == 6. SẢN PHẨM ====================================================== */

function renderProducts() {
  const search = valueOf("products-search").toLowerCase();
  const list = loadProducts().filter((product) =>
    `${product.name} ${product.brand} ${product.sku}`.toLowerCase().includes(search)
  );
  document.getElementById("products-body").innerHTML = list.map((product) => `<tr>
    <td><img class="admin-thumb" src="${product.images[0]}" alt=""></td>
    <td><b>${product.name}</b><div class="muted">${product.brand}</div></td>
    <td>${product.sku}</td>
    <td>${categoryLabel(product.category)}</td>
    <td>${money(product.price)}</td>
    <td>${product.stock}</td>
    <td><span class="status ${product.hidden ? "st-cancel" : "st-done"}">${product.hidden ? "Đang ẩn" : "Đang bán"}</span></td>
    <td><div class="admin-row-actions">
      <button class="btn-ghost" onclick="openProductForm('${product.id}')">Sửa</button>
      <button class="btn-ghost" onclick="toggleProductVisibility('${product.id}')">${product.hidden ? "Hiện" : "Ẩn"}</button>
      <button class="btn-ghost" onclick="deleteProduct('${product.id}')">Xóa</button>
    </div></td>
  </tr>`).join("") || emptyRow(8, "Không tìm thấy sản phẩm.");
}

// Điền thông tin sản phẩm vào form trong admin.html (để trống nếu thêm mới) rồi mở cửa sổ.
function openProductForm(id) {
  editingProductId = id;
  const isNew = !id;
  const product = isNew
    ? { name: "", brand: "", category: "Skincare", sku: "", price: 0, costPrice: "", marginPercent: "", stock: 0, description: "", images: [""] }
    : getProductById(id);
  const form = document.getElementById("product-form").elements;
  fillCategoryOptions(form.category, "");
  form.name.value = product.name;
  form.brand.value = product.brand;
  form.sku.value = product.sku;
  form.category.value = product.category;
  form.costPrice.value = product.costPrice || "";
  form.marginPercent.value = product.marginPercent ?? "";
  form.price.value = money(product.price);
  form.stock.value = product.stock;
  form.stock.readOnly = !isNew; // tồn kho chỉ nhập lúc thêm mới, sau đó đổi qua phiếu nhập và đơn hàng
  form.minStock.value = lowStockLimit(product);
  form.image.value = product.images[0] || "";
  form.description.value = product.description || "";
  document.getElementById("image-preview").src = product.images[0] || "";
  setText("product-title", isNew ? "Thêm sản phẩm" : "Sửa sản phẩm");
  setText("stock-label", isNew ? "Tồn kho ban đầu" : "Tồn kho hiện tại");
  document.getElementById("stock-hint").classList.toggle("hidden", isNew);
  openModal("product-modal");
}

function saveProduct(e) {
  e.preventDefault();
  const form = new FormData(e.target);
  const list = loadProducts();
  const isNew = !editingProductId;
  const draft = {
    name: form.get("name").toString().trim(),
    brand: form.get("brand").toString().trim(),
    sku: form.get("sku").toString().trim(),
    category: form.get("category"),
    costPrice: Number(form.get("costPrice")) || 0,
    marginPercent: form.get("marginPercent") === "" ? null : Number(form.get("marginPercent")),
    stock: Number(form.get("stock")),
    minStock: Number(form.get("minStock")),
    description: form.get("description"),
  };
  if (draft.stock < 0 || draft.minStock < 0 || draft.costPrice < 0 || (draft.marginPercent !== null && draft.marginPercent < 0)) {
    toast("Giá vốn, tồn kho và % lợi nhuận không được âm");
    return;
  }
  if (list.some((product) => product.sku.toLowerCase() === draft.sku.toLowerCase() && product.id !== editingProductId)) {
    toast("Mã SKU đã tồn tại");
    return;
  }
  const image = form.get("image").toString().trim();
  if (isNew) {
    const newProduct = { ...draft, id: "p" + Date.now(), price: 0, images: [image], rating: 0, reviews: 0, ingredients: "", directions: "", tags: [] };
    updateSellingPrice(newProduct);
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
    const index = list.findIndex((product) => product.id === editingProductId);
    draft.stock = list[index].stock;
    // Thay hình đầu tiên, giữ các hình phụ còn lại.
    list[index] = { ...list[index], ...draft, images: [image, ...list[index].images.slice(1)] };
    updateSellingPrice(list[index]);
    toast("Đã cập nhật sản phẩm");
  }
  saveProducts(list);
  closeModal("product-modal");
  refresh();
}

function toggleProductVisibility(id) {
  const products = loadProducts();
  const product = products.find((item) => String(item.id) === String(id));
  if (!product) return;
  product.hidden = !product.hidden;
  saveProducts(products);
  toast(product.hidden ? "Đã ẩn sản phẩm" : "Đã hiển thị sản phẩm");
  refresh();
}

// Chọn file ảnh từ máy: đổi thành chuỗi base64 để lưu được vào localStorage.
function chooseProductImage(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 300 * 1024) {
    toast("Ảnh tối đa 300KB vì dữ liệu lưu trong trình duyệt");
    input.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById("product-image").value = reader.result;
    document.getElementById("image-preview").src = reader.result;
  };
  reader.readAsDataURL(file);
}

// Sản phẩm đã có phiếu nhập, đơn hàng hoặc giao dịch kho thì không được xóa (để giữ lịch sử), chỉ được ẩn.
function productHasHistory(id) {
  const isThisProduct = (item) => String(item.productId) === String(id);
  return readStored(KEYS.stockMovements, []).some(isThisProduct)
    || readStored(KEYS.receipts, []).some((receipt) => receipt.items.some(isThisProduct))
    || getOrders().some((order) => (order.items || []).some(isThisProduct));
}

// Lý do không được xóa sản phẩm ("" = được xóa).
function cannotDeleteReason(product) {
  if (!product.hidden) return "đang bán trên cửa hàng";
  if (product.stock > 0) return `còn ${product.stock} sản phẩm trong kho`;
  if (productHasHistory(product.id)) return "đã có phiếu nhập hoặc đơn hàng";
  return "";
}

// Chỉ xóa được sản phẩm đã ẩn, hết hàng và chưa từng nhập / bán; còn lại thì chỉ được ẩn.
function deleteProduct(id) {
  const product = getProductById(id);
  if (!product) return;
  const reason = cannotDeleteReason(product);
  if (reason) {
    if (product.hidden) {
      toast(`Không thể xóa “${product.name}” vì ${reason}.`);
    } else if (confirm(`Không thể xóa “${product.name}” vì ${reason}.\nẨn sản phẩm khỏi cửa hàng?`)) {
      toggleProductVisibility(id);
    }
    return;
  }
  if (!confirm(`Xóa “${product.name}”?`)) return;
  saveProducts(loadProducts().filter((item) => String(item.id) !== String(id)));
  toast("Đã xóa sản phẩm");
  refresh();
}

/* == 7. NHẬP HÀNG (PHIẾU NHẬP) ======================================== */

function renderReceipts() {
  const search = valueOf("receipts-search").toLowerCase();
  const from = valueOf("receipts-from");
  const to = valueOf("receipts-to");
  const status = valueOf("receipts-status");
  const receipts = readStored(KEYS.receipts, []).filter((receipt) =>
    `${receipt.id} ${formatDate(receipt.date)} ${receipt.status} ${receipt.items.map((item) => item.name).join(" ")}`.toLowerCase().includes(search)
    && (!from || receipt.date >= from)
    && (!to || receipt.date <= to)
    && (!status || receipt.status === status)
  );
  document.getElementById("receipts-body").innerHTML = receipts.map((receipt) => {
    const actions = receipt.status === "Nháp"
      ? `<div class="admin-row-actions">
          <button class="btn-ghost" onclick="openReceiptForm('${receipt.id}')">Sửa</button>
          <button class="btn-ghost" onclick="completeReceipt('${receipt.id}')">Hoàn thành</button>
          <button class="btn-ghost" onclick="deleteReceipt('${receipt.id}')">Xóa</button>
        </div>`
      : `<span class="muted">Đã ghi nhận kho</span>`;
    return `<tr>
      <td><b>${receipt.id}</b></td>
      <td>${formatDate(receipt.date)}</td>
      <td>${receipt.items.map((item) => `${item.name} × ${item.quantity}`).join("<br>")}</td>
      <td>${receipt.items.reduce((sum, item) => sum + Number(item.quantity), 0)}</td>
      <td><span class="status ${receipt.status === "Hoàn thành" ? "st-done" : "st-wait"}">${receipt.status}</span></td>
      <td>${actions}</td>
    </tr>`;
  }).join("") || emptyRow(6, "Chưa có phiếu nhập hàng.");
}

// Mở form phiếu nhập: id = null là tạo mới, có id là sửa phiếu nháp.
function openReceiptForm(id) {
  const receipt = id
    ? readStored(KEYS.receipts, []).find((item) => item.id === id && item.status === "Nháp")
    : { date: todayISO(), items: [{ productId: loadProducts()[0]?.id || "", quantity: 1, costPrice: 0 }] };
  if (!receipt) {
    toast("Chỉ có thể sửa phiếu nhập đang ở trạng thái nháp");
    return;
  }
  editingReceiptId = id;
  setText("receipt-title", id ? "Sửa phiếu nhập" : "Tạo phiếu nhập");
  setDate("receipt-date", receipt.date);
  document.getElementById("receipt-lines").innerHTML = receipt.items.map(receiptLineHtml).join("");
  openModal("receipt-modal");
}

// Một dòng sản phẩm trong phiếu nhập (chọn sản phẩm, số lượng, giá nhập).
function receiptLineHtml(item) {
  const options = loadProducts()
    .map((product) => `<option value="${product.id}" ${String(item.productId) === String(product.id) ? "selected" : ""}>${product.name}</option>`)
    .join("");
  return `<div class="receipt-line admin-filters">
    <label>Sản phẩm<select name="productId" required>${options}</select></label>
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
  document.getElementById("receipt-lines").insertAdjacentHTML("beforeend",
    receiptLineHtml({ productId: product.id, quantity: 1, costPrice: product.costPrice || 0 }));
}

function removeReceiptLine(button) {
  if (document.querySelectorAll(".receipt-line").length <= 1) {
    toast("Phiếu nhập cần có ít nhất một sản phẩm");
    return;
  }
  button.closest(".receipt-line").remove();
}

function saveReceipt(e) {
  e.preventDefault();
  const form = e.target;
  const products = loadProducts();
  const items = [...form.querySelectorAll(".receipt-line")].map((line) => {
    const productId = line.querySelector('[name="productId"]').value;
    const product = products.find((item) => String(item.id) === String(productId));
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
  const date = valueOf("receipt-date");
  if (!date) {
    toast("Vui lòng chọn ngày nhập");
    return;
  }
  const receipts = readStored(KEYS.receipts, []);
  const receipt = { id: editingReceiptId || "PN-" + Date.now().toString().slice(-8), date, status: "Nháp", items };
  const index = receipts.findIndex((item) => item.id === receipt.id);
  if (index >= 0) receipts[index] = receipt;
  else receipts.unshift(receipt);
  writeStored(KEYS.receipts, receipts);
  toast("Đã lưu phiếu nhập nháp");
  closeModal("receipt-modal");
  refresh();
}

function completeReceipt(id) {
  const receipts = readStored(KEYS.receipts, []);
  const receipt = receipts.find((item) => item.id === id);
  if (!receipt || receipt.status !== "Nháp") return;
  if (!confirm(`Hoàn thành phiếu ${id} và cộng hàng vào kho?`)) return;
  const products = loadProducts();
  const movements = readStored(KEYS.stockMovements, []);
  const missing = receipt.items.find((item) => !products.some((product) => String(product.id) === String(item.productId)));
  if (missing) {
    toast(`Không tìm thấy sản phẩm "${missing.name}". Phiếu chưa được hoàn thành.`);
    return;
  }
  for (const item of receipt.items) {
    const product = products.find((entry) => String(entry.id) === String(item.productId));
    // Giá vốn bình quân gia quyền:
    // (tồn cũ × giá vốn cũ + số lượng nhập × giá nhập) / (tồn cũ + số lượng nhập)
    const oldStock = Math.max(Number(product.stock || 0), 0);
    const quantity = Number(item.quantity);
    product.costPrice = Math.round((oldStock * Number(product.costPrice || 0) + quantity * Number(item.costPrice)) / (oldStock + quantity));
    product.stock = oldStock + quantity;
    updateSellingPrice(product);
    movements.unshift({
      id: `${id}-${item.productId}`,
      productId: product.id,
      productName: product.name,
      quantity,
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
  refresh();
}

function deleteReceipt(id) {
  const receipts = readStored(KEYS.receipts, []);
  const receipt = receipts.find((item) => item.id === id);
  if (!receipt || receipt.status !== "Nháp" || !confirm(`Xóa phiếu nháp ${id}?`)) return;
  writeStored(KEYS.receipts, receipts.filter((item) => item.id !== id));
  toast("Đã xóa phiếu nhập nháp");
  refresh();
}

/* == 8. GIÁ BÁN ======================================================= */

// % lợi nhuận: ưu tiên % riêng của sản phẩm, nếu không có thì dùng % của loại.
function marginOf(product) {
  const margins = readStored(KEYS.categoryMargins, {});
  return product.marginPercent ?? margins[product.category] ?? DEFAULT_MARGIN;
}

// Giá bán = giá vốn × (1 + % lợi nhuận), làm tròn đến 1.000đ. Chưa có giá vốn thì giữ nguyên giá.
function updateSellingPrice(product) {
  if (product.costPrice > 0) {
    product.price = Math.round((product.costPrice * (1 + marginOf(product) / 100)) / 1000) * 1000;
  }
}

function renderPricing() {
  const margins = readStored(KEYS.categoryMargins, {});
  document.getElementById("margin-grid").innerHTML = getCategoryList(true).map((category) => `<label>${category.label}
    <span><input name="${category.id}" type="number" min="0" step="0.1" value="${margins[category.id] ?? DEFAULT_MARGIN}"> %</span>
  </label>`).join("");
  renderPricingTable();
}

function renderPricingTable() {
  const select = document.getElementById("pricing-category");
  fillCategoryOptions(select, `<option value="">Tất cả loại</option>`);
  const search = valueOf("pricing-search").toLowerCase();
  const products = loadProducts().filter((product) =>
    (!select.value || product.category === select.value)
    && `${product.name} ${product.sku}`.toLowerCase().includes(search)
  );
  document.getElementById("pricing-body").innerHTML = products.map((product) => `<tr>
    <td><b>${product.name}</b><div class="muted">${product.sku}</div></td>
    <td>${categoryLabel(product.category)}</td>
    <td>${product.costPrice ? money(product.costPrice) : "Chưa có"}</td>
    <td><input id="margin-${product.id}" type="number" min="0" step="0.1" value="${product.marginPercent ?? ""}" placeholder="Theo loại" style="width:90px"> %</td>
    <td>${marginOf(product)}%</td>
    <td><b>${money(product.price)}</b></td>
    <td><button class="btn-ghost" onclick="saveProductMargin('${product.id}')">Lưu</button></td>
  </tr>`).join("") || emptyRow(7, "Không có sản phẩm phù hợp.");
}

function saveCategoryMargins(e) {
  e.preventDefault();
  const margins = {};
  for (const [category, value] of new FormData(e.target).entries()) {
    const percent = Number(value);
    if (percent < 0 || !Number.isFinite(percent)) {
      toast("Biên lợi nhuận phải là số không âm");
      return;
    }
    margins[category] = percent;
  }
  writeStored(KEYS.categoryMargins, margins);
  const products = loadProducts();
  products.forEach(updateSellingPrice);
  saveProducts(products);
  toast("Đã lưu % lợi nhuận và cập nhật giá bán");
  refresh();
}

function saveProductMargin(id) {
  const value = valueOf("margin-" + id);
  if (value !== "" && !(Number(value) >= 0)) {
    toast("% lợi nhuận phải là số không âm");
    return;
  }
  const products = loadProducts();
  const product = products.find((item) => String(item.id) === String(id));
  // Để trống nghĩa là dùng % của loại.
  product.marginPercent = value === "" ? null : Number(value);
  updateSellingPrice(product);
  saveProducts(products);
  toast("Đã cập nhật giá bán " + product.name);
  renderPricingTable();
}

/* == 9. TỒN KHO ======================================================= */

function lowStockRowHtml(product) {
  return `<tr>
    <td>${product.name}</td>
    <td>${categoryLabel(product.category)}</td>
    <td>${product.stock}</td>
    <td>${lowStockLimit(product)}</td>
    <td><span class="status st-wait">Sắp hết hàng</span></td>
  </tr>`;
}

function movementChange(movement) {
  return (movement.type === "Xuất bán" ? -1 : 1) * Number(movement.quantity || 0);
}

// Tồn cuối một ngày = tồn hiện tại trừ đi các phát sinh xảy ra sau ngày đó.
function stockOnDate(product, date, movements) {
  return movements
    .filter((movement) => String(movement.productId) === String(product.id) && movement.date > date)
    .reduce((stock, movement) => stock - movementChange(movement), Number(product.stock || 0));
}

function sumOf(rows, key) {
  return rows.reduce((sum, row) => sum + row[key], 0);
}

function renderInventory() {
  const categorySelect = document.getElementById("inventory-category");
  fillCategoryOptions(categorySelect, `<option value="">Tất cả loại</option>`);
  const category = categorySelect.value;
  const from = valueOf("inventory-from");
  const to = valueOf("inventory-to");
  const search = valueOf("inventory-search").toLowerCase();
  if (!valueOf("inventory-at")) setDate("inventory-at", todayISO());
  const atDate = valueOf("inventory-at");

  const products = loadProducts();
  const allMovements = readStored(KEYS.stockMovements, []);
  const matches = (product) => `${product.name} ${product.sku}`.toLowerCase().includes(search);
  const stockProducts = products.filter((product) => !category || product.category === category);
  const low = stockProducts.filter((product) => isLowStock(product) && !product.hidden);

  // Thống kê nhanh
  setText("stat-inventory-count", stockProducts.length);
  setText("stat-inventory-total", stockProducts.reduce((sum, product) => sum + Number(product.stock || 0), 0));
  setText("stat-inventory-low", low.length);

  // Cảnh báo sắp hết
  document.getElementById("inventory-low-body").innerHTML =
    low.map(lowStockRowHtml).join("") || emptyRow(5, "Không có sản phẩm sắp hết hàng.");

  // Tồn kho tại một ngày
  setText("inventory-at-label", formatDate(atDate));
  document.getElementById("inventory-at-body").innerHTML = stockProducts.filter(matches).map((product) => {
    const stock = stockOnDate(product, atDate, allMovements);
    return `<tr>
      <td>${product.name}</td>
      <td>${categoryLabel(product.category)}</td>
      <td>${stock}</td>
      <td>${lowStockLimit(product)}</td>
      <td>${stock <= lowStockLimit(product)
        ? `<span class="status st-wait">Sắp hết hàng</span>`
        : `<span class="status st-done">Còn hàng</span>`}</td>
    </tr>`;
  }).join("") || emptyRow(5, "Không có sản phẩm phù hợp.");

  // Nhập – xuất – tồn trong khoảng thời gian
  const summary = stockProducts.filter(matches).map((product) => {
    const periodMovements = allMovements.filter((movement) =>
      String(movement.productId) === String(product.id)
      && (!from || movement.date >= from)
      && (!to || movement.date <= to)
    );
    const quantityIn = periodMovements
      .filter((movement) => movement.type === "Nhập hàng" || movement.type === "Hoàn đơn")
      .reduce((sum, movement) => sum + Number(movement.quantity || 0), 0);
    const quantityOut = periodMovements
      .filter((movement) => movement.type === "Xuất bán")
      .reduce((sum, movement) => sum + Number(movement.quantity || 0), 0);
    const closingStock = to ? stockOnDate(product, to, allMovements) : Number(product.stock || 0);
    // Tồn đầu kỳ + Nhập − Xuất = Tồn cuối kỳ
    const openingStock = closingStock - quantityIn + quantityOut;
    return { product, openingStock, quantityIn, quantityOut, closingStock };
  });
  document.getElementById("inventory-summary-body").innerHTML = summary.map((row) => `<tr>
    <td>${row.product.name}</td>
    <td>${categoryLabel(row.product.category)}</td>
    <td>${row.openingStock}</td>
    <td>${row.quantityIn}</td>
    <td>${row.quantityOut}</td>
    <td>${row.closingStock}</td>
  </tr>`).join("") + `<tr>
    <td colspan="2"><b>Tổng cộng</b></td>
    <td><b>${sumOf(summary, "openingStock")}</b></td>
    <td><b>${sumOf(summary, "quantityIn")}</b></td>
    <td><b>${sumOf(summary, "quantityOut")}</b></td>
    <td><b>${sumOf(summary, "closingStock")}</b></td>
  </tr>`;

  // Chi tiết giao dịch kho
  const movements = allMovements.filter((movement) => {
    const product = products.find((item) => String(item.id) === String(movement.productId));
    return (!category || (product && product.category === category))
      && (!from || movement.date >= from)
      && (!to || movement.date <= to)
      && `${movement.productName} ${movement.type} ${movement.reference}`.toLowerCase().includes(search);
  });
  document.getElementById("inventory-movements-body").innerHTML = movements.map((movement) => `<tr>
    <td>${formatDate(movement.date)}</td>
    <td>${movement.productName}</td>
    <td>${movement.type}</td>
    <td>${movement.type === "Xuất bán" ? "−" : "+"}${movement.quantity}</td>
    <td>${movement.reference || "—"}</td>
  </tr>`).join("") || emptyRow(5, "Chưa có giao dịch kho trong khoảng thời gian này.");
}

/* == KHỞI ĐỘNG: đã đăng nhập thì vào thẳng trang quản trị ============== */
if (isAdmin()) showAdminPage();
