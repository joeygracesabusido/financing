document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/graphql';
    const collectionDueTableBody = document.getElementById('collection-due-table-body');
    const filterSelect = document.getElementById('filter-select');
    const dateRangeDisplay = document.getElementById('date-range-display');
    const loanCountDisplay = document.getElementById('loan-count');

    let currentFilter = 'weekly';
    let allLoans = [];

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
            // Start of current week (Monday)
            const dayOfWeek = now.getDay();
            const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday, 0, 0, 0);
            // End of current week (Sunday)
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6, 23, 59, 59);
            label = 'This Week';
        } else if (filter === 'monthly') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            label = 'This Month';
        }

        return { startDate, endDate, label };
    };

    // GraphQL query to fetch loans
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

    // Check if a loan is due within the current date range
    const isLoanDueInRange = (loan, startDate, endDate) => {
        if (currentFilter === 'all') return true;

        // Only show active or approved loans
        if (loan.status !== 'active' && loan.status !== 'approved' && loan.status !== 'paid') return false;

        const createdAtStr = loan.createdAt || new Date().toISOString();
        const startOfLoan = new Date(createdAtStr);
        const termMonths = parseInt(loan.termMonths) || 1;
        const modeOfPayment = (loan.modeOfPayment || loan.loanProduct?.modeOfPayment || 'monthly').toLowerCase();

        // Calculate all installment dates
        const installmentDates = [];
        let currentDate = new Date(startOfLoan);

        // First payment date depends on modeOfPayment
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

        // Calculate number of installments based on term and mode
        let totalInstallments = termMonths;
        switch (modeOfPayment) {
            case 'daily': totalInstallments = termMonths * 30; break;
            case 'weekly': totalInstallments = Math.round(termMonths * 52 / 12); break;
            case 'bi-weekly': totalInstallments = Math.round(termMonths * 26 / 12); break;
            case 'quarterly': totalInstallments = Math.round(termMonths / 3); break;
            case 'semi-annually':
            case 'semi annually':
                totalInstallments = Math.round(termMonths / 6); break;
            case 'annually': totalInstallments = Math.round(termMonths / 12); break;
            case 'monthly':
            default: totalInstallments = termMonths; break;
        }

        if (totalInstallments === 0 && termMonths > 0) totalInstallments = 1;

        for (let i = 0; i < totalInstallments; i++) {
            const normalizedDueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
            const normalizedStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            const normalizedEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

            if (normalizedDueDate >= normalizedStart && normalizedDueDate <= normalizedEnd) {
                return true;
            }

            // Increment for next installment
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

            // If we've passed the end range, we can stop
            if (currentDate > endDate) break;
        }

        return false;
    };

    // Filter loans based on current filter setting
    const getLoansInRange = (filter) => {
        const { startDate, endDate } = getCurrentDateRange(filter);
        return allLoans.filter(loan => isLoanDueInRange(loan, startDate, endDate));
    };

    // Update date range display text
    const updateDateRangeDisplay = (filter) => {
        const { label } = getCurrentDateRange(filter);
        dateRangeDisplay.textContent = `Showing loans due ${label.toLowerCase()}`;
    };

    // Calculate the next due date for display
    const getNextDueDate = (loan) => {
        const now = new Date();
        const startOfLoan = new Date(loan.createdAt);
        const termMonths = parseInt(loan.termMonths) || 1;
        const modeOfPayment = (loan.modeOfPayment || loan.loanProduct?.modeOfPayment || 'monthly').toLowerCase();

        let currentDate = new Date(startOfLoan);
        // Initial payment date
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

        // Find the first payment date that is today or in the future
        // We also need a limit to avoid infinite loops if term is large
        const maxMonths = termMonths + 12;
        const stopDate = new Date(startOfLoan);
        stopDate.setMonth(stopDate.getMonth() + maxMonths);

        while (currentDate < now && currentDate < stopDate) {
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
        return currentDate;
    };

    // Populate the table with loans
    const populateTable = (loans) => {
        if (!collectionDueTableBody) return;

        collectionDueTableBody.innerHTML = '';

        if (loans.length === 0) {
            collectionDueTableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="p-4 text-center text-gray-500">
                        No loans found matching the criteria
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

        loans.forEach(loan => {
            const dueDate = getNextDueDate(loan);
            const dueDateDisplay = dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

            // Determine overdue status
            const now = new Date();
            const isOverdue = dueDate < now && loan.status !== 'paid';

            const row = document.createElement('tr');
            row.className = 'border-b hover:bg-gray-50';

            row.innerHTML = `
                <td class="p-3 font-medium text-blue-600">${loan.loanId || loan.id}</td>
                <td class="p-3">${loan.borrowerName || 'N/A'}</td>
                <td class="p-3">${loan.loanProduct?.productName || 'N/A'}</td>
                <td class="p-3 font-bold">${formatCurrency(loan.amountRequested)}</td>
                <td class="p-3">${loan.termMonths} months</td>
                <td class="p-3">${loan.interestRate}%</td>
                <td class="p-3 ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-700'}">
                    ${dueDateDisplay}
                    ${isOverdue ? '<span class="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded">Overdue</span>' : ''}
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
                <td class="p-3 text-sm">
                    <a href="loan_details.html?id=${loan.id}" class="text-blue-500 hover:text-blue-700 mr-2" title="View Details">
                        <i class="fas fa-eye"></i> View
                    </a>
                    <a href="amortization.html?id=${loan.id}" class="text-indigo-500 hover:text-indigo-700" title="Amortization">
                        <i class="fas fa-calendar-alt"></i> Amortization
                    </a>
                </td>
            `;
            collectionDueTableBody.appendChild(row);
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
                        <td colspan="9" class="p-4 text-center text-red-500">
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
            const filteredLoans = getLoansInRange(currentFilter);
            console.log('Filtered loans:', filteredLoans.length);
            populateTable(filteredLoans);

        } catch (error) {
            console.error('Error fetching loans:', error);
            collectionDueTableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="p-4 text-center text-red-500">
                        Error loading loans. Please check your connection.
                    </td>
                </tr>
            `;
        }
    };

    // Filter change handler
    const handleFilterChange = (event) => {
        currentFilter = event.target.value;
        updateDateRangeDisplay(currentFilter);

        const filteredLoans = getLoansInRange(currentFilter);
        populateTable(filteredLoans);
    };

    // Initialize
    const init = () => {
        // Setup filter change listener
        if (filterSelect) {
            filterSelect.addEventListener('change', handleFilterChange);
        }

        // Fetch loans and apply initial filter
        fetchLoans();
        updateDateRangeDisplay(currentFilter);
    };

    // Start the app
    init();
});
