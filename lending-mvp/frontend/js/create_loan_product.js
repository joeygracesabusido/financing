document.addEventListener('DOMContentLoaded', () => {
    const createLoanProductForm = document.getElementById('createLoanProductForm');
    const responseMessage = document.getElementById('responseMessage');

    if (createLoanProductForm) {
        createLoanProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            responseMessage.textContent = '';
            responseMessage.className = 'mt-4 p-3 rounded-md text-sm hidden';

            const productCode = document.getElementById('productCode').value;
            const productName = document.getElementById('productName').value;
            const termType = document.getElementById('term_type').value; // Changed to termType
            const glCode = document.getElementById('gl_code').value;     // Changed to glCode
            const type = document.getElementById('type').value;
            const defaultInterestRate = parseFloat(document.getElementById('defaultInterestRate').value);
            const template = document.getElementById('template').value;
            const security = document.getElementById('security').value;
            const brLc = document.getElementById('brLc').value;
            const modeOfPayment = document.getElementById('mode_of_payment').value;

            const query = `
                mutation CreateLoanProduct($input: LoanProductCreateInput!) {
                    createLoanProduct(input: $input) {
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

            const variables = {
                input: {
                    productCode,
                    productName,
                    termType, // Changed to termType
                    glCode,     // Changed to glCode
                    type,
                    defaultInterestRate,
                    template,
                    security,
                    brLc,
                    modeOfPayment
                },
            };

            try {
                const response = await fetch('/graphql', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}` // Corrected to access_token
                    },
                    body: JSON.stringify({ query, variables }),
                });

                const result = await response.json();

                if (result.errors) {
                    responseMessage.classList.remove('hidden');
                    responseMessage.classList.add('bg-red-100', 'text-red-700');
                    responseMessage.textContent = `Error: ${result.errors.map(err => err.message).join(', ')}`;
                } else if (result.data.createLoanProduct) {
                    responseMessage.classList.remove('hidden');
                    responseMessage.classList.add('bg-green-100', 'text-green-700');
                    responseMessage.textContent = `Loan Product "${result.data.createLoanProduct.productName}" created successfully! ID: ${result.data.createLoanProduct.id}`;
                    createLoanProductForm.reset(); // Clear the form
                } else {
                    responseMessage.classList.remove('hidden');
                    responseMessage.classList.add('bg-red-100', 'text-red-700');
                    responseMessage.textContent = 'Unknown error occurred.';
                }
            } catch (error) {
                responseMessage.classList.remove('hidden');
                responseMessage.classList.add('bg-red-100', 'text-red-700');
                responseMessage.textContent = `Network error: ${error.message}`;
            }
        });
    }
});
