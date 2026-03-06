'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users,
  DollarSign,
  FileText,
  TrendingUp,
  Calendar,
  Clock,
  Download,
  Briefcase,
} from 'lucide-react'
import { useFirestoreCollection } from '@/lib/useFirestoreCollection'
import { generatePayslipPdf } from '@/lib/generatePayslipPdf'

interface DashboardStat {
  label: string
  value: string | number
  change?: string
  icon: React.ReactNode
  color: string
}

interface PayslipRecord {
  id: string
  month: string
  year: number
  baseSalary: number
  allowances: number
  deductions: number
  netSalary: number
  generatedDate: string
}

interface EmployeeRecord {
  id: string
  uid?: string
  name: string
  email: string
  position: string
  department: string
  salary: number
  joinDate: string
  status: 'active' | 'inactive'
}

export default function Dashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [isAdmin] = useState(user?.role === 'admin')
  const { items: payslips } = useFirestoreCollection<PayslipRecord>('payslips')
  const { items: allEmployees } = useFirestoreCollection<EmployeeRecord>('employees')

  // Find the employee record for the currently logged-in user
  const myEmployee = useMemo(() => {
    if (isAdmin || !user) return null
    return allEmployees.find(
      (emp) => emp.uid === user.id || emp.email === user.email
    ) || null
  }, [allEmployees, user, isAdmin])

  // Navigation handlers
  const handleViewAllRequests = () => router.push('/dashboard/leave-requests')
  const handleGeneratePayroll = () => router.push('/dashboard/payroll')
  const handleAddEmployee = () => router.push('/dashboard/employees')
  const handleProcessPayroll = () => router.push('/dashboard/payroll')
  const handleReviewRequests = () => router.push('/dashboard/leave-requests')
  const handleViewReports = () => alert('Reports feature coming soon')
  const handleMarkAttendance = () => router.push('/dashboard/attendance')
  const handleRequestLeave = () => router.push('/dashboard/leave-requests')
  const handleViewPayslips = () => router.push('/dashboard/payslips')
  const handleCheckHours = () => router.push('/dashboard/attendance')
  const handleDownloadPayslip = () => {
    if (payslips.length === 0) {
      alert('No payslips available to download.')
      return
    }
    const latest = payslips[0]
    generatePayslipPdf({
      employeeName: user?.name,
      department: user?.department,
      month: latest.month,
      year: latest.year,
      baseSalary: latest.baseSalary,
      allowances: latest.allowances,
      deductions: latest.deductions,
      netSalary: latest.netSalary,
      generatedDate: latest.generatedDate,
    })
  }

  // Build personalized stats
  const totalPayroll = allEmployees
    .filter((e) => e.status === 'active')
    .reduce((sum, e) => sum + (e.salary || 0), 0)

  const stats: DashboardStat[] = isAdmin
    ? [
      {
        label: 'Total Employees',
        value: allEmployees.length,
        change: `${allEmployees.filter((e) => e.status === 'active').length} active`,
        icon: <Users className="w-6 h-6" />,
        color: 'bg-blue-500/20 text-blue-500',
      },
      {
        label: 'Monthly Payroll',
        value: `₹${totalPayroll.toLocaleString()}`,
        change: 'All active employees',
        icon: <DollarSign className="w-6 h-6" />,
        color: 'bg-green-500/20 text-green-500',
      },
      {
        label: 'Pending Requests',
        value: '8',
        change: '5 leave, 3 advance',
        icon: <FileText className="w-6 h-6" />,
        color: 'bg-amber-500/20 text-amber-500',
      },
      {
        label: 'Today\'s Attendance',
        value: `${allEmployees.filter((e) => e.status === 'active').length}/${allEmployees.length}`,
        change: 'Present today',
        icon: <Calendar className="w-6 h-6" />,
        color: 'bg-purple-500/20 text-purple-500',
      },
    ]
    : [
      {
        label: 'Department',
        value: user?.department || myEmployee?.department || '—',
        change: user?.position || myEmployee?.position || '',
        icon: <Briefcase className="w-6 h-6" />,
        color: 'bg-blue-500/20 text-blue-500',
      },
      {
        label: 'Status',
        value: myEmployee?.status === 'active' ? 'Active' : myEmployee ? 'Inactive' : 'Active',
        icon: <Clock className="w-6 h-6" />,
        color: 'bg-green-500/20 text-green-500',
      },
      {
        label: 'Leave Balance',
        value: '12 days',
        change: 'Annual leave remaining',
        icon: <Calendar className="w-6 h-6" />,
        color: 'bg-amber-500/20 text-amber-500',
      },
      {
        label: 'Monthly Salary',
        value: myEmployee ? `₹${myEmployee.salary.toLocaleString()}` : '—',
        change: myEmployee ? `Joined ${myEmployee.joinDate}` : '',
        icon: <DollarSign className="w-6 h-6" />,
        color: 'bg-purple-500/20 text-purple-500',
      },
    ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {isAdmin ? 'HR Dashboard' : 'Employee Dashboard'}
        </h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6 bg-card hover:bg-card/80 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
                {stat.change && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {stat.change}
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {isAdmin && (
            <>
              {/* Recent Leave Requests */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Recent Leave Requests
                </h2>
                <div className="space-y-3">
                  {[
                    {
                      name: 'Sarah Johnson',
                      type: 'Annual Leave',
                      date: 'Mar 10-14, 2024',
                      status: 'Pending',
                    },
                    {
                      name: 'Mike Chen',
                      type: 'Sick Leave',
                      date: 'Mar 8, 2024',
                      status: 'Pending',
                    },
                    {
                      name: 'Emma Davis',
                      type: 'Casual Leave',
                      date: 'Mar 6-7, 2024',
                      status: 'Approved',
                    },
                  ].map((request, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-background rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {request.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {request.type} • {request.date}
                        </p>
                      </div>
                      <div className="text-xs font-medium">
                        <span
                          className={`px-2 py-1 rounded ${request.status === 'Pending'
                            ? 'bg-amber-500/20 text-amber-500'
                            : 'bg-green-500/20 text-green-500'
                            }`}
                        >
                          {request.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4 bg-transparent" onClick={handleViewAllRequests}>
                  View All Requests
                </Button>
              </Card>

              {/* Payroll Summary */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Payroll Overview
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                    <span className="text-foreground">Total Salary Cost</span>
                    <span className="font-bold text-foreground">₹14,25,000</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                    <span className="text-foreground">
                      Paid This Month
                    </span>
                    <span className="font-bold text-green-500">₹14,25,000</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                    <span className="text-foreground">Outstanding</span>
                    <span className="font-bold text-red-500">₹0</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4 bg-transparent" onClick={handleGeneratePayroll}>
                  Generate Payroll
                </Button>
              </Card>
            </>
          )}

          {!isAdmin && (
            <>
              {/* My Leave Balance */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Leave Balance
                </h2>
                <div className="space-y-3">
                  {[
                    { type: 'Annual Leave', available: 12, used: 3 },
                    { type: 'Sick Leave', available: 10, used: 1 },
                    { type: 'Casual Leave', available: 5, used: 0 },
                  ].map((leave, idx) => (
                    <div key={idx} className="p-3 bg-background rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-foreground">
                          {leave.type}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {leave.available - leave.used}/{leave.available}
                        </span>
                      </div>
                      <div className="h-2 bg-background rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${((leave.available - leave.used) / leave.available) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4 bg-transparent" onClick={handleRequestLeave}>
                  Request Leave
                </Button>
              </Card>

              {/* Recent Payslips */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Recent Payslips
                </h2>
                <div className="space-y-2">
                  {payslips.length > 0 ? (
                    payslips.slice(0, 3).map((slip) => (
                      <div
                        key={slip.id}
                        className="flex items-center justify-between p-3 bg-background rounded-lg hover:bg-background/80 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-foreground">{slip.month} {slip.year}</p>
                          <p className="text-xs text-muted-foreground">
                            ₹{slip.netSalary.toLocaleString()}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => {
                          generatePayslipPdf({
                            employeeName: user?.name,
                            department: user?.department,
                            month: slip.month,
                            year: slip.year,
                            baseSalary: slip.baseSalary,
                            allowances: slip.allowances,
                            deductions: slip.deductions,
                            netSalary: slip.netSalary,
                            generatedDate: slip.generatedDate,
                          })
                        }}>
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No payslips available</p>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>

        {/* Right Column */}
        <div>
          <Card className="p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              {isAdmin ? (
                <>
                  <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleAddEmployee}>
                    <Users className="w-4 h-4 mr-2" />
                    Add Employee
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleProcessPayroll}>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Process Payroll
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleReviewRequests}>
                    <FileText className="w-4 h-4 mr-2" />
                    Review Requests
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleViewReports}>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Reports
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleMarkAttendance}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Mark Attendance
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleRequestLeave}>
                    <FileText className="w-4 h-4 mr-2" />
                    Request Leave
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent" onClick={() => router.push('/dashboard/payslips')}>
                    <DollarSign className="w-4 h-4 mr-2" />
                    View Payslips
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleCheckHours}>
                    <Clock className="w-4 h-4 mr-2" />
                    Check Hours
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleDownloadPayslip}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Payslip
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
