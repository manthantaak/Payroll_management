import jsPDF from 'jspdf'

export interface PayslipData {
    employeeName?: string
    department?: string
    month: string
    year: number | string
    baseSalary: number
    allowances: number
    deductions: number
    netSalary: number
    generatedDate: string
}

// Helper: format currency without ₹ (jsPDF default fonts don't support it)
function formatINR(amount: number): string {
    return 'Rs. ' + amount.toLocaleString('en-IN')
}

/**
 * Generates a professional payslip PDF and triggers a browser download.
 */
export function generatePayslipPdf(data: PayslipData): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()  // 210
    const margin = 18
    const contentWidth = pageWidth - margin * 2           // 174
    const rightEdge = pageWidth - margin

    let y = 0

    // ── HEADER BANNER ───────────────────────────────────────────────
    const headerHeight = 44
    doc.setFillColor(25, 50, 120)
    doc.rect(0, 0, pageWidth, headerHeight, 'F')

    // Accent stripe
    doc.setFillColor(40, 75, 160)
    doc.rect(0, headerHeight - 4, pageWidth, 4, 'F')

    // Company title
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.setTextColor(255, 255, 255)
    doc.text('SALARY SLIP', pageWidth / 2, 18, { align: 'center' })

    // Period
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(190, 205, 240)
    doc.text(`For the month of ${data.month} ${data.year}`, pageWidth / 2, 30, {
        align: 'center',
    })

    y = headerHeight + 12

    // ── EMPLOYEE INFO BOX ───────────────────────────────────────────
    const empBoxHeight = 22
    doc.setFillColor(242, 244, 248)
    doc.setDrawColor(210, 215, 225)
    doc.setLineWidth(0.3)
    doc.roundedRect(margin, y, contentWidth, empBoxHeight, 2, 2, 'FD')

    const empName = data.employeeName || 'Employee'
    const empDept = data.department || 'N/A'

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    doc.text('Employee Name:', margin + 5, y + 9)
    doc.text('Department:', margin + 5, y + 17)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(30, 30, 30)
    doc.text(empName, margin + 45, y + 9)
    doc.text(empDept, margin + 38, y + 17)

    // Date on the right side
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    doc.text('Date:', rightEdge - 55, y + 9)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 30)
    try {
        const dateStr = new Date(data.generatedDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
        doc.text(dateStr, rightEdge - 40, y + 9)
    } catch {
        doc.text(data.generatedDate, rightEdge - 40, y + 9)
    }

    y += empBoxHeight + 12

    // ── EARNINGS TABLE ──────────────────────────────────────────────
    // Section header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(25, 50, 120)
    doc.text('EARNINGS', margin, y)
    y += 2
    doc.setDrawColor(25, 50, 120)
    doc.setLineWidth(0.6)
    doc.line(margin, y, rightEdge, y)
    y += 8

    // Table header row
    doc.setFillColor(235, 238, 245)
    doc.rect(margin, y - 5, contentWidth, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(60, 60, 60)
    doc.text('Description', margin + 4, y)
    doc.text('Amount', rightEdge - 4, y, { align: 'right' })
    y += 7

    // Rows
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(50, 50, 50)

    doc.text('Basic Salary', margin + 4, y)
    doc.text(formatINR(data.baseSalary), rightEdge - 4, y, { align: 'right' })
    y += 7

    doc.text('Allowances (HRA, DA, etc.)', margin + 4, y)
    doc.text(formatINR(data.allowances), rightEdge - 4, y, { align: 'right' })
    y += 4

    // Divider
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.3)
    doc.line(margin, y, rightEdge, y)
    y += 6

    // Total Earnings
    const totalEarnings = data.baseSalary + data.allowances
    doc.setFillColor(230, 245, 230)
    doc.rect(margin, y - 4.5, contentWidth, 9, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(20, 110, 50)
    doc.text('Total Earnings', margin + 4, y + 1)
    doc.text(formatINR(totalEarnings), rightEdge - 4, y + 1, { align: 'right' })

    y += 16

    // ── DEDUCTIONS TABLE ────────────────────────────────────────────
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(160, 30, 30)
    doc.text('DEDUCTIONS', margin, y)
    y += 2
    doc.setDrawColor(160, 30, 30)
    doc.setLineWidth(0.6)
    doc.line(margin, y, rightEdge, y)
    y += 8

    // Table header row
    doc.setFillColor(248, 235, 235)
    doc.rect(margin, y - 5, contentWidth, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(60, 60, 60)
    doc.text('Description', margin + 4, y)
    doc.text('Amount', rightEdge - 4, y, { align: 'right' })
    y += 7

    const taxDeduction = Math.round(data.deductions * 0.6)
    const insurance = Math.round(data.deductions * 0.4)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(50, 50, 50)

    doc.text('Tax Deduction (TDS)', margin + 4, y)
    doc.text(formatINR(taxDeduction), rightEdge - 4, y, { align: 'right' })
    y += 7

    doc.text('Provident Fund / Insurance', margin + 4, y)
    doc.text(formatINR(insurance), rightEdge - 4, y, { align: 'right' })
    y += 4

    // Divider
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.3)
    doc.line(margin, y, rightEdge, y)
    y += 6

    // Total Deductions
    doc.setFillColor(252, 230, 230)
    doc.rect(margin, y - 4.5, contentWidth, 9, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(160, 30, 30)
    doc.text('Total Deductions', margin + 4, y + 1)
    doc.text(formatINR(data.deductions), rightEdge - 4, y + 1, { align: 'right' })

    y += 18

    // ── NET SALARY BOX ──────────────────────────────────────────────
    const netBoxH = 16
    doc.setFillColor(25, 50, 120)
    doc.roundedRect(margin, y, contentWidth, netBoxH, 3, 3, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(255, 255, 255)
    doc.text('NET SALARY', margin + 8, y + netBoxH / 2 + 1.5)

    doc.setFontSize(14)
    doc.text(formatINR(data.netSalary), rightEdge - 8, y + netBoxH / 2 + 2, {
        align: 'right',
    })

    y += netBoxH + 14

    // ── FOOTER ──────────────────────────────────────────────────────
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.3)
    doc.line(margin, y, rightEdge, y)
    y += 7

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(140, 140, 140)
    doc.text(
        'This is a system-generated payslip and does not require a signature.',
        pageWidth / 2,
        y,
        { align: 'center' }
    )

    // ── TRIGGER DOWNLOAD ────────────────────────────────────────────
    const filename = `Payslip_${data.month}_${data.year}.pdf`
    doc.save(filename)
}
