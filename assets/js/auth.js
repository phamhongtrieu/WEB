/**
 * ==========================================================================
 * CỎ THƠM BEAUTY - PHÂN HỆ TÀI KHOẢN, XÁC THỰC & ĐƠN HÀNG (THÀNH VIÊN 3)
 * ==========================================================================
 * Tác giả: Thành viên 3
 * Công nghệ: JavaScript Vanilla (ES5/ES6 chuẩn trình duyệt), LocalStorage
 * Chức năng:
 *   1. Quản lý xác thực (Đăng nhập, Đăng ký, Đăng xuất)
 *   2. Chuyển đổi linh hoạt Tab & View (SPA thu nhỏ, không reload trang)
 *   3. Quản lý hồ sơ người dùng (Cập nhật Profile, Đổi mật khẩu)
 *   4. Quản lý & hiển thị Lịch sử đơn hàng + Drawer chi tiết hóa đơn
 *   5. Module Quản trị người dùng (Admin User Management: Khóa/Mở, Reset MK)
 * ==========================================================================
 */

/**
 * ==========================================================================
 * I. CÁC HÀM TIỆN ÍCH THÔNG BÁO (ALERTS)
 * ==========================================================================
 */

/**
 * Hiển thị hộp thông báo alert box
 * @param {string} elementId - ID của thẻ chứa alert
 * @param {string} message - Nội dung thông báo
 * @param {string} type - Loại thông báo: 'success' | 'error' | 'info'
 */
function showAlert(elementId, message, type) {
    var alertEl = document.getElementById(elementId);
    if (!alertEl) return;
    
    alertEl.className = 'alert-box show alert-' + (type || 'error');
    alertEl.innerHTML = message;
    
    // Tự động ẩn sau 4 giây đối với thông báo thành công
    if (type === 'success') {
        setTimeout(function() {
            if (alertEl) {
                alertEl.className = 'alert-box';
                alertEl.innerHTML = '';
            }
        }, 4000);
    }
}

/**
 * Ẩn thông báo alert box
 * @param {string} elementId - ID của thẻ chứa alert
 */
function hideAlert(elementId) {
    var alertEl = document.getElementById(elementId);
    if (alertEl) {
        alertEl.className = 'alert-box';
        alertEl.innerHTML = '';
    }
}

/**
 * ==========================================================================
 * II. ĐIỀU HƯỚNG VIEW & TAB TRONG ACCOUNT.HTML (KHÔNG RELOAD TRANG)
 * ==========================================================================
 */

/**
 * Khởi tạo trang account.html:
 * Kiểm tra trạng thái đăng nhập từ localStorage để hiển thị Form Auth hoặc Dashboard
 */
function initAccountPage() {
    var currentUser = getCurrentUser();
    var authSection = document.getElementById('accountAuthSection');
    var dashboardSection = document.getElementById('accountDashboardSection');
    var breadcrumbTitle = document.getElementById('breadcrumbTitle');

    if (!currentUser) {
        // TRƯỜNG HỢP 1: Khách chưa đăng nhập -> Hiển thị khối Auth Form
        if (authSection) authSection.classList.add('active');
        if (dashboardSection) dashboardSection.classList.remove('active');
        if (breadcrumbTitle) breadcrumbTitle.textContent = 'Đăng nhập / Đăng ký';
        
        switchAuthMode('login');
    } else {
        // TRƯỜNG HỢP 2: Đã đăng nhập -> Hiển thị Dashboard hồ sơ & đơn hàng
        if (authSection) authSection.classList.remove('active');
        if (dashboardSection) dashboardSection.classList.add('active');
        if (breadcrumbTitle) breadcrumbTitle.textContent = 'Tài khoản của tôi';

        // Cập nhật thông tin thẻ Hero Card
        updateUserHeroCard(currentUser);

        // Nạp dữ liệu form hồ sơ
        initProfileData(currentUser);

        // Mặc định mở Tab Hồ sơ cá nhân
        switchAccountView('profile');

        // Cập nhật số lượng đơn hàng trên badge
        updateOrdersCountBadge(currentUser.id);
    }

    // Luôn cập nhật trạng thái Menu Dropdown trên Header
    renderHeaderUser();
}

/**
 * Cập nhật thông tin Thẻ đại diện Hero Card của khách hàng
 * @param {Object} user - Đối tượng người dùng hiện tại
 */
function updateUserHeroCard(user) {
    if (!user) return;
    var avatarEl = document.getElementById('userAvatarInitial');
    var heroNameEl = document.getElementById('heroUserName');
    var heroEmailEl = document.getElementById('heroUserEmail');
    var heroRoleBadge = document.getElementById('heroUserRole');

    if (avatarEl) {
        var initial = (user.name && user.name.trim().length > 0) ? user.name.trim().charAt(0).toUpperCase() : 'U';
        avatarEl.textContent = initial;
    }
    if (heroNameEl) heroNameEl.textContent = user.name || 'Quý khách';
    if (heroEmailEl) heroEmailEl.textContent = user.email || '';
    if (heroRoleBadge) {
        heroRoleBadge.textContent = (user.role === 'admin') ? 'Quản trị viên' : 'Thành viên thân thiết';
    }
}

/**
 * Chuyển đổi chế độ Đăng nhập / Đăng ký trong account.html (không reload trang)
 * @param {'login' | 'register'} mode - Chế độ muốn chuyển tới
 */
function switchAuthMode(mode) {
    var tabLogin = document.getElementById('tabBtnLoginMode');
    var tabRegister = document.getElementById('tabBtnRegisterMode');
    var formLoginWrapper = document.getElementById('authLoginFormWrapper');
    var formRegisterWrapper = document.getElementById('authRegisterFormWrapper');
    var sectionTitle = document.getElementById('authSectionTitle');
    var sectionSubtitle = document.getElementById('authSectionSubtitle');

    hideAlert('loginAlert');
    hideAlert('registerAlert');

    if (mode === 'register') {
        if (tabLogin) tabLogin.classList.remove('active');
        if (tabRegister) tabRegister.classList.add('active');
        if (formLoginWrapper) formLoginWrapper.style.display = 'none';
        if (formRegisterWrapper) formRegisterWrapper.style.display = 'block';
        if (sectionTitle) sectionTitle.textContent = 'Đăng Ký Tài Khoản';
        if (sectionSubtitle) sectionSubtitle.textContent = 'Trở thành thành viên của Cỏ Thơm Beauty để nhận ưu đãi';
    } else {
        if (tabLogin) tabLogin.classList.add('active');
        if (tabRegister) tabRegister.classList.remove('active');
        if (formLoginWrapper) formLoginWrapper.style.display = 'block';
        if (formRegisterWrapper) formRegisterWrapper.style.display = 'none';
        if (sectionTitle) sectionTitle.textContent = 'Chào mừng trở lại';
        if (sectionSubtitle) sectionSubtitle.textContent = 'Đăng nhập tài khoản Cỏ Thơm Beauty';
    }
}

/**
 * Chuyển đổi qua lại giữa Tab Hồ sơ cá nhân và Tab Lịch sử đơn hàng (không reload trang)
 * @param {'profile' | 'orders'} view - Tab cần hiển thị
 */
function switchAccountView(view) {
    var tabProfile = document.getElementById('tabBtnProfile');
    var tabOrders = document.getElementById('tabBtnOrders');
    var viewProfile = document.getElementById('viewProfile');
    var viewOrders = document.getElementById('viewOrders');
    var breadcrumbTitle = document.getElementById('breadcrumbTitle');

    if (view === 'orders') {
        if (tabProfile) tabProfile.classList.remove('active');
        if (tabOrders) tabOrders.classList.add('active');
        if (viewProfile) viewProfile.classList.remove('active');
        if (viewOrders) viewOrders.classList.add('active');
        if (breadcrumbTitle) breadcrumbTitle.textContent = 'Lịch sử đơn hàng';

        // Gọi hàm render danh sách đơn hàng từ localStorage
        renderOrders();
    } else {
        if (tabProfile) tabProfile.classList.add('active');
        if (tabOrders) tabOrders.classList.remove('active');
        if (viewProfile) viewProfile.classList.add('active');
        if (viewOrders) viewOrders.classList.remove('active');
        if (breadcrumbTitle) breadcrumbTitle.textContent = 'Hồ sơ của tôi';

        var currentUser = getCurrentUser();
        if (currentUser) {
            initProfileData(currentUser);
        }
    }
}

/**
 * ==========================================================================
 * III. NGHIỆP VỤ XÁC THỰC KHÁCH HÀNG (LOGIN - REGISTER - LOGOUT)
 * ==========================================================================
 */

/**
 * Xử lý đăng nhập tài khoản khách hàng
 * @param {Event} event - Sự kiện submit form
 */
function handleLogin(event) {
    if (event && event.preventDefault) event.preventDefault();
    hideAlert('loginAlert');

    var emailOrUser = document.getElementById('loginEmail') ? document.getElementById('loginEmail').value.trim() : '';
    var password = document.getElementById('loginPassword') ? document.getElementById('loginPassword').value : '';

    // 1. Kiểm tra rỗng
    if (!emailOrUser) {
        showAlert('loginAlert', 'Vui lòng nhập Email hoặc Tên đăng nhập.', 'error');
        return false;
    }
    if (!password) {
        showAlert('loginAlert', 'Vui lòng nhập mật khẩu.', 'error');
        return false;
    }

    // 2. Tra cứu trong cơ sở dữ liệu localStorage
    var users = getUsers();
    var foundUser = null;

    for (var i = 0; i < users.length; i++) {
        var u = users[i];
        var isEmailMatch = u.email && (u.email.toLowerCase() === emailOrUser.toLowerCase());
        var isUsernameMatch = u.username && (u.username.toLowerCase() === emailOrUser.toLowerCase());

        if ((isEmailMatch || isUsernameMatch) && u.password === password) {
            foundUser = u;
            break;
        }
    }

    // 3. Sai thông tin đăng nhập
    if (!foundUser) {
        showAlert('loginAlert', 'Email/Tên đăng nhập hoặc mật khẩu không chính xác.', 'error');
        return false;
    }

    // 4. Kiểm tra trạng thái tài khoản bị khóa
    if (foundUser.status === 'locked') {
        showAlert('loginAlert', 'Tài khoản của bạn đã bị khóa tạm thời. Vui lòng liên hệ Quản trị viên (admin@cothom.vn) để được hỗ trợ.', 'error');
        return false;
    }

    // 5. Lưu trạng thái đăng nhập vào localStorage
    setCurrentUser(foundUser);
    showAlert('loginAlert', 'Đăng nhập thành công! Đang tải thông tin tài khoản...', 'success');

    // Nếu đang ở account.html -> chuyển sang Dashboard trực tiếp, không reload trang
    setTimeout(function() {
        if (document.getElementById('accountDashboardSection')) {
            initAccountPage();
        } else {
            window.location.href = 'account.html';
        }
    }, 500);

    return false;
}

/**
 * Xử lý đăng ký tài khoản khách hàng mới
 * @param {Event} event - Sự kiện submit form
 */
function handleRegister(event) {
    if (event && event.preventDefault) event.preventDefault();
    hideAlert('registerAlert');

    var name = document.getElementById('regName') ? document.getElementById('regName').value.trim() : '';
    var email = document.getElementById('regEmail') ? document.getElementById('regEmail').value.trim() : '';
    var phone = document.getElementById('regPhone') ? document.getElementById('regPhone').value.trim() : '';
    var password = document.getElementById('regPassword') ? document.getElementById('regPassword').value : '';
    var confirmPassword = document.getElementById('regConfirmPassword') ? document.getElementById('regConfirmPassword').value : '';
    var agreeTerms = document.getElementById('regAgree') ? document.getElementById('regAgree').checked : true;

    // 1. Kiểm tra tính hợp lệ dữ liệu
    if (!name) {
        showAlert('registerAlert', 'Vui lòng nhập Họ và tên.', 'error');
        return false;
    }

    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        showAlert('registerAlert', 'Vui lòng nhập địa chỉ Email hợp lệ (ví dụ: thao@example.com).', 'error');
        return false;
    }

    var phoneRegex = /^[0-9+\s\-().]{8,15}$/;
    if (!phone || !phoneRegex.test(phone)) {
        showAlert('registerAlert', 'Vui lòng nhập số điện thoại hợp lệ (từ 8 đến 15 số).', 'error');
        return false;
    }

    if (!password || password.length < 6) {
        showAlert('registerAlert', 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.', 'error');
        return false;
    }

    if (password !== confirmPassword) {
        showAlert('registerAlert', 'Mật khẩu xác nhận không khớp với mật khẩu đã nhập.', 'error');
        return false;
    }

    if (!agreeTerms) {
        showAlert('registerAlert', 'Vui lòng đồng ý với Điều khoản và Chính sách của Cỏ Thơm.', 'error');
        return false;
    }

    // 2. Kiểm tra trùng Email trong localStorage
    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
        if (users[i].email && users[i].email.toLowerCase() === email.toLowerCase()) {
            showAlert('registerAlert', 'Email này đã được sử dụng. Vui lòng chọn Email khác hoặc đăng nhập.', 'error');
            return false;
        }
    }

    // 3. Khởi tạo đối tượng khách hàng mới
    var newId = 'KH-' + Math.floor(100 + Math.random() * 900);
    var now = new Date();
    var createdDateStr = now.toISOString().slice(0, 16).replace('T', ' ');

    var newUser = {
        id: newId,
        username: email.split('@')[0],
        email: email,
        password: password,
        name: name,
        phone: phone,
        address: "",
        city: "",
        postalCode: "",
        role: "customer",
        status: "active",
        createdAt: createdDateStr
    };

    // 4. Lưu vào danh sách Users và đăng nhập tự động
    users.push(newUser);
    saveUsers(users);
    setCurrentUser(newUser);

    showAlert('registerAlert', 'Đăng ký tài khoản thành công! Đang chuyển vào trang tài khoản...', 'success');

    // Chuyển sang Dashboard không reload trang
    setTimeout(function() {
        if (document.getElementById('accountDashboardSection')) {
            initAccountPage();
        } else {
            window.location.href = 'account.html';
        }
    }, 600);

    return false;
}

/**
 * Xử lý đăng xuất tài khoản khách hàng
 */
function handleLogout() {
    setCurrentUser(null);

    // Nếu đang ở account.html -> chuyển ngay về View Auth không reload trang
    if (document.getElementById('accountAuthSection')) {
        initAccountPage();
        switchAuthMode('login');
    } else {
        window.location.href = 'account.html';
    }
}

/**
 * ==========================================================================
 * IV. QUẢN LÝ HỒ SƠ CÁ NHÂN & BẢO MẬT (PROFILE & CHANGE PASSWORD)
 * ==========================================================================
 */

/**
 * Nạp thông tin người dùng vào các trường của form hồ sơ
 * @param {Object} user - Người dùng hiện tại
 */
function initProfileData(user) {
    if (!user) user = getCurrentUser();
    if (!user) return;

    if (document.getElementById('profName')) document.getElementById('profName').value = user.name || '';
    if (document.getElementById('profEmail')) document.getElementById('profEmail').value = user.email || '';
    if (document.getElementById('profPhone')) document.getElementById('profPhone').value = user.phone || '';
    if (document.getElementById('profAddress')) document.getElementById('profAddress').value = user.address || '';
    if (document.getElementById('profCity')) document.getElementById('profCity').value = user.city || '';
    if (document.getElementById('profPostalCode')) document.getElementById('profPostalCode').value = user.postalCode || '';

    toggleEditProfile(false);
}

/**
 * Bật / tắt chế độ cho phép chỉnh sửa hồ sơ
 * @param {boolean} enable - true: cho phép sửa, false: khóa chỉ xem
 */
function toggleEditProfile(enable) {
    var editableInputs = ['profName', 'profPhone', 'profAddress', 'profCity', 'profPostalCode'];
    for (var i = 0; i < editableInputs.length; i++) {
        var el = document.getElementById(editableInputs[i]);
        if (el) {
            el.disabled = !enable;
        }
    }

    var editBtn = document.getElementById('btnStartEditProfile');
    var actionsBar = document.getElementById('profileActionsBar');

    if (editBtn) editBtn.style.display = enable ? 'none' : 'inline-flex';
    if (actionsBar) actionsBar.style.display = enable ? 'flex' : 'none';
    hideAlert('profileAlert');
}

/**
 * Hủy chế độ chỉnh sửa và khôi phục dữ liệu ban đầu
 */
function cancelEditProfile() {
    var currentUser = getCurrentUser();
    initProfileData(currentUser);
    toggleEditProfile(false);
}

/**
 * Cập nhật thông tin hồ sơ và lưu vào localStorage
 * @param {Event} event - Sự kiện submit form
 */
function updateProfile(event) {
    if (event && event.preventDefault) event.preventDefault();
    hideAlert('profileAlert');

    var currentUser = getCurrentUser();
    if (!currentUser) return false;

    var name = document.getElementById('profName') ? document.getElementById('profName').value.trim() : '';
    var phone = document.getElementById('profPhone') ? document.getElementById('profPhone').value.trim() : '';
    var address = document.getElementById('profAddress') ? document.getElementById('profAddress').value.trim() : '';
    var city = document.getElementById('profCity') ? document.getElementById('profCity').value.trim() : '';
    var postalCode = document.getElementById('profPostalCode') ? document.getElementById('profPostalCode').value.trim() : '';

    if (!name) {
        showAlert('profileAlert', 'Họ và tên không được để trống.', 'error');
        return false;
    }
    if (!phone) {
        showAlert('profileAlert', 'Số điện thoại không được để trống.', 'error');
        return false;
    }

    // Cập nhật thuộc tính của user hiện tại
    currentUser.name = name;
    currentUser.phone = phone;
    currentUser.address = address;
    currentUser.city = city;
    currentUser.postalCode = postalCode;

    // Đồng bộ vào danh sách Users trong localStorage
    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
        if (users[i].id === currentUser.id) {
            users[i].name = name;
            users[i].phone = phone;
            users[i].address = address;
            users[i].city = city;
            users[i].postalCode = postalCode;
            break;
        }
    }
    saveUsers(users);
    setCurrentUser(currentUser);

    // Cập nhật lại Hero Card và giao diện
    updateUserHeroCard(currentUser);
    renderHeaderUser();
    toggleEditProfile(false);
    showAlert('profileAlert', 'Cập nhật thông tin cá nhân thành công!', 'success');

    return false;
}

/**
 * Đổi mật khẩu tài khoản và cập nhật vào localStorage
 * @param {Event} event - Sự kiện submit form
 */
function changePassword(event) {
    if (event && event.preventDefault) event.preventDefault();
    hideAlert('passwordAlert');

    var currentUser = getCurrentUser();
    if (!currentUser) return false;

    var currentPass = document.getElementById('currentPassword') ? document.getElementById('currentPassword').value : '';
    var newPass = document.getElementById('newPassword') ? document.getElementById('newPassword').value : '';
    var confirmNewPass = document.getElementById('confirmNewPassword') ? document.getElementById('confirmNewPassword').value : '';

    if (!currentPass) {
        showAlert('passwordAlert', 'Vui lòng nhập mật khẩu hiện tại.', 'error');
        return false;
    }

    if (currentPass !== currentUser.password) {
        showAlert('passwordAlert', 'Mật khẩu hiện tại không chính xác.', 'error');
        return false;
    }

    if (!newPass || newPass.length < 6) {
        showAlert('passwordAlert', 'Mật khẩu mới phải có tối thiểu 6 ký tự.', 'error');
        return false;
    }

    if (newPass === currentPass) {
        showAlert('passwordAlert', 'Mật khẩu mới không được trùng với mật khẩu hiện tại.', 'error');
        return false;
    }

    if (newPass !== confirmNewPass) {
        showAlert('passwordAlert', 'Xác nhận mật khẩu mới không khớp.', 'error');
        return false;
    }

    // Cập nhật mật khẩu trong danh sách Users localStorage
    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
        if (users[i].id === currentUser.id) {
            users[i].password = newPass;
            break;
        }
    }
    currentUser.password = newPass;
    saveUsers(users);
    setCurrentUser(currentUser);

    // Reset form mật khẩu
    var passForm = document.getElementById('formChangePassword');
    if (passForm) passForm.reset();

    showAlert('passwordAlert', 'Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.', 'success');
    return false;
}

/**
 * ==========================================================================
 * V. LỊCH SỬ ĐƠN HÀNG & DRAWER CHI TIẾT (ORDER HISTORY)
 * ==========================================================================
 */

/**
 * Cập nhật số lượng đơn hàng vào Badge trên Tab Lịch sử đơn hàng
 * @param {string} userId - Mã người dùng
 */
function updateOrdersCountBadge(userId) {
    if (!userId) return;
    var allOrders = getOrders();
    var count = 0;
    for (var i = 0; i < allOrders.length; i++) {
        if (allOrders[i].userId === userId) count++;
    }

    var badges = document.querySelectorAll('.order-count-badge');
    for (var j = 0; j < badges.length; j++) {
        badges[j].textContent = count;
    }
}

/**
 * Hiển thị danh sách đơn hàng của khách hàng hiện tại từ localStorage
 */
function renderOrders() {
    var currentUser = getCurrentUser();
    if (!currentUser) return;

    var container = document.getElementById('orderListContainer');
    if (!container) return;

    var allOrders = getOrders();
    var userOrders = [];

    // Lọc các đơn hàng thuộc về currentUser
    for (var i = 0; i < allOrders.length; i++) {
        if (allOrders[i].userId === currentUser.id) {
            userOrders.push(allOrders[i]);
        }
    }

    updateOrdersCountBadge(currentUser.id);

    // Xử lý khi chưa có đơn hàng
    if (userOrders.length === 0) {
        container.innerHTML = 
            '<div class="content-card">' +
                '<div class="order-empty-state">' +
                    '<div class="order-empty-icon">📦</div>' +
                    '<h3 class="order-empty-title">Chưa có đơn hàng nào</h3>' +
                    '<p class="order-empty-text">Bạn chưa thực hiện bất kỳ giao dịch nào tại Cỏ Thơm Beauty.</p>' +
                    '<a href="index.html" class="btn btn-primary">Khám phá sản phẩm ngay</a>' +
                '</div>' +
            '</div>';
        return;
    }

    var html = '';
    for (var j = 0; j < userOrders.length; j++) {
        var order = userOrders[j];
        var currency = order.currency || '£';

        // Phân loại nhãn trạng thái đơn
        var badgeClass = 'badge-processing';
        var badgeText = order.statusText || 'Đang xử lý';
        if (order.status === 'delivered') {
            badgeClass = 'badge-delivered';
            badgeText = 'Đã giao hàng';
        } else if (order.status === 'cancelled') {
            badgeClass = 'badge-cancelled';
            badgeText = 'Đã hủy';
        }

        // Tạo danh sách sản phẩm tóm tắt
        var itemsHtml = '';
        if (order.items && order.items.length > 0) {
            for (var k = 0; k < order.items.length; k++) {
                var item = order.items[k];
                var itemImg = item.image || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300';
                itemsHtml += 
                    '<div class="order-item-row">' +
                        '<img src="' + itemImg + '" alt="' + item.name + '" class="order-item-thumb" onerror="this.src=\'assets/images/placeholder.jpg\'">' +
                        '<div class="order-item-info">' +
                            '<div class="order-item-name">' + item.name + '</div>' +
                            '<div class="order-item-meta">Số lượng: ' + item.quantity + ' | Phân loại: ' + (item.category || 'Mỹ phẩm thiên nhiên') + '</div>' +
                        '</div>' +
                        '<div class="order-item-price">' + currency + (item.price * item.quantity).toFixed(2) + '</div>' +
                    '</div>';
            }
        }

        html += 
            '<div class="order-card">' +
                '<!-- Header tóm tắt đơn hàng -->' +
                '<div class="order-card-header">' +
                    '<div class="order-meta-group">' +
                        '<span class="order-id-label">' + order.id + '</span>' +
                        '<span class="order-date-label">📅 ' + order.date + '</span>' +
                        '<span class="order-price-label">' + currency + order.total.toFixed(2) + '</span>' +
                        '<span class="badge-status ' + badgeClass + '">' + badgeText + '</span>' +
                    '</div>' +
                    '<button type="button" class="btn btn-secondary btn-sm" onclick="openOrderDrawer(\'' + order.id + '\');">' +
                        'Chi tiết →' +
                    '</button>' +
                '</div>' +
                '<!-- Danh sách sản phẩm thuộc đơn hàng -->' +
                '<div class="order-card-body">' +
                    '<div class="order-items-list">' +
                        itemsHtml +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    container.innerHTML = html;
}

/**
 * Mở Slide-over Drawer xem chi tiết toàn diện của đơn hàng
 * @param {string} orderId - Mã đơn hàng
 */
function openOrderDrawer(orderId) {
    var allOrders = getOrders();
    var targetOrder = null;

    for (var i = 0; i < allOrders.length; i++) {
        if (allOrders[i].id === orderId) {
            targetOrder = allOrders[i];
            break;
        }
    }

    if (!targetOrder) {
        alert('Không tìm thấy thông tin đơn hàng này.');
        return;
    }

    var drawerTitle = document.getElementById('drawerOrderTitle');
    var drawerContent = document.getElementById('drawerOrderContent');
    var overlay = document.getElementById('orderDrawerOverlay');

    if (drawerTitle) drawerTitle.textContent = 'Chi tiết ' + targetOrder.id;

    var currency = targetOrder.currency || '£';
    var badgeClass = 'badge-processing';
    var badgeText = targetOrder.statusText || 'Đang xử lý';
    if (targetOrder.status === 'delivered') {
        badgeClass = 'badge-delivered';
        badgeText = 'Đã giao hàng';
    } else if (targetOrder.status === 'cancelled') {
        badgeClass = 'badge-cancelled';
        badgeText = 'Đã hủy';
    }

    var itemsHtml = '';
    if (targetOrder.items && targetOrder.items.length > 0) {
        for (var j = 0; j < targetOrder.items.length; j++) {
            var item = targetOrder.items[j];
            var itemImg = item.image || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300';
            itemsHtml += 
                '<div style="display: flex; gap: 14px; margin-bottom: 14px; align-items: center;">' +
                    '<img src="' + itemImg + '" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover; border: 1px solid #EDE0D4;">' +
                    '<div style="flex: 1;">' +
                        '<div style="font-weight: 600; font-size: 13.5px; color: #2C2320;">' + item.name + '</div>' +
                        '<div style="color: #6B5A56; font-size: 12.5px;">' + currency + item.price.toFixed(2) + ' × ' + item.quantity + '</div>' +
                    '</div>' +
                    '<div style="font-weight: 600; color: #2C2320; font-size: 14px;">' + currency + (item.price * item.quantity).toFixed(2) + '</div>' +
                '</div>';
        }
    }

    if (drawerContent) {
        drawerContent.innerHTML = 
            '<!-- 1. Trạng thái -->' +
            '<div class="drawer-section">' +
                '<div class="drawer-section-title">Trạng thái đơn hàng</div>' +
                '<div class="drawer-info-row">' +
                    '<span class="drawer-info-label">Mã tra cứu:</span>' +
                    '<span class="drawer-info-value">' + targetOrder.id + '</span>' +
                '</div>' +
                '<div class="drawer-info-row">' +
                    '<span class="drawer-info-label">Thời gian đặt:</span>' +
                    '<span class="drawer-info-value">' + targetOrder.date + '</span>' +
                '</div>' +
                '<div class="drawer-info-row">' +
                    '<span class="drawer-info-label">Trạng thái hiện tại:</span>' +
                    '<span class="badge-status ' + badgeClass + '">' + badgeText + '</span>' +
                '</div>' +
            '</div>' +

            '<!-- 2. Thông tin giao hàng -->' +
            '<div class="drawer-section">' +
                '<div class="drawer-section-title">Thông tin giao nhận</div>' +
                '<div class="drawer-info-row">' +
                    '<span class="drawer-info-label">Người nhận:</span>' +
                    '<span class="drawer-info-value">' + (targetOrder.customerName || 'N/A') + '</span>' +
                '</div>' +
                '<div class="drawer-info-row">' +
                    '<span class="drawer-info-label">Số điện thoại:</span>' +
                    '<span class="drawer-info-value">' + (targetOrder.customerPhone || 'N/A') + '</span>' +
                '</div>' +
                '<div class="drawer-info-row">' +
                    '<span class="drawer-info-label">Địa chỉ nhận hàng:</span>' +
                    '<span class="drawer-info-value" style="text-align: right; max-width: 60%;">' + (targetOrder.shippingAddress || 'N/A') + '</span>' +
                '</div>' +
                '<div class="drawer-info-row">' +
                    '<span class="drawer-info-label">Hình thức thanh toán:</span>' +
                    '<span class="drawer-info-value">' + (targetOrder.paymentMethod || 'COD') + '</span>' +
                '</div>' +
            '</div>' +

            '<!-- 3. Danh sách sản phẩm -->' +
            '<div class="drawer-section">' +
                '<div class="drawer-section-title">Sản phẩm đã đặt (' + (targetOrder.items ? targetOrder.items.length : 0) + ')</div>' +
                itemsHtml +
            '</div>' +

            '<!-- 4. Tổng kết thanh toán -->' +
            '<div class="drawer-section" style="border-bottom: none; margin-bottom: 0;">' +
                '<div class="drawer-section-title">Tổng kết thanh toán</div>' +
                '<div class="drawer-info-row">' +
                    '<span class="drawer-info-label">Tạm tính:</span>' +
                    '<span class="drawer-info-value">' + currency + (targetOrder.subtotal || 0).toFixed(2) + '</span>' +
                '</div>' +
                '<div class="drawer-info-row">' +
                    '<span class="drawer-info-label">Phí giao hàng:</span>' +
                    '<span class="drawer-info-value">' + currency + (targetOrder.shippingFee || 0).toFixed(2) + '</span>' +
                '</div>' +
                '<div class="drawer-info-row">' +
                    '<span class="drawer-info-label">Giảm giá voucher:</span>' +
                    '<span class="drawer-info-value" style="color: #15803D;">-' + currency + (targetOrder.discount || 0).toFixed(2) + '</span>' +
                '</div>' +
                '<div class="drawer-total-row">' +
                    '<span>Tổng cộng:</span>' +
                    '<span class="drawer-total-price">' + currency + (targetOrder.total || 0).toFixed(2) + '</span>' +
                '</div>' +
            '</div>';
    }

    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Khóa cuộn trang khi drawer đang mở
}

/**
 * Đóng Slide-over Drawer
 */
function closeOrderDrawer() {
    var overlay = document.getElementById('orderDrawerOverlay');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * ==========================================================================
 * VI. PHÂN HỆ QUẢN TRỊ ADMIN (ADMIN USER MANAGEMENT)
 * ==========================================================================
 */

/**
 * Hiển thị danh sách người dùng trong bảng Quản trị Admin
 * @param {string} filterQuery - Từ khóa tìm kiếm (tên, email, sđt, ID)
 */
function renderAdminUsers(filterQuery) {
    var tbody = document.getElementById('adminUsersTableBody');
    if (!tbody) return;

    var users = getUsers();
    var query = (filterQuery || '').toLowerCase().trim();
    var filtered = [];

    for (var i = 0; i < users.length; i++) {
        var u = users[i];
        if (query) {
            var matchName = u.name && u.name.toLowerCase().indexOf(query) !== -1;
            var matchEmail = u.email && u.email.toLowerCase().indexOf(query) !== -1;
            var matchPhone = u.phone && u.phone.indexOf(query) !== -1;
            var matchId = u.id && u.id.toLowerCase().indexOf(query) !== -1;
            if (matchName || matchEmail || matchPhone || matchId) {
                filtered.push(u);
            }
        } else {
            filtered.push(u);
        }
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #A8918A;">Không tìm thấy người dùng nào phù hợp.</td></tr>';
        return;
    }

    var html = '';
    var currentAdmin = getAdminUser();

    for (var j = 0; j < filtered.length; j++) {
        var user = filtered[j];
        var isLocked = user.status === 'locked';
        var statusBadge = isLocked 
            ? '<span class="badge-status badge-locked">Đã khóa</span>' 
            : '<span class="badge-status badge-active">Hoạt động</span>';
        
        var roleBadge = (user.role === 'admin') 
            ? '<span style="color: #C4788A; font-weight: bold;">Quản trị viên</span>' 
            : 'Khách hàng';

        var lockBtn = isLocked
            ? '<button type="button" class="btn-action-unlock" onclick="toggleLockUser(\'' + user.id + '\')">🔓 Mở khóa</button>'
            : '<button type="button" class="btn-action-lock" onclick="toggleLockUser(\'' + user.id + '\')">🔒 Khóa</button>';

        // Không cho phép tự khóa chính admin đang đăng nhập
        if (currentAdmin && currentAdmin.id === user.id) {
            lockBtn = '<span style="color: #A8918A; font-size: 12px;">(Tài khoản của bạn)</span>';
        }

        html += 
            '<tr>' +
                '<td><strong style="color: #C4788A;">' + user.id + '</strong></td>' +
                '<td>' +
                    '<div style="font-weight: 600; color: #2C2320;">' + (user.name || 'Chưa đặt tên') + '</div>' +
                    '<div style="font-size: 12.5px; color: #A8918A;">@' + (user.username || 'user') + '</div>' +
                '</td>' +
                '<td>' + user.email + '</td>' +
                '<td>' + (user.phone || '—') + '</td>' +
                '<td>' + roleBadge + '</td>' +
                '<td>' + statusBadge + '</td>' +
                '<td>' +
                    '<div class="admin-action-btns">' +
                        lockBtn +
                        '<button type="button" class="btn-action-reset" onclick="resetUserPassword(\'' + user.id + '\')">🔑 Reset MK</button>' +
                    '</div>' +
                '</td>' +
            '</tr>';
    }

    tbody.innerHTML = html;
}

/**
 * Khóa hoặc Mở khóa tài khoản người dùng
 * @param {string} userId - Mã người dùng
 */
function toggleLockUser(userId) {
    var users = getUsers();
    var targetUser = null;
    var targetIndex = -1;

    for (var i = 0; i < users.length; i++) {
        if (users[i].id === userId) {
            targetUser = users[i];
            targetIndex = i;
            break;
        }
    }

    if (!targetUser) return;

    var isNowLocked = targetUser.status === 'locked';
    var confirmMsg = isNowLocked 
        ? 'Bạn có chắc chắn muốn MỞ KHÓA tài khoản "' + targetUser.name + '" (' + targetUser.email + ')?' 
        : 'Bạn có chắc chắn muốn KHÓA tài khoản "' + targetUser.name + '" (' + targetUser.email + ')? Khách hàng sẽ không thể đăng nhập.';

    if (!confirm(confirmMsg)) return;

    // Đảo ngược trạng thái
    targetUser.status = isNowLocked ? 'active' : 'locked';
    users[targetIndex] = targetUser;
    saveUsers(users);

    // Đồng bộ nếu user này đang đăng nhập trên trình duyệt
    var currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
        currentUser.status = targetUser.status;
        setCurrentUser(currentUser);
    }

    var searchInput = document.getElementById('adminUserSearch');
    renderAdminUsers(searchInput ? searchInput.value : '');
    alert('Đã ' + (isNowLocked ? 'mở khóa' : 'khóa') + ' tài khoản thành công!');
}

/**
 * Đặt lại mật khẩu tài khoản về mặc định '123456'
 * @param {string} userId - Mã người dùng
 */
function resetUserPassword(userId) {
    var users = getUsers();
    var targetUser = null;
    var targetIndex = -1;

    for (var i = 0; i < users.length; i++) {
        if (users[i].id === userId) {
            targetUser = users[i];
            targetIndex = i;
            break;
        }
    }

    if (!targetUser) return;

    if (!confirm('Bạn có chắc muốn đặt lại mật khẩu cho tài khoản "' + targetUser.name + '" về mặc định là "123456"?')) {
        return;
    }

    targetUser.password = '123456';
    users[targetIndex] = targetUser;
    saveUsers(users);

    // Đồng bộ nếu user đang đăng nhập
    var currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
        currentUser.password = '123456';
        setCurrentUser(currentUser);
    }

    alert('Mật khẩu của tài khoản ' + targetUser.email + ' đã được đặt lại thành: 123456');
}

/**
 * ==========================================================================
 * VII. HEADER USER DROPDOWN & ĐỒNG BỘ GIAO DIỆN CHUNG
 * ==========================================================================
 */

/**
 * Bật / tắt hiển thị Dropdown Menu tài khoản trên Header
 * @param {Event} event - Sự kiện click
 */
function toggleUserDropdown(event) {
    if (event) event.stopPropagation();
    var trigger = event ? event.currentTarget : null;
    var wrapper = trigger ? trigger.closest('.header-user-wrapper') : document.querySelector('.header-user-wrapper');
    if (!wrapper) return;

    var menu = wrapper.querySelector('.user-dropdown-menu');
    if (!menu) return;

    var isShown = menu.classList.contains('show');

    // Đóng toàn bộ dropdown khác
    var allMenus = document.querySelectorAll('.user-dropdown-menu');
    for (var i = 0; i < allMenus.length; i++) {
        allMenus[i].classList.remove('show');
    }

    if (!isShown) {
        menu.classList.add('show');
    }
}

/**
 * Render cụm Icon Tài khoản và Dropdown Menu trên Header dựa trên trạng thái đăng nhập
 */
function renderHeaderUser() {
    var wrappers = document.querySelectorAll('.header-user-wrapper');
    if (!wrappers || wrappers.length === 0) return;

    var currentUser = getCurrentUser();
    var isInAdmin = window.location.pathname.indexOf('/admin/') !== -1;
    var rootPrefix = isInAdmin ? '../' : '';

    for (var w = 0; w < wrappers.length; w++) {
        var wrapper = wrappers[w];
        var html = '';

        if (!currentUser) {
            // Trường hợp: Chưa đăng nhập (Khách vãng lai)
            html = 
                '<button type="button" class="header-user-btn guest-btn" onclick="toggleUserDropdown(event)" title="Tài khoản">' +
                    '<svg viewBox="0 0 24 24">' +
                        '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>' +
                        '<circle cx="12" cy="7" r="4"></circle>' +
                    '</svg>' +
                '</button>' +
                '<div class="user-dropdown-menu" onclick="event.stopPropagation();">' +
                    '<a href="' + rootPrefix + 'account.html" class="user-dropdown-item">' +
                        '<span>🔑</span> Đăng nhập' +
                    '</a>' +
                    '<a href="' + rootPrefix + 'account.html" class="user-dropdown-item">' +
                        '<span>🌸</span> Đăng ký' +
                    '</a>' +
                    '<div class="user-dropdown-divider"></div>' +
                    '<a href="' + rootPrefix + 'admin.html" class="user-dropdown-item">' +
                        '<span>🛡️</span> Trang quản trị' +
                    '</a>' +
                '</div>';
        } else {
            // Trường hợp: Đã đăng nhập
            var initial = (currentUser.name && currentUser.name.trim().length > 0) ? currentUser.name.trim().charAt(0).toUpperCase() : 'U';
            var displayName = currentUser.name || 'Quý khách';
            var displayEmail = currentUser.email || '';

            html = 
                '<button type="button" class="header-user-btn header-user-avatar" onclick="toggleUserDropdown(event)" title="' + displayName + '">' +
                    initial +
                '</button>' +
                '<div class="user-dropdown-menu" onclick="event.stopPropagation();">' +
                    '<div class="user-dropdown-header">' +
                        '<div class="user-dropdown-name">' + displayName + '</div>' +
                        '<div class="user-dropdown-email">' + displayEmail + '</div>' +
                    '</div>' +
                    '<div class="user-dropdown-divider"></div>' +
                    '<a href="' + rootPrefix + 'account.html" class="user-dropdown-item" onclick="if(window.location.pathname.indexOf(\'account.html\') !== -1) { switchAccountView(\'profile\'); }">' +
                        '<span>👤</span> Hồ sơ của tôi' +
                    '</a>' +
                    '<a href="' + rootPrefix + 'account.html" class="user-dropdown-item" onclick="if(window.location.pathname.indexOf(\'account.html\') !== -1) { switchAccountView(\'orders\'); }">' +
                        '<span>📦</span> Lịch sử đơn hàng' +
                    '</a>' +
                    '<a href="javascript:void(0)" onclick="handleLogout();" class="user-dropdown-item" style="color: #D32F2F;">' +
                        '<span>🚪</span> Đăng xuất' +
                    '</a>' +
                    '<div class="user-dropdown-divider"></div>' +
                    '<a href="' + rootPrefix + 'admin.html" class="user-dropdown-item">' +
                        '<span>🛡️</span> Trang quản trị' +
                    '</a>' +
                '</div>';
        }

        wrapper.innerHTML = html;
    }
}

// Lắng nghe sự kiện click ngoài trang để đóng dropdown
window.addEventListener('click', function() {
    var menus = document.querySelectorAll('.user-dropdown-menu');
    for (var i = 0; i < menus.length; i++) {
        menus[i].classList.remove('show');
    }
});

// Tự động render Header User khi trang nạp xong
document.addEventListener('DOMContentLoaded', function() {
    renderHeaderUser();
});
