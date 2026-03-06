'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Sidebar from '@/components/sidebar'
import TopBar from '@/components/top-bar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isInitialized } = useAuth()

  React.useEffect(() => {
    // Only check auth after initialization and redirect if no user
    if (isInitialized && !user) {
      router.push('/')
    }
  }, [isInitialized, user, router])

  // Wait for auth to initialize
  if (!isInitialized) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    )
  }

  // If no user after initialization, redirect is in progress
  if (!user) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Redirecting...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
