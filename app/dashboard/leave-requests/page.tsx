'use client'

import React, { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Check, X, Plus, Search } from 'lucide-react'
import { useFirestoreCollection } from '@/lib/useFirestoreCollection'

interface LeaveRequest {
  id: string
  employeeName: string
  employeeId: string
  leaveType: 'annual' | 'sick' | 'casual' | 'maternity'
  startDate: string
  endDate: string
  days: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  appliedDate: string
}


export default function LeaveRequestsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const { items: requests, add, update } = useFirestoreCollection<LeaveRequest>('leaveRequests')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
  })

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.employeeName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      request.reason.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      filterStatus === 'all' || request.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleApprove = async (id: string) => {
    await update(id, { status: 'approved' })
  }

  const handleReject = async (id: string) => {
    await update(id, { status: 'rejected' })
  }

  const handleAddRequest = async () => {
    if (
      formData.leaveType &&
      formData.startDate &&
      formData.endDate &&
      formData.reason
    ) {
      const start = new Date(formData.startDate)
      const end = new Date(formData.endDate)
      const days =
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
        1

      const newRequest: Omit<LeaveRequest, 'id'> = {
        employeeName: user?.name || 'Unknown',
        employeeId: user?.id || '',
        leaveType: formData.leaveType as
          | 'annual'
          | 'sick'
          | 'casual'
          | 'maternity',
        startDate: formData.startDate,
        endDate: formData.endDate,
        days,
        reason: formData.reason,
        status: 'pending',
        appliedDate: new Date().toISOString().split('T')[0],
      }
      await add(newRequest as LeaveRequest)
      setFormData({
        leaveType: '',
        startDate: '',
        endDate: '',
        reason: '',
      })
      setIsOpen(false)
    }
  }

  const stats = {
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/20 text-green-500'
      case 'rejected':
        return 'bg-red-500/20 text-red-500'
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
            Leave Requests
          </h1>
          <p className="text-muted-foreground">
            {isAdmin ? 'Manage employee leave applications' : 'View and manage your leave requests'}
          </p>
        </div>
        {!isAdmin && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Leave</DialogTitle>
                <DialogDescription>
                  Submit a new leave request for approval.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="px-3 py-2 border border-input rounded-md bg-muted text-foreground text-sm">
                  Requesting as: <span className="font-medium">{user?.name}</span>
                </div>
                <select
                  value={formData.leaveType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      leaveType: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                >
                  <option value="">Select Leave Type</option>
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="casual">Casual Leave</option>
                  <option value="maternity">Maternity Leave</option>
                </select>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Start Date</label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">End Date</label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endDate: e.target.value,
                      })
                    }
                  />
                </div>
                <textarea
                  placeholder="Reason for leave"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reason: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  rows={3}
                />
                <Button
                  onClick={handleAddRequest}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Submit Request
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Pending</p>
          <p className="text-3xl font-bold text-amber-500">
            {stats.pending}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Approved</p>
          <p className="text-3xl font-bold text-green-500">
            {stats.approved}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Rejected</p>
          <p className="text-3xl font-bold text-red-500">
            {stats.rejected}
          </p>
        </Card>
      </div>

      {/* Filters */}
      {isAdmin && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search employee or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-input rounded-md bg-background text-foreground"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      )}

      {/* Requests List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-background/50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Leave Type
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Date Range
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Days
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Status
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-b border-border hover:bg-background/50 transition-colors"
                  >
                    <td className="px-6 py-3 text-foreground font-medium">
                      {request.employeeName}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground text-sm">
                      {request.leaveType
                        .charAt(0)
                        .toUpperCase() +
                        request.leaveType.slice(1)}{' '}
                      Leave
                    </td>
                    <td className="px-6 py-3 text-muted-foreground text-sm">
                      {request.startDate} to {request.endDate}
                    </td>
                    <td className="px-6 py-3 text-foreground font-medium">
                      {request.days}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground text-sm">
                      {request.reason}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(request.status)}`}
                      >
                        {request.status
                          .charAt(0)
                          .toUpperCase() +
                          request.status.slice(1)}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-3">
                        {request.status === 'pending' ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(request.id)}
                              className="bg-green-500/20 text-green-500 hover:bg-green-500/30"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleReject(request.id)}
                              className="bg-red-500/20 text-red-500 hover:bg-red-500/30"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No action
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-12 text-center">
                    <p className="text-muted-foreground">
                      No requests found
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
