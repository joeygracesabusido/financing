document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/graphql';
    const urlParams = new URLSearchParams(window.location.search);
    const loanId = urlParams.get('id');

    const loanIdDisplay = document.getElementById('loan-id-display');
    const borrowerNameDisplay = document.getElementById('detail-borrower-name');
    const loanProductDisplay = document.getElementById('detail-loan-product');
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
                    borrowerName
                    loanProduct
                    amountRequested
                    termMonths
                    interestRate
                    status
                    createdAt
                    updatedAt
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
                success
                message
                transactions {
                    id
                    transactionType
                    amount
                    transactionDate
                    notes
                    borrowerName
                    loanProduct
                }
                total
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
        console.log('=== FETCHING LOAN DETAILS ===');
        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.warn('❌ No authentication token found. User may not be logged in.');
            loanIdDisplay.textContent = 'Authentication Required';
            return;
        }
        
        console.log('✅ Token exists');
        console.log('📋 Loan ID:', loanId);
        
        try {
            console.log('🔄 Sending GraphQL query to:', API_URL);
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
            
            console.log('📦 HTTP Response status:', response.status);
            const result = await response.json();
            console.log('📦 GraphQL Response:', JSON.stringify(result, null, 2));

            if (result.errors) {
                console.error('❌ GraphQL Errors:', result.errors);
                loanIdDisplay.textContent = 'Error loading loan';
                return;
            }

            const loanResponse = result.data?.loan;
            console.log('📋 Loan Response object:', loanResponse);

            if (loanResponse?.success && loanResponse.loan) {
                const loan = loanResponse.loan;
                console.log('✅ Loan data received:', JSON.stringify(loan, null, 2));
                
                // Update display fields with better fallbacks
                const borrowerName = loan.borrowerName && loan.borrowerName !== 'N/A' 
                    ? loan.borrowerName 
                    : (loan.customer?.displayName || 'N/A');
                
                borrowerNameDisplay.textContent = borrowerName;
                loanProductDisplay.textContent = loan.loanProduct || 'N/A';
                
                const status = loan.status ? loan.status.toLowerCase() : 'unknown';
                statusDisplay.textContent = status.toUpperCase();
                
                // Amount Requested
                const amountRequested = parseFloat(loan.amountRequested);
                amountRequestedDisplay.textContent = !isNaN(amountRequested) 
                    ? `₱${amountRequested.toFixed(2)}` 
                    : '₱0.00';
                
                // Interest Rate
                const interestRate = parseFloat(loan.interestRate);
                interestRateDisplay.textContent = !isNaN(interestRate) 
                    ? `${interestRate}%` 
                    : '-';
                
                // Term
                termDisplay.textContent = loan.termMonths || '-';
                
                // Created At
                if (loan.createdAt) {
                    createdAtDisplay.textContent = new Date(loan.createdAt).toLocaleDateString();
                } else {
                    createdAtDisplay.textContent = '-';
                }
                
                // Set status color
                statusDisplay.className = 'font-bold';
                if (status === 'active' || status === 'approved') {
                    statusDisplay.classList.add('text-green-600');
                } else if (status === 'pending') {
                    statusDisplay.classList.add('text-yellow-600');
                } else if (status === 'paid') {
                    statusDisplay.classList.add('text-blue-600');
                } else {
                    statusDisplay.classList.add('text-gray-600');
                }
                
                console.log('✅ All loan details updated successfully');
            } else {
                const msg = loanResponse?.message || 'Loan details not found.';
                console.warn('⚠️ Loan not found or query failed:', msg);
                loanIdDisplay.textContent = 'Not Found';
                borrowerNameDisplay.textContent = 'N/A';
                statusDisplay.textContent = 'N/A';
            }
        } catch (error) {
            console.error('❌ Error fetching loan details:', error);
            loanIdDisplay.textContent = 'Connection Error';
        }
    };

    const fetchTransactionsAndCalculateBalance = async () => {
        console.log('=== FETCHING LOAN TRANSACTIONS ===');
        const token = localStorage.getItem('accessToken');
        try {
            console.log('🔄 Fetching transactions for loan:', loanId);
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
            console.log('📦 GraphQL Response:', JSON.stringify(result, null, 2));
            
            // Handle response with success/message fields
            const transactionsResponse = result.data?.loanTransactions;
            console.log('📋 Transactions Response:', transactionsResponse);
            
            if (transactionsResponse?.success === false) {
                console.warn('⚠️ Transaction query failed:', transactionsResponse.message);
            }
            
            const transactions = transactionsResponse?.transactions || [];
            console.log('📊 Transaction count:', transactions.length);
            console.log('📋 Transactions data:', JSON.stringify(transactions, null, 2));

            populateTransactionsTable(transactions);
            calculateBalance(transactions);
            
            console.log('✅ Transactions fetched and table populated');
        } catch (error) {
            console.error('❌ Error fetching transactions:', error);
        }
    };

    const populateTransactionsTable = (transactions) => {
        console.log('🔄 Populating transactions table with', transactions.length, 'transactions');
        
        if (transactions.length === 0) {
            console.warn('⚠️ No transactions found');
            transactionsTableBody.innerHTML = '<tr><td colspan="4" class="p-3 text-center text-gray-500">No transactions found.</td></tr>';
            return;
        }

        transactionsTableBody.innerHTML = '';
        // Sort by date descending
        transactions.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));
        
        console.log('📋 Sorted transactions:', transactions.map(t => ({
            id: t.id,
            type: t.transactionType,
            amount: t.amount,
            date: t.transactionDate
        })));

        transactions.forEach((t, index) => {
            console.log(`Processing transaction ${index + 1}:`, {
                id: t.id,
                type: t.transactionType,
                amount: t.amount,
                date: t.transactionDate,
                notes: t.notes
            });
            
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
        
        console.log('✅ Table population complete with', transactions.length, 'rows');
    };

    const calculateBalance = (transactions) => {
        console.log('💰 Calculating balance from', transactions.length, 'transactions');
        
        let balance = 0;
        transactions.forEach((t, index) => {
            const amt = parseFloat(t.amount);
            const oldBalance = balance;
            
            if (t.transactionType === 'disbursement') {
                balance += amt;
                console.log(`  Step ${index + 1}: Disbursement +${amt} (${oldBalance} → ${balance})`);
            } else if (t.transactionType === 'repayment') {
                balance -= amt;
                console.log(`  Step ${index + 1}: Repayment -${amt} (${oldBalance} → ${balance})`);
            } else {
                console.log(`  Step ${index + 1}: Other type '${t.transactionType}' - skipped`);
            }
        });
        
        console.log('💾 Final balance:', balance);
        balanceDisplay.textContent = `₱${balance.toFixed(2)}`;
        if (balance <= 0) {
            balanceDisplay.className = 'font-bold text-green-600';
            console.log('✅ Balance is zero or negative (good - fully paid)');
        } else {
            balanceDisplay.className = 'font-bold text-red-600';
            console.log('⚠️ Balance is positive (outstanding)');
        }
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
