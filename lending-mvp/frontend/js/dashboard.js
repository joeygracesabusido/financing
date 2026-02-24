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

    const DASHBOARD_DATA_QUERY = `
        query GetDashboardData {
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
        }
    `;

    const formatCurrency = (amount) => {
        return '₱' + new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
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

            const savingsAccounts = result.data?.savingsAccounts?.accounts || [];
            const loans = result.data?.loans?.loans || [];
            const loanTransactions = result.data?.loanTransactions?.transactions || [];

            // Calculate Total Savings
            const totalSavings = savingsAccounts.reduce((sum, account) => sum + (account.balance || 0), 0);
            if (totalSavingsDisplay) {
                totalSavingsDisplay.textContent = formatCurrency(totalSavings);
            }

            // Calculate Total Loan Balance (Expenses)
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

            const totalOutstandingLoanBalance = totalLoanPrincipalBalance + totalCalculatedInterest;

            if (expenseDisplay) {
                expenseDisplay.textContent = formatCurrency(totalOutstandingLoanBalance);
            }

            // Update Total Balance
            if (totalBalanceDisplay) {
                totalBalanceDisplay.textContent = formatCurrency(totalSavings - totalOutstandingLoanBalance);
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    fetchDashboardData();
});
