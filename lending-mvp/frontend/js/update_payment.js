document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/graphql';
    const urlParams = new URLSearchParams(window.location.search);
    const transactionId = urlParams.get('id');

    const updatePaymentForm = document.getElementById('update-payment-form');
    const paymentAmountInput = document.getElementById('payment-amount');
    const paymentDateInput = document.getElementById('payment-date');
    const paymentNotesInput = document.getElementById('payment-notes');
    const transactionIdHidden = document.getElementById('transaction-id');
    const loanIdHidden = document.getElementById('loan-id');
    const paymentMessage = document.getElementById('payment-message');
    const cancelBtn = document.getElementById('cancel-btn');

    if (!transactionId) {
        alert('Transaction ID not provided.');
        window.location.href = 'loan_transaction.html';
        return;
    }

    const getLoanTransactionQuery = `
        query GetLoanTransaction($transactionId: ID!) {
            loanTransaction(transactionId: $transactionId) {
                success
                message
                transaction {
                    id
                    loanId
                    amount
                    transactionDate
                    notes
                    transactionType
                }
            }
        }
    `;

    const updateLoanTransactionMutation = `
        mutation UpdateLoanTransaction($transactionId: ID!, $input: LoanTransactionUpdateInput!) {
            updateLoanTransaction(transactionId: $transactionId, input: $input) {
                success
                message
            }
        }
    `;

    const fetchTransactionData = async () => {
        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: getLoanTransactionQuery,
                    variables: { transactionId: transactionId }
                })
            });

            const result = await response.json();
            const transaction = result.data?.loanTransaction?.transaction;

            if (transaction) {
                if (transaction.transactionType !== 'repayment') {
                    alert('This page is only for updating payment transactions.');
                    window.location.href = `loan_details.html?id=${transaction.loanId}`;
                    return;
                }

                transactionIdHidden.value = transaction.id;
                loanIdHidden.value = transaction.loanId;
                paymentAmountInput.value = transaction.amount;
                
                // Format date for datetime-local input
                const date = new Date(transaction.transactionDate);
                date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
                paymentDateInput.value = date.toISOString().slice(0, 16);
                
                paymentNotesInput.value = transaction.notes || '';
            } else {
                alert('Transaction not found.');
                window.location.href = 'loan_transaction.html';
            }
        } catch (error) {
            console.error('Error fetching transaction:', error);
        }
    };

    updatePaymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = parseFloat(paymentAmountInput.value);
        const date = paymentDateInput.value ? new Date(paymentDateInput.value).toISOString() : new Date().toISOString();
        const notes = paymentNotesInput.value.trim();
        const loanId = loanIdHidden.value;

        if (isNaN(amount) || amount <= 0) {
            paymentMessage.textContent = 'Please enter a valid amount.';
            paymentMessage.className = 'mt-4 text-sm font-bold text-red-500';
            return;
        }

        paymentMessage.textContent = 'Updating payment...';
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
                    query: updateLoanTransactionMutation,
                    variables: {
                        transactionId: transactionId,
                        input: {
                            amount: amount,
                            transactionDate: date,
                            notes: notes
                        }
                    }
                })
            });

            const result = await response.json();
            const mutationResult = result.data?.updateLoanTransaction;

            if (mutationResult?.success) {
                paymentMessage.textContent = 'Payment updated successfully! Redirecting...';
                paymentMessage.className = 'mt-4 text-sm font-bold text-green-500';
                setTimeout(() => {
                    window.location.href = `loan_details.html?id=${loanId}`;
                }, 1500);
            } else {
                paymentMessage.textContent = mutationResult?.message || 'Failed to update payment.';
                paymentMessage.className = 'mt-4 text-sm font-bold text-red-500';
            }
        } catch (error) {
            console.error('Update error:', error);
            paymentMessage.textContent = 'An error occurred during update.';
            paymentMessage.className = 'mt-4 text-sm font-bold text-red-500';
        }
    });

    cancelBtn.addEventListener('click', () => {
        const loanId = loanIdHidden.value;
        if (loanId) {
            window.location.href = `loan_details.html?id=${loanId}`;
        } else {
            window.location.href = 'loan_transaction.html';
        }
    });

    fetchTransactionData();
});
