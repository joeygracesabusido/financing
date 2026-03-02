# Loan Product Edit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an "Edit" icon to loan product cards and implement the logic to update existing products using a shared modal.

**Architecture:** Update `LoanProductsPage.tsx` to track an `editingProduct` state. Reuse the existing creation modal by dynamically switching its title, button text, and submission logic based on whether a product is being edited or created.

**Tech Stack:** React (TypeScript), Apollo Client (GraphQL), Tailwind CSS, Lucide Icons.

---

### Task 1: Update Imports and State

**Files:**
- Modify: `lending-mvp/frontend-react/src/pages/LoanProductsPage.tsx`

**Step 1: Add imports for UPDATE_LOAN_PRODUCT and Edit2 icon**

```typescript
import { GET_LOAN_PRODUCTS, CREATE_LOAN_PRODUCT, UPDATE_LOAN_PRODUCT } from '@/api/queries'
import { Package, Plus, Loader2, X, Check, Activity, Calendar, Edit2 } from 'lucide-react'
```

**Step 2: Initialize editingProduct state and update mutations**

```typescript
export default function LoanProductsPage() {
    const { data, loading, error, refetch } = useQuery(GET_LOAN_PRODUCTS)
    const [createLoanProduct, { loading: creating }] = useMutation(CREATE_LOAN_PRODUCT)
    const [updateLoanProduct, { loading: updating }] = useMutation(UPDATE_LOAN_PRODUCT)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<LoanProduct | null>(null)
    // ...
```

**Step 3: Commit changes**

```bash
git add lending-mvp/frontend-react/src/pages/LoanProductsPage.tsx
git commit -m "feat: add editing state and update mutation to LoanProductsPage"
```

---

### Task 2: Implement Modal Toggle Logic

**Files:**
- Modify: `lending-mvp/frontend-react/src/pages/LoanProductsPage.tsx`

**Step 1: Create helper functions for opening and closing the modal**

```typescript
    const handleCloseModal = () => {
        setIsModalOpen(false)
        setEditingProduct(null)
        setFormData({
            productCode: '',
            name: '',
            description: '',
            amortizationType: 'flat_rate',
            repaymentFrequency: 'monthly',
            interestRate: 0.0,
            penaltyRate: 0.0,
            gracePeriodMonths: 0,
            isActive: true,
            originationFeeRate: 0.0,
            originationFeeType: 'upfront',
            prepaymentAllowed: true,
            prepaymentPenaltyRate: 0.0,
            customerLoanLimit: 0.0,
        })
    }

    const handleEditProduct = (product: LoanProduct) => {
        setEditingProduct(product)
        setFormData({
            productCode: product.productCode,
            name: product.name,
            description: product.description || '',
            amortizationType: product.amortizationType,
            repaymentFrequency: product.repaymentFrequency,
            interestRate: product.interestRate,
            penaltyRate: product.penaltyRate,
            gracePeriodMonths: product.gracePeriodMonths,
            isActive: product.isActive,
            originationFeeRate: product.originationFeeRate || 0.0,
            originationFeeType: product.originationFeeType || 'upfront',
            prepaymentAllowed: product.prepaymentAllowed,
            prepaymentPenaltyRate: product.prepaymentPenaltyRate || 0.0,
            customerLoanLimit: product.customerLoanLimit || 0.0,
        })
        setIsModalOpen(true)
    }
```

**Step 2: Update the "New Product" button and close buttons to use these helpers**

```tsx
<button
    onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
    className="..."
>
    <Plus className="w-4 h-4" /> New Product
</button>

// In modal:
<button onClick={handleCloseModal} ...>
```

**Step 3: Commit changes**

```bash
git add lending-mvp/frontend-react/src/pages/LoanProductsPage.tsx
git commit -m "feat: implement modal reset and edit pre-filling logic"
```

---

### Task 3: Add Edit Icon to Product Cards

**Files:**
- Modify: `lending-mvp/frontend-react/src/pages/LoanProductsPage.tsx`

**Step 1: Insert the Edit button in the product card header**

```tsx
products.map((p) => (
    <div key={p.id} className="glass rounded-xl p-5 hover:border-purple-500/30 transition-all duration-300 group flex flex-col justify-between relative">
        <button 
            onClick={(e) => { e.stopPropagation(); handleEditProduct(p); }}
            className="absolute top-4 right-4 p-1.5 bg-purple-500/10 text-purple-400 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-500/20"
            title="Edit Product"
        >
            <Edit2 className="w-3.5 h-3.5" />
        </button>
        <div>
            {/* Existing card content */}
```

**Step 2: Commit changes**

```bash
git add lending-mvp/frontend-react/src/pages/LoanProductsPage.tsx
git commit -m "feat: add edit icon button to loan product cards"
```

---

### Task 4: Update Submission Logic and Modal UI

**Files:**
- Modify: `lending-mvp/frontend-react/src/pages/LoanProductsPage.tsx`

**Step 1: Update handleSubmit to handle UPDATE_LOAN_PRODUCT**

```typescript
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingProduct) {
                await updateLoanProduct({ 
                    variables: { 
                        id: editingProduct.id, 
                        input: formData 
                    } 
                })
            } else {
                await createLoanProduct({ variables: { input: formData } })
            }
            handleCloseModal()
            refetch()
        } catch (err) {
            console.error(err)
            alert(`Failed to ${editingProduct ? 'update' : 'create'} product`)
        }
    }
```

**Step 2: Update Modal title and button text**

```tsx
<h2 className="text-xl font-semibold">
    {editingProduct ? 'Edit Loan Product' : 'Create Loan Product'}
</h2>

// ...

<button form="create-product-form" type="submit" disabled={creating || updating} className="...">
    {(creating || updating) && <Loader2 className="w-4 h-4 animate-spin" />} 
    {editingProduct ? 'Update Product' : 'Save Product'}
</button>
```

**Step 3: Commit changes**

```bash
git add lending-mvp/frontend-react/src/pages/LoanProductsPage.tsx
git commit -m "feat: complete unified create/update logic in LoanProductsPage"
```

---

### Task 5: Manual Verification

**Step 1: Open the application and navigate to /loan-products**

**Step 2: Click the "Edit" icon on an existing product (e.g., "Personal Loan")**

**Step 3: Change the Interest Rate and click "Update Product"**

**Step 4: Verify the change is reflected in the list**

**Step 5: Verify "New Product" still works correctly**
