document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/graphql'; // Use relative path for API
    const updateLoanTransactionForm = document.getElementById('update-loan-transaction-form');
    const formMessage = document.getElementById('form-message');

    // Get transaction ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const transactionId = urlParams.get('id');

    if (!transactionId) {
        formMessage.textContent = 'Error: Transaction ID not found in URL.';
        formMessage.className = 'mt-4 text-sm font-bold text-red-500';
        return;
    }

    // Input fields
    const loanIdInput = document.getElementById('loan-id');
    const transactionTypeSelect = document.getElementById('transaction-type');
    const amountInput = document.getElementById('amount');
    const transactionDateInput = document.getElementById('transaction-date');
    const notesTextarea = document.getElementById('notes');

    let originalLoanId = null; // To store loan_id for redirection

    // GraphQL Query to fetch a single loan transaction
    const getLoanTransactionQuery = `
        query GetLoanTransaction($transactionId: ID!) {
            loanTransaction(transactionId: $transactionId) {
                success
                message
                transaction {
                    id
                    loanId
                    transactionType
                    amount
                    transactionDate
                    notes
                }
            }
        }
    `;

    // GraphQL Mutation to update a loan transaction
    const updateLoanTransactionMutation = `
        mutation UpdateLoanTransaction($transactionId: ID!, $input: LoanTransactionUpdateInput!) {
            updateLoanTransaction(transactionId: $transactionId, input: $input) {
                success
                message
                transaction {
                    id
                    loanId
                }
            }
        }
    `;

    const fetchLoanTransactionData = async () => {
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
                    query: getLoanTransactionQuery,
                    variables: { transactionId: transactionId }
                })
            });

            if (!response.ok) {
                if (response.status === 401) {
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
                formMessage.textContent = `Error fetching transaction data: ${result.errors[0].message}`;
                formMessage.className = 'mt-4 text-sm font-bold text-red-500';
                return;
            }

            const transaction = result.data?.loanTransaction?.transaction;
            if (transaction) {
                populateForm(transaction);
                originalLoanId = transaction.loanId; // Store loan_id for redirection
            } else {
                formMessage.textContent = 'Loan transaction not found.';
                formMessage.className = 'mt-4 text-sm font-bold text-red-500';
            }

        } catch (error) {
            console.error('Error fetching loan transaction:', error);
            formMessage.textContent = 'Error connecting to the server.';
            formMessage.className = 'mt-4 text-sm font-bold text-red-500';
        }
    };

    const populateForm = (transaction) => {
        loanIdInput.value = transaction.loanId || '';
        transactionTypeSelect.value = transaction.transactionType || '';
        amountInput.value = transaction.amount || '';
        
        // Format datetime-local input
        if (transaction.transactionDate) {
            const date = new Date(transaction.transactionDate);
            // Example: 2023-11-20T10:30
            transactionDateInput.value = date.toISOString().slice(0, 16);
        } else {
            transactionDateInput.value = '';
        }
        
        notesTextarea.value = transaction.notes || '';
    };

    updateLoanTransactionForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const token = localStorage.getItem('accessToken');
        if (!token) {
            formMessage.textContent = 'Authentication token not found. Please log in again.';
            formMessage.className = 'mt-4 text-sm font-bold text-red-500';
            window.location.href = 'login.html';
            return;
        }

        formMessage.textContent = 'Updating loan transaction...';
        formMessage.className = 'mt-4 text-sm font-bold text-blue-500';

        const loanTransactionUpdateData = {
            transactionType: transactionTypeSelect.value,
            amount: parseFloat(amountInput.value),
            transactionDate: transactionDateInput.value ? new Date(transactionDateInput.value).toISOString() : null,
            notes: notesTextarea.value.trim() || null
        };

        // Validate inputs
        if (!loanTransactionUpdateData.transactionType || isNaN(loanTransactionUpdateData.amount) || loanTransactionUpdateData.amount <= 0) {
            formMessage.textContent = 'Please enter valid data for transaction type and amount.';
            formMessage.className = 'mt-4 text-sm font-bold text-red-500';
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
                    query: updateLoanTransactionMutation,
                    variables: {
                        transactionId: transactionId,
                        input: loanTransactionUpdateData
                    }
                })
            });

            if (!response.ok) {
                if (response.status === 401) {
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
                const errorMessage = result.errors[0]?.message || 'Unknown GraphQL error';
                if (result.errors.some(e => e.message.includes('Not authorized') || e.extensions?.code === 'UNAUTHENTICATED')) {
                    alert('You do not have permission to update loan transactions.');
                    // window.location.href = 'dashboard.html'; // Redirect if unauthorized
                } else {
                    formMessage.textContent = `Error: ${errorMessage}`;
                    formMessage.className = 'mt-4 text-sm font-bold text-red-500';
                }
                return;
            }

            const updateResult = result.data?.updateLoanTransaction;

            if (updateResult?.success) {
                formMessage.textContent = updateResult.message || 'Loan transaction updated successfully!';
                formMessage.className = 'mt-4 text-sm font-bold text-green-500';
                setTimeout(() => {
                    let redirectUrl = 'loan_transaction.html';
                    if (originalLoanId) {
                        redirectUrl += `?loan_id=${originalLoanId}`;
                    }
                    window.location.href = redirectUrl;
                }, 1500);
            } else {
                formMessage.textContent = updateResult?.message || 'Failed to update loan transaction.';
                formMessage.className = 'mt-4 text-sm font-bold text-red-500';
            }

        } catch (error) {
            console.error('Error updating loan transaction:', error);
            formMessage.textContent = error.message || 'An unexpected error occurred.';
            formMessage.className = 'mt-4 text-sm font-bold text-red-500';
        }
    });

    // Initial fetch to populate the form
    fetchLoanTransactionData();

    // Basic logout functionality (copied from other pages)
    document.getElementById('logout-btn').addEventListener('click', () => {
        alert('Logged out!'); // Replace with actual logout logic
        window.location.href = 'login.html'; // Redirect to login page
    });

    // Sidebar dropdowns
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
