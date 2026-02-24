document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/graphql'; // Use relative path for API
    const loanProductTableBody = document.getElementById('loan-product-table-body');
    const loanSearchInput = document.getElementById('loan-search-input');

    // GraphQL query to fetch loan products
    let getLoanProductsQuery = `
        query GetLoanProducts {
            loanProducts {
            
                id
                productCode
                productName
                termType
                glCode
                type
                defaultInterestRate
                template
                security
                brLc
                modeOfPayment
                createdAt
            }
        }
    `;

    // Fetching loan products with optional filters
    const fetchLoanProducts = async (searchTerm = null) => { // Removed borrowerId, skip, limit
        const token = localStorage.getItem('accessToken'); // Corrected to access_token
        
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
                    variables: {} // Removed borrowerId, skip, limit from variables
                })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.warn('401 Unauthorized - clearing token');
                    localStorage.removeItem('access_token'); // Corrected to access_token
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

            const loanProductsData = result.data?.loanProducts; // Changed to loanProducts
            if (!loanProductsData || !Array.isArray(loanProductsData)) { // Changed to loanProductsData
                console.warn('No loan products data returned');
                loanProductTableBody.innerHTML = '<tr><td colspan="12" class="p-3 text-center">No loan products found or invalid response.</td></tr>'; // Updated colspan
                return;
            }

            // Filter on frontend for searchTerm if provided
            const filteredProducts = searchTerm
                ? loanProductsData.filter(product =>
                    product.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    product.type.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                : loanProductsData;

            populateTable(filteredProducts);

        } catch (error) {
            console.error('Error fetching loan products:', error);
            loanProductTableBody.innerHTML = '<tr><td colspan="12" class="p-3 text-center text-red-500">Error loading loan products. Check console.</td></tr>'; // Updated colspan
        }
    };

    // GraphQL mutation to delete a loan product
    const deleteLoanProductMutation = ` // Renamed from deleteLoanMutation
        mutation DeleteLoanProduct($id: String!) { // Changed variable name to id
            deleteLoanProduct(id: $id) // Changed mutation name to deleteLoanProduct
        }
    `;

    const deleteLoanProduct = async (id) => { // Changed loanId to id
        const token = localStorage.getItem('accessToken'); // Corrected to access_token
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
                    query: deleteLoanProductMutation, // Changed mutation name
                    variables: { id: id } // Changed variable name to id
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

            if (result.data.deleteLoanProduct) { // Changed to deleteLoanProduct
                alert('Loan Product deleted successfully!'); // Simplified message
                return true;
            } else {
                alert('Error: Could not delete loan product.'); // Simplified message
                return false;
            }

        } catch (error) {
            console.error('Error deleting loan product:', error);
            alert('An error occurred while deleting the loan product. Is the server running?');
            return false;
        }
    };

    const populateTable = (loanProducts) => { // Changed loans to loanProducts
        if (!loanProducts || loanProducts.length === 0) {
            loanProductTableBody.innerHTML = '<tr><td colspan="12" class="p-3 text-center">No loan products found.</td></tr>'; // Updated colspan
            return;
        }

        loanProductTableBody.innerHTML = '';

        loanProducts.forEach(product => { // Changed loan to product
            const row = document.createElement('tr');
            row.className = 'border-b hover:bg-gray-50';

            const createdAt = new Date(product.createdAt).toLocaleString(); // Changed loan.createdAt to product.createdAt

            row.innerHTML = `
                
                <td class="p-3">${product.productCode || 'N/A'}</td>
                <td class="p-3">${product.productName || 'N/A'}</td>
                <td class="p-3">${product.termType || 'N/A'}</td>
                <td class="p-3">${product.glCode || 'N/A'}</td>
                <td class="p-3">${product.type || 'N/A'}</td>
                <td class="p-3">${product.defaultInterestRate ? parseFloat(product.defaultInterestRate).toFixed(2) : '0.00'}%</td>
                <td class="p-3">${product.template || 'N/A'}</td>
                <td class="p-3">${product.security || 'N/A'}</td>
                <td class="p-3">${product.brLc || 'N/A'}</td>
                <td class="p-3">${product.modeOfPayment || 'N/A'}</td>
                <td class="p-3">${createdAt}</td>
                <td class="p-3">
                    <button class="text-blue-500 hover:text-blue-700 mr-2 edit-loan-btn" data-id="${product.id}"><i class="fas fa-edit"></i></button>
                    <button class="text-red-500 hover:text-red-700 delete-loan-btn" data-id="${product.id}"><i class="fas fa-trash"></i></button>
                    <button class="text-green-500 hover:text-green-700 view-transactions-btn" data-id="${product.id}"><i class="fas fa-eye"></i></button>
                </td>
            `;
            
            const editButton = row.querySelector('.edit-loan-btn');
            if (editButton) {
                editButton.addEventListener('click', (event) => {
                    const productId = event.currentTarget.dataset.id; // Changed loanId to productId
                    window.location.href = `update_loan_product.html?id=${productId}`; // Changed to update_loan_product.html
                });
            }

            const deleteButton = row.querySelector('.delete-loan-btn');
            if (deleteButton) {
                deleteButton.addEventListener('click', async (event) => {
                    const productId = event.currentTarget.dataset.id; // Changed loanId to productId
                    if (confirm('Are you sure you want to delete this loan product?')) {
                        const success = await deleteLoanProduct(productId); // Changed loanId to productId
                        if (success) {
                            fetchLoanProducts(); // Re-fetch loan products to update the table
                        }
                    }
                });
            }

            const viewTransactionsButton = row.querySelector('.view-transactions-btn');
            if (viewTransactionsButton) {
                viewTransactionsButton.addEventListener('click', (event) => {
                    const productId = event.currentTarget.dataset.id; // Changed loanId to productId
                    window.location.href = `loan_transaction.html?loan_product_id=${productId}`; // Changed to loan_product_id
                });
            }
            
            loanProductTableBody.appendChild(row);
        });
    };

    // Event listener for the search input
    if (loanSearchInput) {
        loanSearchInput.addEventListener('input', (event) => {
            const searchTerm = event.target.value.trim();
            fetchLoanProducts(searchTerm || null); // Pass null if search term is empty
        });
    }

    fetchLoanProducts(); // Initial fetch of all loan products
});
