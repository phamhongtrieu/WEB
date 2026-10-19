function money(n) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.cart) || "[]");
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(KEYS.cart, JSON.stringify(cart));
  updateCartBadge();
}

function cartCount() {
  return getCart().reduce((s, i) => s + i.quantity, 0);
}

function addToCart(productId, qty) {
  const product = getProductById(productId);
  if (!product || product.hidden) return;
  const cart = getCart();
  const found = cart.find((i) => i.productId === productId);
  const nextQty = (found ? found.quantity : 0) + (qty || 1);
  if (nextQty > product.stock) {
    toast("Không đủ hàng trong kho.");
    return;
  }
  if (found) found.quantity = nextQty;
  else cart.push({ productId, quantity: qty || 1 });
  saveCart(cart);
  toast("Đã thêm vào giỏ hàng");
}

function updateQty(productId, quantity) {
  const product = getProductById(productId);
  let cart = getCart();
  if (quantity < 1) cart = cart.filter((i) => i.productId !== productId);
  else {
    const item = cart.find((i) => i.productId === productId);
    if (item) item.quantity = Math.min(quantity, product ? product.stock : quantity);
  }
  saveCart(cart);
}

function removeFromCart(productId) {
  saveCart(getCart().filter((i) => i.productId !== productId));
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.user) || "null");
  } catch (e) {
    return null;
  }
}

function setUser(user) {
  if (user) localStorage.setItem(KEYS.user, JSON.stringify(user));
  else localStorage.removeItem(KEYS.user);
}

function getOrders() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.orders) || "[]");
  } catch (e) {
    return [];
  }
}

function saveOrders(list) {
  localStorage.setItem(KEYS.orders, JSON.stringify(list));
}

function toast(msg) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(window.__toast);
  window.__toast = setTimeout(() => el.classList.add("hidden"), 2200);
}

function stars(n) {
  const full = Math.round(n);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

function discount(p) {
  if (!p.originalPrice) return 0;
  return Math.round((1 - p.price / p.originalPrice) * 100);
}

function productCard(p) {
  const off = discount(p);
  return `<article class="card">
    <div class="card-img" onclick="location.href='san-pham.html?id=${p.id}'">
      <img src="${p.images[0]}" alt="${p.name}">
      ${off ? `<span class="sale">-${off}%</span>` : ""}
      <button class="quick-add" onclick="event.stopPropagation(); addToCart('${p.id}', 1)">+ Giỏ</button>
    </div>
    <div class="card-body" onclick="location.href='san-pham.html?id=${p.id}'">
      <div class="brand">${p.brand}</div>
      <h3>${p.name}</h3>
      <div class="stars">${stars(p.rating)} <span class="muted">(${p.reviews})</span></div>
      <div class="price">${money(p.price)}${p.originalPrice ? ` <s>${money(p.originalPrice)}</s>` : ""}</div>
    </div>
  </article>`;
}

function closeOverlays() {
  document.querySelectorAll(".overlay").forEach((el) => el.classList.add("hidden"));
}

function openOverlay(id) {
  closeOverlays();
  const el = document.getElementById(id);
  if (el) el.classList.remove("hidden");
}

function updateCartBadge() {
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    const n = cartCount();
    el.textContent = n;
    el.style.display = n ? "grid" : "none";
  });
}

function renderHeader(active) {
  const user = getUser();
  const host = document.getElementById("site-header");
  if (!host) return;
  host.innerHTML = `
    <div class="announce">MIỄN PHÍ VẬN CHUYỂN ĐƠN TỪ ${money(FREE_SHIP_MIN)} &nbsp;·&nbsp; MÃ <b>GLOW20</b> GIẢM 20%</div>
    <header class="site-header">
      <div class="header-inner">
        <button class="icon-btn menu-btn" onclick="toggleMobileNav()" aria-label="Menu">☰</button>
        <button class="logo" onclick="location.href='index.html'">CỎ THƠM</button>
        <nav class="nav-desk">
          ${CATEGORIES.map(
            (c) => `<button class="${active === c ? "active" : ""}" onclick="goCatalog('${c}')">${CATEGORY_LABELS[c]}</button>`
          ).join("")}
        </nav>
        <div class="header-actions">
          <button class="icon-btn" onclick="toggleSearch()" aria-label="Tìm kiếm">⌕</button>
          <div style="position:relative">
            <button class="icon-btn" onclick="toggleUserMenu()" aria-label="Tài khoản">👤</button>
            <div id="user-menu" class="user-menu hidden">
              ${
                user
                  ? `<button onclick="openAccount('profile')">Xin chào, ${user.name}</button>
                     <button onclick="openAccount('orders')">Đơn hàng của tôi</button>
                     <button onclick="logout()">Đăng xuất</button>`
                  : `<button onclick="openAuth('login')">Đăng nhập</button>
                     <button onclick="openAuth('register')">Tạo tài khoản</button>`
              }
              <a href="admin.html">Trang quản trị</a>
            </div>
          </div>
          <a class="icon-btn" href="gio-hang.html" aria-label="Giỏ hàng">
            👜<span class="badge-count" data-cart-count></span>
          </a>
        </div>
      </div>
      <div id="mobile-nav" class="mobile-nav">
        ${CATEGORIES.map((c) => `<button onclick="goCatalog('${c}')">${CATEGORY_LABELS[c]}</button>`).join("")}
      </div>
      <form class="search-bar hidden" id="search-bar" onsubmit="submitSearch(event)">
        <input id="search-input" placeholder="Tìm serum, son, nước hoa..." />
      </form>
    </header>`;
  updateCartBadge();
}

function renderFooter() {
  const host = document.getElementById("site-footer");
  if (!host) return;
  host.innerHTML = `
    <footer class="site-footer">
      <div class="wrap foot-grid">
        <div>
          <h3 class="font-display">CỎ THƠM</h3>
          <p>Vẻ đẹp xa xỉ được chắt lọc cho người phụ nữ hiện đại. Tìm kiếm có chủ đích, chế tác bằng tình yêu.</p>
        </div>
        <div>
          <h4>Mua sắm</h4>
          ${CATEGORIES.map((c) => `<button onclick="goCatalog('${c}')">${CATEGORY_LABELS[c]}</button>`).join("")}
          <button onclick="goCatalog('')">Tất cả sản phẩm</button>
        </div>
        <div>
          <h4>Hỗ trợ</h4>
          <button onclick="toast('Giao hàng 2–5 ngày, đổi trả 30 ngày.')">Giao hàng & Đổi trả</button>
          <button onclick="openAccount('orders')">Theo dõi đơn hàng</button>
          <button onclick="toast('Liên hệ: hello@cothom.vn · 1900 6868')">Liên hệ</button>
        </div>
        <div>
          <h4>Kết nối với chúng tôi</h4>
          <p>Nhận ưu đãi sớm cho sản phẩm mới.</p>
          <form class="news" onsubmit="event.preventDefault(); toast('Đã đăng ký nhận tin.'); this.reset();">
            <input type="email" required placeholder="Email của bạn">
            <button class="btn btn-rose" type="submit">Gửi</button>
          </form>
        </div>
      </div>
      <div class="wrap foot-bottom">
        <span>© 2026 Cỏ Thơm. Tất cả quyền được bảo lưu.</span>
        <span>HTML · CSS · JavaScript</span>
      </div>
    </footer>`;
}

function renderModals() {
  if (document.getElementById("auth-overlay")) return;
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div id="auth-overlay" class="overlay hidden" onclick="if(event.target===this)closeOverlays()">
      <div class="modal">
        <div class="tabs">
          <button id="tab-login" class="active" onclick="openAuth('login')">Đăng nhập</button>
          <button id="tab-register" onclick="openAuth('register')">Đăng ký</button>
        </div>
        <h2 class="font-display" id="auth-title">Chào mừng trở lại</h2>
        <p class="muted" id="auth-sub">Đăng nhập để theo dõi đơn hàng.</p>
        <form onsubmit="submitAuth(event)">
          <div class="field" id="name-field" style="display:none"><label>Họ tên</label><input name="name" placeholder="Nguyễn An"></div>
          <div class="field"><label>Email</label><input name="email" type="email" required placeholder="ban@email.com"></div>
          <div class="field"><label>Mật khẩu</label><input name="password" type="password" required minlength="6"></div>
          <button class="btn btn-rose" style="width:100%;margin-top:8px" type="submit">Tiếp tục</button>
        </form>
        <p class="muted" style="margin-top:12px;font-size:12px">Tài khoản demo: minhanh@gmail.com / 123456. Admin: admin.html</p>
      </div>
    </div>
    <div id="account-overlay" class="overlay hidden" onclick="if(event.target===this)closeOverlays()">
      <div class="modal wide">
        <div class="tabs">
          <button id="acc-profile" onclick="openAccount('profile')">Hồ sơ</button>
          <button id="acc-orders" onclick="openAccount('orders')">Đơn hàng</button>
        </div>
        <div id="account-body"></div>
      </div>
    </div>`;
  document.body.appendChild(wrap);
}

function toggleMobileNav() {
  document.getElementById("mobile-nav")?.classList.toggle("open");
}
function toggleSearch() {
  const bar = document.getElementById("search-bar");
  bar.classList.toggle("hidden");
  if (!bar.classList.contains("hidden")) document.getElementById("search-input").focus();
}
function toggleUserMenu() {
  document.getElementById("user-menu")?.classList.toggle("hidden");
}
function goCatalog(cat) {
  location.href = "index.html?view=catalog" + (cat ? "&cat=" + encodeURIComponent(cat) : "");
}
function submitSearch(e) {
  e.preventDefault();
  const q = document.getElementById("search-input").value.trim();
  location.href = "index.html?view=catalog&q=" + encodeURIComponent(q);
}

function openAuth(mode) {
  renderModals();
  document.getElementById("user-menu")?.classList.add("hidden");
  openOverlay("auth-overlay");
  const isReg = mode === "register";
  document.getElementById("tab-login").classList.toggle("active", !isReg);
  document.getElementById("tab-register").classList.toggle("active", isReg);
  document.getElementById("name-field").style.display = isReg ? "block" : "none";
  // Minimum length only applies to new passwords; a reset password ("1") must still be able to log in.
  document.querySelector("#auth-overlay [name=password]").minLength = isReg ? 6 : 0;
  document.getElementById("auth-title").textContent = isReg ? "Tạo tài khoản" : "Chào mừng trở lại";
  document.getElementById("auth-sub").textContent = isReg ? "Tham gia Cỏ Thơm để lưu đơn hàng." : "Đăng nhập để theo dõi đơn hàng.";
  window.__authMode = mode;
}

// shortcut: passwords sit in plain text in localStorage; fine for a demo, a real backend must hash them.
const DEMO_CUSTOMERS = [
  ["KH-001", "Nguyễn Minh Anh", "minhanh@gmail.com", "0901 234 567", "24 Nguyễn Huệ, Q.1, TP.HCM", "2023-08-12"],
  ["KH-002", "Trần Ngọc Mai", "ngocmai@gmail.com", "0988 456 123", "18 Lê Lợi, Hải Châu, Đà Nẵng", "2023-11-03"],
  ["KH-003", "Lê Thanh Hà", "thanhha@gmail.com", "0912 888 302", "57 Tràng Thi, Hoàn Kiếm, Hà Nội", "2024-01-21"],
  ["KH-004", "Phạm Gia Hân", "giahan@gmail.com", "0935 777 810", "102 Hai Bà Trưng, Cần Thơ", "2024-03-10"],
];

const ACTIVE_STATUS = "Đang hoạt động";
const RESET_PASSWORD = "1";

function getCustomers() {
  try {
    const saved = localStorage.getItem(KEYS.customers);
    // Accounts saved before the rename still carry "Kích hoạt".
    if (saved) return JSON.parse(saved).map((c) => (c.status === "Kích hoạt" ? { ...c, status: ACTIVE_STATUS } : c));
  } catch (e) {}
  return DEMO_CUSTOMERS.map(([id, name, email, phone, address, joined]) => ({
    id, name, email, phone, address, password: "123456", status: ACTIVE_STATUS, createdAt: new Date(joined + "T09:00").toISOString(),
  }));
}

function saveCustomers(list) {
  localStorage.setItem(KEYS.customers, JSON.stringify(list));
}

function submitAuth(e) {
  e.preventDefault();
  const form = new FormData(e.target);
  const email = form.get("email").toString().trim().toLowerCase();
  const password = form.get("password").toString();
  const list = getCustomers();
  let c = list.find((x) => x.email.toLowerCase() === email);
  if (window.__authMode === "register") {
    if (c) {
      toast("Email này đã được đăng ký");
      return;
    }
    const name = (form.get("name") || "").toString().trim() || email.split("@")[0];
    c = { id: "KH-" + Date.now().toString().slice(-6), name, email, phone: "", address: "", password, status: ACTIVE_STATUS, createdAt: new Date().toISOString() };
    list.push(c);
    saveCustomers(list);
  } else if (!c || c.password !== password) {
    toast("Sai email hoặc mật khẩu");
    return;
  }
  if (c.status === "Bị khóa") {
    toast("Tài khoản đã bị khóa. Vui lòng liên hệ cửa hàng.");
    return;
  }
  setUser({ name: c.name, email: c.email, phone: c.phone, address: c.address });
  closeOverlays();
  renderHeader(window.__activeNav);
  toast(window.__authMode === "register" ? "Đăng ký thành công" : "Đăng nhập thành công");
}

function logout() {
  setUser(null);
  renderHeader(window.__activeNav);
  toast("Đã đăng xuất");
}

function openAccount(tab) {
  const user = getUser();
  if (!user) {
    openAuth("login");
    return;
  }
  renderModals();
  document.getElementById("user-menu")?.classList.add("hidden");
  openOverlay("account-overlay");
  document.getElementById("acc-profile").classList.toggle("active", tab === "profile");
  document.getElementById("acc-orders").classList.toggle("active", tab === "orders");
  const body = document.getElementById("account-body");
  if (tab === "profile") {
    body.innerHTML = `<h2 class="font-display">Hồ sơ</h2>
      <form onsubmit="saveProfile(event)">
        <div class="field"><label>Họ tên</label><input name="name" value="${user.name || ""}" required></div>
        <div class="field"><label>Email</label><input name="email" type="email" value="${user.email || ""}" readonly></div>
        <div class="field"><label>Số điện thoại</label><input name="phone" value="${user.phone || ""}"></div>
        <div class="field"><label>Địa chỉ</label><input name="address" value="${user.address || ""}"></div>
        <button class="btn btn-rose" type="submit">Lưu thay đổi</button>
      </form>`;
  } else {
    const orders = getOrders();
    body.innerHTML = `<h2 class="font-display">Đơn hàng</h2>` +
      (orders.length
        ? orders
            .map(
              (o) => `<div class="cart-item" style="grid-template-columns:1fr auto;margin-top:12px">
                <div><b>${o.id}</b><div class="muted">${o.date} · ${o.items.length} sản phẩm</div></div>
                <div><span class="status st-wait">${o.status}</span><div class="price">${money(o.total)}</div></div>
              </div>`
            )
            .join("")
        : `<p class="muted" style="margin-top:12px">Chưa có đơn hàng.</p>`);
  }
}

function saveProfile(e) {
  e.preventDefault();
  const form = new FormData(e.target);
  const user = { name: form.get("name"), email: form.get("email"), phone: form.get("phone"), address: form.get("address") };
  setUser(user);
  const list = getCustomers();
  const c = list.find((x) => x.email === user.email);
  if (c) {
    Object.assign(c, { name: user.name, phone: user.phone, address: user.address });
    saveCustomers(list);
  }
  renderHeader(window.__activeNav);
  toast("Đã lưu hồ sơ");
  closeOverlays();
}

function cartItemsDetailed() {
  return getCart()
    .map((i) => ({ ...i, product: getProductById(i.productId) }))
    .filter((i) => i.product && !i.product.hidden);
}

function cartTotals() {
  const items = cartItemsDetailed();
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const shipping = subtotal >= FREE_SHIP_MIN || subtotal === 0 ? 0 : SHIP_FEE;
  return { items, subtotal, shipping, total: subtotal + shipping };
}

function initShop(active) {
  window.__activeNav = active || "";
  const user = getUser();
  if (user && getCustomers().some((c) => c.email === user.email && c.status === "Bị khóa")) setUser(null);
  renderHeader(active);
  renderFooter();
  document.querySelectorAll("[data-free-ship]").forEach((el) => (el.textContent = money(FREE_SHIP_MIN)));
  renderModals();
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".header-actions")) document.getElementById("user-menu")?.classList.add("hidden");
  });
}

function params() {
  return new URLSearchParams(location.search);
}
