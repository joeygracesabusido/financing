document.addEventListener('DOMContentLoaded', () => {
    console.log('update_loan_transaction.js loaded');
    const API_URL = '/graphql';
    const updateLoanTransactionForm = document.getElementById('update-loan-transaction-form');
    const formMessage = document.getElementById('form-message');
    const transactionTypeSelect = document.getElementById('transaction-type');
    const disbursementSection = document.getElementById('disbursement-section');

    // Get transaction ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const transactionId = urlParams.get('id');
    console.log('Transaction ID from URL:', transactionId);

    if (!transactionId) {
        formMessage.textContent = 'Error: Transaction ID not found in URL.';
        formMessage.className = 'mt-4 text-sm font-bold text-red-500';
        return;
    }

    // Input fields mapping
    const fields = {
        transactionIdHidden: 'transaction-id',
        commercialBank: 'commercial_bank',
        servicingBranch: 'servicing-branch',
        region: 'region',
        loanId: 'loan-id',
        borrowerName: 'borrower-name',
        loanProduct: 'loan-product',
        transactionType: 'transaction-type',
        transactionDate: 'transaction-date',
        referenceNumber: 'reference-number',
        amount: 'amount',
        debitAccount: 'debit-account',
        creditAccount: 'credit-account',
        disbursementMethod: 'disbursement-method',
        disbursementStatus: 'disbursement-status',
        chequeNumber: 'cheque-number',
        beneficiaryBank: 'beneficiary-bank',
        beneficiaryAccount: 'beneficiary-account',
        approvedBy: 'approved-by',
        processedBy: 'processed-by',
        notes: 'notes',
        termMonths: 'term-months',
        interestRate: 'interest-rate'
    };

    const elements = {};
    for (const [key, id] of Object.entries(fields)) {
        elements[key] = document.getElementById(id);
        if (!elements[key]) {
            console.warn(`Element with ID "${id}" not found in HTML.`);
        }
    }

    // Borrower autocomplete functionality
    const borrowerDatalist = document.getElementById('borrower-list');
    const ALL_CUSTOMERS_QUERY = `
        query {
            customers {
                customers {
                    id
                    displayName
                }
            }
        }
    `;

    async function fetchCustomers() {
        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ query: ALL_CUSTOMERS_QUERY })
            });
            const result = await response.json();
            return result.data?.customers?.customers || [];
        } catch (error) {
            console.error('Error fetching customers:', error);
            return [];
        }
    }

    async function populateBorrowerDatalist() {
        const customers = await fetchCustomers();
        if (borrowerDatalist) {
            borrowerDatalist.innerHTML = '';
            customers.forEach(customer => {
                const option = document.createElement('option');
                option.value = customer.displayName;
                borrowerDatalist.appendChild(option);
            });
        }
    }

    // Loan product autocomplete functionality
    const loanProductDatalist = document.getElementById('loan-product-list');
    const ALL_LOAN_PRODUCTS_QUERY = `
        query {
            loanProducts {
                id
                productCode
                productName
            }
        }
    `;

    async function fetchLoanProducts() {
        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ query: ALL_LOAN_PRODUCTS_QUERY })
            });
            const result = await response.json();
            return result.data?.loanProducts || [];
        } catch (error) {
            console.error('Error fetching loan products:', error);
            return [];
        }
    }

    async function populateLoanProductDatalist() {
        const loanProducts = await fetchLoanProducts();
        if (loanProductDatalist) {
            loanProductDatalist.innerHTML = '';
            loanProducts.forEach(product => {
                const option = document.createElement('option');
                option.value = `${product.productCode} - ${product.productName}`;
                option.dataset.id = product.id;
                loanProductDatalist.appendChild(option);
            });
        }
    }

    function getSelectedLoanProductId() {
        if (!elements.loanProduct) return null;
        const value = elements.loanProduct.value.trim();
        const options = loanProductDatalist.options;
        
        for (let i = 0; i < options.length; i++) {
            if (options[i].value === value) {
                return options[i].dataset.id;
            }
        }
        return null;
    }

    const GET_LOAN_PRODUCT_QUERY = `
        query GetLoanProduct($id: String!) {
            loanProduct(id: $id) {
                id
                productCode
                productName
                termType
                defaultInterestRate
            }
        }
    `;

    async function populateLoanProductDetails(productId) {
        if (!productId) return;
        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: GET_LOAN_PRODUCT_QUERY,
                    variables: { id: productId }
                })
            });
            const data = await response.json();
            const product = data.data?.loanProduct;
            if (product) {
                const termMatch = product.termType ? product.termType.match(/(\d+)/) : null;
                if (termMatch && elements.termMonths) {
                    elements.termMonths.value = termMatch[1];
                }
                if (product.defaultInterestRate !== null && elements.interestRate) {
                    elements.interestRate.value = parseFloat(product.defaultInterestRate).toFixed(2);
                }
            }
        } catch (error) {
            console.error('Error fetching loan product details:', error);
        }
    }

    if (elements.loanProduct) {
        const handleLoanProductSelection = async () => {
            const productId = getSelectedLoanProductId();
            if (productId) {
                await populateLoanProductDetails(productId);
            }
        };
        elements.loanProduct.addEventListener('change', handleLoanProductSelection);
        elements.loanProduct.addEventListener('blur', handleLoanProductSelection);
    }

    populateBorrowerDatalist();
    populateLoanProductDatalist();

    let originalLoanId = null; // To store loan_id for redirection
    let internalLoanObjectId = null; // To store the actual loan ID for mutation

    // GraphQL Query to fetch a single loan transaction
    const getLoanTransactionQuery = `
        query GetLoanTransaction($transactionId: ID!) {
            loanTransaction(transactionId: $transactionId) {
                success
                message
                transaction {
                    id
                    loanId
                    transactionType
                    amount
                    transactionDate
                    notes
                    commercialBank
                    servicingBranch
                    region
                    borrowerName
                    loanProduct {
                        productName
                    }
                    loanProductId
                    referenceNumber
                    debitAccount
                    creditAccount
                    disbursementMethod
                    disbursementStatus
                    chequeNumber
                    beneficiaryBank
                    beneficiaryAccount
                    approvedBy
                    processedBy
                }
            }
        }
    `;

    const getLoanDetailsQuery = `
        query GetLoan($loanId: ID!) {
            loan(loanId: $loanId) {
                success
                message
                loan {
                    id
                    termMonths
                    interestRate
                    borrowerName
                    loanProduct {
                        productName
                    }
                    loanProductId
                }
            }
        }
    `;

    const getLoanByStringQuery = `
        query GetLoanByString($loanId: String!) {
            loanByIdString(loanId: $loanId) {
                success
                message
                loan {
                    id
                    termMonths
                    interestRate
                    borrowerName
                    loanProduct {
                        productName
                    }
                    loanProductId
                }
            }
        }
    `;

    // ... (rest of the mutations)
    const updateLoanTransactionMutation = `
        mutation UpdateLoanTransaction($transactionId: ID!, $input: LoanTransactionUpdateInput!) {
            updateLoanTransaction(transactionId: $transactionId, input: $input) {
                success
                message
                transaction {
                    id
                    loanId
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

    const fetchLoanTransactionData = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.error('Authentication token not found.');
            window.location.href = 'login.html';
            return;
        }

        console.log('Fetching transaction data for ID:', transactionId);
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

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('accessToken');
                    alert('Session expired or unauthorized. Please log in again.');
                    window.location.href = 'login.html';
                    return;
                }
                const errorText = await response.text();
                throw new Error(`HTTP error ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('Full GraphQL result:', result);

            if (result.errors) {
                console.error('GraphQL Errors:', result.errors);
                formMessage.textContent = `Error fetching transaction data: ${result.errors[0].message}`;
                formMessage.className = 'mt-4 text-sm font-bold text-red-500';
                return;
            }

            const transaction = result.data?.loanTransaction?.transaction;
            console.log('Extracted transaction data:', transaction);

            if (transaction) {
                populateForm(transaction);
                originalLoanId = transaction.loanId;
                
                // Fetch associated loan details
                fetchLoanDetails(transaction.loanId);
            } else {
                console.warn('No transaction data found in response.');
                formMessage.textContent = 'Loan transaction not found.';
                formMessage.className = 'mt-4 text-sm font-bold text-red-500';
            }

        } catch (error) {
            console.error('Error in fetchLoanTransactionData:', error);
            formMessage.textContent = 'Error connecting to the server.';
            formMessage.className = 'mt-4 text-sm font-bold text-red-500';
        }
    };

    const fetchLoanDetails = async (loanId) => {
        const token = localStorage.getItem('accessToken');
        console.log(`--- Fetching Loan Details for loanId: "${loanId}" ---`);
        try {
            // 1. Try by internal ID first
            let response = await fetch(API_URL, {
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
            let result = await response.json();
            let loan = result.data?.loan?.loan;

            // 2. Fallback to by-string if not found
            if (!loan) {
                console.log(`   Loan not found by internal ID, trying as custom loanId string...`);
                response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        query: getLoanByStringQuery,
                        variables: { loanId: loanId }
                    })
                });
                result = await response.json();
                loan = result.data?.loanByIdString?.loan;
            }

            if (loan) {
                console.log(`✅ Loan found! Internal ObjectID: ${loan.id}`);
                internalLoanObjectId = loan.id;
                
                // Populate term and rate if not already set or if empty
                if (elements.termMonths && (!elements.termMonths.value || elements.termMonths.value === '')) {
                    elements.termMonths.value = loan.termMonths !== null && loan.termMonths !== undefined ? loan.termMonths : '';
                    console.log(`   Set termMonths to: ${elements.termMonths.value}`);
                }
                if (elements.interestRate && (!elements.interestRate.value || elements.interestRate.value === '')) {
                    elements.interestRate.value = loan.interestRate !== null && loan.interestRate !== undefined ? loan.interestRate : '';
                    console.log(`   Set interestRate to: ${elements.interestRate.value}`);
                }

                // Fallback for borrower name and loan product if not on transaction
                if (elements.borrowerName && (!elements.borrowerName.value || elements.borrowerName.value === 'N/A' || elements.borrowerName.value === '')) {
                    elements.borrowerName.value = loan.borrowerName || '';
                }
                if (elements.loanProduct && (!elements.loanProduct.value || elements.loanProduct.value === '')) {
                    elements.loanProduct.value = loan.loanProduct?.productName || '';
                }
            } else {
                console.warn(`❌ No loan record found for "${loanId}". Loan update sync will be skipped.`);
            }
        } catch (error) {
            console.error('Error fetching loan details:', error);
        }
    };

    const populateForm = (transaction) => {
        console.log('Populating form with transaction:', transaction);

        const setVal = (key, value) => {
            if (elements[key]) {
                // Better handling for null, undefined, or 'N/A'
                if (value === null || value === undefined || value === 'N/A') {
                    elements[key].value = '';
                } else {
                    elements[key].value = value;
                }
                console.log(`Set ${key} (${fields[key]}) to: "${elements[key].value}"`);
            }
        };

        setVal('transactionIdHidden', transaction.id);
        setVal('commercialBank', transaction.commercialBank);
        setVal('servicingBranch', transaction.servicingBranch);
        setVal('region', transaction.region);
        setVal('loanId', transaction.loanId);
        setVal('borrowerName', transaction.borrowerName);
        setVal('loanProduct', transaction.loanProduct?.productName);
        setVal('transactionType', transaction.transactionType);
        setVal('referenceNumber', transaction.referenceNumber);
        
        // Amount formatting
        if (elements.amount) {
            elements.amount.value = transaction.amount !== null && transaction.amount !== undefined ? parseFloat(transaction.amount) : '';
        }
        
        setVal('debitAccount', transaction.debitAccount);
        setVal('creditAccount', transaction.creditAccount);
        setVal('disbursementMethod', transaction.disbursementMethod);
        setVal('disbursementStatus', transaction.disbursementStatus || 'pending');
        setVal('chequeNumber', transaction.chequeNumber);
        setVal('beneficiaryBank', transaction.beneficiaryBank);
        setVal('beneficiaryAccount', transaction.beneficiaryAccount);
        setVal('approvedBy', transaction.approvedBy);
        setVal('processedBy', transaction.processedBy);
        setVal('notes', transaction.notes);

        // Date handling
        if (elements.transactionDate) {
            if (transaction.transactionDate) {
                const date = new Date(transaction.transactionDate);
                const formattedDate = date.toISOString().slice(0, 16);
                elements.transactionDate.value = formattedDate;
                console.log(`Set transactionDate to: ${formattedDate}`);
            } else {
                elements.transactionDate.value = '';
            }
        }

        // Section visibility
        if (transaction.transactionType === 'disbursement') {
            disbursementSection.style.display = 'block';
        } else {
            disbursementSection.style.display = 'none';
        }
    };

    updateLoanTransactionForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const token = localStorage.getItem('accessToken');
        if (!token) {
            formMessage.textContent = 'Authentication token not found. Please log in again.';
            formMessage.className = 'mt-4 text-sm font-bold text-red-500';
            window.location.href = 'login.html';
            return;
        }

        formMessage.textContent = 'Updating loan transaction...';
        formMessage.className = 'mt-4 text-sm font-bold text-blue-500';

        const loanTransactionUpdateData = {
            transactionType: elements.transactionType.value,
            amount: parseFloat(elements.amount.value),
            transactionDate: elements.transactionDate.value ? new Date(elements.transactionDate.value).toISOString() : null,
            notes: elements.notes.value.trim() || null,
            commercialBank: elements.commercialBank.value.trim() || null,
            servicingBranch: elements.servicingBranch.value.trim() || null,
            region: elements.region.value.trim() || null,
            borrowerName: elements.borrowerName.value.trim() || null,
            loanProductId: getSelectedLoanProductId(),
            referenceNumber: elements.referenceNumber.value.trim() || null,
            debitAccount: elements.debitAccount.value.trim() || null,
            creditAccount: elements.creditAccount.value.trim() || null,
            disbursementMethod: elements.disbursementMethod.value.trim() || null,
            disbursementStatus: elements.disbursementStatus.value || 'pending',
            chequeNumber: elements.chequeNumber.value.trim() || null,
            beneficiaryBank: elements.beneficiaryBank.value.trim() || null,
            beneficiaryAccount: elements.beneficiaryAccount.value.trim() || null,
            approvedBy: elements.approvedBy.value.trim() || null,
            processedBy: elements.processedBy.value.trim() || null
        };

        console.log('Sending update data:', loanTransactionUpdateData);

        try {
            // 1. Update Transaction
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
                        input: loanTransactionUpdateData
                    }
                })
            });

            const result = await response.json();
            console.log('Update Result (Transaction):', result);

            if (result.errors) {
                throw new Error(result.errors[0].message);
            }

            // 2. Update Loan (Terms, Interest, and Product)
            let loanSyncMessage = "";
            if (internalLoanObjectId) {
                const termVal = parseInt(elements.termMonths.value);
                const rateVal = elements.interestRate.value ? elements.interestRate.value.toString() : null;
                const amountVal = elements.amount.value ? elements.amount.value.toString() : null;
                
                const loanUpdateData = {
                    loanProductId: getSelectedLoanProductId()
                };

                // Add status update logic: if disbursement is completed, make loan active
                if (elements.transactionType.value === 'disbursement' && elements.disbursementStatus.value === 'completed') {
                    loanUpdateData.status = 'active';
                    console.log('--- Disbursement completed, setting loan status to ACTIVE ---');
                }
                
                // Only include numerical fields if they are valid numbers
                if (!isNaN(termVal)) loanUpdateData.termMonths = termVal;
                if (rateVal && !isNaN(parseFloat(rateVal))) loanUpdateData.interestRate = rateVal;
                if (amountVal && !isNaN(parseFloat(amountVal))) loanUpdateData.amountRequested = amountVal;
                
                console.log('Synchronizing Loan update with data:', loanUpdateData);
                console.log('Internal Loan ObjectID:', internalLoanObjectId);
                
                try {
                    const loanResponse = await fetch(API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            query: updateLoanMutation,
                            variables: {
                                loanId: internalLoanObjectId,
                                input: loanUpdateData
                            }
                        })
                    });
                    
                    const loanResult = await loanResponse.json();
                    console.log('Update Result (Loan):', loanResult);
                    
                    if (loanResult.errors) {
                        console.error('Loan Update Errors:', loanResult.errors);
                        loanSyncMessage = " (Note: Associated loan record could not be updated: " + loanResult.errors[0].message + ")";
                    } else if (loanResult.data?.updateLoan?.success) {
                        loanSyncMessage = " and associated loan record updated!";
                    } else {
                        const errorMsg = loanResult.data?.updateLoan?.message || 'Unknown reason';
                        console.warn('Loan update was not successful:', errorMsg);
                        loanSyncMessage = " (Note: Loan record sync returned false: " + errorMsg + ")";
                    }
                } catch (e) {
                    console.error('Failed to sync loan update:', e);
                    loanSyncMessage = " (Note: Failed to connect for loan update)";
                }
            } else {
                console.warn('Skipping loan record sync: internalLoanObjectId is null.');
            }

            const updateResult = result.data?.updateLoanTransaction;
            if (updateResult?.success) {
                formMessage.textContent = 'Loan transaction' + (loanSyncMessage || ' updated successfully!');
                formMessage.className = 'mt-4 text-sm font-bold text-green-500';
                setTimeout(() => {
                    let redirectUrl = 'loan_transaction.html';
                    if (originalLoanId) redirectUrl += `?loan_id=${originalLoanId}`;
                    window.location.href = redirectUrl;
                }, 2000);
            } else {
                formMessage.textContent = updateResult?.message || 'Failed to update loan transaction.';
                formMessage.className = 'mt-4 text-sm font-bold text-red-500';
            }
        } catch (error) {
            console.error('Error in update:', error);
            formMessage.textContent = `Error: ${error.message}`;
            formMessage.className = 'mt-4 text-sm font-bold text-red-500';
        }
    });

    transactionTypeSelect.addEventListener('change', () => {
        if (transactionTypeSelect.value === 'disbursement') {
            disbursementSection.style.display = 'block';
        } else {
            disbursementSection.style.display = 'none';
        }
    });

    fetchLoanTransactionData();

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('accessToken');
        window.location.href = 'login.html';
    });

    // Sidebar dropdowns
    ['customer', 'savings', 'loan'].forEach(type => {
        const btn = document.getElementById(`${type}-dropdown-btn`);
        const menu = document.getElementById(`${type}-dropdown-menu`);
        if (btn && menu) {
            btn.addEventListener('click', () => menu.classList.toggle('hidden'));
        }
    });
});
