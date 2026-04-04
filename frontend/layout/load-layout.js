// Auto-logout toàn cục khi server trả về 403 do token hết hạn
(function () {
    let _fetch = window.fetch;
    window.fetch = async function () {
        let response = await _fetch.apply(this, arguments);
        if (response.status === 403 && localStorage.getItem('token')) {
            let cloned = response.clone();
            try {
                let data = await cloned.json();
                let msg = (data && data.message) ? data.message.toLowerCase() : '';
                if (msg.includes('token') || msg.includes('het han') || msg.includes('hết hạn') || msg.includes('dang nhap') || msg.includes('đăng nhập')) {
                    localStorage.clear();
                    window.location.href = '/auth/';
                }
            } catch {}
        }
        return response;
    };
})();

function normalizePath(path) {
    if (!path) return '/';
    if (path.length > 1 && path.endsWith('/')) {
        return path.slice(0, -1);
    }
    return path;
}

function redirectAdminIfNeeded() {
    let token = localStorage.getItem('token');
    let role = localStorage.getItem('role');
    if (!token || role !== 'ADMIN') return;

    let currentPath = normalizePath(window.location.pathname);
    if (currentPath !== '/admin') {
        window.location.replace('/admin/');
    }
}

async function loadIncludes() {
    let includeNodes = document.querySelectorAll('[data-include]');

    for (let node of includeNodes) {
        let filePath = node.getAttribute('data-include');
        if (!filePath) continue;

        try {
            let response = await fetch(filePath);
            if (!response.ok) throw new Error('HTTP ' + response.status);
            let html = await response.text();
            node.innerHTML = html;
        } catch (error) {
            node.innerHTML = '<div>Khong the tai: ' + filePath + '</div>';
        }
    }

    setActiveNav();
    initAuthHeader();
}

function setActiveNav() {
    let currentPath = normalizePath(window.location.pathname);

    document.querySelectorAll('[data-nav]').forEach(function (link) {
        let linkPath = normalizePath(link.getAttribute('data-nav') || '');
        if (linkPath === currentPath) {
            link.classList.add('active');
        }
    });
}

let notificationSocket = null;
let unreadNotificationCount = 0;

function setNotificationBadge(count) {
    unreadNotificationCount = Number(count || 0);
    let badgeText = unreadNotificationCount > 99 ? '99+' : String(unreadNotificationCount);

    let ids = [
        'nav-user-badge',
        'nav-notifications-badge',
        'nav-notifications-dropdown-badge'
    ];

    ids.forEach(function (id) {
        let el = document.getElementById(id);
        if (!el) return;
        if (unreadNotificationCount > 0) {
            el.textContent = badgeText;
            el.classList.remove('d-none');
        } else {
            el.textContent = '0';
            el.classList.add('d-none');
        }
    });
}

async function fetchUnreadNotificationCount() {
    let token = localStorage.getItem('token');
    if (!token) {
        setNotificationBadge(0);
        return;
    }

    try {
        let response = await fetch('/api/v1/notifications/unread-count', {
            headers: {
                Authorization: 'Bearer ' + token
            }
        });

        let data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Khong the tai so thong bao');
        setNotificationBadge(data.unreadCount || 0);
    } catch {
        setNotificationBadge(0);
    }
}

function ensureSocketIoScript() {
    if (window.io) {
        return Promise.resolve();
    }

    if (window.__socketIoLoadingPromise) {
        return window.__socketIoLoadingPromise;
    }

    window.__socketIoLoadingPromise = new Promise(function (resolve, reject) {
        let script = document.createElement('script');
        script.src = '/socket.io/socket.io.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });

    return window.__socketIoLoadingPromise;
}

async function connectNotificationSocket() {
    let token = localStorage.getItem('token');
    if (!token || notificationSocket) return;

    try {
        await ensureSocketIoScript();
        if (!window.io) return;

        notificationSocket = window.io(window.location.origin, {
            transports: ['websocket'],
            auth: { token: token }
        });

        notificationSocket.on('connect', function () {
            fetchUnreadNotificationCount();
        });

        notificationSocket.on('new-notification', function (notification) {
            setNotificationBadge(unreadNotificationCount + 1);
            window.dispatchEvent(new CustomEvent('notification:new', {
                detail: notification
            }));
        });
    } catch {}
}

function initAuthHeader() {
    let token = localStorage.getItem('token');
    let username = localStorage.getItem('username');
    let role = localStorage.getItem('role');

    let guestEl = document.getElementById('nav-guest');
    let userEl = document.getElementById('nav-user');
    let nameEl = document.getElementById('nav-username');
    let wishlistItem = document.getElementById('nav-wishlist-item');
    let adminLink = document.getElementById('nav-admin-link');
    let adminItem = document.getElementById('nav-admin-item');
    let brandEl = document.getElementById('nav-brand');
    let homeItem = document.getElementById('nav-home-item');
    let productsItem = document.getElementById('nav-products-item');
    let cartItem = document.getElementById('nav-cart-item');
    let chatItem = document.getElementById('nav-chat-item');
    let notificationsItem = document.getElementById('nav-notifications-item');
    let profileItem = document.getElementById('nav-profile-item');
    let ordersItem = document.getElementById('nav-orders-item');
    let chatDropdownItem = document.getElementById('nav-chat-dropdown-item');
    let notificationsDropdownItem = document.getElementById('nav-notifications-dropdown-item');
    let wishlistDropdownItem = document.getElementById('nav-wishlist-dropdown-item');

    if (!guestEl || !userEl) return;

    if (token) {
        guestEl.classList.add('d-none');
        userEl.classList.remove('d-none');
        if (nameEl) nameEl.textContent = username || 'Tai khoan';
        fetchUnreadNotificationCount();
        connectNotificationSocket();

        if (role === 'ADMIN') {
            if (brandEl) brandEl.setAttribute('href', '/admin/');
            if (homeItem) homeItem.style.display = 'none';
            if (productsItem) productsItem.style.display = 'none';
            if (cartItem) cartItem.style.display = 'none';
            if (chatItem) chatItem.style.display = 'none';
            if (notificationsItem) notificationsItem.style.display = 'none';
            if (wishlistItem) wishlistItem.style.display = 'none';
            if (profileItem) profileItem.style.display = 'none';
            if (ordersItem) ordersItem.style.display = 'none';
            if (chatDropdownItem) chatDropdownItem.style.display = 'none';
            if (notificationsDropdownItem) notificationsDropdownItem.style.display = 'none';
            if (wishlistDropdownItem) wishlistDropdownItem.style.display = 'none';
            if (adminLink) adminLink.style.display = '';
            if (adminItem) adminItem.style.display = '';
        } else {
            if (brandEl) brandEl.setAttribute('href', '/');
            if (homeItem) homeItem.style.display = '';
            if (productsItem) productsItem.style.display = '';
            if (cartItem) cartItem.style.display = '';
            if (chatItem) chatItem.style.display = '';
            if (notificationsItem) notificationsItem.style.display = '';
            if (wishlistItem) wishlistItem.style.display = '';
            if (profileItem) profileItem.style.display = '';
            if (ordersItem) ordersItem.style.display = '';
            if (chatDropdownItem) chatDropdownItem.style.display = '';
            if (notificationsDropdownItem) notificationsDropdownItem.style.display = '';
            if (wishlistDropdownItem) wishlistDropdownItem.style.display = '';
            if (adminLink) adminLink.style.display = 'none';
            if (adminItem) adminItem.style.display = 'none';
        }
    } else {
        guestEl.classList.remove('d-none');
        userEl.classList.add('d-none');
        if (wishlistItem) wishlistItem.style.display = 'none';
        if (notificationsItem) notificationsItem.style.display = 'none';
        setNotificationBadge(0);
    }

    let logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            localStorage.clear();
            window.location.href = '/';
        });
    }
}

window.refreshNotificationBadge = fetchUnreadNotificationCount;

function getUserIdFromToken() {
    let token = localStorage.getItem('token');
    if (!token) return null;
    try {
        let payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id;
    } catch {
        return null;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    redirectAdminIfNeeded();
    loadIncludes();
});
