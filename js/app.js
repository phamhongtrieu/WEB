function escapeHTML(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

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
  if (!product) return;
  if (product.hidden || !isCategoryVisible(product.category)) {
    toast("Sản phẩm hiện không được bán.");
    return;
  }
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
    const user = JSON.parse(localStorage.getItem(KEYS.user) || "null");
    if (user && user.id) {
      const account = getCustomerAccounts().find((customer) => customer.id === user.id);
      if (!account || account.locked) {
        localStorage.removeItem(KEYS.user);
        return null;
      }
      return { ...user, name: account.name, email: account.email, phone: account.phone, address: account.address };
    }
    return user;
  } catch (error) {
    console.error("Không thể đọc tài khoản hiện tại.", error);
    return null;
  }
}

function setUser(user) {
  if (user) localStorage.setItem(KEYS.user, JSON.stringify(user));
  else localStorage.removeItem(KEYS.user);
}

function getCustomerAccounts() {
  return readStoredList(KEYS.users);
}

function saveCustomerAccounts(accounts) {
  localStorage.setItem(KEYS.users, JSON.stringify(accounts));
}

function recordStockMovement(movement) {
  const movements = readStoredList(KEYS.stockMovements);
  movements.unshift({ id: "MV-" + Date.now(), date: new Date().toISOString(), ...movement });
  localStorage.setItem(KEYS.stockMovements, JSON.stringify(movements));
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
      <img src="${escapeHTML(p.images[0])}" alt="${escapeHTML(p.name)}">
      ${off ? `<span class="sale">-${off}%</span>` : ""}
      <button class="quick-add" onclick="event.stopPropagation(); addToCart('${p.id}', 1)">+ Giỏ</button>
    </div>
    <div class="card-body" onclick="location.href='san-pham.html?id=${p.id}'">
      <div class="brand">${escapeHTML(p.brand)}</div>
      <h3>${escapeHTML(p.name)}</h3>
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
    <div class="announce">MIỄN PHÍ VẬN CHUYỂN ĐƠN TỪ 600.000₫ &nbsp;·&nbsp; MÃ <b>GLOW20</b> GIẢM 20%</div>
    <header class="site-header">
      <div class="header-inner">
        <button class="icon-btn menu-btn" onclick="toggleMobileNav()" aria-label="Menu">☰</button>
        <button class="logo" onclick="location.href='index.html'">CỎ THƠM</button>
        <nav class="nav-desk">
          ${getVisibleCategories().map(
            (category) => `<button class="${active === category.id ? "active" : ""}" onclick="goCatalog('${category.id}')">${escapeHTML(category.name)}</button>`
          ).join("")}
        </nav>
        <div class="header-actions">
          <button class="icon-btn" onclick="toggleSearch()" aria-label="Tìm kiếm">⌕</button>
          <div style="position:relative">
            <button class="icon-btn" onclick="toggleUserMenu()" aria-label="Tài khoản">👤</button>
            <div id="user-menu" class="user-menu hidden">
              ${
                user
                  ? `<button onclick="openAccount('profile')">Xin chào, ${escapeHTML(user.name)}</button>
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
        ${getVisibleCategories().map((c) => `<button onclick="goCatalog('${c.id}')">${escapeHTML(c.name)}</button>`).join("")}
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
          ${getVisibleCategories().map((c) => `<button onclick="goCatalog('${c.id}')">${escapeHTML(c.name)}</button>`).join("")}
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
        <p class="muted" style="margin-top:12px;font-size:12px">Demo: bất kỳ email/mật khẩu đều được. Admin: admin.html</p>
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
  document.getElementById("auth-title").textContent = isReg ? "Tạo tài khoản" : "Chào mừng trở lại";
  document.getElementById("auth-sub").textContent = isReg ? "Tham gia Cỏ Thơm để lưu đơn hàng." : "Đăng nhập để theo dõi đơn hàng.";
  window.__authMode = mode;
}

function submitAuth(e) {
  e.preventDefault();
  const form = new FormData(e.target);
  const email = form.get("email").toString().trim().toLowerCase();
  const password = form.get("password").toString();
  const accounts = getCustomerAccounts();
  let account = accounts.find((customer) => customer.email.toLowerCase() === email);
  if (window.__authMode === "register") {
    if (account) {
      toast("Email này đã được đăng ký.");
      return;
    }
    account = {
      id: "KH-" + Date.now(),
      name: (form.get("name") || "").toString().trim() || email.split("@")[0],
      email,
      password,
      phone: "",
      address: "",
      joined: new Date().toLocaleDateString("vi-VN"),
      locked: false,
    };
    saveCustomerAccounts([account, ...accounts]);
  } else {
    if (!account || account.password !== password) {
      toast("Email hoặc mật khẩu không đúng.");
      return;
    }
    if (account.locked) {
      toast("Tài khoản đã bị khóa. Vui lòng liên hệ cửa hàng.");
      return;
    }
  }
  setUser({ id: account.id, name: account.name, email: account.email, phone: account.phone, address: account.address });
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
        <div class="field"><label>Họ tên</label><input name="name" value="${escapeHTML(user.name || "")}" required></div>
        <div class="field"><label>Email</label><input name="email" type="email" value="${escapeHTML(user.email || "")}" required></div>
        <div class="field"><label>Số điện thoại</label><input name="phone" value="${escapeHTML(user.phone || "")}"></div>
        <div class="field"><label>Địa chỉ</label><input name="address" value="${escapeHTML(user.address || "")}"></div>
        <button class="btn btn-rose" type="submit">Lưu thay đổi</button>
      </form>`;
  } else {
    const orders = getOrders();
    const customerOrders = orders.filter((order) =>
      (order.customerId && order.customerId === user.id)
      || (order.email && order.email.toLowerCase() === user.email.toLowerCase()));
    body.innerHTML = `<h2 class="font-display">Đơn hàng</h2>` +
      (customerOrders.length
        ? customerOrders
            .map(
              (o) => `<div class="cart-item" style="grid-template-columns:1fr auto;margin-top:12px">
                <div><b>${escapeHTML(o.id)}</b><div class="muted">${escapeHTML(o.date)} · ${o.items.length} sản phẩm</div></div>
                <div><span class="status st-wait">${escapeHTML(o.status)}</span><div class="price">${money(o.total)}</div></div>
              </div>`
            )
            .join("")
        : `<p class="muted" style="margin-top:12px">Chưa có đơn hàng.</p>`);
  }
}

function saveProfile(e) {
  e.preventDefault();
  const form = new FormData(e.target);
  const updated = {
    ...getUser(),
    name: form.get("name"),
    email: form.get("email").toString().trim().toLowerCase(),
    phone: form.get("phone"),
    address: form.get("address"),
  };
  const accounts = getCustomerAccounts();
  if (accounts.some((account) => account.id !== updated.id && account.email.toLowerCase() === updated.email)) {
    toast("Email này đã được tài khoản khác sử dụng.");
    return;
  }
  const existing = accounts.findIndex((account) => account.id === updated.id);
  if (existing >= 0) {
    accounts[existing] = { ...accounts[existing], ...updated };
    saveCustomerAccounts(accounts);
  }
  setUser(updated);
  renderHeader(window.__activeNav);
  toast("Đã lưu hồ sơ");
  closeOverlays();
}

function cartItemsDetailed() {
  return getCart()
    .map((i) => ({ ...i, product: getProductById(i.productId) }))
    .filter((i) => i.product);
}

function cartTotals() {
  const items = cartItemsDetailed();
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const shipping = subtotal >= 600000 || subtotal === 0 ? 0 : 30000;
  return { items, subtotal, shipping, total: subtotal + shipping };
}

function initShop(active) {
  window.__activeNav = active || "";
  renderHeader(active);
  renderFooter();
  renderModals();
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".header-actions")) document.getElementById("user-menu")?.classList.add("hidden");
  });
}

function params() {
  return new URLSearchParams(location.search);
}
