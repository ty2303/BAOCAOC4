async function loadIncludes() {
    let includeNodes = document.querySelectorAll('[data-include]');

    for (let node of includeNodes) {
        let filePath = node.getAttribute('data-include');

        if (!filePath) {
            continue;
        }

        try {
            let response = await fetch(filePath);

            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }

            let html = await response.text();
            node.innerHTML = html;
        } catch (error) {
            node.innerHTML = '<div>Không thể tải layout: ' + filePath + '</div>';
        }
    }

    setActiveNav();
}

function setActiveNav() {
    let currentPath = window.location.pathname;

    if (currentPath.length > 1 && currentPath.endsWith('/')) {
        currentPath = currentPath.slice(0, -1);
    }

    let navLinks = document.querySelectorAll('[data-nav]');

    navLinks.forEach(function (link) {
        let linkPath = link.getAttribute('data-nav') || '';

        if (linkPath.length > 1 && linkPath.endsWith('/')) {
            linkPath = linkPath.slice(0, -1);
        }

        if (linkPath === currentPath) {
            link.classList.add('is-active');
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    loadIncludes();
});
