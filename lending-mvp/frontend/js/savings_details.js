document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/graphql';
    const urlParams = new URLSearchParams(window.location.search);
    const accountId = urlParams.get('id');

    const accountNumberDisplay = document.getElementById('account-number-display');
    const detailAccountId = document.getElementById('detail-account-id');
    const detailAccountType = document.getElementById('detail-account-type');
    const detailBalance = document.getElementById('detail-balance');
    const detailCurrency = document.getElementById('detail-currency');
    const detailStatus = document.getElementById('detail-status');
    const detailOpenedAt = document.getElementById('detail-opened-at');
    const detailCreatedAt = document.getElementById('detail-created-at');
    const detailUpdatedAt = document.getElementById('detail-updated-at');
    const transactionsTableBody = document.getElementById('transactions-table-body');

    const depositForm = document.getElementById('deposit-form');
    const depositAmountInput = document.getElementById('deposit-amount');
    const depositNotesInput = document.getElementById('deposit-notes');
    const depositMessage = document.getElementById('deposit-message');

    const withdrawalForm = document.getElementById('withdrawal-form');
    const withdrawalAmountInput = document.getElementById('withdrawal-amount');
    const withdrawalNotesInput = document.getElementById('withdrawal-notes');
    const withdrawalMessage = document.getElementById('withdrawal-message');

    if (!accountId) {
        alert('Account ID not provided.');
        window.location.href = 'savings.html';
        return;
    }

    const getSavingsAccountQuery = `
        query GetSavingsAccount($accountId: ID!) {
            savingsAccount(accountId: $accountId) {
                success
                message
                account {
                    id
                    accountNumber
                    type
                    balance
                    currency
                    openedAt
                    status
                    createdAt
                    updatedAt
                }
            }
        }
    `;

    const getTransactionsQuery = `
        query GetTransactions($accountId: ID!) {
            getTransactions(accountId: $accountId) {
                success
                message
                transactions {
                    id
                    transactionType
                    amount
                    timestamp
                    notes
                }
            }
        }
    `;

    const createDepositMutation = `
        mutation CreateDeposit($input: TransactionCreateInput!) {
            createDeposit(input: $input) {
                success
                message
                transaction {
                    id
                    amount
                }
            }
        }
    `;

    const createWithdrawalMutation = `
        mutation CreateWithdrawal($input: TransactionCreateInput!) {
            createWithdrawal(input: $input) {
                success
                message
                transaction {
                    id
                    amount
                }
            }
        }
    `;

    const fetchAccountDetails = async () => {
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
                    query: getSavingsAccountQuery,
                    variables: { accountId: accountId }
                })
            });

            const result = await response.json();

            if (result.errors) {
                console.error('GraphQL Errors:', result.errors);
                alert('Error loading account details: ' + result.errors[0].message);
                return;
            }

            const accountResponse = result.data?.savingsAccount;

            if (accountResponse?.success && accountResponse.account) {
                const account = accountResponse.account;
                accountNumberDisplay.textContent = account.accountNumber;
                detailAccountId.textContent = account.id;
                detailAccountType.textContent = account.type;
                detailBalance.textContent = `₱${parseFloat(account.balance).toFixed(2)}`;
                detailCurrency.textContent = account.currency;
                detailStatus.textContent = account.status;
                detailOpenedAt.textContent = new Date(account.openedAt).toLocaleDateString();
                detailCreatedAt.textContent = new Date(account.createdAt).toLocaleDateString();
                detailUpdatedAt.textContent = new Date(account.updatedAt).toLocaleDateString();
            } else {
                alert('Failed to load account details: ' + (accountResponse?.message || 'Unknown error'));
                window.location.href = 'savings.html';
            }

        } catch (error) {
            console.error('Error fetching account details:', error);
            alert('An error occurred while fetching account details.');
            window.location.href = 'savings.html';
        }
    };

    const fetchTransactions = async () => {
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
                    query: getTransactionsQuery,
                    variables: { accountId: accountId }
                })
            });

            const result = await response.json();

            if (result.errors) {
                console.error('GraphQL Errors:', result.errors);
                transactionsTableBody.innerHTML = `<tr><td colspan="4" class="p-3 text-center text-red-500">Error loading transactions: ${result.errors[0].message}</td></tr>`;
                return;
            }

            const transactionsResponse = result.data?.getTransactions;

            if (transactionsResponse?.success && transactionsResponse.transactions) {
                populateTransactionsTable(transactionsResponse.transactions);
            } else {
                transactionsTableBody.innerHTML = `<tr><td colspan="4" class="p-3 text-center">No transactions found.</td></tr>`;
            }

        } catch (error) {
            console.error('Error fetching transactions:', error);
            transactionsTableBody.innerHTML = `<tr><td colspan="4" class="p-3 text-center text-red-500">Error loading transactions.</td></tr>`;
        }
    };

    const populateTransactionsTable = (transactions) => {
        if (!transactions || transactions.length === 0) {
            transactionsTableBody.innerHTML = `<tr><td colspan="4" class="p-3 text-center">No transactions found.</td></tr>`;
            return;
        }

        transactionsTableBody.innerHTML = '';
        transactions.forEach(trans => {
            const row = document.createElement('tr');
            row.className = 'border-b hover:bg-gray-50';
            const amountClass = trans.transactionType === 'deposit' ? 'text-green-600' : 'text-red-600';
            const amountSign = trans.transactionType === 'deposit' ? '+' : '-';

            row.innerHTML = `
                <td class="p-3">${new Date(trans.timestamp).toLocaleString()}</td>
                <td class="p-3">${trans.transactionType.charAt(0).toUpperCase() + trans.transactionType.slice(1)}</td>
                <td class="p-3 ${amountClass}">${amountSign}₱${parseFloat(trans.amount).toFixed(2)}</td>
                <td class="p-3">${trans.notes || 'N/A'}</td>
            `;
            transactionsTableBody.appendChild(row);
        });
    };

    depositForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const amount = parseFloat(depositAmountInput.value);
        const notes = depositNotesInput.value.trim();

        if (isNaN(amount) || amount <= 0) {
            depositMessage.textContent = 'Please enter a valid positive amount.';
            depositMessage.className = 'mt-4 text-sm font-bold text-red-500';
            return;
        }

        depositMessage.textContent = 'Processing deposit...';
        depositMessage.className = 'mt-4 text-sm font-bold text-blue-500';

        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: createDepositMutation,
                    variables: {
                        input: {
                            accountId: accountId,
                            amount: amount,
                            notes: notes || null
                        }
                    }
                })
            });

            const result = await response.json();

            if (result.errors) {
                console.error('GraphQL Errors:', result.errors);
                depositMessage.textContent = result.errors[0]?.message || 'Error processing deposit.';
                depositMessage.className = 'mt-4 text-sm font-bold text-red-500';
                return;
            }

            const depositResult = result.data?.createDeposit;
            if (depositResult?.success) {
                depositMessage.textContent = depositResult.message || 'Deposit successful!';
                depositMessage.className = 'mt-4 text-sm font-bold text-green-500';
                depositAmountInput.value = '';
                depositNotesInput.value = '';
                fetchAccountDetails();
                fetchTransactions();
            } else {
                depositMessage.textContent = depositResult?.message || 'Failed to process deposit.';
                depositMessage.className = 'mt-4 text-sm font-bold text-red-500';
            }

        } catch (error) {
            console.error('Deposit error:', error);
            depositMessage.textContent = 'An unexpected error occurred.';
            depositMessage.className = 'mt-4 text-sm font-bold text-red-500';
        }
    });

    withdrawalForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const amount = parseFloat(withdrawalAmountInput.value);
        const notes = withdrawalNotesInput.value.trim();

        if (isNaN(amount) || amount <= 0) {
            withdrawalMessage.textContent = 'Please enter a valid positive amount.';
            withdrawalMessage.className = 'mt-4 text-sm font-bold text-red-500';
            return;
        }

        withdrawalMessage.textContent = 'Processing withdrawal...';
        withdrawalMessage.className = 'mt-4 text-sm font-bold text-blue-500';

        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: createWithdrawalMutation,
                    variables: {
                        input: {
                            accountId: accountId,
                            amount: amount,
                            notes: notes || null
                        }
                    }
                })
            });

            const result = await response.json();

            if (result.errors) {
                console.error('GraphQL Errors:', result.errors);
                withdrawalMessage.textContent = result.errors[0]?.message || 'Error processing withdrawal.';
                withdrawalMessage.className = 'mt-4 text-sm font-bold text-red-500';
                return;
            }

            const withdrawalResult = result.data?.createWithdrawal;
            if (withdrawalResult?.success) {
                withdrawalMessage.textContent = withdrawalResult.message || 'Withdrawal successful!';
                withdrawalMessage.className = 'mt-4 text-sm font-bold text-green-500';
                withdrawalAmountInput.value = '';
                withdrawalNotesInput.value = '';
                fetchAccountDetails();
                fetchTransactions();
            } else {
                withdrawalMessage.textContent = withdrawalResult?.message || 'Failed to process withdrawal. Insufficient funds?';
                withdrawalMessage.className = 'mt-4 text-sm font-bold text-red-500';
            }

        } catch (error) {
            console.error('Withdrawal error:', error);
            withdrawalMessage.textContent = 'An unexpected error occurred.';
            withdrawalMessage.className = 'mt-4 text-sm font-bold text-red-500';
        }
    });

    // Initial fetch for details and transactions
    fetchAccountDetails();
    fetchTransactions();
});