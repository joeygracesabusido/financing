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
            savingsTableBody.innerHTML = '<tr><td colspan="6" class="p-3 text-center">No savings accounts found.</td></tr>';
            return;
        }

        savingsTableBody.innerHTML = '';

        accounts.forEach(account => {
            const row = document.createElement('tr');
            row.className = 'border-b hover:bg-gray-50';

            row.innerHTML = `
                <td class="p-3">${account.accountNumber}</td>
                <td class="p-3">${account.customer ? account.customer.displayName : 'N/A'}</td>
                <td class="p-3">${account.type}</td>
                <td class="p-3">₱${parseFloat(account.balance).toFixed(2)}</td>
                <td class="p-3">${account.status}</td>
                <td class="p-3">${new Date(account.openedAt).toLocaleDateString()}</td>
                <td class="p-3">
                    <a href="savings_details.html?id=${account.id}" class="text-blue-500 hover:text-blue-700 mr-2">View</a>
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