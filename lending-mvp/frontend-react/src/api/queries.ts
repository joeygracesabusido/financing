import { gql } from '@apollo/client'

// ── Auth ──────────────────────────────────────────────────────────────────────
export const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!, $totpCode: String) {
    login(input: { username: $username, password: $password, totpCode: $totpCode }) {
      accessToken
      refreshToken
      tokenType
      user {
        id
        username
        email
        fullName
        isActive
        role
      }
    }
  }
`

// ── Users ─────────────────────────────────────────────────────────────────────
export const GET_USERS = gql`
  query GetUsers($skip: Int, $limit: Int) {
    users(skip: $skip, limit: $limit) {
      success
      message
      users {
        id
        email
        username
        fullName
        isActive
        role
        createdAt
        updatedAt
      }
      total
    }
  }
`

export const CREATE_USER = gql`
  mutation CreateUser($input: UserCreateInput!) {
    createUser(input: $input) {
      success
      message
      user {
        id
        username
        email
        fullName
        role
        isActive
      }
    }
  }
`

export const UPDATE_USER = gql`
  mutation UpdateUser($userId: String!, $input: UserUpdateInput!) {
    updateUser(userId: $userId, input: $input) {
      success
      message
      user {
        id
        username
        email
        fullName
        role
        isActive
      }
    }
  }
`

export const DELETE_USER = gql`
  mutation DeleteUser($userId: String!) {
    deleteUser(userId: $userId) {
      success
      message
    }
  }
`

// ── Customers ────────────────────────────────────────────────────────────────
export const GET_CUSTOMERS = gql`
  query GetCustomers($skip: Int, $limit: Int, $searchTerm: String) {
    customers(skip: $skip, limit: $limit, searchTerm: $searchTerm) {
      success
      message
      customers {
        id
        displayName
        firstName
        lastName
        emailAddress
        mobileNumber
        customerType
        customerCategory
        kycStatus
        riskScore
        branch
        createdAt
      }
      total
    }
  }
`

export const GET_CUSTOMER = gql`
  query GetCustomer($customerId: ID!) {
    customerById(customerId: $customerId) {
      success
      message
      customer {
        id
        displayName
        firstName
        lastName
        middleName
        emailAddress
        mobileNumber
        permanentAddress
        birthDate
        birthPlace
        tinNo
        sssNo
        customerType
        customerCategory
        employerNameAddress
        jobTitle
        salaryRange
        companyName
        companyAddress
        branch
        kycStatus
        riskScore
        createdAt
        updatedAt
      }
    }
  }
`

export const CREATE_CUSTOMER = gql`
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
`

export const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($customerId: ID!, $input: CustomerUpdateInput!) {
    updateCustomer(customerId: $customerId, input: $input) {
      success
      message
      customer {
        id
        displayName
        emailAddress
      }
    }
  }
`

export const DELETE_CUSTOMER = gql`
  mutation DeleteCustomer($customerId: ID!) {
    deleteCustomer(customerId: $customerId) {
      success
      message
    }
  }
`

// ── KYC ──────────────────────────────────────────────────────────────────────
export const GET_KYC_DOCUMENTS = gql`
  query GetKycDocuments($customerId: String!) {
    kycDocuments(customerId: $customerId) {
      success
      message
      documents {
        id
        customerId
        docType
        fileName
        fileSizeBytes
        mimeType
        status
        reviewedBy
        reviewedAt
        rejectionReason
        expiresAt
        uploadedAt
      }
    }
  }
`

export const UPLOAD_KYC_DOCUMENT = gql`
  mutation UploadKycDocument($input: KYCUploadInput!) {
    uploadKycDocument(input: $input) {
      success
      message
      riskScore
      document {
        id
        docType
        fileName
        status
        uploadedAt
      }
    }
  }
`

export const UPDATE_KYC_STATUS = gql`
  mutation UpdateKycStatus($documentId: Int!, $status: String!, $rejectionReason: String) {
    updateKycStatus(documentId: $documentId, status: $status, rejectionReason: $rejectionReason) {
      success
      message
      riskScore
      document {
        id
        status
        reviewedAt
        rejectionReason
      }
    }
  }
`

// ── Beneficiaries ────────────────────────────────────────────────────────────
export const GET_BENEFICIARIES = gql`
  query GetBeneficiaries($customerId: String!) {
    beneficiaries(customerId: $customerId) {
      success
      message
      beneficiaries {
        id
        customerId
        fullName
        relationship
        contactNumber
        email
        address
        isPrimary
        createdAt
      }
    }
  }
`

export const ADD_BENEFICIARY = gql`
  mutation AddBeneficiary($input: BeneficiaryCreateInput!) {
    addBeneficiary(input: $input) {
      success
      message
      beneficiary {
        id
        fullName
        relationship
        isPrimary
        createdAt
      }
    }
  }
`

export const DELETE_BENEFICIARY = gql`
  mutation DeleteBeneficiary($beneficiaryId: Int!) {
    deleteBeneficiary(beneficiaryId: $beneficiaryId) {
      success
      message
    }
  }
`

// ── Customer Activity ─────────────────────────────────────────────────────────
export const GET_CUSTOMER_ACTIVITIES = gql`
  query GetCustomerActivities($customerId: String!) {
    customerActivities(customerId: $customerId) {
      success
      message
      activities {
        id
        customerId
        actorUsername
        action
        detail
        createdAt
      }
    }
  }
`

// ── Audit Logs ─────────────────────────────────────────────────────────────────
export const GET_AUDIT_LOGS = gql`
  query GetAuditLogs($skip: Int, $limit: Int, $searchTerm: String) {
    auditLogs(skip: $skip, limit: $limit, searchTerm: $searchTerm) {
      success
      message
      logs {
        id
        userId
        username
        role
        action
        entity
        entityId
        ipAddress
        status
        detail
        createdAt
      }
      total
    }
  }
`

// ── Savings ───────────────────────────────────────────────────────────────────
export const GET_SAVINGS = gql`
  query GetSavingsAccounts($searchTerm: String, $customerId: String) {
    savingsAccounts(searchTerm: $searchTerm, customerId: $customerId) {
      success
      message
      accounts {
        id
        accountNumber
        userId
        type
        balance
        currency
        openedAt
        status
        createdAt
        updatedAt
        customer {
          id
          displayName
        }
      }
      total
    }
  }
`

export const GET_SAVINGS_ACCOUNT = gql`
  query GetSavingsAccount($id: String!) {
    savingsAccount(id: $id) {
      success
      message
      account {
        id
        accountNumber
        userId
        type
        balance
        currency
        openedAt
        status
        createdAt
        updatedAt
      }
    }
  }
`

export const CREATE_SAVINGS = gql`
  mutation CreateSavingsAccount($input: SavingsAccountCreateInput!) {
    createSavingsAccount(input: $input) {
      success
      message
      account {
        id
        accountNumber
        type
        balance
      }
    }
  }
`

// ── Transactions ──────────────────────────────────────────────────────────────
export const GET_SAVINGS_TRANSACTIONS = gql`
  query GetSavingsTransactions($accountId: ID!) {
    getTransactions(accountId: $accountId) {
      success
      message
      transactions {
        id
        accountId
        transactionType
        amount
        timestamp
        notes
      }
      total
    }
  }
`

export const DEPOSIT = gql`
  mutation CreateDeposit($input: TransactionCreateInput!) {
    createDeposit(input: $input) {
      success
      message
      transaction {
        id
        transactionType
        amount
        timestamp
        notes
      }
    }
  }
`

export const WITHDRAW = gql`
  mutation CreateWithdrawal($input: TransactionCreateInput!) {
    createWithdrawal(input: $input) {
      success
      message
      transaction {
        id
        transactionType
        amount
        timestamp
        notes
      }
    }
  }
`

// ── Loans ─────────────────────────────────────────────────────────────────────
export const GET_LOANS = gql`
  query GetLoans($skip: Int, $limit: Int, $customerId: String) {
    loans(skip: $skip, limit: $limit, customerId: $customerId) {
      success
      message
      total
      loans {
        id
        customerId
        productId
        principal
        termMonths
        approvedPrincipal
        approvedRate
        status
        createdAt
        updatedAt
        disbursedAt
        borrowerName
        productName
        outstandingBalance
        nextDueDate
        monthsPaid
      }
    }
  }
`

export const GET_LOAN = gql`
  query GetLoan($id: ID!) {
    loan(id: $id) {
      success
      message
      loan {
        id
        customerId
        productId
        principal
        termMonths
        approvedPrincipal
        approvedRate
        status
        createdAt
        updatedAt
        disbursedAt
        borrowerName
        productName
      }
    }
  }
`

export const CREATE_LOAN = gql`
  mutation CreateLoan($input: LoanCreateInput!) {
    createLoan(input: $input) {
      success
      message
      loan {
        id
        status
      }
    }
  }
`

export const UPDATE_LOAN = gql`
  mutation UpdateLoan($id: ID!, $input: LoanUpdateInput!) {
    updateLoan(id: $id, input: $input) {
      success
      message
      loan {
        id
        status
        approvedPrincipal
        approvedRate
      }
    }
  }
`

export const DISBURSE_LOAN = gql`
  mutation DisburseLoan($id: ID!) {
    disburseLoan(id: $id) {
      success
      message
    }
  }
`

export const REPAY_LOAN = gql`
  mutation RepayLoan($id: ID!, $amount: Decimal!, $paymentDate: String) {
    repayLoan(id: $id, amount: $amount, paymentDate: $paymentDate) {
      success
      message
    }
  }
`

export const PREVIEW_LOAN_SCHEDULE = gql`
  query PreviewLoanSchedule($principal: Decimal!, $rateAnnual: Decimal!, $termMonths: Int!, $amortizationType: String!) {
    generateLoanSchedulePreview(principal: $principal, rateAnnual: $rateAnnual, termMonths: $termMonths, amortizationType: $amortizationType) {
      installmentNumber
      dueDate
      principalDue
      interestDue
      totalDue
      balance
    }
  }
`

export const GET_LOAN_TRANSACTIONS = gql`
  query GetLoanTransactions($loanId: String!) {
    loanTransactions(loanId: $loanId) {
      id
      transactionType
      amount
      balanceAfter
      description
      createdAt
    }
  }
`

// ── Loan Products ────────────────────────────────────────────────────────────
export const GET_LOAN_PRODUCTS = gql`
  query GetLoanProducts {
    loanProducts {
      id
      productCode
      name
      description
      amortizationType
      repaymentFrequency
      interestRate
      penaltyRate
      gracePeriodMonths
      isActive
      principalOnlyGrace
      fullGrace
      originationFeeRate
      originationFeeType
      prepaymentAllowed
      prepaymentPenaltyRate
      customerLoanLimit
      createdAt
      updatedAt
    }
  }
`

export const CREATE_LOAN_PRODUCT = gql`
  mutation CreateLoanProduct($input: LoanProductCreateInput!) {
    createLoanProduct(input: $input) {
      id
      productCode
      name
      isActive
    }
  }
`

export const UPDATE_LOAN_PRODUCT = gql`
  mutation UpdateLoanProduct($id: ID!, $input: LoanProductUpdateInput!) {
    updateLoanProduct(id: $id, input: $input) {
      id
      productCode
      name
      isActive
    }
  }
`

export const DELETE_LOAN_PRODUCT = gql`
  mutation DeleteLoanProduct($id: ID!) {
    deleteLoanProduct(id: $id)
  }
`

// ── Loan Approval Workflow ───────────────────────────────────────────────────
export const SUBMIT_LOAN = gql`
  mutation SubmitLoan($id: ID!) {
    submitLoan(id: $id) { success message }
  }
`
export const REVIEW_LOAN = gql`
  mutation ReviewLoan($id: ID!, $note: String) {
    reviewLoan(id: $id, note: $note) { success message }
  }
`
export const APPROVE_LOAN = gql`
  mutation ApproveLoan($id: ID!, $approvedPrincipal: Decimal, $approvedRate: Decimal) {
    approveLoan(id: $id, approvedPrincipal: $approvedPrincipal, approvedRate: $approvedRate) { success message }
  }
`
export const REJECT_LOAN = gql`
  mutation RejectLoan($id: ID!, $reason: String!) {
    rejectLoan(id: $id, reason: $reason) { success message }
  }
`
export const WRITE_OFF_LOAN = gql`
  mutation WriteOffLoan($id: ID!, $reason: String!) {
    writeOffLoan(id: $id, reason: $reason) { success message }
  }
`

// ── Collateral ───────────────────────────────────────────────────────────────
export const GET_LOAN_COLLATERAL = gql`
  query GetLoanCollateral($loanId: Int!) {
    loanCollateral(loanId: $loanId) {
      success message totalValue
      collaterals { id loanId type value description createdAt }
    }
  }
`
export const ADD_COLLATERAL = gql`
  mutation AddCollateral($input: CollateralCreateInput!) {
    addCollateral(input: $input) {
      success message
      collateral { id type value description }
    }
  }
`
export const REMOVE_COLLATERAL = gql`
  mutation RemoveCollateral($id: ID!) {
    removeCollateral(id: $id) { success message }
  }
`

// ── Guarantors ───────────────────────────────────────────────────────────────
export const GET_LOAN_GUARANTORS = gql`
  query GetLoanGuarantors($loanId: Int!) {
    loanGuarantors(loanId: $loanId) {
      success message
      guarantors { id loanId customerId guarantorName createdAt }
    }
  }
`
export const ADD_GUARANTOR = gql`
  mutation AddGuarantor($input: GuarantorCreateInput!) {
    addGuarantor(input: $input) {
      success message
      guarantor { id customerId guarantorName }
    }
  }
`
export const REMOVE_GUARANTOR = gql`
  mutation RemoveGuarantor($id: ID!) {
    removeGuarantor(id: $id) { success message }
  }
`

// ── Collections Dashboard ────────────────────────────────────────────────────
export const GET_COLLECTIONS_DASHBOARD = gql`
  query GetCollectionsDashboard {
    collectionsDashboard {
      success message totalOutstanding totalLoans
      buckets {
        label loanCount totalOutstanding
        loans { id customerId borrowerName principal status disbursedAt }
      }
    }
  }
`

// ── Loan Amortization (actual schedule) ──────────────────────────────────────
export const GET_LOAN_AMORTIZATION = gql`
  query GetLoanAmortization($loanId: Int!) {
    loanAmortization(loanId: $loanId) {
      success message
      rows {
        installmentNumber dueDate
        principalDue interestDue penaltyDue
        principalPaid interestPaid penaltyPaid
        status totalDue totalPaid
        paymentDate
      }
    }
  }
`

export const UPDATE_AMORTIZATION_PAYMENT_DATE = gql`
  mutation UpdateAmortizationPaymentDate($loanId: Int!, $installmentNumber: Int!, $paymentDate: String!) {
    updateAmortizationPaymentDate(loanId: $loanId, installmentNumber: $installmentNumber, paymentDate: $paymentDate) {
      success
      message
    }
  }
`

export const UPDATE_AMORTIZATION_ROW = gql`
  mutation UpdateAmortizationRow($input: AmortizationRowUpdateInput!) {
    updateAmortizationRow(input: $input) {
      success
      message
    }
  }
`

// ── Chart of Accounts ────────────────────────────────────────────────────────
export const GET_GL_ACCOUNTS = gql`
  query GetGLAccounts {
    glAccounts {
      id code name type description balance createdAt updatedAt
    }
  }
`

export const GET_GL_ACCOUNT_TRANSACTIONS = gql`
  query GetGLAccountTransactions($accountCode: String!) {
    glAccountTransactions(accountCode: $accountCode) {
      success
      message
      transactions {
        id
        accountCode
        debit
        credit
        description
        timestamp
        referenceNo
      }
    }
  }
`

export const CREATE_GL_ACCOUNT = gql`
  mutation CreateGLAccount($input: GLAccountCreateInput!) {
    createGlAccount(input: $input) {
      success message
      account { id code name type }
    }
  }
`

export const UPDATE_GL_ACCOUNT = gql`
  mutation UpdateGLAccount($id: ID!, $input: GLAccountUpdateInput!) {
    updateGlAccount(id: $id, input: $input) {
      success message
      account { id code name type }
    }
  }
`

export const CREATE_MANUAL_JOURNAL_ENTRY = gql`
  mutation CreateManualJournalEntry($input: JournalEntryCreateInput!) {
    createManualJournalEntry(input: $input) {
      success
      message
      entry {
        id
        referenceNo
        description
        timestamp
        lines {
          id
          accountCode
          accountName
          debit
          credit
          description
        }
      }
    }
  }
`

export const GET_JOURNAL_ENTRIES = gql`
  query GetJournalEntries($skip: Int, $limit: Int) {
    journalEntries(skip: $skip, limit: $limit) {
      success message total
      entries {
        id referenceNo description timestamp createdBy
        lines { id accountCode accountName debit credit description }
      }
    }
  }
`

export const GET_JOURNAL_ENTRY_BY_REFERENCE = gql`
  query GetJournalEntryByReference($referenceNo: String!) {
    journalEntryByReference(referenceNo: $referenceNo) {
      id
      referenceNo
      description
      timestamp
      createdBy
      lines {
        id
        accountCode
        accountName
        debit
        credit
        description
      }
    }
  }
`

// ── AML Compliance ─────────────────────────────────────────────────────────────
export const GET_AML_ALERTS = gql`
  query GetAmlAlerts($skip: Int, $limit: Int) {
    getAmlAlerts(skip: $skip, limit: $limit) {
      success message total alerts {
        id customer_id alert_type severity description reported_at status
      }
    }
  }
`

export const GET_PAR_METRICS = gql`
  query GetParMetrics {
    getParMetrics {
      total_outstanding
      par1 { amount loan_count percentage }
      par7 { amount loan_count percentage }
      par30 { amount loan_count percentage }
      par90 { amount loan_count percentage }
      current { amount loan_count percentage }
    }
  }
`

export const GET_NPL_METRICS = gql`
  query GetNplMetrics {
    getNplMetrics {
      total_loans npl_count npl_amount npl_ratio npl_by_category
    }
  }
`

export const GET_LLR_METRICS = gql`
  query GetLlrMetrics {
    getLlrMetrics {
      total_loans_outstanding llr_required llr_by_bucket llr_current_balance llr_needed llr_provision_required
    }
  }
`

export const GET_INCOME_STATEMENT = gql`
  query GetIncomeStatement($period_start: DateTime!, $period_end: DateTime!) {
    getIncomeStatement(period_start: $period_start, period_end: $period_end) {
      period_start period_end revenues expenses profit_before_tax net_income
    }
  }
`

export const GET_BALANCE_SHEET = gql`
  query GetBalanceSheet($as_of_date: DateTime!) {
    getBalanceSheet(as_of_date: $as_of_date) {
      as_of_date assets liabilities equity
    }
  }
`

export const GET_UNRESOLVED_ALERTS = gql`
  query GetUnresolvedAlerts($severity: String) {
    getUnresolvedAlerts(severity: $severity) {
      success message total alerts {
        id customer_id alert_type severity description reported_at status
      }
    }
  }
`

export const RESOLVE_ALERT = gql`
  mutation ResolveAlert($alert_id: Int!, $status: String!, $resolution_notes: String!) {
    resolveAlert(alert_id: $alert_id, status: $status, resolution_notes: $resolution_notes) {
      success alert_id new_status resolved_at message
    }
  }
`

export const ESCALATE_ALERT = gql`
  mutation EscalateAlert($alert_id: Int!, $escalated_to: String!, $reason: String!) {
    escalateAlert(alert_id: $alert_id, escalated_to: $escalated_to, reason: $reason) {
      success alert_id escalated_to reason message
    }
  }
`

export const RUN_COMPLIANCE_REPORTS = gql`
  mutation RunComplianceReports($report_type: String!) {
    runComplianceReports(report_type: $report_type) {
      generated_at period reports status error
    }
  }
`

// ── Dashboard Stats ────────────────────────────────────────────────────────────
export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    customers { success total }
    savingsAccounts {
      success
      message
      accounts {
        id
        balance
      }
      total
    }
    loans { 
      success 
      total 
      loans {
        id
        status
        principal
        approvedPrincipal
        outstandingBalance
      }
    }
  }
`

// ── Customer Portal - Dashboard ────────────────────────────────────────────────
export const GET_CUSTOMER_PORTAL_STATS = gql`
    query GetCustomerPortalStats {
        loans { 
            success 
            loans { 
                id 
                status 
                principal 
                product_name 
                next_due_date 
            } 
            total 
        }
        savingsAccounts {
            success
            accounts {
                id
                account_name
                account_type
                balance
                interest_rate
            }
            total
        }
    }
`

export const GET_CUSTOMER_LOANS = gql`
    query GetCustomerLoans {
        loans { 
            success 
            loans { 
                id 
                status 
                principal 
                product_name 
                next_due_date 
                created_at 
            } 
            total 
        }
    }
`

export const GET_CUSTOMER_SAVINGS = gql`
    query GetCustomerSavings {
        savingsAccounts {
            success
            accounts {
                id
                account_name
                account_type
                balance
                interest_rate
                account_number
            }
            total
        }
    }
`

// ── Customer Portal - Loan Application ─────────────────────────────────────────
export const CREATE_CUSTOMER_LOAN = gql`
    mutation CreateCustomerLoan($input: LoanCreateInput!) {
        createCustomerLoan(input: $input) {
            success
            message
            loan {
                id
                customerId
                productId
                productName
                principal
                termMonths
                status
                createdAt
            }
        }
    }
`

// ── QR Code Payment ────────────────────────────────────────────────────────────
export const GENERATE_QR_CODE = gql`
    query GenerateQRCode($accountNumber: String!, $amount: Float!, $reference: String, $bankCode: String) {
        generateQRCode(accountNumber: $accountNumber, amount: $amount, reference: $reference, bankCode: $bankCode) {
            qrCode
            paymentUrl
            accountNumber
            amount
            reference
            bankCode
        }
    }
`

export const SCAN_QR_CODE = gql`
    mutation ScanQRCode($qrData: String!) {
        scanQRCode(qrData: $qrData) {
            success
            message
            paymentDetails {
                accountNumber
                amount
                reference
                bankCode
            }
        }
    }
`

// ── Fund Transfer ──────────────────────────────────────────────────────────────
export const CREATE_FUND_TRANSFER = gql`
    mutation CreateFundTransfer($input: FundTransferInput!) {
        createFundTransfer(input: $input) {
            success
            message
            transfer {
                id
                fromAccount
                toAccount
                amount
                status
                createdAt
            }
        }
    }
`

// ── Notifications ──────────────────────────────────────────────────────────────
export const GET_NOTIFICATION_PREFERENCES = gql`
    query GetNotificationPreferences {
        notificationPreferences {
            emailEnabled
            smsEnabled
            pushEnabled
            emailNotifications
            smsNotifications
            pushNotifications
        }
    }
`

export const UPDATE_NOTIFICATION_PREFERENCES = gql`
    mutation UpdateNotificationPreferences($input: NotificationPreferencesInput!) {
        updateNotificationPreferences(input: $input) {
            success
            message
            preferences {
                emailEnabled
                smsEnabled
                pushEnabled
                emailNotifications
                smsNotifications
                pushNotifications
            }
        }
    }
`

export const GET_NOTIFICATION_HISTORY = gql`
    query GetNotificationHistory($skip: Int, $limit: Int) {
        notificationHistory(skip: $skip, limit: $limit) {
            success
            notifications {
                id
                channel
                message
                status
                sentAt
            }
            total
        }
    }
`

