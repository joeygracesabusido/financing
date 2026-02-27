import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const apiUrl = (import.meta as any).env.VITE_API_URL || ''
            const response = await fetch(`${apiUrl}/api-login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            })

            if (!response.ok) {
                const err = await response.json()
                throw new Error(err.detail || 'Invalid credentials')
            }

            const data = await response.json()
            login(data.accessToken, data.user)
            navigate('/dashboard')
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl" />
            </div>

            <div className="w-full max-w-md relative">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-xl shadow-primary/25 mb-4">
                        <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
                    <p className="text-muted-foreground text-sm mt-1">Sign in to LendingMVP</p>
                </div>

                {/* Card */}
                <div className="glass rounded-2xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm
                           text-foreground placeholder:text-muted-foreground
                           focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                           transition-all duration-200"
                                placeholder="Enter your username"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-2.5 pr-11 bg-secondary/50 border border-border rounded-lg text-sm
                             text-foreground placeholder:text-muted-foreground
                             focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                             transition-all duration-200"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 px-4 gradient-primary text-white font-semibold rounded-lg
                         shadow-lg shadow-primary/25 hover:opacity-90 active:opacity-80
                         transition-all duration-200 flex items-center justify-center gap-2
                         disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-6">
                    LendingMVP Financial Platform &copy; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    )
}
