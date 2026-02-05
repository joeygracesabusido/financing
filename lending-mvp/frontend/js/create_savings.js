document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/graphql';
    const createSavingsForm = document.getElementById('create-savings-form');
    const formMessage = document.getElementById('form-message');

    createSavingsForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const accountNumber = document.getElementById('account-number').value.trim();
        const accountType = document.getElementById('account-type').value;
        const initialBalance = parseFloat(document.getElementById('initial-balance').value);

        if (!accountNumber || isNaN(initialBalance) || initialBalance < 0) {
            formMessage.textContent = 'Please enter a valid account number and a non-negative initial balance.';
            formMessage.className = 'mt-4 text-sm font-bold text-red-500';
            return;
        }

        formMessage.textContent = 'Creating account...';
        formMessage.className = 'mt-4 text-sm font-bold text-blue-500';

        const token = localStorage.getItem('accessToken');
        if (!token) {
            formMessage.textContent = 'Authentication token not found. Please log in.';
            formMessage.className = 'mt-4 text-sm font-bold text-red-500';
            window.location.href = 'login.html';
            return;
        }

        const createSavingsMutation = `
            mutation CreateSavingsAccount($input: SavingsAccountCreateInput!) {
                createSavingsAccount(input: $input) {
                    success
                    message
                    account {
                        id
                        accountNumber
                    }
                }
            }
        `;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: createSavingsMutation,
                    variables: {
                        input: {
                            accountNumber: accountNumber,
                            type: accountType,
                            balance: initialBalance
                        }
                    }
                })
            });

            const result = await response.json();

            if (result.errors) {
                console.error('GraphQL Errors:', result.errors);
                formMessage.textContent = result.errors[0]?.message || 'An error occurred during account creation.';
                formMessage.className = 'mt-4 text-sm font-bold text-red-500';
                return;
            }

            const createResult = result.data?.createSavingsAccount;

            if (createResult?.success) {
                formMessage.textContent = createResult.message || 'Savings account created successfully!';
                formMessage.className = 'mt-4 text-sm font-bold text-green-500';
                createSavingsForm.reset();
                // Optionally redirect to savings list or details page
                setTimeout(() => {
                    window.location.href = 'savings.html';
                }, 1500);
            } else {
                formMessage.textContent = createResult?.message || 'Failed to create savings account.';
                formMessage.className = 'mt-4 text-sm font-bold text-red-500';
            }

        } catch (error) {
            console.error('Submission error:', error);
            formMessage.textContent = error.message || 'An unexpected error occurred.';
            formMessage.className = 'mt-4 text-sm font-bold text-red-500';
        }
    });
});
