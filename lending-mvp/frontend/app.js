document.addEventListener('DOMContentLoaded', () => {
    const ledgerEntriesDiv = document.getElementById('ledger-entries');
    const disburseBtn = document.getElementById('disburse-btn');

    if (ledgerEntriesDiv && disburseBtn) {
        // Fetch ledger on page load
        fetchBorrowerLedger('some_borrower_id');

        // Handle button click
        disburseBtn.addEventListener('click', () => {
            disburseTestLoan();
        });
    }

    async function disburseTestLoan() {
        const graphqlQuery = {
            query: `
                mutation DisburseLoan($loanId: String!) {
                    disburseLoan(loanId: $loanId)
                }
            `,
            variables: {
                loanId: `test-loan-${Date.now()}`
            }
        };

        try {
            const response = await fetch('/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(graphqlQuery)
            });
            const result = await response.json();
            console.log('Disbursement Result:', result);
            alert('Disbursement action triggered. Check console and refresh to see new ledger entries.');
            // Refresh ledger after a short delay
            setTimeout(() => fetchBorrowerLedger('some_borrower_id'), 1000);
        } catch (error) {
            console.error('Error disbursing loan:', error);
            alert('Error disbursing loan. Check console.');
        }
    }

    async function fetchBorrowerLedger(borrowerId) {
        const graphqlQuery = {
            query: `
                query GetLedger($borrowerId: String!) {
                    getBorrowerLedger(borrowerId: $borrowerId) {
                        transaction_id
                        account
                        amount
                        entry_type
                        timestamp
                    }
                }
            `,
            variables: {
                borrowerId: borrowerId
            }
        };

        try {
            const response = await fetch('/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': 'Bearer YOUR_JWT_TOKEN'
                },
                body: JSON.stringify(graphqlQuery)
            });

            const result = await response.json();
            console.log('Ledger History:', result.data.getBorrowerLedger);
            
            // Render the ledger entries
            const entries = result.data.getBorrowerLedger;
            if (entries && entries.length > 0) {
                let html = '<table class="table-auto w-full">';
                html += '<thead><tr><th class="px-4 py-2">Transaction ID</th><th class="px-4 py-2">Account</th><th class="px-4 py-2">Type</th><th class="px-4 py-2">Amount</th></tr></thead>';
                html += '<tbody>';
                entries.forEach(e => {
                    html += `<tr>
                        <td class="border px-4 py-2">${e.transaction_id}</td>
                        <td class="border px-4 py-2">${e.account}</td>
                        <td class="border px-4 py-2">${e.entry_type}</td>
                        <td class="border px-4 py-2 text-right">${e.amount}</td>
                    </tr>`;
                });
                html += '</tbody></table>';
                ledgerEntriesDiv.innerHTML = html;
            } else {
                ledgerEntriesDiv.innerHTML = '<p>No ledger entries found.</p>';
            }

        } catch (error) {
            console.error('Error fetching ledger:', error);
            ledgerEntriesDiv.innerHTML = '<p class="text-red-500">Error fetching ledger entries.</p>';
        }
    }
});
