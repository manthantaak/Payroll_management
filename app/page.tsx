import { Card } from '@/components/ui/card'
import { LoginForm } from '@/components/login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Payroll System
          </h1>
          <p className="text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        <LoginForm />

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
    </div>
  )
}
