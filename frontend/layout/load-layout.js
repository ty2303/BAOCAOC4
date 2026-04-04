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
    }

    let logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            localStorage.clear();
            window.location.href = '/';
        });
    }
}

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
