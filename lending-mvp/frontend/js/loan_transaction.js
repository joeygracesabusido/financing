document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/graphql'; // Use relative path for API
    const loanTransactionTableBody = document.getElementById('loan-transaction-table-body');
    const loanTransactionSearchInput = document.getElementById('loan-transaction-search-input');
    const createLoanTransactionBtn = document.getElementById('create-loan-transaction-btn');

    // Get loan_id from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const initialLoanId = urlParams.get('loan_id');

    // GraphQL query to fetch loan transactions
    let getLoanTransactionsQuery = `
        query GetLoanTransactions($loanId: ID, $skip: Int, $limit: Int) {
            loanTransactions(loanId: $loanId, skip: $skip, limit: $limit) {
                transactions {
                    id
                    loanId
                    transactionType
                    amount
                    transactionDate
                    notes
                }
                total
            }
        }
    `;

    // Fetching loan transactions with optional filters
    const fetchLoanTransactions = async (loanId = null, skip = 0, limit = 100) => {
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
                    query: getLoanTransactionsQuery,
                    variables: { loanId, skip, limit }
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
                const firstError = result.errors[0]?.message || 'Unknown GraphQL error';
                
                if (result.errors.some(e => e.message.includes('Not authorized') || e.extensions?.code === 'UNAUTHENTICATED')) {
                    alert('You do not have permission to view loan transactions.');
                    // window.location.href = 'dashboard.html'; // Redirect if unauthorized
                } else {
                    alert(`Error: ${firstError}`);
                }
                return;
            }

            const transactionData = result.data?.loanTransactions;
            if (!transactionData || !Array.isArray(transactionData.transactions)) {
                console.warn('No loan transactions data returned');
                loanTransactionTableBody.innerHTML = '<tr><td colspan="7" class="p-3 text-center">No loan transactions found or invalid response.</td></tr>';
                return;
            }

            populateTable(transactionData.transactions);

        } catch (error) {
            console.error('Error fetching loan transactions:', error);
            loanTransactionTableBody.innerHTML = '<tr><td colspan="7" class="p-3 text-center text-red-500">Error loading loan transactions. Check console.</td></tr>';
        }
    };

    // GraphQL mutation to delete a loan transaction
    const deleteLoanTransactionMutation = `
        mutation DeleteLoanTransaction($transactionId: ID!) {
            deleteLoanTransaction(transactionId: $transactionId) {
                success
                message
            }
        }
    `;

    const deleteLoanTransaction = async (transactionId) => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.error('Authentication token not found.');
            window.location.href = 'login.html';
            return false;
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: deleteLoanTransactionMutation,
                    variables: { transactionId: transactionId }
                })
            });

            const result = await response.json();

            if (result.errors) {
                if (result.errors.some(error => error.message.includes("Not authorized"))) {
                    console.error('Authorization error: You do not have permission to delete this data.');
                    alert('You are not authorized to delete loan transactions.');
                } else {
                    console.error('GraphQL Errors:', result.errors);
                    alert('An error occurred while deleting the loan transaction.');
                }
                return false;
            }

            if (result.data.deleteLoanTransaction.success) {
                alert(result.data.deleteLoanTransaction.message);
                return true;
            } else {
                alert('Error: ' + result.data.deleteLoanTransaction.message);
                return false;
            }

        } catch (error) {
            console.error('Error deleting loan transaction:', error);
            alert('An error occurred while deleting the loan transaction. Is the server running?');
            return false;
        }
    };

    const populateTable = (transactions) => {
        if (!transactions || transactions.length === 0) {
            loanTransactionTableBody.innerHTML = '<tr><td colspan="7" class="p-3 text-center">No loan transactions found.</td></tr>';
            return;
        }

        loanTransactionTableBody.innerHTML = '';

        transactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.className = 'border-b hover:bg-gray-50';

            const transactionDate = new Date(transaction.transactionDate).toLocaleDateString() + ' ' + new Date(transaction.transactionDate).toLocaleTimeString();

            row.innerHTML = `
                <td class="p-3">${transaction.id || 'N/A'}</td>
                <td class="p-3">${transaction.loanId || 'N/A'}</td>
                <td class="p-3">${transaction.transactionType || 'N/A'}</td>
                <td class="p-3">₱${transaction.amount ? parseFloat(transaction.amount).toFixed(2) : '0.00'}</td>
                <td class="p-3">${transactionDate}</td>
                <td class="p-3">${transaction.notes || 'N/A'}</td>
                <td class="p-3">
                    <button class="text-blue-500 hover:text-blue-700 mr-2 edit-transaction-btn" data-id="${transaction.id}"><i class="fas fa-edit"></i></button>
                    <button class="text-red-500 hover:text-red-700 delete-transaction-btn" data-id="${transaction.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            
            const editButton = row.querySelector('.edit-transaction-btn');
            if (editButton) {
                editButton.addEventListener('click', (event) => {
                    const transactionId = event.currentTarget.dataset.id;
                    window.location.href = `update_loan_transaction.html?id=${transactionId}`;
                });
            }

            const deleteButton = row.querySelector('.delete-transaction-btn');
            if (deleteButton) {
                deleteButton.addEventListener('click', async (event) => {
                    const transactionId = event.currentTarget.dataset.id;
                    if (confirm('Are you sure you want to delete this loan transaction?')) {
                        const success = await deleteLoanTransaction(transactionId);
                        if (success) {
                            fetchLoanTransactions(initialLoanId); // Re-fetch transactions to update the table
                        }
                    }
                });
            }
            
            loanTransactionTableBody.appendChild(row);
        });
    };

    // Event listener for the search input
    if (loanTransactionSearchInput) {
        loanTransactionSearchInput.addEventListener('input', (event) => {
            const searchTerm = event.target.value.trim();
            fetchLoanTransactions(searchTerm || null); // Pass null if search term is empty
        });
    }

    // Event listener for the "Create New Transaction" button
    if (createLoanTransactionBtn) {
        createLoanTransactionBtn.addEventListener('click', () => {
            let url = 'create_loan_transaction.html';
            if (initialLoanId) {
                url += `?loan_id=${initialLoanId}`;
            }
            window.location.href = url;
        });
    }

    // Initial fetch of loan transactions
    fetchLoanTransactions(initialLoanId);

    // Basic logout functionality (common to all pages)
    document.getElementById('logout-btn').addEventListener('click', () => {
        alert('Logged out!'); // Replace with actual logout logic
        window.location.href = 'login.html'; // Redirect to login page
    });

    // Sidebar dropdowns (common to all pages)
    const customerDropdownBtn = document.getElementById('customer-dropdown-btn');
    const customerDropdownMenu = document.getElementById('customer-dropdown-menu');
    if (customerDropdownBtn && customerDropdownMenu) {
        customerDropdownBtn.addEventListener('click', () => {
            customerDropdownMenu.classList.toggle('hidden');
        });
    }

    const savingsDropdownBtn = document.getElementById('savings-dropdown-btn');
    const savingsDropdownMenu = document.getElementById('savings-dropdown-menu');
    if (savingsDropdownBtn && savingsDropdownMenu) {
        savingsDropdownBtn.addEventListener('click', () => {
            savingsDropdownMenu.classList.toggle('hidden');
        });
    }
    
    const loanDropdownBtn = document.getElementById('loan-dropdown-btn');
    const loanDropdownMenu = document.getElementById('loan-dropdown-menu');
    if (loanDropdownBtn && loanDropdownMenu) {
        loanDropdownBtn.addEventListener('click', () => {
            loanDropdownMenu.classList.toggle('hidden');
        });
    }
});
