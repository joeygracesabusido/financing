import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { NavLink, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard,
    Users,
    PiggyBank,
    CreditCard,
    ArrowLeftRight,
    Package,
    LogOut,
    ChevronRight,
    Building2,
} from 'lucide-react'

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/customers', icon: Users, label: 'Customers' },
    { to: '/savings', icon: PiggyBank, label: 'Savings Accounts' },
    { to: '/loans', icon: CreditCard, label: 'Loans' },
    { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
    { to: '/loan-products', icon: Package, label: 'Loan Products' },
]

export default function Sidebar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <aside
            className="fixed left-0 top-0 h-full flex flex-col glass border-r border-border/50 z-50"
            style={{ width: 'var(--sidebar-width)' }}
        >
            {/* Brand */}
            <div className="px-5 py-5 border-b border-border/50">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-lg">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="font-bold text-sm text-foreground leading-none">LendingMVP</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Financial Platform</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Main Menu
                </p>
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            cn('sidebar-item group', isActive && 'active')
                        }
                    >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1">{label}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
                    </NavLink>
                ))}
            </nav>

            {/* User Profile */}
            <div className="px-3 py-4 border-t border-border/50">
                <div className="glass rounded-lg p-3 mb-2">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                            {user?.fullName?.[0]?.toUpperCase() ?? user?.username?.[0]?.toUpperCase() ?? 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">
                                {user?.fullName || user?.username}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="sidebar-item w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    )
}
