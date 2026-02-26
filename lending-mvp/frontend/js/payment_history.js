document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/graphql';
    const urlParams = new URLSearchParams(window.location.search);
    const loanId = urlParams.get('id');

    console.log('--- Payment History Page Initialization ---');
    console.log('Loan ID from URL:', loanId);

    // Elements
    const elements = {
        loanIdDisplay: document.getElementById('loan-id-display'),
        summaryBorrower: document.getElementById('summary-borrower'),
        summaryPrincipal: document.getElementById('summary-principal'),
        summaryRate: document.getElementById('summary-rate'),
        summaryTerm: document.getElementById('summary-term'),
        summaryFrequency: document.getElementById('summary-frequency'),
        summaryTotalDue: document.getElementById('summary-total-due'),
        summaryTotalPaid: document.getElementById('summary-total-paid'),
        summaryRemaining: document.getElementById('summary-remaining'),
        summaryPaymentsCount: document.getElementById('summary-payments-count'),
        tableBody: document.getElementById('payment-history-table-body')
    };

    if (!loanId) {
        alert('Loan ID not provided in the URL.');
        window.location.href = 'loan_transaction.html';
        return;
    }

    const getLoanQuery = `
        query GetLoan($loanId: ID!) {
            loan(loanId: $loanId) {
                success
                message
                loan {
                    id
                    loanId
                    borrowerName
                    amountRequested
                    termMonths
                    interestRate
                    modeOfPayment
                    createdAt
                    loanProduct {
                        productName
                        termType
                        defaultInterestRate
                        modeOfPayment
                    }
                }
            }
        }
    `;

    const getPaymentsQuery = `
        query GetLoanTransactions($loanId: ID, $transactionType: String) {
            loanTransactions(loanId: $loanId, transactionType: $transactionType) {
                success
                message
                transactions {
                    id
                    amount
                    transactionDate
                    notes
                }
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

    const fetchLoanData = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.warn('No accessToken found in localStorage.');
            alert('Your session may have expired. Please log in again.');
            window.location.href = 'login.html';
            return;
        }

        try {
            console.log('Fetching data for loan:', loanId);
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: getLoanQuery,
                    variables: { loanId: loanId }
                })
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`HTTP ${response.status}: ${text}`);
            }

            const result = await response.json();
            console.log('GraphQL Response:', result);

            if (result.errors) {
                console.error('GraphQL Errors:', result.errors);
                const firstError = result.errors[0]?.message || 'Unknown GraphQL error';
                alert('Database Error: ' + firstError);
                return;
            }

            const loanResponse = result.data?.loan;
            if (loanResponse && loanResponse.success && loanResponse.loan) {
                console.log('Success! Loan data fetched.');
                await fetchPaymentsAndGenerateHistory(loanResponse.loan);
            } else {
                const failMsg = loanResponse?.message || 'Loan data not found.';
                console.error('API reported failure:', failMsg);
                alert('API Error: ' + failMsg);
            }
        } catch (error) {
            console.error('Fetch operation failed:', error);
            alert('System Error: ' + error.message);
        }
    };

    const fetchPaymentsAndGenerateHistory = async (loan) => {
        const token = localStorage.getItem('accessToken');

        try {
            // Fetch payment transactions for this loan
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: getPaymentsQuery,
                    variables: { loanId: loan.id || loan.loanId, transactionType: 'repayment' }
                })
            });

            let payments = [];
            if (response.ok) {
                const result = await response.json();
                if (result.data?.loanTransactions?.success) {
                    payments = result.data.loanTransactions.transactions || [];
                    console.log('Payments fetched:', payments.length);
                }
            }

            generatePaymentHistory(loan, payments);
        } catch (error) {
            console.error('Error fetching payments:', error);
            // Still generate history without payments
            generatePaymentHistory(loan, []);
        }
    };

    const generatePaymentHistory = (loan, payments) => {
        try {
            console.log('Starting payment history generation...');

            // Loan details
            const principal = parseFloat(loan.amountRequested) || 0;
            let annualRatePercent = 0;
            if (loan.loanProduct?.defaultInterestRate !== undefined && loan.loanProduct.defaultInterestRate !== null) {
                annualRatePercent = parseFloat(loan.loanProduct.defaultInterestRate);
            } else {
                annualRatePercent = parseFloat(loan.interestRate) || 0;
            }
            const annualRate = annualRatePercent / 100;

            let termMonths = parseInt(loan.termMonths) || 0;
            if (loan.loanProduct?.termType) {
                const matches = loan.loanProduct.termType.match(/\d+/g);
                if (matches && matches.length > 0) {
                    termMonths = Math.max(...matches.map(m => parseInt(m)));
                }
            }

            const modeOfPayment = (loan.loanProduct?.modeOfPayment || loan.modeOfPayment || 'monthly').toLowerCase();
            const createdAtStr = loan.createdAt || new Date().toISOString();
            const startDate = new Date(createdAtStr);

            // Update loan ID display
            if (elements.loanIdDisplay) elements.loanIdDisplay.textContent = loan.loanId || loan.id;
            if (elements.summaryBorrower) elements.summaryBorrower.textContent = loan.borrowerName || 'N/A';
            if (elements.summaryPrincipal) elements.summaryPrincipal.textContent = formatCurrency(principal);
            if (elements.summaryRate) elements.summaryRate.textContent = annualRatePercent.toFixed(2) + '%';
            if (elements.summaryTerm) elements.summaryTerm.textContent = termMonths;

            const capitalizedFrequency = modeOfPayment.charAt(0).toUpperCase() + modeOfPayment.slice(1);
            if (elements.summaryFrequency) elements.summaryFrequency.textContent = capitalizedFrequency;

            // Calculate periods
            let periodsPerYear = 12;
            switch (modeOfPayment) {
                case 'daily': periodsPerYear = 360; break;
                case 'weekly': periodsPerYear = 52; break;
                case 'bi-weekly': periodsPerYear = 26; break;
                case 'quarterly': periodsPerYear = 4; break;
                case 'semi-annually':
                case 'semi annually':
                case 'semi annualy':
                    periodsPerYear = 2; break;
                case 'annually': periodsPerYear = 1; break;
                case 'monthly':
                default: periodsPerYear = 12; break;
            }

            const periodicRate = annualRate / periodsPerYear;

            let totalPaymentsCount = termMonths;
            switch (modeOfPayment) {
                case 'daily': totalPaymentsCount = termMonths * 30; break;
                case 'weekly': totalPaymentsCount = Math.round(termMonths * 52 / 12); break;
                case 'bi-weekly': totalPaymentsCount = Math.round(termMonths * 26 / 12); break;
                case 'quarterly': totalPaymentsCount = Math.round(termMonths / 3); break;
                case 'semi-annually':
                case 'semi annually':
                case 'semi annualy':
                    totalPaymentsCount = Math.round(termMonths / 6); break;
                case 'annually': totalPaymentsCount = Math.round(termMonths / 12); break;
                case 'monthly':
                default: totalPaymentsCount = termMonths; break;
            }

            if (totalPaymentsCount === 0 && termMonths > 0) totalPaymentsCount = 1;

            let periodicPayment = 0;
            if (totalPaymentsCount > 0) {
                if (Math.abs(periodicRate) < 0.000001) {
                    periodicPayment = principal / totalPaymentsCount;
                } else {
                    periodicPayment = (principal * periodicRate) / (1 - Math.pow(1 + periodicRate, -totalPaymentsCount));
                }
            }

            // Sort payments by date
            const sortedPayments = payments
                .map(p => ({
                    ...p,
                    date: new Date(p.transactionDate)
                }))
                .sort((a, b) => a.date - b.date);

            // Generate schedule
            let currentDate = new Date(startDate);
            switch (modeOfPayment) {
                case 'daily': currentDate.setDate(currentDate.getDate() + 1); break;
                case 'weekly': currentDate.setDate(currentDate.getDate() + 7); break;
                case 'bi-weekly': currentDate.setDate(currentDate.getDate() + 14); break;
                case 'quarterly': currentDate.setMonth(currentDate.getMonth() + 3); break;
                case 'semi-annually':
                case 'semi annually':
                case 'semi annualy':
                    currentDate.setMonth(currentDate.getMonth() + 6); break;
                case 'annually': currentDate.setFullYear(currentDate.getFullYear() + 1); break;
                case 'monthly':
                default: currentDate.setMonth(currentDate.getMonth() + 1); break;
            }

            let remainingBalance = principal;
            let totalInterest = 0;
            let totalPaid = 0;
            let paymentsMade = 0;
            const rows = [];

            // Initial balance row
            rows.push({
                paymentNumber: 0,
                dueDate: null,
                amountDue: null,
                principalAmount: null,
                interestAmount: null,
                paymentMade: null,
                paymentDate: null,
                status: 'Initial Balance',
                balance: principal
            });

            let paymentIndex = 0;

            for (let i = 1; i <= totalPaymentsCount; i++) {
                const interest = remainingBalance * periodicRate;
                let principalPayment = periodicPayment - interest;

                if (i === totalPaymentsCount) {
                    principalPayment = remainingBalance;
                    remainingBalance = 0;
                } else {
                    remainingBalance -= principalPayment;
                }

                totalInterest += interest;
                const amountDue = principalPayment + interest;

                // Find matching payment (by date proximity or order)
                let matchedPayment = null;
                if (paymentIndex < sortedPayments.length) {
                    const payment = sortedPayments[paymentIndex];
                    // Consider payment matched if it's within a reasonable time window
                    matchedPayment = payment;
                    paymentIndex++;
                    totalPaid += payment.amount;
                    paymentsMade++;
                }

                const row = {
                    paymentNumber: i,
                    dueDate: new Date(currentDate),
                    amountDue: amountDue,
                    principalAmount: principalPayment,
                    interestAmount: interest,
                    paymentMade: matchedPayment ? matchedPayment.amount : null,
                    paymentDate: matchedPayment ? new Date(matchedPayment.date) : null,
                    status: matchedPayment ? 'Paid' : 'Unpaid',
                    balance: remainingBalance > 0.005 ? remainingBalance : 0
                };

                rows.push(row);

                // Increment to next payment date
                switch (modeOfPayment) {
                    case 'daily': currentDate.setDate(currentDate.getDate() + 1); break;
                    case 'weekly': currentDate.setDate(currentDate.getDate() + 7); break;
                    case 'bi-weekly': currentDate.setDate(currentDate.getDate() + 14); break;
                    case 'quarterly': currentDate.setMonth(currentDate.getMonth() + 3); break;
                    case 'semi-annually':
                    case 'semi annually':
                    case 'semi annualy':
                        currentDate.setMonth(currentDate.getMonth() + 6); break;
                    case 'annually': currentDate.setFullYear(currentDate.getFullYear() + 1); break;
                    case 'monthly':
                    default: currentDate.setMonth(currentDate.getMonth() + 1); break;
                }
            }

            // Update summary
            const totalAmountDue = principal + totalInterest;
            if (elements.summaryTotalDue) elements.summaryTotalDue.textContent = formatCurrency(totalAmountDue);
            if (elements.summaryTotalPaid) elements.summaryTotalPaid.textContent = formatCurrency(totalPaid);
            if (elements.summaryRemaining) elements.summaryRemaining.textContent = formatCurrency(totalAmountDue - totalPaid);
            if (elements.summaryPaymentsCount) elements.summaryPaymentsCount.textContent = `${paymentsMade} of ${totalPaymentsCount}`;

            // Populate table
            if (elements.tableBody) {
                elements.tableBody.innerHTML = '';

                rows.forEach((row, index) => {
                    const tr = document.createElement('tr');

                    if (row.paymentNumber === 0) {
                        // Initial balance row
                        tr.className = 'border-b border-gray-300 bg-gray-50';
                        tr.innerHTML = `
                            <td class="p-2 px-3 border border-gray-300 text-center font-bold" colspan="7">Initial Balance</td>
                            <td class="p-2 px-3 border border-gray-300 text-right font-medium">${formatCurrency(row.balance)}</td>
                        `;
                    } else {
                        // Regular payment row
                        const isOverdue = row.status === 'Unpaid' && row.dueDate < new Date();
                        const isPaid = row.status === 'Paid';

                        tr.className = 'border-b border-gray-300 hover:bg-gray-50';
                        if (isOverdue) tr.className += ' bg-red-50';
                        if (isPaid) tr.className += ' bg-green-50';

                        const statusClass = isPaid
                            ? 'bg-green-100 text-green-800'
                            : isOverdue
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800';

                        const statusText = isPaid
                            ? 'Paid'
                            : isOverdue
                                ? 'Overdue'
                                : 'Unpaid';

                        tr.innerHTML = `
                            <td class="p-2 px-3 border border-gray-300 text-center">${row.paymentNumber}</td>
                            <td class="p-2 px-3 border border-gray-300 text-center">${row.dueDate.toLocaleDateString()}</td>
                            <td class="p-2 px-3 border border-gray-300 text-right">${formatCurrency(row.amountDue)}</td>
                            <td class="p-2 px-3 border border-gray-300 text-right">${formatCurrency(row.principalAmount)}</td>
                            <td class="p-2 px-3 border border-gray-300 text-right">${formatCurrency(row.interestAmount)}</td>
                            <td class="p-2 px-3 border border-gray-300 text-right ${isPaid ? 'text-green-600 font-medium' : ''}">${row.paymentMade !== null ? formatCurrency(row.paymentMade) : '-'}</td>
                            <td class="p-2 px-3 border border-gray-300 text-center">${row.paymentDate ? row.paymentDate.toLocaleDateString() : '-'}</td>
                            <td class="p-2 px-3 border border-gray-300 text-center">
                                <span class="px-2 py-1 rounded-full text-xs font-medium ${statusClass}">${statusText}</span>
                            </td>
                        `;
                    }

                    elements.tableBody.appendChild(tr);
                });
            }

            console.log('Payment history generation complete.');
        } catch (err) {
            console.error('Fatal error in generatePaymentHistory:', err);
            alert('Generation Error: ' + err.message);
        }
    };

    fetchLoanData();
});