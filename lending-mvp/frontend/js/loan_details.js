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
    const interestBalanceDisplay = document.getElementById('detail-interest-balance');
    const interestRateDisplay = document.getElementById('detail-interest-rate');
    const termDisplay = document.getElementById('detail-term');
    const modeOfPaymentDisplay = document.getElementById('detail-mode-of-payment');
    const createdAtDisplay = document.getElementById('detail-created-at');
    const transactionsTableBody = document.getElementById('transactions-table-body');

    const paymentForm = document.getElementById('payment-form');
    const paymentAmountInput = document.getElementById('payment-amount');
    const paymentDateInput = document.getElementById('payment-date');
    const paymentNotesInput = document.getElementById('payment-notes');
    const paymentMessage = document.getElementById('payment-message');

    let currentBalance = 0;
    let totalInterest = 0;

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
                    loanProduct {
                        productName
                        termType
                        defaultInterestRate
                        modeOfPayment
                    }
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
        query GetLoanTransactions($loanId: ID, $transactionType: String) {
            loanTransactions(loanId: $loanId, transactionType: $transactionType) {
                success
                message
                transactions {
                    id
                    transactionType
                    amount
                    transactionDate
                    notes
                    borrowerName
                    loanProduct {
                        productName
                    }
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

    const updateLoanMutation = `
        mutation UpdateLoan($loanId: ID!, $input: LoanUpdateInput!) {
            updateLoan(loanId: $loanId, input: $input) {
                success
                message
            }
        }
    `;

    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined || isNaN(amount)) return '₱0.00';
        return '₱' + new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

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
                loanProductDisplay.textContent = loan.loanProduct?.productName || 'N/A';
                
                const status = loan.status ? loan.status.toLowerCase() : 'unknown';
                statusDisplay.textContent = status.toUpperCase();
                
                // Amount Requested
                const amountRequested = parseFloat(loan.amountRequested);
                amountRequestedDisplay.textContent = formatCurrency(amountRequested);
                
                // Interest Rate - Prefer product's defaultInterestRate
                const interestRate = loan.loanProduct?.defaultInterestRate !== undefined 
                    ? parseFloat(loan.loanProduct.defaultInterestRate) 
                    : parseFloat(loan.interestRate);
                
                interestRateDisplay.textContent = !isNaN(interestRate) 
                    ? `${interestRate}%` 
                    : '-';
                
                // Term - Prefer product's termType (extracting months)
                let termMonths = parseInt(loan.termMonths);
                if (loan.loanProduct?.termType) {
                    const match = loan.loanProduct.termType.match(/(\d+)/);
                    if (match) termMonths = parseInt(match[1]);
                }
                termDisplay.textContent = termMonths || '-';

                // Mode of Payment
                if (modeOfPaymentDisplay) {
                    modeOfPaymentDisplay.textContent = loan.loanProduct?.modeOfPayment || 'N/A';
                }

                // Interest Balance Calculation (Per Annum rate for monthly term):
                // (Amount * (Rate / 100) / 12 months) * termMonths
                if (!isNaN(amountRequested) && !isNaN(interestRate) && !isNaN(termMonths) && termMonths > 0) {
                    const monthlyRate = (interestRate / 100) / 12;
                    totalInterest = amountRequested * monthlyRate * termMonths;
                    interestBalanceDisplay.textContent = formatCurrency(totalInterest);
                } else {
                    totalInterest = 0;
                    interestBalanceDisplay.textContent = '₱0.00';
                }
                
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
                    variables: { 
                        loanId: loanId,
                        transactionType: null // We want ALL transactions here
                    }
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
            transactionsTableBody.innerHTML = '<tr><td colspan="5" class="p-3 text-center text-gray-500">No transactions found.</td></tr>';
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

            let actionsHtml = '';
            if (isRepayment) {
                actionsHtml = `<button class="text-blue-500 hover:text-blue-700 edit-btn" data-id="${t.id}"><i class="fas fa-edit"></i> Edit</button>`;
            }

            row.innerHTML = `
                <td class="p-3">${new Date(t.transactionDate).toLocaleString()}</td>
                <td class="p-3 font-medium">${t.transactionType.toUpperCase()}</td>
                <td class="p-3 font-bold ${amountClass}">${amountPrefix}${formatCurrency(parseFloat(t.amount))}</td>
                <td class="p-3 text-sm text-gray-600">${t.notes || '-'}</td>
                <td class="p-3 text-sm">${actionsHtml}</td>
            `;

            const editBtn = row.querySelector('.edit-btn');
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    const transactionId = e.currentTarget.getAttribute('data-id');
                    if (t.transactionType === 'repayment') {
                        window.location.href = `update_payment.html?id=${transactionId}`;
                    } else {
                        window.location.href = `update_loan_transaction.html?id=${transactionId}`;
                    }
                });
            }

            transactionsTableBody.appendChild(row);
        });
        
        console.log('✅ Table population complete with', transactions.length, 'rows');
    };

    const calculateBalance = (transactions) => {
        console.log('💰 Calculating balance from', transactions.length, 'transactions');
        
        currentBalance = 0;
        transactions.forEach((t, index) => {
            const amt = parseFloat(t.amount);
            const oldBalance = currentBalance;
            
            if (t.transactionType === 'disbursement') {
                currentBalance += amt;
                console.log(`  Step ${index + 1}: Disbursement +${amt} (${oldBalance} → ${currentBalance})`);
            } else if (t.transactionType === 'repayment') {
                currentBalance -= amt;
                console.log(`  Step ${index + 1}: Repayment -${amt} (${oldBalance} → ${currentBalance})`);
            } else {
                console.log(`  Step ${index + 1}: Other type '${t.transactionType}' - skipped`);
            }
        });
        
        console.log('💾 Principal sum:', currentBalance);
        const finalRemainingBalance = currentBalance + totalInterest;
        console.log('💾 Final balance (plus interest):', finalRemainingBalance);
        balanceDisplay.textContent = formatCurrency(finalRemainingBalance);
        if (finalRemainingBalance <= 0) {
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
                
                // Check if loan is now fully paid (Principal + Interest)
                if ((currentBalance + totalInterest) - amount <= 0) {
                    console.log('--- Loan fully paid (Principal + Interest), updating status to PAID ---');
                    try {
                        await fetch(API_URL, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                query: updateLoanMutation,
                                variables: {
                                    loanId: loanId,
                                    input: { status: 'paid' }
                                }
                            })
                        });
                        paymentMessage.textContent += ' Loan status updated to PAID.';
                    } catch (e) {
                        console.error('Failed to update loan status to paid:', e);
                    }
                }

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

    const init = async () => {
        await fetchLoanDetails();
        await fetchTransactionsAndCalculateBalance();
    };

    init();
});
