document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/graphql';
    const urlParams = new URLSearchParams(window.location.search);
    const loanId = urlParams.get('id');

    console.log('--- Amortization Page Initialization ---');
    console.log('Loan ID from URL:', loanId);

    // Loan Information Elements
    const elements = {
        summaryPrincipal: document.getElementById('summary-principal'),
        summaryRate: document.getElementById('summary-rate'),
        summaryTerm: document.getElementById('summary-term'),
        summaryGranted: document.getElementById('summary-granted'),
        summaryFrequency: document.getElementById('summary-frequency'),
        summaryPeriodicRate: document.getElementById('summary-periodic-rate'),
        summaryTotalPaymentsAmount: document.getElementById('summary-total-payments-amount'),
        summaryTotalInterest: document.getElementById('summary-total-interest'),
        summaryPeriodicPayment: document.getElementById('summary-periodic-payment'),
        tableBody: document.getElementById('amortization-table-body'),
        paymentLabel: document.getElementById('payment-label')
    };

    // Verify all elements exist
    for (const [key, element] of Object.entries(elements)) {
        if (!element && key !== 'paymentLabel') {
            console.error(`Missing required DOM element: ${key}`);
            // alert(`Critical Error: Page element "${key}" not found.`);
        }
    }

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
                console.log('Success! Generating schedule...');
                generateSchedule(loanResponse.loan);
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

    const generateSchedule = (loan) => {
        try {
            console.log('Starting generateSchedule...');
            
            // 1. Principal
            const principal = parseFloat(loan.amountRequested) || 0;
            
            // 2. Interest Rate
            let annualRatePercent = 0;
            if (loan.loanProduct?.defaultInterestRate !== undefined && loan.loanProduct.defaultInterestRate !== null) {
                annualRatePercent = parseFloat(loan.loanProduct.defaultInterestRate);
            } else {
                annualRatePercent = parseFloat(loan.interestRate) || 0;
            }
            const annualRate = annualRatePercent / 100;

            // 3. Term
            let termMonths = parseInt(loan.termMonths) || 0;
            if (loan.loanProduct?.termType) {
                const matches = loan.loanProduct.termType.match(/\d+/g);
                if (matches && matches.length > 0) {
                    termMonths = Math.max(...matches.map(m => parseInt(m)));
                }
            }

            // 4. Frequency
            const modeOfPayment = (loan.loanProduct?.modeOfPayment || loan.modeOfPayment || 'monthly').toLowerCase();
            
            // 5. Dates
            const createdAtStr = loan.createdAt || new Date().toISOString();
            const startDate = new Date(createdAtStr);
            let firstPaymentDate = new Date(startDate);

            switch (modeOfPayment) {
                case 'daily': firstPaymentDate.setDate(startDate.getDate() + 1); break;
                case 'weekly': firstPaymentDate.setDate(startDate.getDate() + 7); break;
                case 'bi-weekly': firstPaymentDate.setDate(startDate.getDate() + 14); break;
                case 'quarterly': firstPaymentDate.setMonth(startDate.getMonth() + 3); break;
                case 'semi-annually':
                case 'semi annually':
                case 'semi annualy':
                    firstPaymentDate.setMonth(startDate.getMonth() + 6); break;
                case 'annually': firstPaymentDate.setFullYear(startDate.getFullYear() + 1); break;
                case 'monthly':
                default: firstPaymentDate.setMonth(startDate.getMonth() + 1); break;
            }

            // --- Fill Summary ---
            if (elements.summaryPrincipal) elements.summaryPrincipal.textContent = principal.toLocaleString('en-US', { minimumFractionDigits: 2 });
            if (elements.summaryRate) elements.summaryRate.textContent = annualRatePercent.toFixed(2) + '%';
            if (elements.summaryTerm) elements.summaryTerm.textContent = termMonths;
            if (elements.summaryGranted) elements.summaryGranted.textContent = firstPaymentDate.toLocaleDateString();
            
            const capitalizedFrequency = modeOfPayment.charAt(0).toUpperCase() + modeOfPayment.slice(1);
            if (elements.summaryFrequency) elements.summaryFrequency.textContent = capitalizedFrequency;
            if (elements.paymentLabel) elements.paymentLabel.textContent = capitalizedFrequency + ' Payment';

            // --- Calculations ---
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
            if (elements.summaryPeriodicRate) elements.summaryPeriodicRate.textContent = (periodicRate * 100).toFixed(3) + '%';

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
            
            // Safety: at least 1 payment if termMonths > 0
            if (totalPaymentsCount === 0 && termMonths > 0) totalPaymentsCount = 1;

            let periodicPayment = 0;
            if (totalPaymentsCount > 0) {
                if (Math.abs(periodicRate) < 0.000001) {
                    periodicPayment = principal / totalPaymentsCount;
                } else {
                    periodicPayment = (principal * periodicRate) / (1 - Math.pow(1 + periodicRate, -totalPaymentsCount));
                }
            }
            if (elements.summaryPeriodicPayment) elements.summaryPeriodicPayment.textContent = periodicPayment.toLocaleString('en-US', { minimumFractionDigits: 2 });

            // --- Fill Table ---
            if (elements.tableBody) {
                elements.tableBody.innerHTML = '';

                // Row 0: Initial Balance
                const row0 = document.createElement('tr');
                row0.className = 'border-b border-gray-300';
                row0.innerHTML = `
                    <td class="p-1 px-2 border-r border-gray-300 text-center"></td>
                    <td class="p-1 px-2 border-r border-gray-300"></td>
                    <td class="p-1 px-2 border-r border-gray-300"></td>
                    <td class="p-1 px-2 border-r border-gray-300"></td>
                    <td class="p-1 px-2 border-r border-gray-300"></td>
                    <td class="p-1 px-2 border-r border-gray-300"></td>
                    <td class="p-1 px-2 text-right border border-gray-300 font-medium">${principal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                `;
                elements.tableBody.appendChild(row0);

                let currentDate = new Date(firstPaymentDate);
                let remainingBalance = principal;
                let totalInterestAccrued = 0;

                for (let i = 1; i <= totalPaymentsCount; i++) {
                    const interest = remainingBalance * periodicRate;
                    let principalPayment = periodicPayment - interest;

                    if (i === totalPaymentsCount) {
                        principalPayment = remainingBalance;
                        remainingBalance = 0;
                    } else {
                        remainingBalance -= principalPayment;
                    }

                    totalInterestAccrued += interest;

                    const row = document.createElement('tr');
                    row.className = 'border-b border-gray-300 hover:bg-gray-50';
                    row.innerHTML = `
                        <td class="p-1 px-2 border-r border-gray-300 text-center text-gray-600">${i}</td>
                        <td class="p-1 px-2 border-r border-gray-300 text-center">${currentDate.toLocaleDateString()}</td>
                        <td class="p-1 px-2 border-r border-gray-300 text-right">${(principalPayment + interest).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td class="p-1 px-2 border-r border-gray-300 text-right"></td>
                        <td class="p-1 px-2 border-r border-gray-300 text-right">${interest.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td class="p-1 px-2 border-r border-gray-300 text-right">${principalPayment.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td class="p-1 px-2 text-right border border-gray-300">${remainingBalance > 0.005 ? remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}</td>
                    `;
                    elements.tableBody.appendChild(row);

                    // Increment Date
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

                if (elements.summaryTotalInterest) elements.summaryTotalInterest.textContent = totalInterestAccrued.toLocaleString('en-US', { minimumFractionDigits: 2 });
                if (elements.summaryTotalPaymentsAmount) elements.summaryTotalPaymentsAmount.textContent = (principal + totalInterestAccrued).toLocaleString('en-US', { minimumFractionDigits: 2 });
                console.log('Schedule generation finished successfully.');
            }
        } catch (err) {
            console.error('Fatal error in generateSchedule:', err);
            alert('Generation Error: ' + err.message);
        }
    };

    fetchLoanData();
});
