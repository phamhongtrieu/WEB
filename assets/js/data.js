/**
 * ==========================================================================
 * CỎ THƠM BEAUTY - DỮ LIỆU MOCK-UP & KHỞI TẠO LOCALSTORAGE (THÀNH VIÊN 3)
 * ==========================================================================
 */

// Các key lưu trữ
var STORAGE_USERS_KEY = 'COTHOM_USERS';
var STORAGE_ORDERS_KEY = 'COTHOM_ORDERS';
var SESSION_CURRENT_USER_KEY = 'COTHOM_CURRENT_USER';
var SESSION_ADMIN_USER_KEY = 'COTHOM_ADMIN_USER';

// Dữ liệu mẫu người dùng
var INITIAL_USERS = [
    {
        id: "admin-01",
        username: "admin",
        email: "admin@cothom.vn",
        password: "123",
        name: "An Nhiên",
        phone: "0988123456",
        address: "79 Cỏ Thơm Boulevard",
        city: "TP. Hồ Chí Minh",
        postalCode: "700000",
        role: "admin",
        status: "active",
        createdAt: "2024-01-01 08:00"
    },
    {
        id: "KH-001",
        username: "sophie",
        email: "bb@cs",
        password: "123",
        name: "Sophie Laurent",
        phone: "+44 7700 900123",
        address: "14 Blossom Lane",
        city: "London",
        postalCode: "SW1A 1AA",
        role: "customer",
        status: "active",
        createdAt: "2024-02-15 14:30"
    },
    {
        id: "KH-002",
        username: "lockeduser",
        email: "locked@cs",
        password: "123",
        name: "Lê Khóa",
        phone: "0901234567",
        address: "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1",
        city: "TP. Hồ Chí Minh",
        postalCode: "700000",
        role: "customer",
        status: "locked",
        createdAt: "2024-03-01 09:15"
    },
    {
        id: "KH-003",
        username: "maichi",
        email: "maichi@cothom.vn",
        password: "123",
        name: "Nguyễn Mai Chi",
        phone: "0912345678",
        address: "45 Hoàng Hoa Thám",
        city: "Hà Nội",
        postalCode: "100000",
        role: "customer",
        status: "active",
        createdAt: "2024-03-20 16:45"
    }
];

// Dữ liệu mẫu đơn hàng
var INITIAL_ORDERS = [
    {
        id: "ORD-2024-0891",
        userId: "KH-001",
        customerName: "Sophie Laurent",
        customerEmail: "bb@cs",
        customerPhone: "+44 7700 900123",
        shippingAddress: "14 Blossom Lane, London, SW1A 1AA",
        date: "2024-05-12 10:25",
        status: "delivered", // "delivered", "processing", "cancelled"
        statusText: "Đã giao",
        subtotal: 155.00,
        shippingFee: 10.00,
        discount: 0.00,
        total: 165.00,
        currency: "£",
        paymentMethod: "Thanh toán qua thẻ (Visa/Mastercard)",
        items: [
            {
                productId: "P001",
                name: "Serum Dưỡng Sáng Phục Hồi Da Hoa Cúc & Trà Trắng",
                category: "Chăm sóc da mặt",
                price: 85.00,
                quantity: 1,
                image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&auto=format&fit=crop&q=80"
            },
            {
                productId: "P002",
                name: "Kem Dưỡng Ẩm Trẻ Hóa Tinh Chất Nụ Tầm Xuân",
                category: "Kem dưỡng ẩm",
                price: 80.00,
                quantity: 1,
                image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&auto=format&fit=crop&q=80"
            }
        ]
    },
    {
        id: "ORD-2024-0934",
        userId: "KH-001",
        customerName: "Sophie Laurent",
        customerEmail: "bb@cs",
        customerPhone: "+44 7700 900123",
        shippingAddress: "14 Blossom Lane, London, SW1A 1AA",
        date: "2024-06-02 18:40",
        status: "processing", // "processing"
        statusText: "Đang xử lý",
        subtotal: 150.00,
        shippingFee: 5.00,
        discount: 0.00,
        total: 155.00,
        currency: "£",
        paymentMethod: "Thanh toán khi nhận hàng (COD)",
        items: [
            {
                productId: "P003",
                name: "Nước Cân Bằng Dịu Nhẹ Tinh Dầu Oải Hương Hữu Cơ",
                category: "Toner & Xịt khoáng",
                price: 50.00,
                quantity: 1,
                image: "https://images.unsplash.com/photo-1608248597359-bb5b2c93724c?w=300&auto=format&fit=crop&q=80"
            },
            {
                productId: "P004",
                name: "Mặt Nạ Đất Sét Thải Độc Tro Núi Lửa & Tràm Trà",
                category: "Mặt nạ chuyên sâu",
                price: 45.00,
                quantity: 1,
                image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=300&auto=format&fit=crop&q=80"
            },
            {
                productId: "P005",
                name: "Dầu Tẩy Trang Thảo Dược Hạt Jojoba & Hạnh Nhân",
                category: "Làm sạch da",
                price: 55.00,
                quantity: 1,
                image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80"
            }
        ]
    }
];

/**
 * Khởi tạo dữ liệu vào localStorage nếu chưa có
 */
function initDataStorage() {
    if (!localStorage.getItem(STORAGE_USERS_KEY)) {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(STORAGE_ORDERS_KEY)) {
        localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(INITIAL_ORDERS));
    }
}

/**
 * Lấy danh sách toàn bộ users từ localStorage
 */
function getUsers() {
    var raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) {
        initDataStorage();
        raw = localStorage.getItem(STORAGE_USERS_KEY);
    }
    try {
        return JSON.parse(raw) || [];
    } catch (e) {
        return [];
    }
}

/**
 * Lưu danh sách users vào localStorage
 */
function saveUsers(users) {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

/**
 * Lấy danh sách toàn bộ đơn hàng từ localStorage
 */
function getOrders() {
    var raw = localStorage.getItem(STORAGE_ORDERS_KEY);
    if (!raw) {
        initDataStorage();
        raw = localStorage.getItem(STORAGE_ORDERS_KEY);
    }
    try {
        return JSON.parse(raw) || [];
    } catch (e) {
        return [];
    }
}

/**
 * Lưu danh sách đơn hàng vào localStorage
 */
function saveOrders(orders) {
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders));
}

/**
 * Lấy user khách hàng đang đăng nhập từ localStorage (đồng bộ sessionStorage)
 */
function getCurrentUser() {
    var raw = localStorage.getItem(SESSION_CURRENT_USER_KEY) || sessionStorage.getItem(SESSION_CURRENT_USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

/**
 * Lưu user khách hàng đang đăng nhập vào localStorage & sessionStorage
 */
function setCurrentUser(user) {
    if (user) {
        localStorage.setItem(SESSION_CURRENT_USER_KEY, JSON.stringify(user));
        sessionStorage.setItem(SESSION_CURRENT_USER_KEY, JSON.stringify(user));
    } else {
        localStorage.removeItem(SESSION_CURRENT_USER_KEY);
        sessionStorage.removeItem(SESSION_CURRENT_USER_KEY);
    }
}

/**
 * Lấy admin đang đăng nhập từ localStorage (đồng bộ sessionStorage)
 */
function getAdminUser() {
    var raw = localStorage.getItem(SESSION_ADMIN_USER_KEY) || sessionStorage.getItem(SESSION_ADMIN_USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

/**
 * Lưu admin đang đăng nhập vào localStorage & sessionStorage
 */
function setAdminUser(user) {
    if (user) {
        localStorage.setItem(SESSION_ADMIN_USER_KEY, JSON.stringify(user));
        sessionStorage.setItem(SESSION_ADMIN_USER_KEY, JSON.stringify(user));
    } else {
        localStorage.removeItem(SESSION_ADMIN_USER_KEY);
        sessionStorage.removeItem(SESSION_ADMIN_USER_KEY);
    }
}

// Tự động khởi tạo ngay khi nạp file
initDataStorage();
