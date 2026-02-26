# Collection Due Feature - Quick Start Guide

## What's New? 🎉

The **Collection Due** page now displays **actual amortization data** when you select a time period (Weekly, Daily, Monthly, or All).

---

## Quick Start (2 minutes)

### Step 1: Go to Collection Due Page
```
URL: http://localhost:8080/collection_due.html

Or click:
Sidebar → Loans → Collection Due
```

### Step 2: Select a Time Period
```
Filter options:
┌─────────────────────────┐
│ All Loans               │
│ Daily     (today only)  │
│ Weekly    (this week) ✓ │ ← Default
│ Monthly   (this month)  │
└─────────────────────────┘
```

### Step 3: View Collections Due
The table shows:
- **Loan ID** - Identification number
- **Borrower** - Customer name
- **Product** - Loan type
- **Amount** - Original loan amount
- **Term** - Duration in months
- **Interest Rate** - Annual rate %
- **Collection** (BOLD COLUMN):
  - 💰 **Total Amount** to collect
  - 💵 **Principal** breakdown
  - 🏦 **Interest** breakdown
  - 📅 **Next Due Date**
  - 📋 **Payment Schedule** (expandable)
- **Status** - Active, Paid, etc.
- **Actions** - View loan or amortization schedule

---

## Features

### 1. Total Collection Amount
Shows the **total amount that should be collected** in the selected period.

```
Example:
When Weekly is selected: ₱4,250.50
= Sum of all weekly payments due this week
```

### 2. Principal vs. Interest Breakdown
See how much goes to each:
```
Total:      ₱4,250.50
├─ Principal: ₱4,000.00  (actual loan reduction)
└─ Interest:  ₱250.50    (finance charges)
```

### 3. Next Due Date
When the borrower should make their next payment:
```
Next Due: Jan 15, 2026
```

### 4. Payment Schedule (Expandable)
Click the "Collection" column to see each payment date:
```
┌─────────────────────────────────────────────────┐
│ Mon 1/13 - ₱2,100.25                            │
│   └ Principal: ₱2,000 | Interest: ₱100.25      │
│ Wed 1/15 - ₱2,150.25                            │
│   └ Principal: ₱2,050 | Interest: ₱100.25      │
│ Fri 1/17 - ₱2,099.00                            │
│   └ Principal: ₱1,999 | Interest: ₱100.00      │
└─────────────────────────────────────────────────┘
```

---

## Filter Explanations

### Daily
- Shows **collections due TODAY only**
- Good for: Daily collection tracking
- Example: If today is Feb 26, shows only Feb 26 payments

### Weekly (Default)
- Shows **collections due THIS WEEK**
- Covers: Monday through Sunday (current week)
- Good for: Weekly collection routes, weekly planning
- Example: If Feb 26 is Wednesday, shows Mon-Sun of that week

### Monthly
- Shows **collections due THIS MONTH**
- Covers: 1st through last day of current month
- Good for: Monthly reporting, cashflow planning
- Example: Shows all payments from Feb 1-29

### All
- Shows **all active loans regardless of date**
- Filters: Only active, approved, or paid loans
- Good for: Portfolio overview, finding all borrowers

---

## How It Calculates Amounts

The feature uses a **real amortization schedule** (same as amortization.html):

1. **Loan Amount** × **Interest Rate** ÷ **Payment Frequency**
2. Each payment includes:
   - **Principal** - reduces loan balance
   - **Interest** - finance charge on remaining balance
3. Process repeats for each payment in the period
4. All amounts summed and displayed

**Result**: You see the **exact amount that should be collected** based on the actual amortization math.

---

## Common Questions

### Q: Why does this show different amounts than my estimate?
**A**: This shows **exact amortization data**, not estimates. Each payment includes calculated interest on the remaining balance.

### Q: Does this match the amortization.html page?
**A**: Yes! Both pages use the same calculation method. If different, something may be cached - clear browser cache.

### Q: What if a loan doesn't show up?
**A**: Check that:
- Loan status is "Active", "Approved", or "Paid"
- Loan has a creation date
- Loan has modeOfPayment set (Weekly, Monthly, etc.)
- The loan's payment schedule includes dates in the selected range

### Q: Can I export this data?
**A**: Not yet, but you can:
- Screenshot the page
- Copy/paste from the table
- Click "View" to see full loan details

### Q: What payment frequencies are supported?
**A**: All of them:
- Daily (every day)
- Weekly (every week)
- Bi-weekly (every 2 weeks)
- Monthly (every month) ← Most common
- Quarterly (every 3 months)
- Semi-annual (every 6 months)
- Annual (every year)

---

## Real Example

### Scenario: Collection Due This Week

**Loan Details:**
- Borrower: John Doe
- Amount: ₱100,000
- Interest Rate: 5% annual
- Term: 12 months
- Payment Frequency: Weekly (₱2,093/week)
- Loan Start: Jan 1, 2026

**What You See (Week of Feb 17-23, 2026):**
```
Loan ID:       LOAN-001-2026
Borrower:      John Doe
Product:       Home Loan
Amount:        ₱100,000
Term:          12 months
Rate:          5%

Collection This Week:  ₱2,093.45
  Principal:           ₱2,000.00
  Interest:            ₱93.45
  Next Due:            Feb 17, 2026

Payment Schedule:
├─ Mon 2/17 ₱2,093.45
│  └ Principal: ₱2,000 | Interest: ₱93.45
├─ Wed 2/19 ₱2,093.45  
│  └ Principal: ₱1,997 | Interest: ₱96.45
└─ Fri 2/21 ₱2,093.45
   └ Principal: ₱1,994 | Interest: ₱99.45

Status: Active
```

---

## Tips & Tricks

💡 **Tip 1: Quick Overview**
- Click "All" to see all active loans at a glance
- See which loans have highest collection amounts

💡 **Tip 2: Collection Planning**
- Click "Weekly" to plan your weekly collection route
- See total amount and individual payment dates
- Plan visits based on due dates

💡 **Tip 3: Monthly Reporting**
- Click "Monthly" to generate monthly collection report
- See all due amounts for accounting records
- Track total collections vs. target

💡 **Tip 4: Track Overdue**
- Red "Overdue" badge shows if payment is late
- Use "View" link to see full loan details
- Take action on overdue accounts

💡 **Tip 5: Double-Check Amounts**
- Click "Amortization" to see full payment schedule
- Verify amounts match your records
- Identify discrepancies early

---

## Troubleshooting

### No loans showing in Weekly view
**Check:**
- [ ] Are there any active loans created?
- [ ] Do the loans have status = "active", "approved", or "paid"?
- [ ] Is the loan's payment frequency set? (Weekly, Monthly, etc.)
- [ ] Is the loan's start date reasonable?

**Solution:**
1. Go to "Loans → All Loans"
2. Create a test loan or verify existing ones
3. Return to "Collection Due" and try again

### Amounts don't match amortization.html
**Check:**
- [ ] Same loan ID?
- [ ] Same date range?
- [ ] Browser cache cleared?

**Solution:**
1. Clear browser cache: `Ctrl+Shift+Delete`
2. Hard refresh: `Ctrl+Shift+R`
3. Try again

### Payment schedule not expanding
**Check:**
- [ ] Click on the "Collection" column (not other columns)
- [ ] The blue column with amounts

**Solution:**
- Click directly on the collection amount or breakdown text
- Should expand to show detailed payment list

---

## Next Steps

Want more features?
- [ ] Export collections due to CSV file
- [ ] Filter by specific borrower or product
- [ ] Set collection goals and track
- [ ] Integration with payment module
- [ ] Email collection reminders
- [ ] Collection analytics

---

## Support

**Documentation**: `/COLLECTION_DUE_FEATURE.md`
- Technical details
- Calculation methods
- Complete feature guide

**Questions?**
- Check the troubleshooting section above
- Review full documentation
- Contact development team

---

**Version**: 1.0
**Last Updated**: Feb 26, 2026
**Status**: ✅ Ready to Use
