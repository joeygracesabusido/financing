// add_customer.js

document.addEventListener('DOMContentLoaded', () => {
    // ────────────────────────────────────────────────
    // Dropdown (Customer menu)
    // ────────────────────────────────────────────────
    const customerDropdownBtn = document.getElementById('customer-dropdown-btn');
    const customerDropdownMenu = document.getElementById('customer-dropdown-menu');

    if (customerDropdownBtn && customerDropdownMenu) {
        // Keep open on this page (Add New Customer)
        customerDropdownMenu.classList.remove('hidden');

        customerDropdownBtn.addEventListener('click', () => {
            customerDropdownMenu.classList.toggle('hidden');
        });
    }

    // ────────────────────────────────────────────────
    // Form field references
    // ────────────────────────────────────────────────
    const lastNameInput     = document.getElementById('last-name');
    const firstNameInput    = document.getElementById('first-name');
    const middleNameInput   = document.getElementById('middle-name');
    const companyNameInput  = document.getElementById('company-name');
    const displayNameSelect = document.getElementById('display-name');

    const customerTypeBusinessRadio   = document.getElementById('customer-type-business');
    const customerTypeIndividualRadio = document.getElementById('customer-type-individual');
    const individualFieldsDiv = document.getElementById('individual-fields');
    const businessFieldsDiv   = document.getElementById('business-fields');

    // ────────────────────────────────────────────────
    // Helper: Add <option> to select
    // ────────────────────────────────────────────────
    function addOption(selectElement, text, value) {
        const option = document.createElement('option');
        option.textContent = text;
        option.value = value;
        selectElement.appendChild(option);
    }

    // ────────────────────────────────────────────────
    // Update Display Name dropdown options
    // ────────────────────────────────────────────────
   function updateDisplayNameOptions() {
    displayNameSelect.innerHTML = ''; // Clear previous options

    const lastName    = (lastNameInput.value   || '').trim();
    const firstName   = (firstNameInput.value  || '').trim();
    const middleName  = (middleNameInput.value || '').trim();
    const companyName = (companyNameInput.value || '').trim();

    const isBusiness = customerTypeBusinessRadio.checked;

    if (isBusiness) {
        if (companyName) {
            addOption(displayNameSelect, companyName, companyName);
        } else {
            addOption(displayNameSelect, 'Enter Company Name', '');
        }
    } else {
        // ── Only one format: Lastname, Firstname Middlename ──
        let display = '';

        if (lastName) {
            display = lastName;
        }

        if (firstName || middleName) {
            if (lastName) {
                display += ', ';
            }
            if (firstName) {
                display += firstName;
            }
            if (middleName) {
                display += (firstName ? ' ' : '') + middleName;
            }
        }

        display = display.trim();

        if (display) {
            addOption(displayNameSelect, display, display);
        } else {
            addOption(displayNameSelect, 'Enter Name', '');
        }
    }

    // Auto-select the first (and usually only) option
    if (displayNameSelect.options.length > 0) {
        displayNameSelect.selectedIndex = 0;
    }
}

    // ────────────────────────────────────────────────
    // Toggle fields visibility + required attributes
    // ────────────────────────────────────────────────
    function toggleCustomerTypeFields() {
        const isBusiness = customerTypeBusinessRadio.checked;

        if (isBusiness) {
            businessFieldsDiv.classList.remove('hidden');
            individualFieldsDiv.classList.add('hidden');

            companyNameInput.setAttribute('required', '');
            lastNameInput.removeAttribute('required');
            firstNameInput.removeAttribute('required');
        } else {
            businessFieldsDiv.classList.add('hidden');
            individualFieldsDiv.classList.remove('hidden');

            companyNameInput.removeAttribute('required');
            lastNameInput.setAttribute('required', '');
            firstNameInput.setAttribute('required', '');
        }

        // Very important: update display name RIGHT AFTER visibility change
        updateDisplayNameOptions();
    }

    // ────────────────────────────────────────────────
    // Event Listeners
    // ────────────────────────────────────────────────
    // Radio buttons (better to listen on the group)
    document.querySelectorAll('input[name="customerType"]').forEach(radio => {
        radio.addEventListener('change', toggleCustomerTypeFields);
    });

    // Input changes → update display name
    [lastNameInput, firstNameInput, middleNameInput, companyNameInput].forEach(input => {
        input.addEventListener('input', updateDisplayNameOptions);
        // Optional: also update on blur (good for copy-paste)
        input.addEventListener('blur', updateDisplayNameOptions);
    });

    // ────────────────────────────────────────────────
    // Form submission
    // ────────────────────────────────────────────────
  document.getElementById('add-customer-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formMessage = document.getElementById('form-message');

    // Collect form data based on customer type
    const isBusiness = customerTypeBusinessRadio.checked;
    const customerType = isBusiness ? 'business' : 'individual';

    const customerData = {
        customerType: customerType,
        displayName: displayNameSelect.value.trim(),
        tinNo: document.getElementById('tin-no').value.trim() || null,
        sssNo: document.getElementById('sss-no').value.trim() || null,
        permanentAddress: document.getElementById('permanent-address').value.trim() || null,
        birthDate: document.getElementById('birth-date').value || null, // already "YYYY-MM-DD"
        birthPlace: document.getElementById('birth-place').value.trim() || null,
        mobileNumber: document.getElementById('mobile-number').value.trim() || null,
        emailAddress: document.getElementById('email-address').value.trim() || null,
        employerNameAddress: document.getElementById('employer-name-address').value.trim() || null,
        jobTitle: document.getElementById('job-title').value.trim() || null,
        salaryRange: document.getElementById('salary-range').value.trim() || null,
        branch: document.getElementById('branch').value.trim() || null,
    };

    if (isBusiness) {
        customerData.companyName = companyNameInput.value.trim() || null;
        customerData.lastName = null;
        customerData.firstName = null;
        customerData.middleName = null;
    } else { // Individual
        customerData.lastName = lastNameInput.value.trim() || null;
        customerData.firstName = firstNameInput.value.trim() || null;
        customerData.middleName = middleNameInput.value.trim() || null;
        customerData.companyName = null;
    }

    // Optional: basic client-side validation
    if (!customerData.emailAddress) {
        formMessage.textContent = 'Email address is required.';
        formMessage.className = 'mt-4 text-sm font-bold text-red-500';
        return;
    }

    formMessage.textContent = 'Adding customer...';
    formMessage.className = 'mt-4 text-sm font-bold text-blue-500';

    try {
        // ── REAL GraphQL request ──
        const graphqlQuery = `
            mutation CreateCustomer($input: CustomerCreateInput!) {
                createCustomer(input: $input) {
                    success
                    message
                    customer {
                        id
                        displayName
                        emailAddress
                    }
                }
            }
        `;

        const variables = {
            input: customerData
        };

        const response = await fetch('/graphql', {   // Use relative path for Nginx proxy
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': 'Bearer YOUR_TOKEN_HERE'   // if you use authentication
            },
            body: JSON.stringify({
                query: graphqlQuery,
                variables: variables
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.errors) {
            throw new Error(result.errors[0]?.message || 'GraphQL error');
        }

        const createResult = result.data?.createCustomer;

        if (createResult?.success) {
            formMessage.textContent = createResult.message || 'Customer added successfully!';
            formMessage.className = 'mt-4 text-sm font-bold text-green-500';
            event.target.reset();
            updateDisplayNameOptions(); // reset display name dropdown
        } else {
            formMessage.textContent = createResult?.message || 'Failed to add customer.';
            formMessage.className = 'mt-4 text-sm font-bold text-red-500';
        }

    } catch (err) {
        console.error('Submission error:', err);
        formMessage.textContent = err.message || 'An unexpected error occurred.';
        formMessage.className = 'mt-4 text-sm font-bold text-red-500';
    }
});

    // ────────────────────────────────────────────────
    // Initial setup
    // ────────────────────────────────────────────────
    toggleCustomerTypeFields();    // sets correct fields + required
    updateDisplayNameOptions();    // fills display name on load
});

