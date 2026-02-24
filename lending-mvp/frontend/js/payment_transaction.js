document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/graphql';
    const paymentTransactionTableBody = document.getElementById('payment-transaction-table-body');
    const paymentTransactionSearchInput = document.getElementById('payment-transaction-search-input');

    // GraphQL query to fetch loan transactions (filtered by repayment in JS call)
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

    const fetchPaymentTransactions = async (loanId = null, searchTerm = null, skip = 0, limit = 100) => {
        const token = localStorage.getItem('accessToken');
        const transactionType = 'repayment'; // Fixed to only show repayments
        
        if (!token) {
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

            const result = await response.json();

            if (result.errors) {
                const firstError = result.errors[0]?.message || 'Unknown GraphQL error';
                paymentTransactionTableBody.innerHTML = `<tr><td colspan="9" class="p-3 text-center text-red-500">Error: ${firstError}</td></tr>`;
                return;
            }

            const transactionResponse = result.data?.loanTransactions;
            if (!transactionResponse?.success) {
                paymentTransactionTableBody.innerHTML = `<tr><td colspan="9" class="p-3 text-center">No payment transactions found.</td></tr>`;
                return;
            }

            const transactionData = transactionResponse.transactions;
            if (!transactionData || transactionData.length === 0) {
                paymentTransactionTableBody.innerHTML = '<tr><td colspan="9" class="p-3 text-center">No payment transactions found.</td></tr>';
                return;
            }

            populateTable(transactionData);

        } catch (error) {
            console.error('Error fetching transactions:', error);
            paymentTransactionTableBody.innerHTML = '<tr><td colspan="9" class="p-3 text-center text-red-500">Error loading transactions.</td></tr>';
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
        paymentTransactionTableBody.innerHTML = '';

        transactions.forEach((transaction) => {
            const row = document.createElement('tr');
            row.className = 'border-b hover:bg-gray-50';

            const transactionDate = new Date(transaction.transactionDate).toLocaleString();

            row.innerHTML = `
                <td class="p-3 text-xs text-gray-500">${transaction.id}</td>
                <td class="p-3 font-semibold">${transaction.loanId}</td>
                <td class="p-3">${transaction.borrowerName || 'N/A'}</td>
                <td class="p-3">${transaction.loanProduct?.productName || 'N/A'}</td>
                <td class="p-3"><span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold uppercase">${transaction.transactionType}</span></td>
                <td class="p-3 font-bold text-green-600">${formatCurrency(transaction.amount)}</td>
                <td class="p-3 text-sm">${transactionDate}</td>
                <td class="p-3 text-sm italic text-gray-600">${transaction.notes || '-'}</td>
                <td class="p-3 text-sm">
                    <button class="text-blue-500 hover:text-blue-700 mr-2 view-loan-btn" data-loan-id="${transaction.loanId}" title="View Loan Details"><i class="fas fa-eye"></i></button>
                </td>
            `;
            
            const viewButton = row.querySelector('.view-loan-btn');
            if (viewButton) {
                viewButton.addEventListener('click', (event) => {
                    const loanId = event.currentTarget.dataset.loanId;
                    window.location.href = `loan_details.html?id=${loanId}`;
                });
            }
            
            paymentTransactionTableBody.appendChild(row);
        });
    };

    if (paymentTransactionSearchInput) {
        paymentTransactionSearchInput.addEventListener('input', (event) => {
            const searchTerm = event.target.value.trim();
            fetchPaymentTransactions(null, searchTerm || null); 
        });
    }

    fetchPaymentTransactions();
});
