import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { CREATE_CUSTOMER } from '@/api/queries'
import { Building2, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'

export default function NewCustomerPage() {
    const navigate = useNavigate()
    const [createCustomer, { loading, error }] = useMutation(CREATE_CUSTOMER)
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState({
        customer_type: 'individual',
        first_name: '',
        middle_name: '',
        last_name: '',
        display_name: '',
        tin_no: '',
        sss_no: '',
        permanent_address: '',
        birth_date: '',
        birth_place: '',
        mobile_number: '',
        email_address: '',
        employer_name_address: '',
        job_title: '',
        salary_range: '',
        company_name: '',
        company_address: '',
        branch: 'HQ',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => {
            const updated = { ...prev, [name]: value }
            
            // Auto-generate display name for individual/joint customers
            if (name === 'first_name' || name === 'middle_name' || name === 'last_name') {
                if (prev.customer_type !== 'corporate') {
                    const parts = [
                        updated.first_name?.trim() || '',
                        updated.middle_name?.trim() || '',
                        updated.last_name?.trim() || ''
                    ].filter(Boolean)
                    updated.display_name = parts.join(' ')
                }
            }
            
            // Auto-generate from company name for corporate
            if (name === 'company_name' && prev.customer_type === 'corporate') {
                updated.display_name = updated.company_name || ''
            }
            
            return updated
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            // Convert snake_case to camelCase for GraphQL API
            const input = {
                customerType: formData.customer_type,
                firstName: formData.first_name,
                middleName: formData.middle_name,
                lastName: formData.last_name,
                displayName: formData.display_name,
                tinNo: formData.tin_no,
                sssNo: formData.sss_no,
                permanentAddress: formData.permanent_address,
                birthDate: formData.birth_date || null,
                birthPlace: formData.birth_place,
                mobileNumber: formData.mobile_number,
                emailAddress: formData.email_address,
                employerNameAddress: formData.employer_name_address,
                jobTitle: formData.job_title,
                salaryRange: formData.salary_range,
                companyName: formData.company_name,
                companyAddress: formData.company_address,
                branch: formData.branch,
            }
            
            await createCustomer({
                variables: { input }
            })
            setSuccess(true)
            setTimeout(() => navigate('/customers'), 2000)
        } catch (err) {
            console.error(err)
        }
    }

    if (success) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-foreground">Customer Created!</h2>
                    <p className="text-muted-foreground mt-2">Redirecting to customers list...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/customers')}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <Building2 className="w-6 h-6 text-primary" /> New Customer
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Add a new customer to the system
                        </p>
                    </div>
                </div>
            </div>

            <div className="glass rounded-xl p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Customer Type *
                            </label>
                            <select
                                name="customer_type"
                                value={formData.customer_type}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="individual">Individual</option>
                                <option value="joint">Joint</option>
                                <option value="corporate">Corporate</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Branch *
                            </label>
                            <select
                                name="branch"
                                value={formData.branch}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="HQ">Head Office</option>
                                <option value="BR-QC">Quezon City Branch</option>
                                <option value="BR-CDO">Cagayan de Oro Branch</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Display Name {formData.customer_type !== 'corporate' ? '(Auto-generated)' : '*'}
                            </label>
                            <input
                                type="text"
                                name="display_name"
                                value={formData.display_name}
                                onChange={handleChange}
                                required
                                readOnly={formData.customer_type !== 'corporate'}
                                disabled={formData.customer_type !== 'corporate'}
                                className={`w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${formData.customer_type !== 'corporate' ? 'opacity-70 cursor-not-allowed' : ''}`}
                                placeholder={formData.customer_type === 'corporate' ? 'Company name' : 'Auto-generated from name fields'}
                            />
                        </div>

                        {formData.customer_type !== 'corporate' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">
                                        Middle Name
                                    </label>
                                    <input
                                        type="text"
                                        name="middle_name"
                                        value={formData.middle_name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                            </>
                        )}

                        {formData.customer_type === 'corporate' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">
                                        Company Name
                                    </label>
                                    <input
                                        type="text"
                                        name="company_name"
                                        value={formData.company_name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">
                                        Company Address
                                    </label>
                                    <input
                                        type="text"
                                        name="company_address"
                                        value={formData.company_address}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Email Address *
                            </label>
                            <input
                                type="email"
                                name="email_address"
                                value={formData.email_address}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="email@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Mobile Number
                            </label>
                            <input
                                type="text"
                                name="mobile_number"
                                value={formData.mobile_number}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="+63 900 000 0000"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                TIN Number
                            </label>
                            <input
                                type="text"
                                name="tin_no"
                                value={formData.tin_no}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="123-456-789-000"
                            />
                        </div>

                        {formData.customer_type !== 'corporate' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">
                                        SSS Number
                                    </label>
                                    <input
                                        type="text"
                                        name="sss_no"
                                        value={formData.sss_no}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">
                                        Birth Date
                                    </label>
                                    <input
                                        type="date"
                                        name="birth_date"
                                        value={formData.birth_date}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">
                                        Birth Place
                                    </label>
                                    <input
                                        type="text"
                                        name="birth_place"
                                        value={formData.birth_place}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">
                                        Permanent Address
                                    </label>
                                    <input
                                        type="text"
                                        name="permanent_address"
                                        value={formData.permanent_address}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">
                                        Employer Name & Address
                                    </label>
                                    <input
                                        type="text"
                                        name="employer_name_address"
                                        value={formData.employer_name_address}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">
                                        Job Title
                                    </label>
                                    <input
                                        type="text"
                                        name="job_title"
                                        value={formData.job_title}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">
                                        Salary Range
                                    </label>
                                    <input
                                        type="text"
                                        name="salary_range"
                                        value={formData.salary_range}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="50,000-100,000"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {error && (
                        <div className="px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                            {error.message}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/customers')}
                            className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 gradient-primary text-white text-sm font-semibold rounded-lg shadow-lg shadow-primary/25 hover:opacity-90 transition-all duration-200 disabled:opacity-60"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading ? 'Creating...' : 'Create Customer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
