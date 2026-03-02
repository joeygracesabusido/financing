# Design Document: Loan Product Edit Functionality

## Overview
Implement the ability to edit existing loan products in the React frontend of the Gemini Lending Application. This will involve updating the `LoanProductsPage.tsx` to support both creation and editing within a single, integrated modal.

## User Interface (UI)
- **Edit Button**: Add an `Edit2` icon button from `lucide-react` to the top-right corner of each loan product card in the list.
- **Dynamic Modal**:
  - **Title**: Change between "Create Loan Product" and "Edit Loan Product" based on the current mode.
  - **Button Text**: Change between "Save Product" and "Update Product".
  - **Pre-filling**: When the Edit button is clicked, the modal will open with all fields pre-populated with the selected product's data.

## Technical Architecture

### Component State (`LoanProductsPage.tsx`)
- `editingProduct`: A state variable to store the ID or the full object of the product being edited. If `null`, the modal is in "Create" mode.
- `formData`: Controlled form state initialized with default values for creation or the existing product's values for editing.

### API Integration
- **Mutations**:
  - `CREATE_LOAN_PRODUCT`: Used when `editingProduct` is `null`.
  - `UPDATE_LOAN_PRODUCT`: Used when `editingProduct` is set. Requires passing the `id` and the `input` (formData).
- **Refetching**: The `useQuery`'s `refetch` function will be called after a successful update to refresh the product list.

### Logic Flow
1. User clicks **"Edit"** on a product card.
2. `editingProduct` state is set to the selected product.
3. `formData` is updated with the selected product's values.
4. `isModalOpen` is set to `true`.
5. User modifies fields and clicks **"Update Product"**.
6. `handleSubmit` detects `editingProduct` is set and calls `updateLoanProduct`.
7. On success, `isModalOpen` is closed, and `refetch()` is called.

## Error Handling
- Display an alert or toast message if the update mutation fails.
- Ensure the "Update" button shows a loading spinner (`Loader2`) during the mutation.

## Testing Strategy
- **Manual Verification**:
  1. Open the `/loan-products` page.
  2. Click the new Edit icon on an existing product.
  3. Verify the modal title and form data are correct.
  4. Change a field (e.g., Interest Rate) and save.
  5. Confirm the list reflects the updated value.
  6. Repeat the "New Product" flow to ensure no regressions in creation.
