document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/graphql';
    const urlParams = new URLSearchParams(window.location.search);
    const loanId = urlParams.get('id');

    const summaryPrincipal = document.getElementById('summary-principal');
    const summaryRate = document.getElementById('summary-rate');
    const summaryTerm = document.getElementById('summary-term');
    const summaryGranted = document.getElementById('summary-granted');
    const summaryMaturity = document.getElementById('summary-maturity');
    const tableBody = document.getElementById('amortization-table-body');

    if (!loanId) {
        alert('Loan ID not provided.');
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
                    createdAt
                }
            }
        }
    `;

    const fetchLoanData = async () => {
        const token = localStorage.getItem('accessToken');
        try {
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

            const result = await response.json();
            const loanResponse = result.data?.loan;

            if (loanResponse?.success && loanResponse.loan) {
                generateSchedule(loanResponse.loan);
            } else {
                alert('Error fetching loan data: ' + (loanResponse?.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to connect to the server.');
        }
    };

    const generateSchedule = (loan) => {
        const principal = parseFloat(loan.amountRequested);
        const annualRate = parseFloat(loan.interestRate) / 100;
        const termMonths = parseInt(loan.termMonths);
        const startDate = new Date(loan.createdAt);

        summaryPrincipal.textContent = principal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        summaryRate.textContent = (annualRate * 100) + '%';
        summaryTerm.textContent = '1'; // As per image "Term (No. Principal Installment)"
        summaryGranted.textContent = startDate.toLocaleDateString();

        const dailyRate = (principal * annualRate) / 360;
        
        tableBody.innerHTML = '';

        // Initial Balance Row
        const initialRow = document.createElement('tr');
        initialRow.innerHTML = `
            <td class="p-2 border-r border-black text-center font-bold">#</td>
            <td class="p-2 border-r border-black text-center font-bold">Date</td>
            <td class="p-2 border-r border-black text-center font-bold">Days</td>
            <td class="p-2 border-r border-black text-right font-bold">Monthly Amortization</td>
            <td class="p-2 border-r border-black text-right font-bold">Interest</td>
            <td class="p-2 border-r border-black text-right font-bold">Principal</td>
            <td class="p-2 text-right font-bold">${principal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        `;
        initialRow.className = 'border-b border-black';
        tableBody.appendChild(initialRow);

        let currentDate = new Date(startDate);
        let remainingBalance = principal;

        for (let i = 1; i <= termMonths; i++) {
            const prevDate = new Date(currentDate);
            currentDate.setMonth(currentDate.getMonth() + 1);
            
            // Calculate days between prevDate and currentDate
            const timeDiff = currentDate.getTime() - prevDate.getTime();
            const daysInMonth = Math.round(timeDiff / (1000 * 3600 * 24));
            
            const interest = dailyRate * daysInMonth;
            let principalPayment = 0;
            
            if (i === termMonths) {
                principalPayment = principal;
                summaryMaturity.textContent = currentDate.toLocaleDateString();
            }

            const monthlyAmortization = interest + principalPayment;
            remainingBalance -= principalPayment;

            const row = document.createElement('tr');
            row.className = 'border-b border-black text-sm';
            row.innerHTML = `
                <td class="p-2 border-r border-black text-center">${i}</td>
                <td class="p-2 border-r border-black text-center">${currentDate.toLocaleDateString()}</td>
                <td class="p-2 border-r border-black text-center">${daysInMonth}</td>
                <td class="p-2 border-r border-black text-right">${monthlyAmortization.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="p-2 border-r border-black text-right">${interest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="p-2 border-r border-black text-right">${principalPayment > 0 ? principalPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                <td class="p-2 text-right">${remainingBalance > 0.01 ? remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
            `;
            tableBody.appendChild(row);
        }

        // Add 2 extra empty rows as shown in the image
        for (let i = termMonths + 1; i <= termMonths + 2; i++) {
             const prevDate = new Date(currentDate);
            currentDate.setMonth(currentDate.getMonth() + 1);
            const timeDiff = currentDate.getTime() - prevDate.getTime();
            const daysInMonth = Math.round(timeDiff / (1000 * 3600 * 24));

            const row = document.createElement('tr');
            row.className = 'border-b border-black text-sm';
            row.innerHTML = `
                <td class="p-2 border-r border-black text-center">${i}</td>
                <td class="p-2 border-r border-black text-center">${currentDate.toLocaleDateString()}</td>
                <td class="p-2 border-r border-black text-center">${daysInMonth}</td>
                <td class="p-2 border-r border-black text-right">-</td>
                <td class="p-2 border-r border-black text-right">-</td>
                <td class="p-2 border-r border-black text-right">-</td>
                <td class="p-2 text-right">-</td>
            `;
            tableBody.appendChild(row);
        }
    };

    fetchLoanData();
});
