document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/graphql'; // Use relative path for API
    const loanProductTableBody = document.getElementById('loan-product-table-body');
    const loanSearchInput = document.getElementById('loan-search-input');

    // GraphQL query to fetch loan products
    let getLoanProductsQuery = `
        query GetLoans($borrowerId: ID, $skip: Int, $limit: Int) {
            loans(borrowerId: $borrowerId, skip: $skip, limit: $limit) {
                loans {
                    id
                    borrowerId
                    amountRequested
                    termMonths
                    interestRate
                    status
                    createdAt
                }
                total
            }
        }
    `;

    // Fetching loan products with optional filters
    const fetchLoanProducts = async (borrowerId = null, skip = 0, limit = 100) => {
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
                    query: getLoanProductsQuery,
                    variables: { borrowerId, skip, limit }
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
                    alert('You do not have permission to view loan products.');
                    // window.location.href = 'dashboard.html'; // Redirect if unauthorized
                } else {
                    alert(`Error: ${firstError}`);
                }
                return;
            }

            const loanData = result.data?.loans;
            if (!loanData || !Array.isArray(loanData.loans)) {
                console.warn('No loan products data returned');
                loanProductTableBody.innerHTML = '<tr><td colspan="8" class="p-3 text-center">No loan products found or invalid response.</td></tr>';
                return;
            }

            populateTable(loanData.loans);

        } catch (error) {
            console.error('Error fetching loan products:', error);
            loanProductTableBody.innerHTML = '<tr><td colspan="8" class="p-3 text-center text-red-500">Error loading loan products. Check console.</td></tr>';
        }
    };

    // GraphQL mutation to delete a loan product
    const deleteLoanMutation = `
        mutation DeleteLoan($loanId: ID!) {
            deleteLoan(loanId: $loanId) {
                success
                message
            }
        }
    `;

    const deleteLoanProduct = async (loanId) => {
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
                    query: deleteLoanMutation,
                    variables: { loanId: loanId }
                })
            });

            const result = await response.json();

            if (result.errors) {
                if (result.errors.some(error => error.message.includes("Not authorized"))) {
                    console.error('Authorization error: You do not have permission to delete this data.');
                    alert('You are not authorized to delete loan products.');
                } else {
                    console.error('GraphQL Errors:', result.errors);
                    alert('An error occurred while deleting the loan product.');
                }
                return false;
            }

            if (result.data.deleteLoan.success) {
                alert(result.data.deleteLoan.message);
                return true;
            } else {
                alert('Error: ' + result.data.deleteLoan.message);
                return false;
            }

        } catch (error) {
            console.error('Error deleting loan product:', error);
            alert('An error occurred while deleting the loan product. Is the server running?');
            return false;
        }
    };

    const populateTable = (loans) => {
        if (!loans || loans.length === 0) {
            loanProductTableBody.innerHTML = '<tr><td colspan="8" class="p-3 text-center">No loan products found.</td></tr>';
            return;
        }

        loanProductTableBody.innerHTML = '';

        loans.forEach(loan => {
            const row = document.createElement('tr');
            row.className = 'border-b hover:bg-gray-50';

            const createdAt = new Date(loan.createdAt).toLocaleString();

            row.innerHTML = `
                <td class="p-3">${loan.id || 'N/A'}</td>
                <td class="p-3">${loan.borrowerId || 'N/A'}</td>
                <td class="p-3">₱${loan.amountRequested ? parseFloat(loan.amountRequested).toFixed(2) : '0.00'}</td>
                <td class="p-3">${loan.termMonths || 'N/A'}</td>
                <td class="p-3">${loan.interestRate ? parseFloat(loan.interestRate).toFixed(2) : '0.00'}%</td>
                <td class="p-3">${loan.status || 'N/A'}</td>
                <td class="p-3">${createdAt}</td>
                <td class="p-3">
                    <button class="text-blue-500 hover:text-blue-700 mr-2 edit-loan-btn" data-id="${loan.id}"><i class="fas fa-edit"></i></button>
                    <button class="text-red-500 hover:text-red-700 delete-loan-btn" data-id="${loan.id}"><i class="fas fa-trash"></i></button>
                    <button class="text-green-500 hover:text-green-700 view-transactions-btn" data-id="${loan.id}"><i class="fas fa-eye"></i></button>
                </td>
            `;
            
            const editButton = row.querySelector('.edit-loan-btn');
            if (editButton) {
                editButton.addEventListener('click', (event) => {
                    const loanId = event.currentTarget.dataset.id;
                    window.location.href = `update_loan.html?id=${loanId}`;
                });
            }

            const deleteButton = row.querySelector('.delete-loan-btn');
            if (deleteButton) {
                deleteButton.addEventListener('click', async (event) => {
                    const loanId = event.currentTarget.dataset.id;
                    if (confirm('Are you sure you want to delete this loan product?')) {
                        const success = await deleteLoanProduct(loanId);
                        if (success) {
                            fetchLoanProducts(); // Re-fetch loan products to update the table
                        }
                    }
                });
            }

            const viewTransactionsButton = row.querySelector('.view-transactions-btn');
            if (viewTransactionsButton) {
                viewTransactionsButton.addEventListener('click', (event) => {
                    const loanId = event.currentTarget.dataset.id;
                    window.location.href = `loan_transaction.html?loan_id=${loanId}`;
                });
            }
            
            loanProductTableBody.appendChild(row);
        });
    };

    // Event listener for the search input
    if (loanSearchInput) {
        loanSearchInput.addEventListener('input', (event) => {
            const searchTerm = event.target.value.trim();
            // Assuming search term will be matched against borrowerId for simplicity, or add a general search field
            // For now, let's just re-fetch all for simplicity unless backend supports general search
            fetchLoanProducts(searchTerm || null); // Pass null if search term is empty
        });
    }

    fetchLoanProducts(); // Initial fetch of all loan products
});
