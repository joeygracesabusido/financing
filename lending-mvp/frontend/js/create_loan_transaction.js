// CACHE BUSTER VERSION 1.0.7 - Fixed GraphQL type mismatch (ID! to String!)
document.addEventListener('DOMContentLoaded', () => {
    // Authentication check
    const token = localStorage.getItem('accessToken');
    if (!token) {
        console.error('❌ Authentication token not found. Redirecting to login...');
        window.location.href = 'login.html';
        return;
    }
    console.log('✅ Authentication token found');

    const API_URL = '/graphql';
    const createLoanTransactionForm = document.getElementById('create-loan-transaction-form');
    const formMessage = document.getElementById('form-message');
    const transactionTypeSelect = document.getElementById('transaction-type');
    const disbursementSection = document.getElementById('disbursement-section');

    // Input fields
    const loanIdInput = document.getElementById('loan-id');
    const amountInput = document.getElementById('amount');
    const transactionDateInput = document.getElementById('transaction-date');
    const notesTextarea = document.getElementById('notes');
    const termMonthsInput = document.getElementById('term-months');
    const interestRateInput = document.getElementById('interest-rate');
    const borrowerSearchInput = document.getElementById('borrower-name');
    const borrowerDatalist = document.getElementById('borrower-list');
    const loanProductSearchInput = document.getElementById('loan-product');
    const loanProductDatalist = document.getElementById('loan-product-list');

    // Global state
    let currentBorrowerId = null;

    // Queries & Mutations
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

    const ALL_LOAN_PRODUCTS_QUERY = `
        query {
            loanProducts {
                id
                productCode
                productName
                termType
                defaultInterestRate
            }
        }
    `;

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

    const GET_LOAN_QUERY = `
        query GetLoan($id: ID!) {
            loan(loanId: $id) {
                success
                loan {
                    id
                    termMonths
                    interestRate
                    loanProduct
                    customer {
                        id
                        displayName
                    }
                }
            }
        }
    `;

    const createLoanMutation = `
        mutation CreateLoan($input: LoanCreateInput!) {
            createLoan(input: $input) {
                success
                message
                loan {
                    id
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

    const createLoanTransactionMutation = `
        mutation CreateLoanTransaction($input: LoanTransactionCreateInput!) {
            createLoanTransaction(input: $input) {
                success
                message
                transaction {
                    id
                }
            }
        }
    `;

    // Initialize Autocomplete
    async function populateDatalists() {
        try {
            const [custRes, prodRes] = await Promise.all([
                fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ query: ALL_CUSTOMERS_QUERY }) }),
                fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ query: ALL_LOAN_PRODUCTS_QUERY }) })
            ]);

            const custData = await custRes.json();
            const prodData = await prodRes.json();

            if (borrowerDatalist && custData.data?.customers?.customers) {
                borrowerDatalist.innerHTML = '';
                custData.data.customers.customers.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.displayName;
                    opt.dataset.id = c.id;
                    borrowerDatalist.appendChild(opt);
                    console.log(`  ✅ Added customer: ${c.displayName} (ID: ${c.id})`);
                });
                console.log(`✅ Loaded ${custData.data.customers.customers.length} customers`);
            }

            if (loanProductDatalist && prodData.data?.loanProducts) {
                loanProductDatalist.innerHTML = '';
                prodData.data.loanProducts.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = `${p.productCode} - ${p.productName}`;
                    opt.dataset.id = p.id;
                    opt.dataset.termType = p.termType;
                    opt.dataset.interestRate = p.defaultInterestRate;
                    loanProductDatalist.appendChild(opt);
                    console.log(`  ✅ Added product: ${p.productName} (ID: ${p.id})`);
                });
                console.log(`✅ Loaded ${prodData.data.loanProducts.length} loan products`);
            }
        } catch (e) { console.error('Error populating lists:', e); }
    }

    function getSelectedBorrowerId() {
        const name = borrowerSearchInput.value;
        const options = borrowerDatalist.options;
        for (let i = 0; i < options.length; i++) {
            if (options[i].value === name) return options[i].dataset.id;
        }
        return currentBorrowerId;
    }

    function getSelectedLoanProductId() {
        const value = loanProductSearchInput.value.trim();
        const options = loanProductDatalist.options;
        console.log(`🔍 Searching for loan product: "${value}"`);
        console.log(`📊 Total options available: ${options.length}`);
        
        if (options.length === 0) {
            console.log('❌ Datalist is empty - products not loaded');
            return null;
        }
        
        // Log all available options
        const optionsList = Array.from(options).map((o, i) => {
            return `[${i}] value="${o.value}" id="${o.dataset.id}"`;
        });
        console.log(`Available options:\n${optionsList.join('\n')}`);
        
        // Try exact match first
        for (let i = 0; i < options.length; i++) {
            if (options[i].value === value) {
                console.log(`✅ Found exact match for product: "${options[i].value}"`);
                console.log(`✅ Product ID: ${options[i].dataset.id}`);
                return options[i].dataset.id;
            }
        }
        
        // Try partial match if no exact match (user may have typed but not fully selected)
        const lowerValue = value.toLowerCase();
        for (let i = 0; i < options.length; i++) {
            if (options[i].value.toLowerCase().includes(lowerValue) && lowerValue.length > 0) {
                console.log(`✅ Found partial match: "${options[i].value}"`);
                console.log(`✅ Product ID: ${options[i].dataset.id}`);
                return options[i].dataset.id;
            }
        }
        
        console.log(`❌ No product found matching: "${value}"`);
        console.log(`⚠️ Please select from the dropdown list`);
        return null;
    }

    // Auto-populate loan product details when selected
    async function populateLoanProductDetails(productId) {
        if (!productId) {
            console.log('⚠️ No loan product ID selected');
            return;
        }

        console.log('📋 Fetching loan product details for ID:', productId);
        
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

            if (!response.ok) {
                console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
                return;
            }

            const data = await response.json();
            console.log('📦 Loan Product Response:', data);

            // Check for GraphQL errors
            if (data.errors) {
                console.error('❌ GraphQL Errors:', data.errors);
                return;
            }

            const product = data.data?.loanProduct;
            if (product) {
                // Auto-populate fields
                console.log('✅ Auto-populating loan product fields');
                console.log(`   Product: ${product.productName} (${product.productCode})`);
                
                // Extract term from termType (e.g., "12 months" → "12")
                const termMatch = product.termType ? product.termType.match(/(\d+)/) : null;
                if (termMatch) {
                    termMonthsInput.value = termMatch[1];
                    console.log(`  ✅ Term Months: ${termMatch[1]}`);
                } else {
                    console.warn(`⚠️ Could not extract term from: "${product.termType}"`);
                }

                // Auto-populate interest rate
                if (product.defaultInterestRate !== null && product.defaultInterestRate !== undefined) {
                    const rateValue = parseFloat(product.defaultInterestRate).toFixed(2);
                    interestRateInput.value = rateValue;
                    console.log(`  ✅ Interest Rate: ${rateValue}%`);
                } else {
                    console.warn('⚠️ No interest rate available for this product');
                }

                console.log('✅ Loan product details populated successfully');
            } else {
                console.warn('⚠️ Loan product not found in response');
                console.log('Response data structure:', Object.keys(data?.data || {}));
            }
        } catch (error) {
            console.error('❌ Error fetching loan product details:', error);
            console.error('Error type:', error.name);
            console.error('Error message:', error.message);
        }
    }

    // Event Listeners
    loanProductSearchInput.addEventListener('input', () => {
        console.log('🔄 Loan product input changed');
    });

    // Handle selection from autocomplete - trigger on both change and blur
    const handleLoanProductSelection = async () => {
        console.log('📝 Loan product field changed:', loanProductSearchInput.value);
        const productId = getSelectedLoanProductId();
        if (productId) {
            console.log(`✅ Loan product ID retrieved: ${productId}`);
            await populateLoanProductDetails(productId);
        } else {
            console.warn('⚠️ Product not found - please select from dropdown list');
            termMonthsInput.value = '';
            interestRateInput.value = '';
        }
    };

    loanProductSearchInput.addEventListener('change', handleLoanProductSelection);
    loanProductSearchInput.addEventListener('blur', handleLoanProductSelection);

    // Handle borrower selection to auto-populate from existing loan
    borrowerSearchInput.addEventListener('change', () => {
        const name = borrowerSearchInput.value;
        const options = borrowerDatalist.options;
        for (let i = 0; i < options.length; i++) {
            if (options[i].value === name) {
                currentBorrowerId = options[i].dataset.id;
                console.log('✅ Borrower selected:', name, 'ID:', currentBorrowerId);
                break;
            }
        }
    });

    transactionTypeSelect.addEventListener('change', () => {
        console.log('🔄 Transaction type changed to:', transactionTypeSelect.value);
        disbursementSection.style.display = transactionTypeSelect.value === 'disbursement' ? 'block' : 'none';
    });

    const urlParams = new URLSearchParams(window.location.search);
    const initialLoanId = urlParams.get('loan_id');
    if (initialLoanId) {
        loanIdInput.value = initialLoanId;
        (async (id) => {
            const res = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ query: GET_LOAN_QUERY, variables: { id } }) });
            const data = await res.json();
            const loan = data.data?.loan?.loan;
            if (loan) {
                if (loan.customer) {
                    borrowerSearchInput.value = loan.customer.displayName;
                    currentBorrowerId = loan.customer.id;
                }
                loanProductSearchInput.value = loan.loanProduct || '';
                termMonthsInput.value = loan.termMonths || '';
                interestRateInput.value = loan.interestRate || '';
            }
        })(initialLoanId);
    }

    if (!transactionDateInput.value) {
        transactionDateInput.value = new Date().toISOString().slice(0, 16);
    }

    createLoanTransactionForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        formMessage.textContent = 'Processing...';
        formMessage.className = 'mt-4 text-sm font-bold text-blue-500';

        const loanId = loanIdInput.value.trim();
        const type = transactionTypeSelect.value;
        const amount = parseFloat(amountInput.value);
        const borrowerId = getSelectedBorrowerId();

        if (!loanId || !type || isNaN(amount) || amount <= 0) {
            formMessage.textContent = 'Please fill in all required fields.';
            formMessage.className = 'mt-4 text-sm font-bold text-red-500';
            return;
        }

        try {
            // 1. Sync Loan Record
            if (type === 'disbursement') {
                console.log('--- Step 1: Syncing Loan Record ---');
                if (!borrowerId) {
                    console.error('No borrowerId found for name:', borrowerSearchInput.value);
                    throw new Error('Please select a valid borrower from the list.');
                }

                console.log('Checking if loan exists for ID:', loanId);
                const checkRes = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ query: GET_LOAN_QUERY, variables: { id: loanId } }) });
                const checkData = await checkRes.json();
                const loanExists = checkData.data?.loan?.success && checkData.data.loan.loan;
                console.log('Loan exists?', !!loanExists);

                // Send Decimal fields as Strings for safety
                const loanInput = {
                    borrowerId: borrowerId,
                    loanId: loanId,
                    loanProduct: loanProductSearchInput.value.trim(),
                    amountRequested: amount.toString(),
                    termMonths: parseInt(termMonthsInput.value) || 12,
                    interestRate: (interestRateInput.value || "0")
                };

                let syncQuery, syncVars;
                if (!loanExists) {
                    console.log('Mode: CREATE Loan');
                    syncQuery = createLoanMutation;
                    syncVars = { input: loanInput };
                } else {
                    console.log('Mode: UPDATE Loan');
                    syncQuery = updateLoanMutation;
                    syncVars = { 
                        loanId: loanId, 
                        input: { 
                            loanProduct: loanInput.loanProduct, 
                            amountRequested: loanInput.amountRequested, 
                            termMonths: loanInput.termMonths, 
                            interestRate: loanInput.interestRate 
                        } 
                    };
                }

                console.log('Sync Variables:', JSON.stringify(syncVars, null, 2));

                const syncRes = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ query: syncQuery, variables: syncVars }) });
                const syncResult = await syncRes.json();
                console.log('Sync Result:', syncResult);
                
                if (syncResult.errors) {
                    console.error('Sync GraphQL Errors:', syncResult.errors);
                    throw new Error("Loan synchronization failed: " + syncResult.errors[0].message);
                }
                if (syncResult.data?.createLoan?.success === false || syncResult.data?.updateLoan?.success === false) {
                    const msg = (syncResult.data?.createLoan || syncResult.data?.updateLoan).message;
                    throw new Error("Loan synchronization unsuccessful: " + msg);
                }
            }

            // 2. Create Transaction
            console.log('--- Step 2: Creating Transaction ---');
            const transactionInput = {
                loanId: loanId,
                transactionType: type,
                amount: amount, // Number is fine for create_loan_transaction as per schema
                transactionDate: transactionDateInput.value ? new Date(transactionDateInput.value).toISOString() : new Date().toISOString(),
                notes: notesTextarea.value.trim() || null,
                commercialBank: document.getElementById('commercial_bank')?.value.trim() || null,
                servicingBranch: document.getElementById('servicing-branch')?.value.trim() || null,
                region: document.getElementById('region')?.value.trim() || null,
                borrowerName: borrowerSearchInput.value.trim() || null,
                loanProduct: loanProductSearchInput.value.trim() || null,
                referenceNumber: document.getElementById('reference-number')?.value.trim() || null,
                debitAccount: document.getElementById('debit-account')?.value.trim() || null,
                creditAccount: document.getElementById('credit-account')?.value.trim() || null,
                disbursementMethod: document.getElementById('disbursement-method')?.value || null,
                disbursementStatus: document.getElementById('disbursement-status')?.value || 'pending',
                chequeNumber: document.getElementById('cheque-number')?.value.trim() || null,
                beneficiaryBank: document.getElementById('beneficiary-bank')?.value.trim() || null,
                beneficiaryAccount: document.getElementById('beneficiary-account')?.value.trim() || null,
                approvedBy: document.getElementById('approved-by')?.value.trim() || null,
                processedBy: document.getElementById('processed-by')?.value.trim() || null
            };

            const transRes = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ query: createLoanTransactionMutation, variables: { input: transactionInput } }) });
            const transResult = await transRes.json();

            if (transResult.errors) throw new Error(transResult.errors[0].message);

            if (transResult.data?.createLoanTransaction?.success) {
                formMessage.textContent = 'Success! Redirecting...';
                formMessage.className = 'mt-4 text-sm font-bold text-green-500';
                setTimeout(() => window.location.href = `loan_details.html?id=${loanId}`, 1500);
            } else {
                throw new Error(transResult.data?.createLoanTransaction?.message || 'Transaction creation failed.');
            }
        } catch (error) {
            console.error('Submit error:', error);
            formMessage.textContent = error.message;
            formMessage.className = 'mt-4 text-sm font-bold text-red-500';
        }
    });

    populateDatalists();
    
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('accessToken');
        window.location.href = 'login.html';
    });

    // Dropdowns
    ['customer', 'savings', 'loan'].forEach(type => {
        const btn = document.getElementById(`${type}-dropdown-btn`);
        const menu = document.getElementById(`${type}-dropdown-menu`);
        if (btn && menu) btn.addEventListener('click', () => menu.classList.toggle('hidden'));
    });
});