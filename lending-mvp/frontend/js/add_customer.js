
        const customerDropdownBtn = document.getElementById('customer-dropdown-btn');
        const customerDropdownMenu = document.getElementById('customer-dropdown-menu');

        if (customerDropdownBtn && customerDropdownMenu) {
            // Keep dropdown open if this page is active
            customerDropdownMenu.classList.remove('hidden');

            customerDropdownBtn.addEventListener('click', () => {
                customerDropdownMenu.classList.toggle('hidden');
            });
        }

        document.getElementById('add-customer-form').addEventListener('submit', async (event) => {
            event.preventDefault();

            const lastName = document.getElementById('last-name').value;
            const firstName = document.getElementById('first-name').value;
            const middleName = document.getElementById('middle-name').value;
            const tinNo = document.getElementById('tin-no').value;
            const sssNo = document.getElementById('sss-no').value;
            const permanentAddress = document.getElementById('permanent-address').value;
            const birthDate = document.getElementById('birth-date').value;
            const birthPlace = document.getElementById('birth-place').value;
            const mobileNumber = document.getElementById('mobile-number').value;
            const emailAddress = document.getElementById('email-address').value;
            const employerNameAddress = document.getElementById('employer-name-address').value;
            const jobTitle = document.getElementById('job-title').value;
            const salaryRange = document.getElementById('salary-range').value;

            const formMessage = document.getElementById('form-message');

            const customerData = {
                lastName,
                firstName,
                middleName,
                tinNo,
                sssNo,
                permanentAddress,
                birthDate,
                birthPlace,
                mobileNumber,
                emailAddress,
                employerNameAddress,
                jobTitle,
                salaryRange
            };

            // Placeholder for API call
            console.log('Submitting customer data:', customerData);
            formMessage.textContent = 'Adding customer...';
            formMessage.className = 'mt-4 text-sm font-bold text-blue-500';

            try {
                // Simulate API call
                const response = await new Promise(resolve => setTimeout(() => {
                    // Simulate success or failure
                    const success = Math.random() > 0.2; // 80% success rate
                    if (success) {
                        resolve({ ok: true, json: () => Promise.resolve({ message: 'Customer added successfully!', customerId: 'cust-' + Date.now() }) });
                    } else {
                        resolve({ ok: false, status: 500, json: () => Promise.resolve({ detail: 'Failed to add customer. Please try again.' }) });
                    }
                }, 1500)); // Simulate network delay

                if (response.ok) {
                    const result = await response.json();
                    formMessage.textContent = result.message;
                    formMessage.className = 'mt-4 text-sm font-bold text-green-500';
                    document.getElementById('add-customer-form').reset(); // Clear form
                } else {
                    const errorData = await response.json();
                    formMessage.textContent = errorData.detail || 'Error adding customer.';
                    formMessage.className = 'mt-4 text-sm font-bold text-red-500';
                }
            } catch (error) {
                console.error('Error:', error);
                formMessage.textContent = 'An unexpected error occurred.';
                formMessage.className = 'mt-4 text-sm font-bold text-red-500';
            }
        });
    
