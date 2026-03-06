'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { AlertCircle, Download, Loader2, Plus, Send } from 'lucide-react'
import { useFirestoreCollection } from '@/lib/useFirestoreCollection'
import { generatePayslipPdf } from '@/lib/generatePayslipPdf'

interface PayrollRecord {
  id: string
  employeeId: string
  employeeName: string
  employeeDepartment: string
  month: string
  baseSalary: number
  allowances: number
  deductions: number
  netSalary: number
  status: 'pending' | 'processed' | 'paid'
  processedDate?: string
}

interface Employee {
  id: string
  name: string
  email: string
  position: string
  department: string
  salary: number
  joinDate: string
  status: 'active' | 'inactive'
}

interface Payslip {
  employeeId: string
  employeeName: string
  month: string
  year: number
  baseSalary: number
  allowances: number
  deductions: number
  netSalary: number
  generatedDate: string
}

const currentDate = new Date()
const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

export default function PayrollPage() {
  const { items: payroll, add: addPayroll, update: updatePayroll } = useFirestoreCollection<PayrollRecord>('payroll')
  const { items: employees } = useFirestoreCollection<Employee>('employees')
  const { add: addPayslip } = useFirestoreCollection<Payslip>('payslips')
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [isGenerateOpen, setIsGenerateOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // Deduplicate by id to handle any legacy duplicate records
  const filteredPayroll = payroll
    .filter((record) => record.month.startsWith(selectedMonth))
    .filter((record, index, self) => self.findIndex((r) => r.id === record.id) === index)

  const pendingRecords = filteredPayroll.filter((r) => r.status === 'pending')
  const hasPendingRecords = pendingRecords.length > 0

  const totalStats = {
    baseSalary: filteredPayroll.reduce((sum, r) => sum + r.baseSalary, 0),
    allowances: filteredPayroll.reduce((sum, r) => sum + r.allowances, 0),
    deductions: filteredPayroll.reduce((sum, r) => sum + r.deductions, 0),
    netSalary: filteredPayroll.reduce((sum, r) => sum + r.netSalary, 0),
  }

  const handleGeneratePayroll = async () => {
    setIsGenerating(true)
    try {
      // Get only active employees
      const activeEmployees = employees.filter((emp) => emp.status === 'active')

      if (activeEmployees.length === 0) {
        alert('No active employees found to generate payroll for.')
        setIsGenerating(false)
        return
      }

      // Check if payroll already exists for this month
      const existingForMonth = payroll.filter((r) => r.month === selectedMonth)
      if (existingForMonth.length > 0) {
        alert('Payroll has already been generated for this month.')
        setIsGenerating(false)
        setIsGenerateOpen(false)
        return
      }

      // Generate payroll entries from employees with status 'pending'
      for (const emp of activeEmployees) {
        const baseSalary = emp.salary || 0
        const allowances = Math.round(baseSalary * 0.2) // 20% allowances
        const deductions = Math.round(baseSalary * 0.1) // 10% deductions
        const netSalary = baseSalary + allowances - deductions

        const payrollEntry: Omit<PayrollRecord, 'id'> = {
          employeeId: emp.id,
          employeeName: emp.name,
          employeeDepartment: emp.department || '',
          month: selectedMonth,
          baseSalary,
          allowances,
          deductions,
          netSalary,
          status: 'pending',
          processedDate: new Date().toISOString().split('T')[0],
        }

        await addPayroll(payrollEntry as PayrollRecord)
      }

      setIsGenerateOpen(false)
    } catch (error) {
      console.error('Error generating payroll:', error)
      alert('Failed to generate payroll. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSendPayroll = async () => {
    if (!hasPendingRecords) {
      alert('No pending payroll records to send for this month.')
      return
    }

    setIsSending(true)
    try {
      // Process each pending payroll record
      for (const rec of pendingRecords) {
        // 1. Update payroll status to 'paid'
        await updatePayroll(rec.id, { status: 'paid' })

        // 2. Create a payslip entry for the employee so they can view it
        const monthName = new Date(`${rec.month}-01`).toLocaleString('default', { month: 'long' })
        const year = parseInt(rec.month.split('-')[0], 10)

        const payslipEntry: Omit<Payslip, 'id'> = {
          employeeId: rec.employeeId,
          employeeName: rec.employeeName,
          month: monthName,
          year,
          baseSalary: rec.baseSalary,
          allowances: rec.allowances,
          deductions: rec.deductions,
          netSalary: rec.netSalary,
          generatedDate: new Date().toISOString(),
        }

        await addPayslip(payslipEntry as Payslip)
      }

      alert('Payroll sent successfully! Payslips have been created for all employees.')
    } catch (error) {
      console.error('Error sending payroll:', error)
      alert('Failed to send payroll. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/20 text-green-500'
      case 'processed':
        return 'bg-blue-500/20 text-blue-500'
      case 'pending':
        return 'bg-amber-500/20 text-amber-500'
      default:
        return 'bg-gray-500/20 text-gray-500'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Payroll Management
          </h1>
          <p className="text-muted-foreground">
            Generate and manage employee payroll
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Generate Payroll
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Payroll</DialogTitle>
                <DialogDescription>
                  Generate payroll for the selected month
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Select Month
                  </label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  />
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <p className="text-sm text-amber-500">
                      This will generate payroll for all {employees.filter(e => e.status === 'active').length} active employees with status &quot;Pending&quot;
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleGeneratePayroll}
                  disabled={isGenerating}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            onClick={handleSendPayroll}
            disabled={!hasPendingRecords || isSending}
            title={!hasPendingRecords ? 'No pending payroll records to send' : 'Send payroll and create payslips for employees'}
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Payroll {hasPendingRecords && `(${pendingRecords.length})`}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Month Selector */}
      <Card className="p-4">
        <label className="block text-sm font-medium text-foreground mb-3">
          Select Month
        </label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full md:w-48 px-4 py-2 border border-input rounded-md bg-background text-foreground"
        />
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Total Base Salary</p>
          <p className="text-2xl font-bold text-foreground">
            ₹{totalStats.baseSalary.toLocaleString()}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">
            Total Allowances
          </p>
          <p className="text-2xl font-bold text-green-500">
            ₹{totalStats.allowances.toLocaleString()}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Total Deductions</p>
          <p className="text-2xl font-bold text-red-500">
            ₹{totalStats.deductions.toLocaleString()}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Total Net Salary</p>
          <p className="text-2xl font-bold text-primary">
            ₹{totalStats.netSalary.toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Payroll Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-background/50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Base Salary
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Allowances
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Deductions
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Net Salary
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPayroll.length > 0 ? (
                filteredPayroll.map((record, index) => (
                  <tr
                    key={`${record.id}-${index}`}
                    className="border-b border-border hover:bg-background/50 transition-colors"
                  >
                    <td className="px-6 py-3 text-foreground font-medium">
                      {record.employeeName}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      ₹{record.baseSalary.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-green-500">
                      ₹{record.allowances.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-red-500">
                      ₹{record.deductions.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-foreground font-bold">
                      ₹{record.netSalary.toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(record.status)}`}
                      >
                        {record.status
                          .charAt(0)
                          .toUpperCase() +
                          record.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary"
                        onClick={() => {
                          const monthName = new Date(`${record.month}-01`).toLocaleString('default', { month: 'long' })
                          const year = record.month.split('-')[0]
                          generatePayslipPdf({
                            employeeName: record.employeeName,
                            month: monthName,
                            year: year,
                            baseSalary: record.baseSalary,
                            allowances: record.allowances,
                            deductions: record.deductions,
                            netSalary: record.netSalary,
                            generatedDate: record.processedDate || new Date().toISOString(),
                          })
                        }}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-muted-foreground">
                      No payroll records for this month
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
