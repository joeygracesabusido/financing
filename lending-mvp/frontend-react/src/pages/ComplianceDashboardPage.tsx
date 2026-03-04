import { useState, useEffect } from 'react'
import { AlertCircle, Shield, FileCheck } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

interface Alert {
    id: string
    severity: string
    message: string
    createdAt: string
}

interface PEPRecord {
    id: string
    name: string
    riskLevel: string
    createdAt: string
}

export default async function ComplianceDashboardPage() {
    const { user } = useAuth()

    const [loading, setLoading] = useState(true)
    const [alertsData, setAlertsData] = useState<Alert[]>([])
    const [pepRecordsData, setPepRecordsData] = useState<PEPRecord[]>([])

    const init = async () => {
        try {
            const res = await fetch('/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `query { alerts { id severity message createdAt } pepRecords { id name riskLevel createdAt } }`
                })
            })
            const data = await res.json()
            setAlertsData(data.data?.alerts || [])
            setPepRecordsData(data.data?.pepRecords || [])
        } catch (e) {
            console.error('Failed to fetch compliance data:', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { init() }, [])

    const getSeverityColor = (severity: string) => {
        const colors: { [key: string]: string } = {
            'critical': 'bg-red-500/20 text-red-400',
            'high': 'bg-orange-500/20 text-orange-400',
            'medium': 'bg-amber-500/20 text-amber-400',
            'low': 'bg-blue-500/20 text-blue-400'
        }
        return colors[severity] || 'bg-gray-500/20 text-gray-400'
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Compliance Dashboard</h1>
                <p className="text-muted-foreground text-sm mt-1">AML/KYC monitoring and alerts</p>
            </div>

            {loading ? (
                <div className="text-center py-16 text-muted-foreground">Loading compliance data…</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="glass rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="w-5 h-5 text-red-400" />
                                <h3 className="font-semibold text-foreground">Active Alerts</h3>
                            </div>
                            <p className="text-3xl font-bold text-foreground">{alertsData.length}</p>
                        </div>
                        <div className="glass rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Shield className="w-5 h-5 text-emerald-400" />
                                <h3 className="font-semibold text-foreground">PEP Records</h3>
                            </div>
                            <p className="text-3xl font-bold text-foreground">{pepRecordsData.length}</p>
                        </div>
                    </div>

                    <div className="glass rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-border/50">
                            <h3 className="font-semibold text-foreground">Recent Alerts</h3>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/50">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Severity</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Message</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {alertsData.length === 0 ? (
                                    <tr><td colSpan={3} className="text-center py-12 text-muted-foreground">No active alerts</td></tr>
                                ) : alertsData.slice(0, 10).map((alert) => (
                                    <tr key={alert.id} className="border-b border-border/30 hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(alert.severity)}`}>
                                                {alert.severity}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-foreground">{alert.message}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{new Date(alert.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="glass rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-border/50">
                            <h3 className="font-semibold text-foreground">PEP Records</h3>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/50">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Risk Level</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pepRecordsData.length === 0 ? (
                                    <tr><td colSpan={3} className="text-center py-12 text-muted-foreground">No PEP records</td></tr>
                                ) : pepRecordsData.slice(0, 10).map((record) => (
                                    <tr key={record.id} className="border-b border-border/30 hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 text-foreground">{record.name}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(record.riskLevel)}`}>
                                                {record.riskLevel}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{new Date(record.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    )
}
