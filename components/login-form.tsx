'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export function LoginForm() {
  const router = useRouter()
  const { login, isLoading, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // Redirect only after login and component is mounted
    if (isMounted && user) {
      const timer = setTimeout(() => {
        router.push('/dashboard')
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [user, isMounted, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const { email: userEmail, password: userPassword } = e.target as HTMLFormElement & {
        email?: { value: string }
        password?: { value: string }
      }
      await login(email, password)
      // Don't rely on useEffect for redirect - happens automatically
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  if (!isMounted) {
    return (
      <Card className="w-full max-w-md p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Payroll System
          </h1>
          <p className="text-muted-foreground">
            Sign in to your account
          </p>
        </div>
        <div className="space-y-4">
          <div className="h-10 bg-muted rounded animate-pulse" />
          <div className="h-10 bg-muted rounded animate-pulse" />
          <div className="h-10 bg-muted rounded animate-pulse" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Payroll System
        </h1>
        <p className="text-muted-foreground">
          Sign in to your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Email
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@company.com"
            disabled={isLoading}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Password
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            disabled={isLoading}
            required
            autoComplete="current-password"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Use password: 'password'
          </p>
        </div>

        {error && (
          <div className="bg-destructive/20 text-destructive text-sm p-3 rounded">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-border">
        <p className="text-xs text-muted-foreground mb-3">Demo Credentials:</p>
        <div className="space-y-2 text-xs">
          <div>
            <p className="font-medium text-foreground">Admin:</p>
            <p className="text-muted-foreground">admin@company.com</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Employee:</p>
            <p className="text-muted-foreground">employee@company.com</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
