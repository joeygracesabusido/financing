document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/graphql';
    const createSavingsForm = document.getElementById('create-savings-form');
    const formMessage = document.getElementById('form-message');
    const customerSearchInput = document.getElementById('customer-search');
    const customerDatalist = document.getElementById('customer-list');
    const customerIdHiddenInput = document.getElementById('customer-id-hidden');

    // GraphQL query to fetch all customers
    const ALL_CUSTOMERS_QUERY = `
        query {
            customers {
                customers {
                    id
                    firstName
                    lastName
                    displayName
                }
            }
        }
    `;

    // Function to fetch customers from the backend
    async function fetchCustomers() {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.error('Authentication token not found. Please log in.');
            return [];
        }

        console.log('Fetching customers...'); // Debug log
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: ALL_CUSTOMERS_QUERY
                })
            });

            const result = await response.json();
            console.log('GraphQL raw result:', result); // Debug log

            if (result.errors) {
                console.error('GraphQL Errors:', result.errors);
                return [];
            }

            // Access the nested 'customers' field
            const customers = result.data?.customers?.customers || [];
            console.log('Extracted customers:', customers); // Debug log
            return customers;
        } catch (error) {
            console.error('Error fetching customers:', error);
            return [];
        }
    }

    // Populate datalist with customers
    async function populateCustomerDatalist() {
        console.log('Populating customer datalist...'); // Debug log
        const customers = await fetchCustomers();
        console.log('Customers received for datalist population:', customers); // Debug log
        customerDatalist.innerHTML = ''; // Clear previous options
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.displayName; // Use displayName for consistency and readability
            option.dataset.id = customer.id;
            customerDatalist.appendChild(option);
            console.log('Added option:', option.value, 'with ID:', option.dataset.id); // Debug log
        });
        console.log('Datalist populated. Total options:', customerDatalist.options.length); // Debug log
    }

    // Handle customer search input
    customerSearchInput.addEventListener('input', () => {
        const selectedCustomerName = customerSearchInput.value;
        const options = customerDatalist.options;
        let customerFound = false;

        for (let i = 0; i < options.length; i++) {
            if (options[i].value === selectedCustomerName) {
                customerIdHiddenInput.value = options[i].dataset.id;
                customerFound = true;
                break;
            }
        }

        if (!customerFound) {
            customerIdHiddenInput.value = ''; // Clear hidden ID if no valid customer is selected
        }
    });

            createSavingsForm.addEventListener('submit', async (event) => {
                event.preventDefault();
    
                const customerId = customerIdHiddenInput.value;
                const accountType = document.getElementById('account-type').value;
                const initialDeposit = parseFloat(document.getElementById('initial-deposit').value);
                const openingDate = document.getElementById('opening-date').value;
                const branch = document.getElementById('branch').value.trim();
                const description = document.getElementById('description').value.trim();
    
                // Generate account number
                const randomFourDigits = Math.floor(1000 + Math.random() * 9000); // Generates a random number between 1000 and 9999
                const accountNumber = `1000-${branch}-${randomFourDigits}`;
                console.log('Generated Account Number:', accountNumber); // Debug log
    
                if (!customerId) {
                    formMessage.textContent = 'Please select a valid customer.';
                    formMessage.className = 'mt-4 text-sm font-bold text-red-500';
                    return;
                }
    
                if (isNaN(initialDeposit) || initialDeposit < 0) {
                    formMessage.textContent = 'Please enter a non-negative initial deposit.';
                    formMessage.className = 'mt-4 text-sm font-bold text-red-500';
                    return;
                }
    
                if (!accountType) {
                    formMessage.textContent = 'Please select an account type.';
                    formMessage.className = 'mt-4 text-sm font-bold text-red-500';
                    return;
                }
    
                if (!openingDate) {
                    formMessage.textContent = 'Please select an opening date.';
                    formMessage.className = 'mt-4 text-sm font-bold text-red-500';
                    return;
                }
    
                formMessage.textContent = 'Creating account...';
                formMessage.className = 'mt-4 text-sm font-bold text-blue-500';
    
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    formMessage.textContent = 'Authentication token not found. Please log in.';
                    formMessage.className = 'mt-4 text-sm font-bold text-red-500';
                    window.location.href = 'login.html';
                    return;
                }
    
                const createSavingsMutation = `
                    mutation CreateSavingsAccount($input: SavingsAccountCreateInput!) {
                        createSavingsAccount(input: $input) {
                            success
                            message
                            account {
                                id
                                accountNumber
                            }
                        }
                    }
                `;
    
                try {
                    const response = await fetch(API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            query: createSavingsMutation,
                            variables: {
                                input: {
                                    customerId: customerId,
                                    accountNumber: accountNumber,
                                    type: accountType,       // 'accountType' in frontend maps to 'type' in backend
                                    balance: initialDeposit, // 'initialDeposit' in frontend maps to 'balance' in backend
                                    openedAt: openingDate    // 'openingDate' in frontend maps to 'openedAt' in backend
                                }
                            }
                        })
                    });
            const result = await response.json();

            if (result.errors) {
                console.error('GraphQL Errors:', result.errors);
                formMessage.textContent = result.errors[0]?.message || 'An error occurred during account creation.';
                formMessage.className = 'mt-4 text-sm font-bold text-red-500';
                return;
            }

            const createResult = result.data?.createSavingsAccount;

            if (createResult?.success) {
                formMessage.textContent = createResult.message || 'Savings account created successfully!';
                formMessage.className = 'mt-4 text-sm font-bold text-green-500';
                createSavingsForm.reset();
                customerIdHiddenInput.value = ''; // Clear hidden ID after successful submission
                // Optionally redirect to savings list or details page
                setTimeout(() => {
                    window.location.href = 'savings.html';
                }, 1500);
            } else {
                formMessage.textContent = createResult?.message || 'Failed to create savings account.';
                formMessage.className = 'mt-4 text-sm font-bold text-red-500';
            }

        } catch (error) {
            console.error('Submission error:', error);
            formMessage.textContent = error.message || 'An unexpected error occurred.';
            formMessage.className = 'mt-4 text-sm font-bold text-red-500';
        }
    });

    // Initial population of the customer datalist
    populateCustomerDatalist();
});