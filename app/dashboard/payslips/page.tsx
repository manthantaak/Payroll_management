'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Download, Eye, Search } from 'lucide-react'
import { useFirestoreCollection } from '@/lib/useFirestoreCollection'
import { generatePayslipPdf } from '@/lib/generatePayslipPdf'
import { useAuth } from '@/lib/auth-context'

interface Payslip {
  id: string
  month: string
  year: number
  baseSalary: number
  allowances: number
  deductions: number
  netSalary: number
  generatedDate: string
}

export default function PayslipsPage() {
  const { user } = useAuth()
  const { items: payslips } = useFirestoreCollection<Payslip>('payslips')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)

  const filteredPayslips = payslips.filter((slip) =>
    `${slip.month} ${slip.year}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleViewPayslip = (payslip: Payslip) => {
    setSelectedPayslip(payslip)
    setIsViewOpen(true)
  }

  const handleDownload = (payslip: Payslip) => {
    generatePayslipPdf({
      employeeName: user?.name,
      department: user?.department,
      month: payslip.month,
      year: payslip.year,
      baseSalary: payslip.baseSalary,
      allowances: payslip.allowances,
      deductions: payslip.deductions,
      netSalary: payslip.netSalary,
      generatedDate: payslip.generatedDate,
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Payslips
        </h1>
        <p className="text-muted-foreground">
          View and download your salary slips
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by month or year..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Payslips List */}
      <div className="space-y-3">
        {filteredPayslips.length > 0 ? (
          filteredPayslips.map((payslip) => (
            <Card
              key={payslip.id}
              className="p-6 hover:bg-card/80 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {payslip.month} {payslip.year}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Generated on {new Date(payslip.generatedDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Payslip Summary */}
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Base Salary
                      </p>
                      <p className="font-semibold text-foreground">
                        ₹{payslip.baseSalary.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Allowances
                      </p>
                      <p className="font-semibold text-green-500">
                        ₹{payslip.allowances.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Deductions
                      </p>
                      <p className="font-semibold text-red-500">
                        ₹{payslip.deductions.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Net Salary
                      </p>
                      <p className="font-bold text-primary text-lg">
                        ₹{payslip.netSalary.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewPayslip(payslip)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(payslip)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-12">
            <p className="text-center text-muted-foreground">
              No payslips found
            </p>
          </Card>
        )}
      </div>

      {/* View Payslip Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Payslip - {selectedPayslip?.month} {selectedPayslip?.year}
            </DialogTitle>
            <DialogDescription>
              Detailed salary breakdown
            </DialogDescription>
          </DialogHeader>

          {selectedPayslip && (
            <div className="space-y-6">
              {/* Header */}
              <div className="border-b border-border pb-4">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Payslip
                </h2>
                <p className="text-muted-foreground">
                  Period: {selectedPayslip.month} {selectedPayslip.year}
                </p>
              </div>

              {/* Earnings Section */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Earnings</h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-3 bg-background rounded">
                    <span className="text-foreground">Base Salary</span>
                    <span className="font-medium text-foreground">
                      ₹{selectedPayslip.baseSalary.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-background rounded">
                    <span className="text-foreground">Allowances</span>
                    <span className="font-medium text-green-500">
                      ₹{selectedPayslip.allowances.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions Section */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">
                  Deductions
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-3 bg-background rounded">
                    <span className="text-foreground">
                      Tax Deduction
                    </span>
                    <span className="font-medium text-red-500">
                      ₹{(selectedPayslip.deductions * 0.6).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-background rounded">
                    <span className="text-foreground">Insurance</span>
                    <span className="font-medium text-red-500">
                      ₹{(selectedPayslip.deductions * 0.4).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="border-t border-border pt-4">
                <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
                  <span className="font-bold text-foreground text-lg">
                    Net Salary
                  </span>
                  <span className="font-bold text-primary text-2xl">
                    ₹{selectedPayslip.netSalary.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-xs text-muted-foreground">
                <p>Generated on {new Date(selectedPayslip.generatedDate).toLocaleDateString()}</p>
                <p>This is a computer-generated document</p>
              </div>

              {/* Download Button */}
              <Button
                onClick={() => handleDownload(selectedPayslip)}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Download className="w-4 h-4 mr-2" />
                Download as PDF
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
