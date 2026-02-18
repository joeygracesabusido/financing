document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/graphql';
    const urlParams = new URLSearchParams(window.location.search);
    const loanId = urlParams.get('id');

    const loanIdDisplay = document.getElementById('loan-id-display');
    const borrowerNameDisplay = document.getElementById('detail-borrower-name');
    const statusDisplay = document.getElementById('detail-status');
    const amountRequestedDisplay = document.getElementById('detail-amount-requested');
    const balanceDisplay = document.getElementById('detail-balance');
    const interestRateDisplay = document.getElementById('detail-interest-rate');
    const termDisplay = document.getElementById('detail-term');
    const createdAtDisplay = document.getElementById('detail-created-at');
    const transactionsTableBody = document.getElementById('transactions-table-body');

    const paymentForm = document.getElementById('payment-form');
    const paymentAmountInput = document.getElementById('payment-amount');
    const paymentDateInput = document.getElementById('payment-date');
    const paymentNotesInput = document.getElementById('payment-notes');
    const paymentMessage = document.getElementById('payment-message');

    if (!loanId) {
        alert('Loan ID not provided.');
        window.location.href = 'loan_transaction.html';
        return;
    }

    loanIdDisplay.textContent = loanId;

    // Set default date to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    paymentDateInput.value = now.toISOString().slice(0, 16);

    const getLoanDetailsQuery = `
        query GetLoan($loanId: ID!) {
            loan(loanId: $loanId) {
                success
                message
                loan {
                    id
                    amountRequested
                    termMonths
                    interestRate
                    status
                    createdAt
                    customer {
                        displayName
                    }
                }
            }
        }
    `;

    const getLoanTransactionsQuery = `
        query GetLoanTransactions($loanId: ID!) {
            loanTransactions(loanId: $loanId) {
                transactions {
                    id
                    transactionType
                    amount
                    transactionDate
                    notes
                }
            }
        }
    `;

    const createLoanTransactionMutation = `
        mutation CreateLoanTransaction($input: LoanTransactionCreateInput!) {
            createLoanTransaction(input: $input) {
                success
                message
                transaction {
                    id
                }
            }
        }
    `;

    const fetchLoanDetails = async () => {
        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: getLoanDetailsQuery,
                    variables: { loanId: loanId }
                })
            });
            const result = await response.json();
            const loanResponse = result.data?.loan;

            if (loanResponse?.success && loanResponse.loan) {
                const loan = loanResponse.loan;
                borrowerNameDisplay.textContent = loan.customer?.displayName || 'N/A';
                statusDisplay.textContent = loan.status.toUpperCase();
                amountRequestedDisplay.textContent = `₱${parseFloat(loan.amountRequested).toFixed(2)}`;
                interestRateDisplay.textContent = `${loan.interestRate}%`;
                termDisplay.textContent = loan.termMonths;
                createdAtDisplay.textContent = new Date(loan.createdAt).toLocaleDateString();
                
                // Set status color
                statusDisplay.className = 'font-bold ' + 
                    (loan.status === 'active' ? 'text-green-600' : 
                     loan.status === 'pending' ? 'text-yellow-600' : 'text-gray-600');
            }
        } catch (error) {
            console.error('Error fetching loan details:', error);
        }
    };

    const fetchTransactionsAndCalculateBalance = async () => {
        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: getLoanTransactionsQuery,
                    variables: { loanId: loanId }
                })
            });
            const result = await response.json();
            const transactions = result.data?.loanTransactions?.transactions || [];

            populateTransactionsTable(transactions);
            calculateBalance(transactions);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const populateTransactionsTable = (transactions) => {
        if (transactions.length === 0) {
            transactionsTableBody.innerHTML = '<tr><td colspan="4" class="p-3 text-center text-gray-500">No transactions found.</td></tr>';
            return;
        }

        transactionsTableBody.innerHTML = '';
        // Sort by date descending
        transactions.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));

        transactions.forEach(t => {
            const row = document.createElement('tr');
            row.className = 'border-b hover:bg-gray-50';
            const isRepayment = t.transactionType === 'repayment';
            const amountClass = isRepayment ? 'text-green-600' : 'text-red-600';
            const amountPrefix = isRepayment ? '-' : '+';

            row.innerHTML = `
                <td class="p-3">${new Date(t.transactionDate).toLocaleString()}</td>
                <td class="p-3 font-medium">${t.transactionType.toUpperCase()}</td>
                <td class="p-3 font-bold ${amountClass}">${amountPrefix}₱${parseFloat(t.amount).toFixed(2)}</td>
                <td class="p-3 text-sm text-gray-600">${t.notes || '-'}</td>
            `;
            transactionsTableBody.appendChild(row);
        });
    };

    const calculateBalance = (transactions) => {
        let balance = 0;
        transactions.forEach(t => {
            const amt = parseFloat(t.amount);
            if (t.transactionType === 'disbursement') {
                balance += amt;
            } else if (t.transactionType === 'repayment') {
                balance -= amt;
            }
            // Other types like interest/fees might add to balance in a real system
        });
        balanceDisplay.textContent = `₱${balance.toFixed(2)}`;
        if (balance <= 0) balanceDisplay.className = 'font-bold text-green-600';
        else balanceDisplay.className = 'font-bold text-red-600';
    };

    paymentForm.addEventListener('submit', async (e) => {
        event.preventDefault();
        const amount = parseFloat(paymentAmountInput.value);
        const date = paymentDateInput.value ? new Date(paymentDateInput.value).toISOString() : new Date().toISOString();
        const notes = paymentNotesInput.value.trim();

        if (isNaN(amount) || amount <= 0) {
            paymentMessage.textContent = 'Please enter a valid amount.';
            paymentMessage.className = 'mt-4 text-sm font-bold text-red-500';
            return;
        }

        paymentMessage.textContent = 'Processing payment...';
        paymentMessage.className = 'mt-4 text-sm font-bold text-blue-500';

        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: createLoanTransactionMutation,
                    variables: {
                        input: {
                            loanId: loanId,
                            transactionType: 'repayment',
                            amount: amount,
                            transactionDate: date,
                            notes: notes || 'Loan repayment'
                        }
                    }
                })
            });

            const result = await response.json();
            const mutationResult = result.data?.createLoanTransaction;

            if (mutationResult?.success) {
                paymentMessage.textContent = 'Payment recorded successfully!';
                paymentMessage.className = 'mt-4 text-sm font-bold text-green-500';
                paymentForm.reset();
                // Reset date
                paymentDateInput.value = new Date().toISOString().slice(0, 16);
                fetchTransactionsAndCalculateBalance();
            } else {
                paymentMessage.textContent = mutationResult?.message || 'Failed to record payment.';
                paymentMessage.className = 'mt-4 text-sm font-bold text-red-500';
            }
        } catch (error) {
            console.error('Payment error:', error);
            paymentMessage.textContent = 'An error occurred during payment processing.';
            paymentMessage.className = 'mt-4 text-sm font-bold text-red-500';
        }
    });

    fetchLoanDetails();
    fetchTransactionsAndCalculateBalance();
});
