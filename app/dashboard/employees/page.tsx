'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { MoreVertical, Plus, Search, Edit2, Trash2 } from 'lucide-react'
import { useFirestoreCollection } from '@/lib/useFirestoreCollection'

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

export default function EmployeesPage() {
  const { items: employees, remove } = useFirestoreCollection<Employee>('employees')
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    position: '',
    department: '',
    salary: '',
    accountNumber: '',
    ifscCode: '',
  })

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddEmployee = async () => {
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.position ||
      !formData.department ||
      !formData.salary ||
      !formData.accountNumber ||
      !formData.ifscCode
    ) {
      setFormError('All fields are required.')
      return
    }

    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters.')
      return
    }

    setIsSubmitting(true)
    setFormError('')
    setFormSuccess('')

    try {
      const res = await fetch('/api/create-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()

      if (!res.ok) {
        setFormError(data.error || 'Failed to create employee.')
        return
      }

      setFormSuccess(`Employee "${formData.name}" created successfully! They can now log in with their email & password.`)
      setFormData({
        name: '',
        email: '',
        password: '',
        position: '',
        department: '',
        salary: '',
        accountNumber: '',
        ifscCode: '',
      })
      // Auto-close after a short delay
      setTimeout(() => {
        setIsOpen(false)
        setFormSuccess('')
      }, 2000)
    } catch (err: any) {
      setFormError(err.message || 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteEmployee = async (id: string) => {
    await remove(id)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Employee Management
          </h1>
          <p className="text-muted-foreground">
            Manage your company employees and their details
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>
                Fill in the employee details to add a new team member.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {formError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm px-4 py-3 rounded-lg">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-500 text-sm px-4 py-3 rounded-lg">
                  {formSuccess}
                </div>
              )}
              <Input
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <Input
                placeholder="Email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
              <Input
                placeholder="Login Password (min 6 characters)"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              <Input
                placeholder="Position"
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
              />
              <Input
                placeholder="Department"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
              />
              <Input
                placeholder="Monthly Salary"
                type="number"
                value={formData.salary}
                onChange={(e) =>
                  setFormData({ ...formData, salary: e.target.value })
                }
              />
              <Input
                placeholder="Bank Account Number"
                value={formData.accountNumber}
                onChange={(e) =>
                  setFormData({ ...formData, accountNumber: e.target.value })
                }
              />
              <Input
                placeholder="IFSC Code"
                value={formData.ifscCode}
                onChange={(e) =>
                  setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })
                }
              />
              <Button
                onClick={handleAddEmployee}
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? 'Creating Employee...' : 'Add Employee'}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                This will create a login account for the employee. They can sign in with their email &amp; password.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-background/50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Salary
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
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => (
                  <tr
                    key={employee.id}
                    className="border-b border-border hover:bg-background/50 transition-colors"
                  >
                    <td className="px-6 py-3 text-foreground font-medium">
                      {employee.name}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground text-sm">
                      {employee.email}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground text-sm">
                      {employee.position}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground text-sm">
                      {employee.department}
                    </td>
                    <td className="px-6 py-3 text-foreground font-medium">
                      ₹{employee.salary.toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${employee.status === 'active'
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-red-500/20 text-red-500'
                          }`}
                      >
                        {employee.status === 'active'
                          ? 'Active'
                          : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteEmployee(employee.id)}
                            className="text-red-500"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-muted-foreground">
                      No employees found
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Total Employees</p>
          <p className="text-2xl font-bold text-foreground">
            {employees.length}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Active</p>
          <p className="text-2xl font-bold text-green-500">
            {employees.filter((e) => e.status === 'active').length}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">
            Total Monthly Payroll
          </p>
          <p className="text-2xl font-bold text-foreground">
            ₹{employees.reduce((sum, e) => sum + e.salary, 0).toLocaleString()}
          </p>
        </Card>
      </div>
    </div>
  )
}
