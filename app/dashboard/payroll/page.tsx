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
import { AlertCircle, Download, Plus, Send } from 'lucide-react'
import { useFirestoreCollection } from '@/lib/useFirestoreCollection'
import { generatePayslipPdf } from '@/lib/generatePayslipPdf'

interface PayrollRecord {
  id: string
  employeeId: string
  employeeName: string
  month: string
  baseSalary: number
  allowances: number
  deductions: number
  netSalary: number
  status: 'pending' | 'processed' | 'paid'
  processedDate?: string
}


const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const currentDate = new Date()
const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

export default function PayrollPage() {
  const { items: payroll, add, update } = useFirestoreCollection<PayrollRecord>('payroll')
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [isGenerateOpen, setIsGenerateOpen] = useState(false)

  const filteredPayroll = payroll.filter((record) =>
    record.month.startsWith(selectedMonth)
  )

  const totalStats = {
    baseSalary: filteredPayroll.reduce((sum, r) => sum + r.baseSalary, 0),
    allowances: filteredPayroll.reduce((sum, r) => sum + r.allowances, 0),
    deductions: filteredPayroll.reduce((sum, r) => sum + r.deductions, 0),
    netSalary: filteredPayroll.reduce((sum, r) => sum + r.netSalary, 0),
  }

  const handleGeneratePayroll = async () => {
    // generate entries based on selected month
    const newRecords = payroll.map((record) => ({
      ...record,
      month: selectedMonth,
      status: 'processed' as const,
      processedDate: new Date().toISOString().split('T')[0],
    }))
    // batch write
    for (const rec of newRecords) {
      await add(rec as PayrollRecord)
    }
    setIsGenerateOpen(false)
  }

  const handleSendPayroll = async () => {
    // mark filtered records as paid
    for (const rec of filteredPayroll) {
      await update(rec.id, { status: 'paid' })
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
                      This will generate payroll for all active employees
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleGeneratePayroll}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Generate
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handleSendPayroll}>
            <Send className="w-4 h-4 mr-2" />
            Send Payroll
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
                filteredPayroll.map((record) => (
                  <tr
                    key={record.id}
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
