document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');
    console.log('Token from localStorage:', token ? token.substring(0, 20) + '...' : 'NOT FOUND');
    
    if (!token) {
        console.error('Authentication token not found. Redirecting to login...');
        console.log('localStorage contents:', Object.keys(localStorage));
        window.location.href = 'login.html';
        return;
    }

    // Basic logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('accessToken');
            alert('Logged out!');
            window.location.href = 'login.html';
        });
    }

    // Sidebar dropdown toggles
    const toggleDropdown = (btnId, menuId) => {
        const btn = document.getElementById(btnId);
        const menu = document.getElementById(menuId);
        if (btn && menu) {
            btn.addEventListener('click', () => {
                menu.classList.toggle('hidden');
            });
        }
    };

    toggleDropdown('customer-dropdown-btn', 'customer-dropdown-menu');
    toggleDropdown('savings-dropdown-btn', 'savings-dropdown-menu');
    toggleDropdown('loan-dropdown-btn', 'loan-dropdown-menu');

    // Dashboard Data Fetching
    const API_URL = '/graphql';
    const totalSavingsDisplay = document.getElementById('total-savings-display');
    const expenseDisplay = document.getElementById('expense-display');
    const totalBalanceDisplay = document.getElementById('total-balance-display');
    const recentTransactionsTbody = document.getElementById('recent-transactions-tbody');
    const userNameDisplay = document.getElementById('user-name-display');

    const DASHBOARD_DATA_QUERY = `
        query GetDashboardData {
            me {
                fullName
            }
            savingsAccounts {
                accounts {
                    balance
                }
            }
            loans {
                loans {
                    id
                    amountRequested
                    interestRate
                    termMonths
                }
            }
            loanTransactions {
                transactions {
                    transactionType
                    amount
                }
            }
            recentTransactions(limit: 10) {
                id
                date
                amount
                name
                user
                method
                category
            }
        }
    `;

    const formatCurrency = (amount) => {
        const sign = amount < 0 ? '-' : '';
        const absAmount = Math.abs(amount);
        return sign + '₱' + new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(absAmount);
    };

    const populateRecentTransactions = (transactions) => {
        if (!recentTransactionsTbody) return;
        recentTransactionsTbody.innerHTML = '';

        if (transactions.length === 0) {
            recentTransactionsTbody.innerHTML = '<tr><td colspan="6" class="p-3 text-center text-gray-500">No recent transactions.</td></tr>';
            return;
        }

        transactions.forEach(tx => {
            const row = document.createElement('tr');
            row.className = 'border-b hover:bg-gray-50';
            
            const date = new Date(tx.date);
            const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' ' + 
                                  date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            
            const amountClass = tx.amount < 0 ? 'text-red-600' : 'text-green-600';
            
            row.innerHTML = `
                <td class="py-3 text-sm">${formattedDate}</td>
                <td class="py-3 text-sm font-bold ${amountClass}">${formatCurrency(tx.amount)}</td>
                <td class="py-3 text-sm font-medium text-blue-600">${tx.user}</td>
                <td class="py-3 text-sm font-medium">${tx.name}</td>
                <td class="py-3 text-sm text-gray-600">${tx.method}</td>
                <td class="py-3 text-sm"><span class="px-2 py-1 bg-gray-100 rounded-full text-xs">${tx.category}</span></td>
            `;
            recentTransactionsTbody.appendChild(row);
        });
    };

    const fetchDashboardData = async () => {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ query: DASHBOARD_DATA_QUERY })
            });

            const result = await response.json();

            if (result.errors) {
                console.error('GraphQL Errors:', result.errors);
                return;
            }

            const me = result.data?.me;
            if (me && userNameDisplay) {
                userNameDisplay.textContent = me.fullName;
            }

            const savingsAccounts = result.data?.savingsAccounts?.accounts || [];
            const loans = result.data?.loans?.loans || [];
            const loanTransactions = result.data?.loanTransactions?.transactions || [];
            const recentTransactions = result.data?.recentTransactions || [];

            // Populate Table
            populateRecentTransactions(recentTransactions);

            // Calculate Total Savings
            const totalSavings = savingsAccounts.reduce((sum, account) => sum + (account.balance || 0), 0);
            if (totalSavingsDisplay) {
                totalSavingsDisplay.textContent = formatCurrency(totalSavings);
            }

            // Calculate Income (Total Repayments)
            const totalRepayments = loanTransactions.reduce((sum, tx) => {
                if (tx.transactionType === 'repayment') {
                    return sum + (parseFloat(tx.amount) || 0);
                }
                return sum;
            }, 0);

            const incomeDisplay = document.getElementById('income-display');
            if (incomeDisplay) {
                incomeDisplay.textContent = formatCurrency(totalRepayments);
            }

            // Calculate Total Loan Principal Balance
            // Principal Balance = sum(disbursements) - sum(repayments)
            let totalLoanPrincipalBalance = loanTransactions.reduce((balance, tx) => {
                const amount = parseFloat(tx.amount) || 0;
                if (tx.transactionType === 'disbursement') {
                    return balance + amount;
                } else if (tx.transactionType === 'repayment') {
                    return balance - amount;
                }
                return balance;
            }, 0);

            // Add calculated interest for all loans
            let totalCalculatedInterest = loans.reduce((sum, loan) => {
                const amountRequested = parseFloat(loan.amountRequested) || 0;
                const interestRate = parseFloat(loan.interestRate) || 0;
                const termMonths = parseInt(loan.termMonths) || 0;
                
                if (amountRequested > 0 && interestRate > 0 && termMonths > 0) {
                    const monthlyRate = (interestRate / 100) / 12;
                    return sum + (amountRequested * monthlyRate * termMonths);
                }
                return sum;
            }, 0);

            const totalOutstandingLoanBalance = Math.max(0, totalLoanPrincipalBalance + totalCalculatedInterest);

            if (expenseDisplay) {
                expenseDisplay.textContent = formatCurrency(totalOutstandingLoanBalance);
            }

            // Update Total Balance (Total Assets = Cash in Savings + Outstanding Loans)
            if (totalBalanceDisplay) {
                totalBalanceDisplay.textContent = formatCurrency(totalSavings + totalOutstandingLoanBalance);
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    fetchDashboardData();
});
