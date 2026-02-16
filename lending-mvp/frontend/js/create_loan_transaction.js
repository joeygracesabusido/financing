document.addEventListener('DOMContentLoaded', () => {
    // Authentication check
    const token = localStorage.getItem('accessToken');
    if (!token) {
        console.error('Authentication token not found. Redirecting to login...');
        window.location.href = 'login.html';
        return;
    }

    const API_URL = '/graphql'; // Use relative path for API
    const createLoanTransactionForm = document.getElementById('create-loan-transaction-form');
    const formMessage = document.getElementById('form-message');
    const transactionTypeSelect = document.getElementById('transaction-type');
    const disbursementSection = document.getElementById('disbursement-section');

    // Input fields
    const loanIdInput = document.getElementById('loan-id');
    const transactionTypeSelect_var = document.getElementById('transaction-type');
    const amountInput = document.getElementById('amount');
    const transactionDateInput = document.getElementById('transaction-date');
    const notesTextarea = document.getElementById('notes');

    // Get loan_id from URL if present and pre-fill
    const urlParams = new URLSearchParams(window.location.search);
    const initialLoanId = urlParams.get('loan_id');
    if (initialLoanId) {
        loanIdInput.value = initialLoanId;
    }

    // Show/hide disbursement section based on transaction type
    transactionTypeSelect.addEventListener('change', () => {
        if (transactionTypeSelect.value === 'disbursement') {
            disbursementSection.style.display = 'block';
        } else {
            disbursementSection.style.display = 'none';
        }
    });

    // Set default date to today
    const today = new Date().toISOString().slice(0, 16);
    if (!transactionDateInput.value) {
        transactionDateInput.value = today;
    }

    // GraphQL mutation to create a loan transaction
    const createLoanTransactionMutation = `
        mutation CreateLoanTransaction($input: LoanTransactionCreateInput!) {
            createLoanTransaction(input: $input) {
                success
                message
                transaction {
                    id
                    loanId
                    transactionType
                    amount
                }
            }
        }
    `;

    createLoanTransactionForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        formMessage.textContent = '';
        formMessage.className = 'mt-4 text-sm font-bold';

        const loanId = loanIdInput.value.trim();
        const transactionType = transactionTypeSelect.value;
        const amount = parseFloat(amountInput.value);
        const transactionDate = transactionDateInput.value ? new Date(transactionDateInput.value).toISOString() : new Date().toISOString();
        const notes = notesTextarea.value.trim() || null;

        if (!loanId || !transactionType || isNaN(amount) || amount <= 0) {
            formMessage.textContent = 'Please fill in all required fields with valid data.';
            formMessage.className = 'mt-4 text-sm font-bold text-red-500';
            return;
        }

        // Collect additional fields if present
        const additionalData = {
            referenceNumber: document.getElementById('reference-number')?.value.trim() || null,
            borrowerName: document.getElementById('borrower-name')?.value.trim() || null,
            loanProduct: document.getElementById('loan-product')?.value.trim() || null,
            currency: document.getElementById('currency')?.value || 'NGN',
            exchangeRate: parseFloat(document.getElementById('exchange-rate')?.value) || null,
            debitAccount: document.getElementById('debit-account')?.value.trim() || null,
            creditAccount: document.getElementById('credit-account')?.value.trim() || null,
            disbursementMethod: document.getElementById('disbursement-method')?.value.trim() || null,
            disbursementStatus: document.getElementById('disbursement-status')?.value || 'pending',
            chequeNumber: document.getElementById('cheque-number')?.value.trim() || null,
            beneficiaryBank: document.getElementById('beneficiary-bank')?.value.trim() || null,
            beneficiaryAccount: document.getElementById('beneficiary-account')?.value.trim() || null,
            approvedBy: document.getElementById('approved-by')?.value.trim() || null,
            processedBy: document.getElementById('processed-by')?.value.trim() || null
        };

        const transactionData = {
            loanId: loanId,
            transactionType: transactionType,
            amount: amount,
            transactionDate: transactionDate,
            notes: notes,
            ...additionalData
        };

        formMessage.textContent = 'Creating loan transaction...';
        formMessage.className = 'mt-4 text-sm font-bold text-blue-500';

        if (!token) {
            formMessage.textContent = 'Authentication token not found. Please log in.';
            formMessage.className = 'mt-4 text-sm font-bold text-red-500';
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
                    query: createLoanTransactionMutation,
                    variables: { input: transactionData }
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
                    alert('You do not have permission to create loan transactions.');
                } else {
                    formMessage.textContent = `Error: ${errorMessage}`;
                    formMessage.className = 'mt-4 text-sm font-bold text-red-500';
                }
                return;
            }

            const createResult = result.data?.createLoanTransaction;

            if (createResult?.success) {
                formMessage.textContent = createResult.message || 'Loan transaction created successfully!';
                formMessage.className = 'mt-4 text-sm font-bold text-green-500';
                createLoanTransactionForm.reset();
                // Optionally redirect after a short delay
                setTimeout(() => {
                    let redirectUrl = 'loan_transaction.html';
                    if (initialLoanId) {
                        redirectUrl += `?loan_id=${initialLoanId}`;
                    }
                    window.location.href = redirectUrl;
                }, 1500);
            } else {
                formMessage.textContent = createResult?.message || 'Failed to create loan transaction.';
                formMessage.className = 'mt-4 text-sm font-bold text-red-500';
            }

        } catch (error) {
            console.error('Error creating loan transaction:', error);
            formMessage.textContent = error.message || 'An unexpected error occurred.';
            formMessage.className = 'mt-4 text-sm font-bold text-red-500';
        }
    });

    // Basic logout functionality
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('accessToken');
        alert('Logged out!');
        window.location.href = 'login.html';
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