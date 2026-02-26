document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/graphql';
    const collectionDueTableBody = document.getElementById('collection-due-table-body');
    const filterSelect = document.getElementById('filter-select');
    const dateRangeDisplay = document.getElementById('date-range-display');
    const loanCountDisplay = document.getElementById('loan-count');

    let currentFilter = 'weekly';
    let allLoans = [];
    let allAmortizationData = {}; // Cache amortization data: loanId -> scheduleData

    // Get the current date range based on filter
    const getCurrentDateRange = (filter) => {
        const now = new Date();
        let startDate, endDate, label;

        if (filter === 'all') {
            startDate = new Date(0);
            endDate = new Date(now.getFullYear() + 100, 0, 1);
            label = 'All Time';
        } else if (filter === 'daily') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            label = 'Today';
        } else if (filter === 'weekly') {
            // Next 7 days
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59);
            label = 'Next 7 Days';
        } else if (filter === 'monthly') {
            // Next 30 days
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30, 23, 59, 59);
            label = 'Next 30 Days';
        }

        return { startDate, endDate, label };
    };

    // GraphQL query to fetch loans with full details for amortization
    const getLoansQuery = `
        query GetLoans($skip: Int, $limit: Int) {
            loans(skip: $skip, limit: $limit) {
                success
                message
                loans {
                    id
                    loanId
                    borrowerId
                    borrowerName
                    loanProduct {
                        productName
                        modeOfPayment
                        defaultInterestRate
                    }
                    amountRequested
                    termMonths
                    interestRate
                    modeOfPayment
                    status
                    createdAt
                }
                total
            }
        }
    `;

    // Format currency helper
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined || isNaN(amount)) return '₱0.00';
        return '₱' + new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    // Calculate amortization schedule for a loan
    const calculateAmortizationSchedule = (loan) => {
        const principal = parseFloat(loan.amountRequested) || 0;
        const annualRatePercent = parseFloat(loan.loanProduct?.defaultInterestRate || loan.interestRate || 0);
        const annualRate = annualRatePercent / 100;
        const termMonths = parseInt(loan.termMonths) || 0;
        const modeOfPayment = (loan.loanProduct?.modeOfPayment || loan.modeOfPayment || 'monthly').toLowerCase();

        const createdAtStr = loan.createdAt || new Date().toISOString();
        const startDate = new Date(createdAtStr);

        // Calculate periodic values
        let periodsPerYear = 12;
        let totalPaymentsCount = termMonths;

        switch (modeOfPayment) {
            case 'daily':
                periodsPerYear = 360;
                totalPaymentsCount = termMonths * 30;
                break;
            case 'weekly':
                periodsPerYear = 52;
                totalPaymentsCount = Math.round(termMonths * 52 / 12);
                break;
            case 'bi-weekly':
                periodsPerYear = 26;
                totalPaymentsCount = Math.round(termMonths * 26 / 12);
                break;
            case 'quarterly':
                periodsPerYear = 4;
                totalPaymentsCount = Math.round(termMonths / 3);
                break;
            case 'semi-annually':
            case 'semi annually':
                periodsPerYear = 2;
                totalPaymentsCount = Math.round(termMonths / 6);
                break;
            case 'annually':
                periodsPerYear = 1;
                totalPaymentsCount = Math.round(termMonths / 12);
                break;
            case 'monthly':
            default:
                periodsPerYear = 12;
                totalPaymentsCount = termMonths;
                break;
        }

        const periodicRate = annualRate / periodsPerYear;

        // Calculate periodic payment using standard amortization formula
        let periodicPayment = 0;
        if (periodicRate > 0) {
            periodicPayment = (principal * periodicRate * Math.pow(1 + periodicRate, totalPaymentsCount)) /
                (Math.pow(1 + periodicRate, totalPaymentsCount) - 1);
        } else {
            periodicPayment = principal / totalPaymentsCount;
        }

        // Generate schedule
        const schedule = [];
        let currentDate = new Date(startDate);
        let remainingBalance = principal;

        // Calculate first payment date
        switch (modeOfPayment) {
            case 'daily': currentDate.setDate(currentDate.getDate() + 1); break;
            case 'weekly': currentDate.setDate(currentDate.getDate() + 7); break;
            case 'bi-weekly': currentDate.setDate(currentDate.getDate() + 14); break;
            case 'quarterly': currentDate.setMonth(currentDate.getMonth() + 3); break;
            case 'semi-annually':
            case 'semi annually':
                currentDate.setMonth(currentDate.getMonth() + 6); break;
            case 'annually': currentDate.setFullYear(currentDate.getFullYear() + 1); break;
            case 'monthly':
            default: currentDate.setMonth(currentDate.getMonth() + 1); break;
        }

        for (let i = 0; i < totalPaymentsCount; i++) {
            const interestPayment = remainingBalance * periodicRate;
            const principalPayment = periodicPayment - interestPayment;
            remainingBalance = Math.max(0, remainingBalance - principalPayment);

            schedule.push({
                paymentNumber: i + 1,
                paymentDate: new Date(currentDate),
                principalPayment: parseFloat(principalPayment.toFixed(2)),
                interestPayment: parseFloat(interestPayment.toFixed(2)),
                totalPayment: parseFloat(periodicPayment.toFixed(2)),
                remainingBalance: parseFloat(remainingBalance.toFixed(2))
            });

            // Increment to next payment date
            switch (modeOfPayment) {
                case 'daily': currentDate.setDate(currentDate.getDate() + 1); break;
                case 'weekly': currentDate.setDate(currentDate.getDate() + 7); break;
                case 'bi-weekly': currentDate.setDate(currentDate.getDate() + 14); break;
                case 'quarterly': currentDate.setMonth(currentDate.getMonth() + 3); break;
                case 'semi-annually':
                case 'semi annually':
                    currentDate.setMonth(currentDate.getMonth() + 6); break;
                case 'annually': currentDate.setFullYear(currentDate.getFullYear() + 1); break;
                case 'monthly':
                default: currentDate.setMonth(currentDate.getMonth() + 1); break;
            }
        }

        return schedule;
    };

    // Get all installment dates for a loan within a date range
    // (This function is now replaced by calculateAmortizationSchedule above)

    // Check if a loan has collections due within the current date range
    const isLoanDueInRange = (loan, startDate, endDate) => {
        if (currentFilter === 'all') return loan.status === 'active' || loan.status === 'approved' || loan.status === 'paid';
        if (loan.status !== 'active' && loan.status !== 'approved' && loan.status !== 'paid') return false;

        // Generate amortization schedule and check if any payments fall in the range
        const schedule = calculateAmortizationSchedule(loan);
        return schedule.some(payment => {
            const paymentDate = new Date(payment.paymentDate);
            const normalizedPaymentDate = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate());
            const normalizedStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            const normalizedEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
            return normalizedPaymentDate >= normalizedStart && normalizedPaymentDate <= normalizedEnd;
        });
    };

    // Filter loans based on current filter setting
    const getLoansInRange = (filter) => {
        const { startDate, endDate } = getCurrentDateRange(filter);
        return allLoans.filter(loan => isLoanDueInRange(loan, startDate, endDate));
    };

    // Update date range display text
    const updateDateRangeDisplay = (filter) => {
        const { label, startDate, endDate } = getCurrentDateRange(filter);
        const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        dateRangeDisplay.textContent = `Showing loans due ${label.toLowerCase()} (${startStr} - ${endStr})`;
    };

    // Populate the table with loans and their collection data
    const populateTable = (loans, startDate, endDate) => {
        if (!collectionDueTableBody) return;

        collectionDueTableBody.innerHTML = '';

        if (loans.length === 0) {
            collectionDueTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="p-4 text-center text-gray-500">
                        No loans found with collections due in this period
                    </td>
                </tr>
            `;
            if (loanCountDisplay) {
                loanCountDisplay.textContent = '0 loans';
            }
            return;
        }

        if (loanCountDisplay) {
            loanCountDisplay.textContent = `${loans.length} loan${loans.length !== 1 ? 's' : ''}`;
        }

        const now = new Date();

        loans.forEach(loan => {
            try {
                // Get the loan's payment frequency
                const loanModeOfPayment = (loan.loanProduct?.modeOfPayment || loan.modeOfPayment || 'monthly').toLowerCase();
                
                // Get amortization schedule
                const schedule = allAmortizationData[loan.id] || calculateAmortizationSchedule(loan);
                allAmortizationData[loan.id] = schedule;

                // Find payments due in this date range
                const paymentsInRange = schedule.filter(payment => {
                    const paymentDate = new Date(payment.paymentDate);
                    const normalizedPaymentDate = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate());
                    const normalizedStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                    const normalizedEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                    return normalizedPaymentDate >= normalizedStart && normalizedPaymentDate <= normalizedEnd;
                });

                // Skip if no payments in range
                if (paymentsInRange.length === 0) return;

                // Calculate totals for this loan in the range
                const totalCollectionAmount = paymentsInRange.reduce((sum, p) => sum + p.totalPayment, 0);
                const totalPrincipal = paymentsInRange.reduce((sum, p) => sum + p.principalPayment, 0);
                const totalInterest = paymentsInRange.reduce((sum, p) => sum + p.interestPayment, 0);

                // Get next due date
                const nextPayment = schedule.find(p => new Date(p.paymentDate) >= now);
                const nextDueDate = nextPayment ? new Date(nextPayment.paymentDate) : null;
                const nextDueDateDisplay = nextDueDate ? 
                    nextDueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 
                    'N/A';

                // Check if overdue
                const isOverdue = nextDueDate && nextDueDate < now && loan.status !== 'paid';

                // Build payment schedule display for this range
                let paymentScheduleHtml = '<div class="text-xs text-gray-600 mt-2 space-y-1 max-h-48 overflow-y-auto">';
                paymentsInRange.forEach(payment => {
                    const paymentDate = new Date(payment.paymentDate);
                    const dateDisplay = paymentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const isPast = paymentDate < now;
                    paymentScheduleHtml += `
                        <div class="p-2 border rounded ${isPast ? 'bg-gray-100' : 'bg-blue-50'}">
                            <div class="flex justify-between">
                                <span class="${isPast ? 'text-gray-400 line-through' : 'font-medium'}">${dateDisplay}</span>
                                <span class="font-medium">${formatCurrency(payment.totalPayment)}</span>
                            </div>
                            <div class="text-xs text-gray-500">
                                Principal: ${formatCurrency(payment.principalPayment)} | Interest: ${formatCurrency(payment.interestPayment)}
                            </div>
                        </div>
                    `;
                });
                paymentScheduleHtml += '</div>';

                const row = document.createElement('tr');
                row.className = 'border-b hover:bg-gray-50';

                row.innerHTML = `
                    <td class="p-3 font-medium text-blue-600">${loan.loanId || loan.id}</td>
                    <td class="p-3">${loan.borrowerName || 'N/A'}</td>
                    <td class="p-3">${loan.loanProduct?.productName || 'N/A'}</td>
                    <td class="p-3 font-bold">${formatCurrency(loan.amountRequested)}</td>
                    <td class="p-3">${loan.termMonths} months</td>
                    <td class="p-3">${loan.interestRate || loan.loanProduct?.defaultInterestRate || 0}%</td>
                    <td class="p-3 ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-700'}">
                        <div class="font-bold text-lg">${formatCurrency(totalCollectionAmount)}</div>
                        <div class="text-xs text-gray-500 mt-1">
                            Principal: ${formatCurrency(totalPrincipal)}<br>
                            Interest: ${formatCurrency(totalInterest)}
                        </div>
                        <div class="text-xs text-gray-600 mt-2 font-semibold">
                            Next Due: ${nextDueDateDisplay}
                        </div>
                        ${isOverdue ? '<span class="mt-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded inline-block">Overdue</span>' : ''}
                        ${paymentScheduleHtml}
                    </td>
                    <td class="p-3">
                        <span class="px-2 py-1 rounded-full text-xs font-medium
                            ${loan.status === 'approved' || loan.status === 'active' ? 'bg-green-100 text-green-800' :
                              loan.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                              loan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'}">
                            ${loan.status}
                        </span>
                    </td>
                `;
                collectionDueTableBody.appendChild(row);
            } catch (error) {
                console.error('Error processing loan:', loan.id, error);
            }
        });
    };

    // Fetch loans from the API
    const fetchLoans = async () => {
        const token = localStorage.getItem('accessToken');

        if (!token) {
            console.error('Authentication token not found');
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
                    query: getLoansQuery,
                    variables: { skip: 0, limit: 1000 }
                })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('accessToken');
                    alert('Session expired. Please log in again.');
                    window.location.href = 'login.html';
                    return;
                }
                throw new Error(`HTTP error ${response.status}`);
            }

            const result = await response.json();

            if (result.errors) {
                console.error('GraphQL Errors:', result.errors);
                alert(`Error: ${result.errors[0]?.message || 'Unknown error'}`);
                return;
            }

            const loansResponse = result.data?.loans;

            if (!loansResponse?.success) {
                console.warn('Query unsuccessful:', loansResponse?.message);
                collectionDueTableBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="p-4 text-center text-red-500">
                            Error loading loans: ${loansResponse?.message || 'Unknown error'}
                        </td>
                    </tr>
                `;
                return;
            }

            allLoans = loansResponse.loans || [];
            console.log('Loans fetched:', allLoans.length);
            console.log('First loan:', allLoans[0]);

            // Apply current filter
            const { startDate, endDate } = getCurrentDateRange(currentFilter);
            const filteredLoans = getLoansInRange(currentFilter);
            console.log('Filtered loans:', filteredLoans.length);
            populateTable(filteredLoans, startDate, endDate);

        } catch (error) {
            console.error('Error fetching loans:', error);
            collectionDueTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="p-4 text-center text-red-500">
                        Error loading loans. Please check your connection.
                    </td>
                </tr>
            `;
        }
    };

    // Filter change handler
    const handleFilterChange = (event) => {
        currentFilter = event.target.value;
        const { startDate, endDate, label } = getCurrentDateRange(currentFilter);
        updateDateRangeDisplay(currentFilter);

        const filteredLoans = getLoansInRange(currentFilter);
        populateTable(filteredLoans, startDate, endDate);
    };

    // Initialize
    const init = () => {
        // Setup filter change listener
        if (filterSelect) {
            filterSelect.addEventListener('change', handleFilterChange);
        }

        // Fetch loans and apply initial filter
        fetchLoans();
        const { startDate, endDate } = getCurrentDateRange(currentFilter);
        updateDateRangeDisplay(currentFilter);
    };

    // Start the app
    init();
});
