import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { useAuth } from '@/context/AuthContext'
import {
    ArrowLeft, User, Users, Activity,
    CheckCircle, XCircle, Clock, Upload, Trash2, Plus,
    ShieldCheck, AlertCircle, Star, Pencil
} from 'lucide-react'
import {
    GET_CUSTOMER, GET_KYC_DOCUMENTS, GET_BENEFICIARIES,
    GET_CUSTOMER_ACTIVITIES, UPLOAD_KYC_DOCUMENT, UPDATE_KYC_STATUS,
    ADD_BENEFICIARY, DELETE_BENEFICIARY,
} from '@/api/queries'

type Tab = 'overview' | 'kyc' | 'beneficiaries' | 'activity'

const DOC_TYPES = [
    { value: 'government_id', label: 'Government ID' },
    { value: 'proof_of_address', label: 'Proof of Address' },
    { value: 'income_proof', label: 'Income Proof / Payslip' },
]

const RELATIONSHIPS = ['Spouse', 'Parent', 'Child', 'Sibling', 'Guardian', 'Other']

const KYC_STATUS_COLORS: Record<string, string> = {
    pending: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    submitted: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
    verified: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    rejected: 'text-destructive bg-destructive/10 border-destructive/20',
}

const DOC_STATUS_COLORS: Record<string, string> = {
    pending: 'text-amber-400',
    verified: 'text-emerald-400',
    rejected: 'text-destructive',
}

function formatDate(d: string | null | undefined) {
    if (!d) return '—'
    try { return new Date(d).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) }
    catch { return d }
}

function formatBytes(n: number | null | undefined) {
    if (!n) return ''
    return n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`
}

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

export default function CustomerDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [tab, setTab] = useState<Tab>('overview')

    const canReviewKyc = user?.role === 'admin' || user?.role === 'loan_officer'

    // ── Queries ──────────────────────────────────────────────────────
    const { data: custData, loading: custLoading, error: custError } = useQuery(GET_CUSTOMER, {
        variables: { customerId: id },
        skip: !id,
    })
    const { data: kycData, refetch: refetchKyc } = useQuery(GET_KYC_DOCUMENTS, {
        variables: { customerId: id },
        skip: !id || tab !== 'kyc',
        fetchPolicy: 'cache-and-network',
    })
    const { data: beneData, refetch: refetchBene } = useQuery(GET_BENEFICIARIES, {
        variables: { customerId: id },
        skip: !id || tab !== 'beneficiaries',
        fetchPolicy: 'cache-and-network',
    })
    const { data: actData } = useQuery(GET_CUSTOMER_ACTIVITIES, {
        variables: { customerId: id },
        skip: !id || tab !== 'activity',
        fetchPolicy: 'cache-and-network',
    })

    // ── Mutations ─────────────────────────────────────────────────────
    const [uploadKyc, { loading: uploading }] = useMutation(UPLOAD_KYC_DOCUMENT)
    const [updateKycStatus] = useMutation(UPDATE_KYC_STATUS)
    const [addBeneficiary, { loading: addingBene }] = useMutation(ADD_BENEFICIARY)
    const [deleteBeneficiary] = useMutation(DELETE_BENEFICIARY)

    // ── Local state ────────────────────────────────────────────────────
    const [uploadDocType, setUploadDocType] = useState(DOC_TYPES[0].value)
    const [uploadFile, setUploadFile] = useState<File | null>(null)
    const [uploadError, setUploadError] = useState('')
    const [kycMsg, setKycMsg] = useState('')

    const [beneForm, setBeneForm] = useState({
        fullName: '', relationship: RELATIONSHIPS[0], contactNumber: '', email: '', address: '', isPrimary: false,
    })
    const [beneError, setBeneError] = useState('')
    const [showBeneForm, setShowBeneForm] = useState(false)

    const customer = custData?.customerById?.customer

    // ── KYC Upload handler ────────────────────────────────────────────
    const handleUpload = async () => {
        if (!uploadFile) { setUploadError('Please select a file'); return }
        setUploadError('')
        setKycMsg('')
        try {
            const fileBase64 = await fileToBase64(uploadFile)
            const res = await uploadKyc({
                variables: {
                    input: {
                        customerId: id,
                        docType: uploadDocType,
                        fileName: uploadFile.name,
                        fileBase64,
                        mimeType: uploadFile.type,
                    },
                },
            })
            if (res.data?.uploadKycDocument?.success) {
                setKycMsg('Document uploaded successfully')
                setUploadFile(null)
                refetchKyc()
            } else {
                setUploadError(res.data?.uploadKycDocument?.message || 'Upload failed')
            }
        } catch (e: any) {
            setUploadError(e.message)
        }
    }

    const handleKycAction = async (docId: number, status: string) => {
        const reason = status === 'rejected' ? prompt('Rejection reason (optional):') ?? '' : ''
        try {
            await updateKycStatus({ variables: { documentId: docId, status, rejectionReason: reason || undefined } })
            setKycMsg(`Document marked as ${status}`)
            refetchKyc()
        } catch (e: any) {
            setKycMsg(`Error: ${e.message}`)
        }
    }

    const handleAddBeneficiary = async () => {
        if (!beneForm.fullName) { setBeneError('Full name is required'); return }
        setBeneError('')
        try {
            await addBeneficiary({ variables: { input: { customerId: id, ...beneForm } } })
            setBeneForm({ fullName: '', relationship: RELATIONSHIPS[0], contactNumber: '', email: '', address: '', isPrimary: false })
            setShowBeneForm(false)
            refetchBene()
        } catch (e: any) {
            setBeneError(e.message)
        }
    }

    const handleDeleteBeneficiary = async (bId: number) => {
        if (!confirm('Remove this beneficiary?')) return
        await deleteBeneficiary({ variables: { beneficiaryId: bId } })
        refetchBene()
    }

    if (custLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading customer…</div>
    if (custError || !customer) return (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
            <AlertCircle className="w-10 h-10 text-destructive" />
            <p className="text-muted-foreground">Customer not found</p>
            <button onClick={() => navigate('/customers')} className="text-primary text-sm hover:underline">← Back to Customers</button>
        </div>
    )

    const kycStatusColor = KYC_STATUS_COLORS[customer.kycStatus ?? 'pending'] ?? KYC_STATUS_COLORS.pending

    const TABS: { id: Tab; label: string; icon: any }[] = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'kyc', label: 'KYC Documents', icon: ShieldCheck },
        { id: 'beneficiaries', label: 'Beneficiaries', icon: Users },
        { id: 'activity', label: 'Activity Log', icon: Activity },
    ]

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/customers')} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-foreground">{customer.displayName}</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm text-muted-foreground">{customer.emailAddress}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${kycStatusColor}`}>
                                KYC: {customer.kycStatus ?? 'pending'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20 capitalize">
                                {customer.customerCategory ?? 'individual'}
                            </span>
                            {customer.riskScore != null && (
                                <span className={`text-xs font-medium ${customer.riskScore <= 25 ? 'text-emerald-400' : customer.riskScore <= 60 ? 'text-amber-400' : 'text-destructive'}`}>
                                    Risk: {customer.riskScore.toFixed(0)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => navigate(`/customers/${id}/edit`)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                >
                    <Pencil className="w-4 h-4" />
                    Edit
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-border/50">
                {TABS.map(({ id: tabId, label, icon: Icon }) => (
                    <button
                        key={tabId}
                        onClick={() => setTab(tabId)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === tabId ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        <Icon className="w-4 h-4" />{label}
                    </button>
                ))}
            </div>

            {/* ── Overview Tab ─────────────────────────────────────────────── */}
            {tab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="glass rounded-xl p-5">
                        <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider text-muted-foreground">Personal Info</h3>
                        {[
                            ['Full Name', customer.displayName],
                            ['First Name', customer.firstName],
                            ['Last Name', customer.lastName],
                            ['Middle Name', customer.middleName],
                            ['Date of Birth', customer.birthDate ? new Date(customer.birthDate).toLocaleDateString('en-PH') : null],
                            ['Place of Birth', customer.birthPlace],
                            ['Mobile', customer.mobileNumber],
                            ['Email', customer.emailAddress],
                            ['Address', customer.permanentAddress],
                            ['TIN No.', customer.tinNo],
                            ['SSS No.', customer.sssNo],
                        ].map(([label, value]) => (
                            <div key={label} className="flex justify-between py-2 border-b border-border/30 last:border-b-0">
                                <span className="text-xs text-muted-foreground">{label}</span>
                                <span className="text-xs text-foreground font-medium text-right max-w-[200px] truncate">{value ?? '—'}</span>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-5">
                        <div className="glass rounded-xl p-5">
                            <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider text-muted-foreground">Employment</h3>
                            {[
                                ['Job Title', customer.jobTitle],
                                ['Employer / Company', customer.companyName || customer.employerNameAddress],
                                ['Company Address', customer.companyAddress],
                                ['Salary Range', customer.salaryRange],
                            ].map(([label, value]) => (
                                <div key={label} className="flex justify-between py-2 border-b border-border/30 last:border-b-0">
                                    <span className="text-xs text-muted-foreground">{label}</span>
                                    <span className="text-xs text-foreground font-medium">{value ?? '—'}</span>
                                </div>
                            ))}
                        </div>

                        <div className="glass rounded-xl p-5">
                            <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider text-muted-foreground">Account Info</h3>
                            {[
                                ['Type', customer.customerType],
                                ['Category', customer.customerCategory],
                                ['Branch', customer.branch],
                                ['KYC Status', customer.kycStatus],
                                ['Risk Score', customer.riskScore != null ? `${customer.riskScore.toFixed(1)} / 100` : null],
                                ['Joined', formatDate(customer.createdAt)],
                                ['Last Updated', formatDate(customer.updatedAt)],
                            ].map(([label, value]) => (
                                <div key={label} className="flex justify-between py-2 border-b border-border/30 last:border-b-0">
                                    <span className="text-xs text-muted-foreground">{label}</span>
                                    <span className="text-xs text-foreground font-medium capitalize">{value ?? '—'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── KYC Documents Tab ─────────────────────────────────────────── */}
            {tab === 'kyc' && (
                <div className="space-y-5">
                    {/* Upload Form */}
                    <div className="glass rounded-xl p-5">
                        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Upload className="w-4 h-4 text-primary" /> Upload KYC Document
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <select
                                value={uploadDocType}
                                onChange={e => setUploadDocType(e.target.value)}
                                className="bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                            >
                                {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                            </select>
                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp,.pdf"
                                onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
                                className="bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground file:mr-2 file:bg-primary/10 file:text-primary file:border-0 file:rounded file:px-2 file:py-0.5 file:text-xs"
                            />
                            <button
                                onClick={handleUpload}
                                disabled={uploading || !uploadFile}
                                className="px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium disabled:opacity-60"
                            >
                                {uploading ? 'Uploading…' : 'Upload'}
                            </button>
                        </div>
                        {uploadError && <p className="text-destructive text-xs mt-2">{uploadError}</p>}
                        {kycMsg && <p className="text-emerald-400 text-xs mt-2">{kycMsg}</p>}
                    </div>

                    {/* Document List */}
                    <div className="glass rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/50">
                                    {['Type', 'File', 'Size', 'Uploaded', 'Status', 'Expires', ...(canReviewKyc ? ['Actions'] : [])].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(kycData?.kycDocuments?.documents ?? []).length === 0 ? (
                                    <tr><td colSpan={7} className="py-12 text-center text-muted-foreground text-sm">No documents uploaded yet</td></tr>
                                ) : (kycData?.kycDocuments?.documents ?? []).map((doc: any) => (
                                    <tr key={doc.id} className="border-b border-border/30 hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 text-foreground font-medium text-xs capitalize">{doc.docType.replace(/_/g, ' ')}</td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-[150px]">{doc.fileName}</td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">{formatBytes(doc.fileSizeBytes)}</td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(doc.uploadedAt)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-medium ${DOC_STATUS_COLORS[doc.status] ?? 'text-muted-foreground'}`}>
                                                {doc.status}
                                            </span>
                                            {doc.rejectionReason && <p className="text-xs text-destructive/70">{doc.rejectionReason}</p>}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">{doc.expiresAt ? formatDate(doc.expiresAt) : '—'}</td>
                                        {canReviewKyc && (
                                            <td className="px-4 py-3">
                                                {doc.status === 'pending' && (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleKycAction(doc.id, 'verified')}
                                                            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors">
                                                            <CheckCircle className="w-3 h-3" /> Approve
                                                        </button>
                                                        <button onClick={() => handleKycAction(doc.id, 'rejected')}
                                                            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-destructive/15 text-destructive hover:bg-destructive/25 transition-colors">
                                                            <XCircle className="w-3 h-3" /> Reject
                                                        </button>
                                                    </div>
                                                )}
                                                {doc.status !== 'pending' && (
                                                    <span className="text-xs text-muted-foreground">Reviewed {formatDate(doc.reviewedAt)}</span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Beneficiaries Tab ─────────────────────────────────────────── */}
            {tab === 'beneficiaries' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">Next of kin and emergency contacts</p>
                        <button onClick={() => setShowBeneForm(!showBeneForm)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90 transition-opacity">
                            <Plus className="w-4 h-4" /> Add Beneficiary
                        </button>
                    </div>

                    {showBeneForm && (
                        <div className="glass rounded-xl p-5 space-y-4">
                            <h3 className="font-semibold text-foreground text-sm">New Beneficiary</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { label: 'Full Name *', key: 'fullName', type: 'text' },
                                    { label: 'Contact Number', key: 'contactNumber', type: 'tel' },
                                    { label: 'Email', key: 'email', type: 'email' },
                                ].map(f => (
                                    <div key={f.key}>
                                        <label className="block text-xs text-muted-foreground mb-1">{f.label}</label>
                                        <input
                                            type={f.type}
                                            value={(beneForm as any)[f.key]}
                                            onChange={e => setBeneForm({ ...beneForm, [f.key]: e.target.value })}
                                            className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                                        />
                                    </div>
                                ))}
                                <div>
                                    <label className="block text-xs text-muted-foreground mb-1">Relationship</label>
                                    <select value={beneForm.relationship} onChange={e => setBeneForm({ ...beneForm, relationship: e.target.value })}
                                        className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50">
                                        {RELATIONSHIPS.map(r => <option key={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs text-muted-foreground mb-1">Address</label>
                                    <input value={beneForm.address} onChange={e => setBeneForm({ ...beneForm, address: e.target.value })}
                                        className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="primary" checked={beneForm.isPrimary}
                                        onChange={e => setBeneForm({ ...beneForm, isPrimary: e.target.checked })}
                                        className="accent-primary" />
                                    <label htmlFor="primary" className="text-xs text-muted-foreground">Primary Beneficiary</label>
                                </div>
                            </div>
                            {beneError && <p className="text-destructive text-xs">{beneError}</p>}
                            <div className="flex gap-3">
                                <button onClick={() => setShowBeneForm(false)}
                                    className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-white/5">Cancel</button>
                                <button onClick={handleAddBeneficiary} disabled={addingBene}
                                    className="px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium disabled:opacity-60">
                                    {addingBene ? 'Adding…' : 'Add Beneficiary'}
                                </button>
                            </div>
                        </div>
                    )}

                    {(beneData?.beneficiaries?.beneficiaries ?? []).length === 0 && !showBeneForm ? (
                        <div className="glass rounded-xl p-12 text-center">
                            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground text-sm">No beneficiaries added yet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(beneData?.beneficiaries?.beneficiaries ?? []).map((b: any) => (
                                <div key={b.id} className="glass rounded-xl p-4 flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-foreground text-sm">{b.fullName}</span>
                                            {b.isPrimary && (
                                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-amber-400/10 text-amber-400 border border-amber-400/20">
                                                    <Star className="w-2.5 h-2.5" /> Primary
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">{b.relationship}</p>
                                        {b.contactNumber && <p className="text-xs text-muted-foreground mt-1">{b.contactNumber}</p>}
                                        {b.email && <p className="text-xs text-muted-foreground">{b.email}</p>}
                                    </div>
                                    <button onClick={() => handleDeleteBeneficiary(b.id)}
                                        className="p-1.5 rounded-lg hover:bg-destructive/15 text-destructive/60 hover:text-destructive transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Activity Log Tab ──────────────────────────────────────────── */}
            {tab === 'activity' && (
                <div className="glass rounded-xl overflow-hidden">
                    {(actData?.customerActivities?.activities ?? []).length === 0 ? (
                        <div className="p-12 text-center">
                            <Activity className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground text-sm">No activity recorded yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/30">
                            {(actData?.customerActivities?.activities ?? []).map((act: any) => (
                                <div key={act.id} className="flex items-start gap-4 px-5 py-4 hover:bg-white/5 transition-colors">
                                    <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Clock className="w-3.5 h-3.5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-mono text-xs text-primary font-medium">{act.action}</span>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(act.createdAt)}</span>
                                        </div>
                                        {act.actorUsername && (
                                            <p className="text-xs text-muted-foreground mt-0.5">by {act.actorUsername}</p>
                                        )}
                                        {act.detail && (
                                            <p className="text-xs text-muted-foreground/70 mt-1 font-mono">
                                                {(() => { try { return JSON.stringify(JSON.parse(act.detail), null, 1) } catch { return act.detail } })()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
