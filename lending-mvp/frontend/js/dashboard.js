document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');
    console.log('Token from localStorage:', token ? token.substring(0, 20) + '...' : 'NOT FOUND');
    
    if (!token) {
        console.error('Authentication token not found. Redirecting to login...');
        console.log('localStorage contents:', Object.keys(localStorage));
        window.location.href = 'login.html';
        return;
    }

    // Basic logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('accessToken');
            alert('Logged out!');
            window.location.href = 'login.html';
        });
    }

    // Sidebar dropdown toggles
    const toggleDropdown = (btnId, menuId) => {
        const btn = document.getElementById(btnId);
        const menu = document.getElementById(menuId);
        if (btn && menu) {
            btn.addEventListener('click', () => {
                menu.classList.toggle('hidden');
            });
        }
    };

    toggleDropdown('customer-dropdown-btn', 'customer-dropdown-menu');
    toggleDropdown('savings-dropdown-btn', 'savings-dropdown-menu');
    toggleDropdown('loan-dropdown-btn', 'loan-dropdown-menu');
});
