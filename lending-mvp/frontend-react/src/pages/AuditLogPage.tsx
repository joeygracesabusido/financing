import { useState } from 'react'
import { useQuery, gql } from '@apollo/client'
import { ScrollText, Filter, Search, User, Clock, Activity } from 'lucide-react'

const GET_AUDIT_LOGS = gql`
  query GetAuditLogs {
    auditLogs {
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

// Fallback: query audit logs independently via REST if GraphQL not set up
// For now we'll use mock data structure and note that the GQL resolver needs backend
// The backend stores these in PG — add a GQL query resolver in Phase 1.2 enhancement

export default function AuditLogPage() {
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failure'>('all')

    // Attempt to load from GraphQL; gracefully fall back if query fails
    const { data, loading, error } = useQuery(GET_AUDIT_LOGS, {
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'ignore',
    })

    const logs: any[] = data?.auditLogs?.logs ?? []

    const filtered = logs.filter(log => {
        const matchSearch = !search ||
            log.username?.toLowerCase().includes(search.toLowerCase()) ||
            log.action?.toLowerCase().includes(search.toLowerCase()) ||
            log.entity?.toLowerCase().includes(search.toLowerCase())
        const matchStatus = filterStatus === 'all' || log.status === filterStatus
        return matchSearch && matchStatus
    })

    const statusBadge = (status: string) => {
        if (status === 'success') return <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">success</span>
        return <span className="px-2 py-0.5 rounded-full text-xs bg-destructive/15 text-destructive border border-destructive/20">failure</span>
    }

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleString('en-PH', { dateStyle: 'short', timeStyle: 'short' })
        } catch { return dateStr }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <ScrollText className="w-6 h-6 text-primary" />
                        Audit Logs
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">Track all system activity and user actions</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground glass px-3 py-2 rounded-lg border border-border/30">
                    <Activity className="w-3.5 h-3.5" />
                    <span>{data?.auditLogs?.total ?? logs.length} total entries</span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-background/50 border border-border rounded-lg px-3 py-2 flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by user, action, entity…"
                        className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    {(['all', 'success', 'failure'] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filterStatus === s ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-background/50 border border-border text-muted-foreground hover:bg-white/5'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="text-center py-16 text-muted-foreground">Loading audit logs…</div>
            ) : error || logs.length === 0 ? (
                <div className="glass rounded-xl p-12 text-center">
                    <ScrollText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                        {error ? 'Audit logs are stored in PostgreSQL and will appear here once the backend is connected.' : 'No audit entries yet. Entries are created automatically when users perform actions.'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 opacity-60">Every GraphQL mutation is logged with user, IP, timestamp, and status.</p>
                </div>
            ) : (
                <div className="glass rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Entity</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">IP</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((log: any) => (
                                <tr key={log.id} className="border-b border-border/30 hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDate(log.createdAt)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-1.5">
                                            <User className="w-3 h-3 text-muted-foreground" />
                                            <span className="text-foreground">{log.username || '—'}</span>
                                            {log.role && <span className="text-xs text-muted-foreground">({log.role})</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5 font-mono text-xs text-primary">{log.action}</td>
                                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{log.entity || '—'}</td>
                                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{log.ipAddress || '—'}</td>
                                    <td className="px-4 py-2.5">{statusBadge(log.status)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
