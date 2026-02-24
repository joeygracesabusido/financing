document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/graphql'; // Use relative path for API
    const updateLoanProductForm = document.getElementById('update-loan-form');
    const formMessage = document.getElementById('form-message');

    // Get loan product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        formMessage.textContent = 'Error: Loan Product ID not found in URL.';
        formMessage.className = 'mt-4 text-sm font-bold text-red-500';
        return;
    }

    // Input fields
    const productCodeInput    = document.getElementById('product-code');
    const productNameInput    = document.getElementById('product-name');
    const termTypeInput       = document.getElementById('term-type');
    const glCodeInput         = document.getElementById('gl-code');
    const typeInput           = document.getElementById('type');
    const defaultInterestRateInput = document.getElementById('default-interest-rate');
    const templateInput       = document.getElementById('template');
    const securityInput       = document.getElementById('security');
    const brLcInput           = document.getElementById('br-lc');
    const modeOfPaymentInput  = document.getElementById('mode-of-payment');

    // GraphQL Query - Fetch single loan product
    const getLoanProductQuery = `
        query GetLoanProduct($id: String!) {
            loanProduct(id: $id) {
                id
                productCode
                productName
                termType
                glCode
                type
                defaultInterestRate
                template
                security
                brLc
                modeOfPayment
                createdAt
            }
        }
    `;

    // GraphQL Mutation - Update loan product
    const updateLoanProductMutation = `
        mutation UpdateLoanProduct($id: String!, $input: LoanProductUpdateInput!) {
            updateLoanProduct(id: $id, input: $input) {
                id
                productCode
                productName
                termType
                glCode
                type
                defaultInterestRate
                template
                security
                brLc
                modeOfPayment
                createdAt
            }
        }
    `;

    const fetchLoanProductData = async () => {
        const token = localStorage.getItem('accessToken');
        console.log('Token from localStorage:', token ? token.substring(0, 20) + '...' : 'NOT FOUND');
        if (!token) {
            console.error('Authentication token not found. Redirecting to login...');
            console.log('localStorage contents:', Object.keys(localStorage));
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
                    query: getLoanProductQuery,
                    variables: { id: productId }
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
            console.log('Fetch response:', result); // ← helpful for debugging

            if (result.errors) {
                console.error('GraphQL Errors:', result.errors);
                const messages = result.errors.map(e => e.message).join('; ');
                formMessage.textContent = `Error fetching loan product: ${messages}`;
                formMessage.className = 'mt-4 text-sm font-bold text-red-500';
                return;
            }

            const loanProduct = result.data?.loanProduct;
            if (loanProduct) {
                populateForm(loanProduct);
            } else {
                formMessage.textContent = 'Loan Product not found.';
                formMessage.className = 'mt-4 text-sm font-bold text-red-500';
            }
        } catch (error) {
            console.error('Error fetching loan product:', error);
            formMessage.textContent = 'Error connecting to the server.';
            formMessage.className = 'mt-4 text-sm font-bold text-red-500';
        }
    };

    const populateForm = (loanProduct) => {
        productCodeInput.value    = loanProduct.productCode || '';
        productNameInput.value    = loanProduct.productName || '';
        termTypeInput.value       = loanProduct.termType    || '';
        glCodeInput.value         = loanProduct.glCode      || '';
        typeInput.value           = loanProduct.type        || '';
        defaultInterestRateInput.value = loanProduct.defaultInterestRate != null 
            ? loanProduct.defaultInterestRate 
            : '';
        templateInput.value       = loanProduct.template    || '';
        securityInput.value       = loanProduct.security    || '';
        brLcInput.value           = loanProduct.brLc        || '';
        modeOfPaymentInput.value  = loanProduct.modeOfPayment || '';
    };

    updateLoanProductForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const token = localStorage.getItem('accessToken');
        if (!token) {
            formMessage.textContent = 'Authentication token not found. Please log in again.';
            formMessage.className = 'mt-4 text-sm font-bold text-red-500';
            window.location.href = 'login.html'; // Uncommented (was already active)
            return;
        }

        // Basic client-side validation (you can expand this)
        const interestRateVal = defaultInterestRateInput.value.trim();
        if (interestRateVal !== '' && isNaN(parseFloat(interestRateVal))) {
            formMessage.textContent = 'Default interest rate must be a valid number.';
            formMessage.className = 'mt-4 text-sm font-bold text-red-500';
            return;
        }

        formMessage.textContent = 'Updating loan product...';
        formMessage.className = 'mt-4 text-sm font-bold text-blue-500';

        const loanProductUpdateData = {
            productCode: productCodeInput.value.trim() || null,
            productName: productNameInput.value.trim() || null,
            termType:    termTypeInput.value.trim()    || null,
            glCode:      glCodeInput.value.trim()      || null,
            type:        typeInput.value.trim()        || null,
            defaultInterestRate: interestRateVal 
                ? parseFloat(interestRateVal) 
                : null,
            template:    templateInput.value.trim()    || null,
            security:    securityInput.value.trim()    || null,
            brLc:        brLcInput.value.trim()        || null,
            modeOfPayment: modeOfPaymentInput.value || null
        };

        console.log('Sending update with:', { id: productId, input: loanProductUpdateData }); // ← debug

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: updateLoanProductMutation,
                    variables: {
                        id: productId,
                        input: loanProductUpdateData
                    }
                })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('accessToken');
                    alert('Session expired or unauthorized. Please log in again.');
                    window.location.href = 'login.html'; // This line is active
                    return;
                }
                const errorText = await response.text();
                throw new Error(`HTTP error ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('Update response:', result); // ← very helpful

            if (result.errors) {
                console.error('GraphQL Errors:', result.errors);
                const messages = result.errors.map(e => e.message).join('; ');
                formMessage.textContent = `Error: ${messages}`;
                formMessage.className = 'mt-4 text-sm font-bold text-red-500';
                return;
            }

            const updatedLoanProduct = result.data?.updateLoanProduct;
            if (updatedLoanProduct) {
                formMessage.textContent = 'Loan Product updated successfully!';
                formMessage.className = 'mt-4 text-sm font-bold text-green-500';
                setTimeout(() => {
                    window.location.href = 'loan_product.html';
                }, 1500);
            } else {
                formMessage.textContent = 'Failed to update loan product (no data returned).';
                formMessage.className = 'mt-4 text-sm font-bold text-red-500';
            }
        } catch (error) {
            console.error('Error updating loan product:', error);
            formMessage.textContent = error.message || 'An unexpected error occurred.';
            formMessage.className = 'mt-4 text-sm font-bold text-red-500';
        }
    });

    // Load data when page opens
    fetchLoanProductData();

    // Logout button (placeholder - replace with real logic if needed)
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
    toggleDropdown('savings-dropdown-btn',   'savings-dropdown-menu');
    toggleDropdown('loan-dropdown-btn',      'loan-dropdown-menu');
});