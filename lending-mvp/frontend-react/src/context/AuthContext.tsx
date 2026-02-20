import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface AuthUser {
    id: string
    username: string
    email: string
    fullName: string
    isActive: boolean
    role: string
}

interface AuthContextType {
    user: AuthUser | null
    token: string | null
    login: (token: string, user: AuthUser) => void
    logout: () => void
    isAuthenticated: boolean
    isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(() => {
        try {
            const stored = localStorage.getItem('user')
            return stored ? JSON.parse(stored) : null
        } catch {
            return null
        }
    })
    const [token, setToken] = useState<string | null>(
        () => localStorage.getItem('access_token')
    )

    useEffect(() => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user))
        } else {
            localStorage.removeItem('user')
        }
    }, [user])

    const login = (newToken: string, newUser: AuthUser) => {
        localStorage.setItem('access_token', newToken)
        localStorage.setItem('user', JSON.stringify(newUser))
        setToken(newToken)
        setUser(newUser)
    }

    const logout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        setToken(null)
        setUser(null)
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                logout,
                isAuthenticated: !!token && !!user,
                isAdmin: user?.role === 'admin',
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
