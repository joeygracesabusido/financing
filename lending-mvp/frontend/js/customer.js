document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/graphql'; // Use relative path for API
    const customerTableBody = document.getElementById('customer-table-body');
    const customerSearchInput = document.getElementById('customer-search-input');

    // GraphQL query to fetch customers
    // The search_term variable will be dynamically added when performing a search
    let getCustomersQuery = `
        query GetCustomers($searchTerm: String) {
            customers(searchTerm: $searchTerm) {
                customers {
                    id
                    displayName
                    emailAddress
                    mobileNumber
                    customerType
                    branch
                }
                total
            }
        }
    `;
//fetching customers with optional search term
    const fetchCustomers = async (searchTerm = '') => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
        console.error('Authentication token not found.');
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
                query: getCustomersQuery,
                variables: searchTerm ? { searchTerm } : {}
            })
        });
        console.log(response)
        console.log('Response status:', response.status);           // ← add this
        console.log('Response ok:', response.ok);                   // ← add this

        if (!response.ok) {
            if (response.status === 401) {
                console.warn('401 Unauthorized - clearing token');
                localStorage.removeItem('accessToken');
                alert('Session expired or unauthorized. Please log in again.');
                window.location.href = 'login.html';
                return;
            }
            const errorText = await response.text();
            throw new Error(`HTTP error ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log('Full GraphQL result:', result);                // ← very useful

        if (result.errors) {
            console.error('GraphQL Errors:', result.errors);
            const firstError = result.errors[0]?.message || 'Unknown GraphQL error';
            
            if (result.errors.some(e => e.message.includes('Not authorized') || e.extensions?.code === 'UNAUTHENTICATED')) {
                alert('You do not have permission to view customers.');
                window.location.href = 'dashboard.html';
            } else {
                alert(`Error: ${firstError}`);
            }
            return;
        }

        // Safe access
        const customerData = result.data?.customers;
        if (!customerData || !Array.isArray(customerData.customers)) {
            console.warn('No customers data returned');
            customerTableBody.innerHTML = '<tr><td colspan="6" class="p-3 text-center">No customers found or invalid response.</td></tr>';
            return;
        }

        populateTable(customerData.customers);

    } catch (error) {
        console.error('Error fetching customers:', error);
        customerTableBody.innerHTML = '<tr><td colspan="6" class="p-3 text-center text-red-500">Error loading customers. Check console.</td></tr>';
    }
};

    // GraphQL mutation to delete a customer
    const deleteCustomerMutation = `
        mutation DeleteCustomer($customerId: ID!) {
            deleteCustomer(customerId: $customerId) {
                success
                message
            }
        }
    `;

    const deleteCustomer = async (customerId) => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.error('Authentication token not found.');
            window.location.href = 'login.html';
            return false;
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: deleteCustomerMutation,
                    variables: { customerId: customerId }
                })
            });

            const result = await response.json();

            if (result.errors) {
                if (result.errors.some(error => error.message.includes("Not authorized"))) {
                    console.error('Authorization error: You do not have permission to delete this data.');
                    alert('You are not authorized to delete customers.');
                } else {
                    console.error('GraphQL Errors:', result.errors);
                    alert('An error occurred while deleting the customer.');
                }
                return false;
            }

            if (result.data.deleteCustomer.success) {
                alert(result.data.deleteCustomer.message);
                return true;
            } else {
                alert('Error: ' + result.data.deleteCustomer.message);
                return false;
            }

        } catch (error) {
            console.error('Error deleting customer:', error);
            alert('An error occurred while deleting the customer. Is the server running?');
            return false;
        }
    };

    const populateTable = (customers) => {
        if (!customers || customers.length === 0) {
            customerTableBody.innerHTML = '<tr><td colspan="6" class="p-3 text-center">No customers found.</td></tr>';
            return;
        }

        customerTableBody.innerHTML = '';

        customers.forEach(customer => {
            const row = document.createElement('tr');
            row.className = 'border-b hover:bg-gray-50';

            row.innerHTML = `
                <td class="p-3">${customer.displayName || 'N/A'}</td>
                <td class="p-3">${customer.emailAddress || 'N/A'}</td>
                <td class="p-3">${customer.mobileNumber || 'N/A'}</td>
                <td class="p-3">${customer.customerType || 'N/A'}</td>
                <td class="p-3">${customer.branch || 'N/A'}</td>
                <td class="p-3">
                    <button class="text-blue-500 hover:text-blue-700 mr-2 edit-customer-btn" data-id="${customer.id}"><i class="fas fa-edit"></i></button>
                    <button class="text-red-500 hover:text-red-700 delete-customer-btn" data-id="${customer.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            
            // Add event listener for the edit button
            // We need to query from the 'row' itself because it's not yet appended to the DOM
            const editButton = row.querySelector('.edit-customer-btn');
            if (editButton) {
                editButton.addEventListener('click', (event) => {
                    const customerId = event.currentTarget.dataset.id;
                    window.location.href = `update_customer.html?id=${customerId}`;
                });
            }

            const deleteButton = row.querySelector('.delete-customer-btn');
            if (deleteButton) {
                deleteButton.addEventListener('click', async (event) => {
                    const customerId = event.currentTarget.dataset.id;
                    if (confirm('Are you sure you want to delete this customer?')) {
                        const success = await deleteCustomer(customerId);
                        if (success) {
                            fetchCustomers(); // Re-fetch customers to update the table
                        }
                    }
                });
            }
            
            customerTableBody.appendChild(row);
        });
    };

    // Event listener for the search input
    if (customerSearchInput) {
        customerSearchInput.addEventListener('input', (event) => {
            const searchTerm = event.target.value.trim();
            fetchCustomers(searchTerm);
        });
    }

    fetchCustomers(); // Initial fetch of all customers
});
