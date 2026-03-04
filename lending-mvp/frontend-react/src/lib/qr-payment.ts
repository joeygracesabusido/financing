import qrcode from 'qrcode'

export interface QRPayload {
    merchantId: string;
    referenceId: string;
    amount?: number;
    transactionType: 'payment' | 'transfer' | 'deposit';
    merchantName: string;
    terminalId?: string;
}

/**
 * Generate a QR code for payment
 * @param paymentData - Payment details including amount, reference, and account info
 * @returns Base64 encoded QR code image
 */
export async function generatePaymentQRCode(paymentData: {
    accountNumber: string
    amount: number
    reference?: string
    bankCode?: string
}): Promise<string> {
    const { accountNumber, amount, reference, bankCode } = paymentData

    // Build payment URL format (GCash/PESONet style)
    const paymentUrl = buildPaymentUrl({
        accountNumber,
        amount,
        reference,
        bankCode
    })

    // Generate QR code
    try {
        const qrCode = await qrcode.toDataURL(paymentUrl, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        })
        return qrCode
    } catch (error) {
        console.error('Error generating QR code:', error)
        throw new Error('Failed to generate QR code')
    }
}

/**
 * Build payment URL based on bank code
 */
function buildPaymentUrl({
    accountNumber,
    amount,
    reference,
    bankCode
}: {
    accountNumber: string
    amount: number
    reference?: string
    bankCode?: string
}): string {
    // Format: BANKCODE|ACCOUNT|AMOUNT|REFERENCE
    const bank = bankCode || 'PH'
    const amountStr = amount.toFixed(2)
    const ref = reference || ''

    return `${bank}|${accountNumber}|${amountStr}|${ref}`
}

/**
 * Generate GCash-style QR code
 */
export async function generateGCashQRCode({
    accountNumber,
    amount,
    reference
}: {
    accountNumber: string
    amount: number
    reference?: string
}): Promise<string> {
    const paymentData = buildPaymentUrl({ accountNumber, amount, reference, bankCode: 'GCASH' })

    try {
        const qrCode = await qrcode.toDataURL(paymentData, {
            width: 350,
            margin: 3,
            errorCorrectionLevel: 'M'
        })
        return qrCode
    } catch (error) {
        console.error('Error generating GCash QR code:', error)
        throw new Error('Failed to generate QR code')
    }
}

/**
 * Generate PESONet/InstaPay QR code
 */
export async function generatePesonetQRCode({
    accountNumber,
    amount,
    reference,
    bankCode = 'BP'
}: {
    accountNumber: string
    amount: number
    reference?: string
    bankCode?: string
}): Promise<string> {
    // Format: 00020126320014PH0101012401280112610000000000BSS
    const paymentData = buildPaymentUrl({ accountNumber, amount, reference, bankCode })

    try {
        const qrCode = await qrcode.toDataURL(paymentData, {
            width: 350,
            margin: 3,
            errorCorrectionLevel: 'Q'
        })
        return qrCode
    } catch (error) {
        console.error('Error generating PESONet QR code:', error)
        throw new Error('Failed to generate QR code')
    }
}