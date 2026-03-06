'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import {
  Home,
  Users,
  Calendar,
  FileText,
  DollarSign,
  LogOut,
  Receipt,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  adminOnly?: boolean
  employeeOnly?: boolean
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <Home className="w-5 h-5" />,
  },
  {
    label: 'Employees',
    href: '/dashboard/employees',
    icon: <Users className="w-5 h-5" />,
    adminOnly: true,
  },
  {
    label: 'Attendance',
    href: '/dashboard/attendance',
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    label: 'Leave Requests',
    href: '/dashboard/leave-requests',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    label: 'Payroll',
    href: '/dashboard/payroll',
    icon: <DollarSign className="w-5 h-5" />,
    adminOnly: true,
  },
  {
    label: 'My Payslips',
    href: '/dashboard/payslips',
    icon: <Receipt className="w-5 h-5" />,
    employeeOnly: true,
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const filteredItems = navItems.filter((item) => {
    if (item.adminOnly && user?.role !== 'admin') {
      return false
    }
    if (item.employeeOnly && user?.role === 'admin') {
      return false
    }
    return true
  })

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-foreground">PayrollHub</h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1">
          {user?.role === 'admin' ? 'HR Dashboard' : 'Employee Portal'}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }`}
              >
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        <div className="px-4 py-2">
          <p className="text-xs text-sidebar-foreground/60">Signed in as</p>
          <p className="text-sm font-medium text-sidebar-foreground truncate">
            {user?.name}
          </p>
          <p className="text-xs text-sidebar-foreground/50 truncate">
            {user?.email}
          </p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
