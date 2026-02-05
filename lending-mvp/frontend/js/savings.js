document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/graphql'; // Use relative path for API
    const savingsTableBody = document.getElementById('savings-table-body');

    const getSavingsAccountsQuery = `
        query GetSavingsAccounts {
            savingsAccounts {
                accounts {
                    id
                    accountNumber
                    type
                    balance
                    status
                    openedAt
                }
            }
        }
    `;

    const fetchSavingsAccounts = async () => {
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
                    query: getSavingsAccountsQuery
                })
            });

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

    fetchSavingsAccounts(); // Initial fetch
});