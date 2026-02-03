document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/graphql'; // Use relative path for API
    const customerTableBody = document.getElementById('customer-table-body');

    const getCustomersQuery = `
        query GetCustomers {
            customers {
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

    const fetchCustomers = async () => {
        // Fetch the token from localStorage
        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.error('Authentication token not found.');
            // Redirect to login or show an error message
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
                    query: getCustomersQuery
                })
            });

            const result = await response.json();

            if (result.errors) {
                // Check for authorization error
                if (result.errors.some(error => error.message.includes("Not authorized"))) {
                    console.error('Authorization error: You do not have permission to view this data.');
                    alert('You are not authorized to view this page.');
                    window.location.href = 'dashboard.html'; // Or some other appropriate page
                } else {
                    console.error('GraphQL Errors:', result.errors);
                    alert('An error occurred while fetching customer data.');
                }
                return;
            }

            const customers = result.data.customers.customers;
            populateTable(customers);

        } catch (error) {
            console.error('Error fetching customers:', error);
            customerTableBody.innerHTML = '<tr><td colspan="6" class="p-3 text-center text-red-500">Error loading data. Is the server running?</td></tr>';
        }
    };

    const populateTable = (customers) => {
        if (!customers || customers.length === 0) {
            customerTableBody.innerHTML = '<tr><td colspan="6" class="p-3 text-center">No customers found.</td></tr>';
            return;
        }

        customerTableBody.innerHTML = ''; // Clear existing rows

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
                    <button class="text-blue-500 hover:text-blue-700 mr-2"><i class="fas fa-edit"></i></button>
                    <button class="text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>
                </td>
            `;
            customerTableBody.appendChild(row);
        });
    };

    fetchCustomers();
});
