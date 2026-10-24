let pendingCartAction = null;

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

function addToCart(productId, qty, goToCartAfterAdd) {
  // Đề yêu cầu khách phải đăng nhập mới dùng được giỏ hàng.
  if (!getUser()) {
    toast("Vui lòng đăng nhập để mua hàng.");
    openAuth("login");
    return false;
  }
  const product = getProductById(productId);
  if (!product || product.hidden || !getCategoryList().some((category) => category.id === product.category)) {
    toast("Sản phẩm hiện không được bán.");
    return false;
  }
  const cart = getCart();
  const found = cart.find((i) => i.productId === productId);
  const nextQty = (found ? found.quantity : 0) + (qty || 1);
  if (nextQty > product.stock) {
    toast("Không đủ hàng trong kho.");
    return false;
  }
  if (found) found.quantity = nextQty;
  else cart.push({ productId, quantity: qty || 1 });
  saveCart(cart);
  toast("Đã thêm vào giỏ hàng");
  if (goToCartAfterAdd) location.href = "gio-hang.html";
  return true;
}

function buyNow(productId, qty) {
  addToCart(productId, qty, true);
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
    if (!user || !user.email) return user;
    const flags = readStored(KEYS.customerFlags, {});
    return flags[user.email.toLowerCase()] && flags[user.email.toLowerCase()].locked ? null : user;
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
  const isAdminSession = sessionStorage.getItem(KEYS.admin) === "yes" || (user && user.role === "admin");
  const host = document.getElementById("site-header");
  if (!host) return;
  host.innerHTML = `
    <div class="announce">MIỄN PHÍ VẬN CHUYỂN CHO MỌI ĐƠN HÀNG TỪ 600.000₫</div>
    <header class="site-header">
      <div class="header-inner">
        <button class="icon-btn menu-btn" onclick="toggleMobileNav()" aria-label="Menu">☰</button>
        <button class="logo" onclick="location.href='index.html'">CỎ THƠM</button>
        <nav class="nav-desk">
          ${getCategoryList().map(
    (c) => `<button class="${active === c.id ? "active" : ""}" onclick="goCatalog('${c.id}')">${c.label}</button>`
  ).join("")}
        </nav>
        <div class="header-actions">
          <button class="icon-btn" onclick="toggleSearch()" aria-label="Tìm kiếm">⌕</button>
          <div class="account-menu-wrap" style="position:relative" onmouseenter="openUserMenu()" onmouseleave="closeUserMenu()">
            <button class="icon-btn" onclick="toggleUserMenu()" aria-label="Tài khoản" aria-haspopup="true" aria-expanded="false">👤</button>
            <div id="user-menu" class="user-menu hidden">
              ${user
      ? isAdminSession
        ? `<button onclick="location.href='admin.html'">Xin chào, ${user.name}</button>
                       <button onclick="logout()">Đăng xuất</button>`
        : `<button onclick="openAccount('profile')">Xin chào, ${user.name}</button>
                       <button onclick="openAccount('orders')">Đơn hàng của tôi</button>
                       <button onclick="openAccount('profile')">Hồ sơ</button>
                       <button onclick="logout()">Đăng xuất</button>`
      : `<button onclick="openAuth('login')">Đăng nhập</button>
                     <button onclick="openAuth('register')">Tạo tài khoản</button>`
    }
              <a href="admin.html">Trang quản trị</a>
            </div>
          </div>
          <a class="icon-btn" href="gio-hang.html" aria-label="Giỏ hàng" onclick="return openCart()">
            👜<span class="badge-count" data-cart-count></span>
          </a>
        </div>
      </div>
      <div id="mobile-nav" class="mobile-nav">
        ${getCategoryList().map((c) => `<button onclick="goCatalog('${c.id}')">${c.label}</button>`).join("")}
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
          ${getCategoryList().map((c) => `<button onclick="goCatalog('${c.id}')">${c.label}</button>`).join("")}
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
    <div id="auth-overlay" class="overlay hidden">
      <div class="modal" style="position:relative">
        <button class="btn-ghost modal-close" type="button" onclick="closeOverlays()" style="position:absolute;top:16px;right:18px;font-size:20px;cursor:pointer">✕</button>
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
        <p class="muted" style="margin-top:12px;font-size:12px">Tài khoản demo được lưu trên trình duyệt này. Admin: admin.html</p>
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
  const menu = document.getElementById("user-menu");
  if (!menu) return;
  const isOpen = menu.classList.toggle("hidden") === false;
  menu.parentElement.querySelector('[aria-haspopup="true"]')?.setAttribute("aria-expanded", String(isOpen));
}
function openUserMenu() {
  const menu = document.getElementById("user-menu");
  if (!menu) return;
  menu.classList.remove("hidden");
  menu.parentElement.querySelector('[aria-haspopup="true"]')?.setAttribute("aria-expanded", "true");
}
function closeUserMenu() {
  const menu = document.getElementById("user-menu");
  if (!menu) return;
  menu.classList.add("hidden");
  menu.parentElement.querySelector('[aria-haspopup="true"]')?.setAttribute("aria-expanded", "false");
}
function openCart() {
  return true;
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
  document.querySelector("#auth-overlay [name='name']").required = isReg;
  document.getElementById("auth-title").textContent = isReg ? "Tạo tài khoản" : "Chào mừng trở lại";
  document.getElementById("auth-sub").textContent = isReg ? "Tham gia Cỏ Thơm để lưu đơn hàng." : "Đăng nhập để theo dõi đơn hàng.";
  window.__authMode = mode;
}

function submitAuth(e) {
  e.preventDefault();
  const form = new FormData(e.target);
  const email = form.get("email").toString().trim().toLowerCase();
  const password = form.get("password").toString();
  const isRegister = window.__authMode === "register";
  const accounts = readStored(KEYS.customerAccounts, []);
  const existing = accounts.find((account) => account.email === email);
  const flags = readStored(KEYS.customerFlags, {});
  if (flags[email] && flags[email].locked) {
    toast("Tài khoản đã bị khóa. Vui lòng liên hệ cửa hàng.");
    return;
  }
  if (isRegister && existing) {
    toast("Email này đã được đăng ký.");
    return;
  }
  if (!isRegister && (!existing || existing.password !== password)) {
    toast("Email hoặc mật khẩu không đúng.");
    return;
  }
  const name = (form.get("name") || (existing && existing.name) || "").toString().trim() || email.split("@")[0];
  const account = { ...(existing || {}), name, email, password };
  writeStored(KEYS.customerAccounts, [account, ...accounts.filter((item) => item.email !== email)]);
  const user = {
    name,
    email,
    phone: (existing && existing.phone) || "",
    address: (existing && existing.address) || "",
    addresses: (existing && existing.addresses) || [],
  };
  setUser(user);
  closeOverlays();
  renderHeader(window.__activeNav);
  toast(isRegister ? "Đăng ký thành công!" : "Đăng nhập thành công!");
  if (typeof renderCart === "function") renderCart();
  if (pendingCartAction) {
    const action = pendingCartAction;
    pendingCartAction = null;
    addToCart(action.productId, action.quantity, action.goToCart);
  }
  if (typeof renderCart === "function") {
    renderCart();
  }
  if (typeof openCheckout === "function" && getCart().length > 0) {
    openCheckout();
  }
}

function paymentLabel(payment) {
  if (payment === "COD") return "Tiền mặt khi nhận hàng";
  if (payment === "Bank") return "Chuyển khoản";
  return "Thanh toán trực tuyến";
}

function logout() {
  setUser(null);
  localStorage.removeItem(KEYS.user);
  sessionStorage.removeItem(KEYS.admin);
  closeOverlays();
  renderHeader(window.__activeNav);
  if (typeof renderCart === "function") renderCart();
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
    const addresses = [...new Set([user.address, ...(user.addresses || [])].filter(Boolean))];
    body.innerHTML = `<h2 class="font-display">Hồ sơ</h2>
      <form onsubmit="saveProfile(event)">
        <div class="field"><label>Họ tên</label><input name="name" value="${user.name || ""}" required></div>
        <div class="field"><label>Email (không thể thay đổi)</label><input name="email" type="email" value="${user.email || ""}" readonly></div>
        <div class="field"><label>Số điện thoại</label><input name="phone" value="${user.phone || ""}"></div>
        <div class="field"><label>Địa chỉ mặc định</label><input name="address" value="${user.address || ""}"></div>
        <div class="field"><label>Địa chỉ giao hàng đã lưu (mỗi địa chỉ một dòng)</label><textarea name="addresses" rows="3" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành">${addresses.join("\n")}</textarea></div>
        <button class="btn btn-rose" type="submit">Lưu thay đổi</button>
      </form>`;
  } else {
    const orders = getOrders()
      .filter((order) => (order.email || "").toLowerCase() === user.email.toLowerCase())
      .map((order) => ({ ...order, status: orderStatus(order.status) }));
    body.innerHTML = `<h2 class="font-display">Đơn hàng</h2>` +
      (orders.length
        ? orders
          .map(
            (o) => `<article class="account-order">
                <div class="account-order-head"><div><b>${o.id}</b><div class="muted">${o.date} · ${(o.items || []).length} sản phẩm</div></div>
                  <div><span class="status ${statusClass(o.status)}">${o.status}</span><div class="price">${money(o.total)}</div></div>
                </div>
                <details><summary>Xem chi tiết đơn hàng</summary>
                  <div class="account-order-items">${(o.items || []).map((item) => `<div><span>${item.name} × ${item.quantity}</span><b>${money(item.price * item.quantity)}</b></div>`).join("")}</div>
                  <p class="muted">Giao đến: ${o.address || "—"} · ${o.phone || "—"}</p>
                  <p class="muted">Thanh toán: ${paymentLabel(o.payment)} · ${o.status}</p>
                </details>
              </article>`
          )
          .join("")
        : `<p class="muted" style="margin-top:12px">Bạn chưa có đơn hàng nào.</p>`);
  }
}

function saveProfile(e) {
  e.preventDefault();
  const form = new FormData(e.target);
  const current = getUser();
  const address = form.get("address").toString().trim();
  const addresses = [...new Set([address, ...form.get("addresses").toString().split(/\r?\n/).map((item) => item.trim()).filter(Boolean)])];
  const user = { ...current, name: form.get("name").toString().trim(), phone: form.get("phone").toString().trim(), address, addresses };
  setUser(user);
  const accounts = readStored(KEYS.customerAccounts, []);
  const account = accounts.find((item) => item.email === current.email.toLowerCase());
  if (account) {
    account.name = user.name;
    account.phone = user.phone;
    account.address = user.address;
    account.addresses = user.addresses;
    writeStored(KEYS.customerAccounts, accounts);
  }
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
    if (!e.target.closest(".account-menu-wrap")) closeUserMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeUserMenu();
  });
}

function params() {
  return new URLSearchParams(location.search);
}
