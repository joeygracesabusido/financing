import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

interface AuditLog {
    id: string
    userId: string
    action: string
    resource: string
    timestamp: string
}

export default async function AuditLogPage() {
    const { user } = useAuth()

    const [loading, setLoading] = useState(true)
    const [logsData, setLogsData] = useState<AuditLog[]>([])
    const [search, setSearch] = useState('')

    const init = async () => {
        try {
            const res = await fetch('/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `query GetAuditLogs { auditLogs { id userId action resource timestamp } }`
                })
            })
            const data = await res.json()
            setLogsData(data.data?.auditLogs || [])
        } catch (e) {
            console.error('Failed to fetch audit logs:', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { init() }, [])

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
                    <p className="text-muted-foreground text-sm mt-1">System activity logs</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-16 text-muted-foreground">Loading audit logs…</div>
            ) : (
                <div className="glass rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-border/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-primary/50" />
                        </div>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resource</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logsData.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-12 text-muted-foreground">No audit logs found.</td></tr>
                            ) : logsData.map((log) => (
                                <tr key={log.id} className="border-b border-border/30 hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 text-foreground font-medium">{log.action}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{log.resource}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{log.userId}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
