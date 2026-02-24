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
        query GetLoanTransactions($loanId: ID, $searchTerm: String, $skip: Int, $limit: Int, $transactionType: String) {
            loanTransactions(loanId: $loanId, searchTerm: $searchTerm, skip: $skip, limit: $limit, transactionType: $transactionType) {
                success
                message
                transactions {
                    id
                    loanId
                    borrowerName
                    loanProduct {
                        productName
                    }
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
    const fetchLoanTransactions = async (loanId = null, searchTerm = null, skip = 0, limit = 100, transactionType = 'disbursement') => {
        const token = localStorage.getItem('accessToken');
        
        console.log('=== Fetching Loan Transactions ===');
        console.log('Token exists:', !!token);
        console.log('Loan ID filter:', loanId);
        console.log('Search term:', searchTerm);
        console.log('Transaction Type:', transactionType);
        
        if (!token) {
            console.error('❌ Authentication token not found.');
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
                    variables: { loanId, searchTerm, skip, limit, transactionType }
                })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.warn('❌ 401 Unauthorized - clearing token');
                    localStorage.removeItem('accessToken');
                    alert('Session expired or unauthorized. Please log in again.');
                    window.location.href = 'login.html';
                    return;
                }
                const errorText = await response.text();
                throw new Error(`HTTP error ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('📦 GraphQL Response:', JSON.stringify(result, null, 2));

            if (result.errors) {
                console.error('❌ GraphQL Errors:', result.errors);
                const firstError = result.errors[0]?.message || 'Unknown GraphQL error';
                
                if (result.errors.some(e => e.message.includes('Not authorized') || e.extensions?.code === 'UNAUTHENTICATED')) {
                    alert('You do not have permission to view loan transactions.');
                    // window.location.href = 'dashboard.html'; // Redirect if unauthorized
                } else {
                    alert(`Error: ${firstError}`);
                }
                loanTransactionTableBody.innerHTML = `<tr><td colspan="9" class="p-3 text-center text-red-500">Error: ${firstError}</td></tr>`;
                return;
            }

            const transactionResponse = result.data?.loanTransactions;
            console.log('📋 Transaction Response:', transactionResponse);
            
            if (!transactionResponse?.success) {
                console.warn('⚠️ Query unsuccessful:', transactionResponse?.message || 'Unknown reason');
                loanTransactionTableBody.innerHTML = `<tr><td colspan="9" class="p-3 text-center">No loan transactions found or query failed.</td></tr>`;
                return;
            }

            const transactionData = transactionResponse.transactions;
            console.log('📊 Transactions Data:', transactionData);
            console.log('✅ Transaction count:', transactionData?.length || 0);
            
            if (!transactionData || !Array.isArray(transactionData)) {
                console.warn('⚠️ No loan transactions data returned or invalid format');
                loanTransactionTableBody.innerHTML = '<tr><td colspan="9" class="p-3 text-center">No loan transactions found or invalid response.</td></tr>';
                return;
            }

            if (transactionData.length === 0) {
                console.log('ℹ️ No transactions to display');
                loanTransactionTableBody.innerHTML = '<tr><td colspan="9" class="p-3 text-center">No loan transactions found.</td></tr>';
                return;
            }

            populateTable(transactionData);
            console.log('✅ Table populated successfully with', transactionData.length, 'transactions');

        } catch (error) {
            console.error('❌ Error fetching loan transactions:', error);
            loanTransactionTableBody.innerHTML = '<tr><td colspan="9" class="p-3 text-center text-red-500">Error loading loan transactions. Check console.</td></tr>';
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

    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined || isNaN(amount)) return '₱0.00';
        return '₱' + new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const populateTable = (transactions) => {
        console.log('🔄 Populating table with', transactions?.length || 0, 'transactions');
        
        if (!transactions || transactions.length === 0) {
            console.log('ℹ️ No transactions to populate');
            loanTransactionTableBody.innerHTML = '<tr><td colspan="9" class="p-3 text-center">No loan transactions found.</td></tr>';
            return;
        }

        loanTransactionTableBody.innerHTML = '';

        transactions.forEach((transaction, index) => {
            console.log(`Processing transaction ${index + 1}:`, transaction);
            
            const row = document.createElement('tr');
            row.className = 'border-b hover:bg-gray-50';

            const transactionDate = new Date(transaction.transactionDate).toLocaleDateString() + ' ' + new Date(transaction.transactionDate).toLocaleTimeString();

            row.innerHTML = `
                <td class="p-3">${transaction.id || 'N/A'}</td>
                <td class="p-3">${transaction.loanId || 'N/A'}</td>
                <td class="p-3">${transaction.borrowerName || 'N/A'}</td>
                <td class="p-3">${transaction.loanProduct?.productName || 'N/A'}</td>
                <td class="p-3">${transaction.transactionType || 'N/A'}</td>
                <td class="p-3 font-bold">${formatCurrency(transaction.amount)}</td>
                <td class="p-3">${transactionDate}</td>
                <td class="p-3">${transaction.notes || 'N/A'}</td>
                <td class="p-3 text-sm">
                    <button class="text-blue-500 hover:text-blue-700 mr-2 view-loan-btn" data-loan-id="${transaction.loanId}" title="View Loan Details"><i class="fas fa-eye"></i>Views</button>
                    <button class="text-indigo-500 hover:text-indigo-700 mr-2 amortization-btn" data-loan-id="${transaction.loanId}" title="Amortization Schedule"><i class="fas fa-calendar-alt"></i> Amortization</button>
                    <button class="text-yellow-500 hover:text-yellow-700 mr-2 edit-transaction-btn" data-id="${transaction.id}" title="Edit Transaction"><i class="fas fa-edit"></i></button>
                    <button class="text-red-500 hover:text-red-700 delete-transaction-btn" data-id="${transaction.id}" title="Delete Transaction"><i class="fas fa-trash"></i></button>
                </td>
            `;
            
            const viewButton = row.querySelector('.view-loan-btn');
            if (viewButton) {
                viewButton.addEventListener('click', (event) => {
                    const loanId = event.currentTarget.dataset.loanId;
                    console.log('👁️ Viewing loan:', loanId);
                    window.location.href = `loan_details.html?id=${loanId}`;
                });
            }

            const amortizationButton = row.querySelector('.amortization-btn');
            if (amortizationButton) {
                amortizationButton.addEventListener('click', (event) => {
                    const loanId = event.currentTarget.dataset.loanId;
                    console.log('📅 Viewing amortization for loan:', loanId);
                    window.location.href = `amortization.html?id=${loanId}`;
                });
            }

            const editButton = row.querySelector('.edit-transaction-btn');
            if (editButton) {
                editButton.addEventListener('click', (event) => {
                    const transactionId = event.currentTarget.dataset.id;
                    console.log('✏️ Editing transaction:', transactionId);
                    window.location.href = `update_loan_transaction.html?id=${transactionId}`;
                });
            }

            const deleteButton = row.querySelector('.delete-transaction-btn');
            if (deleteButton) {
                deleteButton.addEventListener('click', async (event) => {
                    const transactionId = event.currentTarget.dataset.id;
                    console.log('🗑️ Deleting transaction:', transactionId);
                    if (confirm('Are you sure you want to delete this loan transaction?')) {
                        const success = await deleteLoanTransaction(transactionId);
                        if (success) {
                            console.log('✅ Transaction deleted, refreshing list');
                            fetchLoanTransactions(initialLoanId); // Re-fetch transactions to update the table
                        }
                    }
                });
            }
            
            loanTransactionTableBody.appendChild(row);
        });
        
        console.log('✅ Table population complete');
    };

    // Event listener for the search input
    if (loanTransactionSearchInput) {
        loanTransactionSearchInput.addEventListener('input', (event) => {
            const searchTerm = event.target.value.trim();
            // Pass null for loanId and the actual searchTerm
            fetchLoanTransactions(null, searchTerm || null); 
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
    console.log('🚀 Initializing loan transactions page...');
    console.log('Initial Loan ID from URL:', initialLoanId || 'None (all transactions)');
    fetchLoanTransactions(initialLoanId);

    // Basic logout functionality (common to all pages)
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            console.log('👋 Logging out...');
            localStorage.removeItem('accessToken');
            window.location.href = 'login.html'; // Redirect to login page
        });
    }

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
