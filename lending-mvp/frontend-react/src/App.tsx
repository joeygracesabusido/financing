import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/layout/Sidebar'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import CustomersPage from '@/pages/CustomersPage'
import SavingsPage from '@/pages/SavingsPage'
import LoansPage from '@/pages/LoansPage'
import LoanProductsPage from '@/pages/LoanProductsPage'
import TransactionsPage from '@/pages/TransactionsPage'

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
                        <Route path="/savings" element={<SavingsPage />} />
                        <Route path="/loans" element={<LoansPage />} />
                        <Route path="/loan-products" element={<LoanProductsPage />} />
                        <Route path="/transactions" element={<TransactionsPage />} />
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
