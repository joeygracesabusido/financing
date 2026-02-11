document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/graphql'; // Use relative path for API
    const createLoanForm = document.getElementById('create-loan-form');
    const formMessage = document.getElementById('form-message');

    // GraphQL mutation to create a loan
    const createLoanMutation = `
        mutation CreateLoan($input: LoanCreateInput!) {
            createLoan(input: $input) {
                success
                message
                loan {
                    id
                    borrowerId
                    amountRequested
                }
            }
        }
    `;

    createLoanForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        formMessage.textContent = '';
        formMessage.className = 'mt-4 text-sm font-bold';

        const borrowerId = document.getElementById('borrower-id').value.trim();
        const amountRequested = parseFloat(document.getElementById('amount-requested').value);
        const termMonths = parseInt(document.getElementById('term-months').value, 10);
        const interestRate = parseFloat(document.getElementById('interest-rate').value);

        if (!borrowerId || isNaN(amountRequested) || isNaN(termMonths) || isNaN(interestRate)) {
            formMessage.textContent = 'Please fill in all fields with valid data.';
            formMessage.className = 'mt-4 text-sm font-bold text-red-500';
            return;
        }
        if (amountRequested <= 0 || termMonths <= 0 || interestRate < 0) {
            formMessage.textContent = 'Amount, term, and interest rate must be positive values.';
            formMessage.className = 'mt-4 text-sm font-bold text-red-500';
            return;
        }

        const loanData = {
            borrowerId: borrowerId,
            amountRequested: amountRequested,
            termMonths: termMonths,
            interestRate: interestRate
        };

        formMessage.textContent = 'Creating loan...';
        formMessage.className = 'mt-4 text-sm font-bold text-blue-500';

        const token = localStorage.getItem('accessToken');
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
                    query: createLoanMutation,
                    variables: { input: loanData }
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
                    alert('You do not have permission to create loan products.');
                    // window.location.href = 'dashboard.html'; // Redirect if unauthorized
                } else {
                    formMessage.textContent = `Error: ${errorMessage}`;
                    formMessage.className = 'mt-4 text-sm font-bold text-red-500';
                }
                return;
            }

            const createResult = result.data?.createLoan;

            if (createResult?.success) {
                formMessage.textContent = createResult.message || 'Loan created successfully!';
                formMessage.className = 'mt-4 text-sm font-bold text-green-500';
                createLoanForm.reset();
                // Optionally redirect after a short delay
                setTimeout(() => {
                    window.location.href = 'loan_product.html';
                }, 1500);
            } else {
                formMessage.textContent = createResult?.message || 'Failed to create loan.';
                formMessage.className = 'mt-4 text-sm font-bold text-red-500';
            }

        } catch (error) {
            console.error('Error creating loan:', error);
            formMessage.textContent = error.message || 'An unexpected error occurred.';
            formMessage.className = 'mt-4 text-sm font-bold text-red-500';
        }
    });

    // Basic logout functionality
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
