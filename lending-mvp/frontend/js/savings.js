document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/graphql'; // Use relative path for API
    const savingsTableBody = document.getElementById('savings-table-body');
    const savingsSearchInput = document.getElementById('savings-search-input');

    const getSavingsAccountsQuery = `
        query GetSavingsAccounts($searchTerm: String) {
            savingsAccounts(searchTerm: $searchTerm) {
                accounts {
                    id
                    accountNumber
                    type
                    balance
                    status
                    openedAt
                    customer {
                        displayName
                    }
                }
            }
        }
    `;

    const fetchSavingsAccounts = async (searchTerm = '') => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.error('Authentication token not found.');
            window.location.href = 'login.html';
            return;
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: getSavingsAccountsQuery,
                    variables: searchTerm ? { searchTerm } : {}
                })
            });

            if (!response.ok) {
            if (response.status === 401) {
                console.warn('401 Unauthorized - clearing token');
                localStorage.removeItem('accessToken');
                alert('Session expired or unauthorized. Please log in again.');
                window.location.href = 'login.html';
                return;
            }
            const errorText = await response.text();
            throw new Error(`HTTP error ${response.status}: ${errorText}`);
        }


            const result = await response.json();

            if (result.errors) {
                console.error('GraphQL Errors:', result.errors);
                savingsTableBody.innerHTML = `<tr><td colspan="6" class="p-3 text-center text-red-500">Error loading data: ${result.errors[0].message}</td></tr>`;
                return;
            }

            const accounts = result.data.savingsAccounts.accounts;
            populateTable(accounts);

        } catch (error) {
            console.error('Error fetching savings accounts:', error);
            savingsTableBody.innerHTML = '<tr><td colspan="6" class="p-3 text-center text-red-500">Error loading data. Is the server running?</td></tr>';
        }
    };

    const populateTable = (accounts) => {
        if (!accounts || accounts.length === 0) {
            savingsTableBody.innerHTML = '<tr><td colspan="7" class="p-8 text-center text-gray-400">No savings accounts found.</td></tr>';
            return;
        }

        savingsTableBody.innerHTML = '';

        accounts.forEach(account => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50/50 transition-colors';

            row.innerHTML = `
                <td class="p-4">
                    <span class="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md font-mono text-xs font-bold border border-blue-100">
                        ${account.accountNumber}
                    </span>
                </td>
                <td class="p-4 font-medium text-gray-700">${account.customer ? account.customer.displayName : '<span class="text-gray-400 italic text-xs">Unassigned</span>'}</td>
                <td class="p-4">
                    <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                        ${account.type.replace('_', ' ')}
                    </span>
                </td>
                <td class="p-4 font-bold text-gray-900">₱${parseFloat(account.balance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td class="p-4">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${account.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        <span class="w-1.5 h-1.5 mr-1.5 rounded-full ${account.status === 'active' ? 'bg-green-500' : 'bg-red-500'}"></span>
                        ${account.status}
                    </span>
                </td>
                <td class="p-4 text-gray-500 text-xs">${new Date(account.openedAt).toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'})}</td>
                <td class="p-4 text-center">
                    <a href="savings_details.html?id=${account.id}" 
                       class="inline-flex items-center px-3 py-1 bg-white border border-gray-200 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                        <i class="fas fa-external-link-alt mr-1.5 text-gray-400"></i> View
                    </a>
                </td>
            `;
            
            savingsTableBody.appendChild(row);
        });
    };

    // Event listener for the search input
    if (savingsSearchInput) {
        savingsSearchInput.addEventListener('input', (event) => {
            const searchTerm = event.target.value.trim();
            fetchSavingsAccounts(searchTerm);
        });
    }

    fetchSavingsAccounts(); // Initial fetch
});