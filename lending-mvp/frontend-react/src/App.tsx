import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/layout/Sidebar'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import CustomersPage from '@/pages/CustomersPage'
import CustomerDetailPage from '@/pages/CustomerDetailPage'
import SavingsPage from '@/pages/SavingsPage'
import LoansPage from '@/pages/LoansPage'
import LoanDetailPage from '@/pages/LoanDetailPage'
import LoanProductsPage from '@/pages/LoanProductsPage'
import TransactionsPage from '@/pages/TransactionsPage'
import BranchesPage from '@/pages/BranchesPage'
import AuditLogPage from '@/pages/AuditLogPage'
import UsersPage from '@/pages/UsersPage'
import CollectionsPage from '@/pages/CollectionsPage'
import ChartOfAccountsPage from '@/pages/ChartOfAccountsPage'
import SavingsDetailPage from '@/pages/SavingsDetailPage'

function ProtectedLayout() {
    const { isAuthenticated } = useAuth()
    if (!isAuthenticated) return <Navigate to="/login" replace />
    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main
                className="flex-1 overflow-auto"
                style={{ marginLeft: 'var(--sidebar-width)' }}
            >
                <div className="p-6 max-w-screen-2xl mx-auto">
                    <Routes>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/customers" element={<CustomersPage />} />
                        <Route path="/customers/:id" element={<CustomerDetailPage />} />
                        <Route path="/savings" element={<SavingsPage />} />
                        <Route path="/loans" element={<LoansPage />} />
                        <Route path="/loans/:id" element={<LoanDetailPage />} />
                        <Route path="/loan-products" element={<LoanProductsPage />} />
                        <Route path="/transactions" element={<TransactionsPage />} />
                        <Route path="/branches" element={<BranchesPage />} />
                        <Route path="/audit-logs" element={<AuditLogPage />} />
                        <Route path="/users" element={<UsersPage />} />
                        <Route path="/collections" element={<CollectionsPage />} />
                        <Route path="/chart-of-accounts" element={<ChartOfAccountsPage />} />
                        <Route path="/savings/:id" element={<SavingsDetailPage />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </div>
            </main>
        </div>
    )
}


function AppRoutes() {
    const { isAuthenticated } = useAuth()
    return (
        <Routes>
            <Route
                path="/login"
                element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
            />
            <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
    )
}

export default function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    )
}
