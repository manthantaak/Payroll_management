'use client'

import React, { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar, Search, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useFirestoreCollection } from '@/lib/useFirestoreCollection'

interface AttendanceRecord {
  id: string
  employeeName: string
  date: string
  status: 'present' | 'absent' | 'half-day'
  checkIn: string | null
  checkOut: string | null
}


const today = new Date().toISOString().split('T')[0]

export default function AttendancePage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const { items: attendance, add, update, remove } = useFirestoreCollection<AttendanceRecord>('attendance')
  const [selectedDate, setSelectedDate] = useState(today)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredAttendance = attendance.filter((record) =>
    record.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    present: attendance.filter((r) => r.status === 'present').length,
    absent: attendance.filter((r) => r.status === 'absent').length,
    halfDay: attendance.filter((r) => r.status === 'half-day').length,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'text-green-500 bg-green-500/20'
      case 'absent':
        return 'text-red-500 bg-red-500/20'
      case 'half-day':
        return 'text-amber-500 bg-amber-500/20'
      default:
        return 'text-gray-500 bg-gray-500/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5" />
      case 'absent':
        return <XCircle className="w-5 h-5" />
      case 'half-day':
        return <AlertCircle className="w-5 h-5" />
      default:
        return null
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Attendance Management
        </h1>
        <p className="text-muted-foreground">
          Track employee attendance and working hours
        </p>
      </div>

      {/* Date and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Calendar className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Present</p>
          <p className="text-3xl font-bold text-green-500">{stats.present}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Absent</p>
          <p className="text-3xl font-bold text-red-500">{stats.absent}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Half Day</p>
          <p className="text-3xl font-bold text-amber-500">{stats.halfDay}</p>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-background/50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Check In
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Check Out
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Hours Worked
                </th>

              </tr>
            </thead>
            <tbody>
              {filteredAttendance.length > 0 ? (
                filteredAttendance.map((record) => {
                  const hoursWorked =
                    record.checkIn && record.checkOut
                      ? (
                        (new Date(`2024-01-01 ${record.checkOut}`).getTime() -
                          new Date(`2024-01-01 ${record.checkIn}`).getTime()) /
                        (1000 * 60 * 60)
                      ).toFixed(1)
                      : '—'

                  return (
                    <tr
                      key={record.id}
                      className="border-b border-border hover:bg-background/50 transition-colors"
                    >
                      <td className="px-6 py-3 text-foreground font-medium">
                        {record.employeeName}
                      </td>
                      <td className="px-6 py-3">
                        <div
                          className={`flex items-center gap-2 px-2 py-1 rounded w-fit text-sm font-medium ${getStatusColor(record.status)}`}
                        >
                          {getStatusIcon(record.status)}
                          {record.status === 'half-day'
                            ? 'Half Day'
                            : record.status.charAt(0).toUpperCase() +
                            record.status.slice(1)}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground text-sm">
                        {record.checkIn || '—'}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground text-sm">
                        {record.checkOut || '—'}
                      </td>
                      <td className="px-6 py-3 text-foreground font-medium">
                        {hoursWorked !== '—'
                          ? `${hoursWorked}h`
                          : hoursWorked}
                      </td>

                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-muted-foreground">No records found</p>
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
