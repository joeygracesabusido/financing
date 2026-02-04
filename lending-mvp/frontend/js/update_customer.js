document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/graphql';
    const updateCustomerForm = document.getElementById('update-customer-form');
    const formMessage = document.getElementById('form-message');

    // Get customer ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const customerId = urlParams.get('id');

    if (!customerId) {
        formMessage.textContent = 'Error: Customer ID not found in URL.';
        formMessage.className = 'mt-4 text-sm font-bold text-red-500';
        return;
    }

    // Input fields
    const customerTypeRadios = document.querySelectorAll('input[name="customerType"]');
    const individualFields = document.getElementById('individual-fields');
    const businessFields = document.getElementById('business-fields');

    const lastNameInput = document.getElementById('last-name');
    const firstNameInput = document.getElementById('first-name');
    const middleNameInput = document.getElementById('middle-name');
    const companyNameInput = document.getElementById('company-name');
    const displayNameSelect = document.getElementById('display-name');

    const tinNoInput = document.getElementById('tin-no');
    const sssNoInput = document.getElementById('sss-no');
    const permanentAddressInput = document.getElementById('permanent-address');
    const birthDateInput = document.getElementById('birth-date');
    const birthPlaceInput = document.getElementById('birth-place');
    const mobileNumberInput = document.getElementById('mobile-number');
    const emailAddressInput = document.getElementById('email-address');
    const employerNameAddressInput = document.getElementById('employer-name-address');
    const jobTitleInput = document.getElementById('job-title');
    const salaryRangeInput = document.getElementById('salary-range');
    const branchInput = document.getElementById('branch');

    // GraphQL Query to fetch a single customer
    const getCustomerQuery = `
        query GetCustomer($customerId: ID!) {
            customer(customerId: $customerId) {
                success
                message
                customer {
                    id
                    lastName
                    firstName
                    middleName
                    displayName
                    customerType
                    tinNo
                    sssNo
                    permanentAddress
                    birthDate
                    birthPlace
                    mobileNumber
                    emailAddress
                    employerNameAddress
                    jobTitle
                    salaryRange
                    companyName
                    companyAddress
                    branch
                }
            }
        }
    `;

    // GraphQL Mutation to update a customer
    const updateCustomerMutation = `
        mutation UpdateCustomer($customerId: ID!, $input: CustomerUpdateInput!) {
            updateCustomer(customerId: $customerId, input: $input) {
                success
                message
                customer {
                    id
                    displayName
                }
            }
        }
    `;

    const fetchCustomerData = async () => {
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
                    query: getCustomerQuery,
                    variables: { customerId: customerId }
                })
            });

            const result = await response.json();

            if (result.errors) {
                console.error('GraphQL Errors:', result.errors);
                // Display the specific error message from the backend
                formMessage.textContent = `Error fetching customer data: ${result.errors[0].message}`;
                formMessage.className = 'mt-4 text-sm font-bold text-red-500';
                return;
            }

            const customer = result.data.customer.customer;
            if (customer) {
                populateForm(customer);
            } else {
                formMessage.textContent = 'Customer not found.';
                formMessage.className = 'mt-4 text-sm font-bold text-red-500';
            }

        } catch (error) {
            console.error('Error fetching customer:', error);
            formMessage.textContent = 'Error connecting to the server.';
            formMessage.className = 'mt-4 text-sm font-bold text-red-500';
        }
    };

    const populateForm = (customer) => {
        // Set customer type radio
        if (customer.customerType) {
            document.querySelector(`input[name="customerType"][value="${customer.customerType}"]`).checked = true;
        }
        toggleCustomerFields(); // Show/hide fields based on type

        // Populate individual fields
        lastNameInput.value = customer.lastName || '';
        firstNameInput.value = customer.firstName || '';
        middleNameInput.value = customer.middleName || '';
        
        // Populate business fields
        companyNameInput.value = customer.companyName || '';

        // Populate common fields
        tinNoInput.value = customer.tinNo || '';
        sssNoInput.value = customer.sssNo || '';
        permanentAddressInput.value = customer.permanentAddress || '';
        
        // Format birthDate for input type="date"
        if (customer.birthDate) {
            const date = new Date(customer.birthDate);
            birthDateInput.value = date.toISOString().split('T')[0];
        } else {
            birthDateInput.value = '';
        }
        
        birthPlaceInput.value = customer.birthPlace || '';
        mobileNumberInput.value = customer.mobileNumber || '';
        emailAddressInput.value = customer.emailAddress || '';
        employerNameAddressInput.value = customer.employerNameAddress || '';
        jobTitleInput.value = customer.jobTitle || '';
        salaryRangeInput.value = customer.salaryRange || '';
        branchInput.value = customer.branch || '';

        updateDisplayNameOptions(customer.displayName);
    };

    // Toggle individual/business fields based on customer type
    const toggleCustomerFields = () => {
        const selectedType = document.querySelector('input[name="customerType"]:checked').value;
        if (selectedType === 'individual') {
            individualFields.classList.remove('hidden');
            businessFields.classList.add('hidden');
            companyNameInput.removeAttribute('required');
            firstNameInput.setAttribute('required', 'required');
            lastNameInput.setAttribute('required', 'required');
        } else { // business
            individualFields.classList.add('hidden');
            businessFields.classList.remove('hidden');
            companyNameInput.setAttribute('required', 'required');
            firstNameInput.removeAttribute('required');
            lastNameInput.removeAttribute('required');
        }
        updateDisplayNameOptions();
    };

    // Update display name options
    const updateDisplayNameOptions = (currentDisplayName = '') => {
        displayNameSelect.innerHTML = ''; // Clear existing options
        const selectedType = document.querySelector('input[name="customerType"]:checked').value;

        let options = [];
        if (selectedType === 'individual') {
            const firstName = firstNameInput.value.trim();
            const middleName = middleNameInput.value.trim();
            const lastName = lastNameInput.value.trim();

            if (firstName || lastName) {
                options.push(`${lastName}, ${firstName} ${middleName}`.trim().replace(/\s\s+/g, ' '));
                options.push(`${firstName} ${middleName} ${lastName}`.trim().replace(/\s\s+/g, ' '));
            }
        } else { // business
            const companyName = companyNameInput.value.trim();
            if (companyName) {
                options.push(companyName);
            }
        }

        // Add options, ensuring no duplicates and selecting the current one
        const uniqueOptions = [...new Set(options)];
        uniqueOptions.forEach(optionText => {
            const option = document.createElement('option');
            option.value = optionText;
            option.textContent = optionText;
            if (optionText === currentDisplayName) {
                option.selected = true;
            }
            displayNameSelect.appendChild(option);
        });

        // If no options, add a default disabled one
        if (displayNameSelect.options.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Enter name/company to generate options';
            option.disabled = true;
            option.selected = true;
            displayNameSelect.appendChild(option);
        }
    };

    // Event listeners for dynamic fields
    customerTypeRadios.forEach(radio => radio.addEventListener('change', toggleCustomerFields));
    lastNameInput.addEventListener('input', updateDisplayNameOptions);
    firstNameInput.addEventListener('input', updateDisplayNameOptions);
    middleNameInput.addEventListener('input', updateDisplayNameOptions);
    companyNameInput.addEventListener('input', updateDisplayNameOptions);

    updateCustomerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const token = localStorage.getItem('accessToken');
        if (!token) {
            formMessage.textContent = 'Authentication token not found. Please log in again.';
            formMessage.className = 'mt-4 text-sm font-bold text-red-500';
            window.location.href = 'login.html';
            return;
        }

        formMessage.textContent = 'Updating customer...';
        formMessage.className = 'mt-4 text-sm font-bold text-blue-500';

        const selectedCustomerType = document.querySelector('input[name="customerType"]:checked').value;

        const input = {
            customerType: selectedCustomerType,
            displayName: displayNameSelect.value || null,
            tinNo: tinNoInput.value || null,
            sssNo: sssNoInput.value || null,
            permanentAddress: permanentAddressInput.value || null,
            birthDate: birthDateInput.value ? new Date(birthDateInput.value).toISOString() : null,
            birthPlace: birthPlaceInput.value || null,
            mobileNumber: mobileNumberInput.value || null,
            emailAddress: emailAddressInput.value || null,
            employerNameAddress: employerNameAddressInput.value || null,
            jobTitle: jobTitleInput.value || null,
            salaryRange: salaryRangeInput.value || null,
            branch: branchInput.value || null,
        };

        if (selectedCustomerType === 'individual') {
            input.lastName = lastNameInput.value || null;
            input.firstName = firstNameInput.value || null;
            input.middleName = middleNameInput.value || null;
            input.companyName = null; // Ensure companyName is null for individual
            input.companyAddress = null; // Ensure companyAddress is null for individual
        } else { // business
            input.companyName = companyNameInput.value || null;
            input.companyAddress = null; // Assuming no input for companyAddress yet
            input.lastName = null; // Ensure individual fields are null for business
            input.firstName = null;
            input.middleName = null;
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: updateCustomerMutation,
                    variables: {
                        customerId: customerId,
                        input: input
                    }
                })
            });

            const result = await response.json();

            if (result.errors) {
                console.error('GraphQL Errors:', result.errors);
                formMessage.textContent = `Error updating customer: ${result.errors[0].message}`;
                formMessage.className = 'mt-4 text-sm font-bold text-red-500';
                return;
            }

            if (result.data.updateCustomer.success) {
                formMessage.textContent = 'Customer updated successfully!';
                formMessage.className = 'mt-4 text-sm font-bold text-green-500';
                // Redirect back to customer list or show a success message
                setTimeout(() => {
                    window.location.href = 'customer.html';
                }, 2000);
            } else {
                formMessage.textContent = `Error: ${result.data.updateCustomer.message}`;
                formMessage.className = 'mt-4 text-sm font-bold text-red-500';
            }

        } catch (error) {
            console.error('Error updating customer:', error);
            formMessage.textContent = 'Error connecting to the server.';
            formMessage.className = 'mt-4 text-sm font-bold text-red-500';
        }
    });

    // Initial fetch to populate the form
    fetchCustomerData();
    // Initial toggle to set up fields correctly
    toggleCustomerFields();
});

// Basic logout functionality (copied from other pages)
document.getElementById('logout-btn').addEventListener('click', () => {
    alert('Logged out!'); // Replace with actual logout logic
    window.location.href = 'login.html'; // Redirect to login page
});

// Customer dropdown functionality (copied from other pages)
const customerDropdownBtn = document.getElementById('customer-dropdown-btn');
const customerDropdownMenu = document.getElementById('customer-dropdown-menu');

if (customerDropdownBtn && customerDropdownMenu) {
    customerDropdownBtn.addEventListener('click', () => {
        customerDropdownMenu.classList.toggle('hidden');
    });
}
