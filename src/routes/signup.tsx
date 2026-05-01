import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TagPicker } from '@/components/TagPicker'
import { TAGS } from '@/data/tags'

export const Route = createFileRoute('/signup')({
  component: SignUpPage,
})

function SignUpPage() {
  const navigate = useNavigate()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [university, setUniversity] = useState('')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [error, setError] = useState('')

  const handleNext = () => {
    if (step === 1) {
      if (!fullName.trim() || !username.trim() || !email.trim()) {
        setError('Please fill in all fields')
        return
      }
      setError('')
      setStep(2)
    } else if (step === 2) {
      if (!password.trim()) {
        setError('Please enter a password')
        return
      }
      setError('')
      setStep(3)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3)
      setError('')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    // Redirect to circles after form submission
    navigate({ to: '/circles' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Step {step} of 3</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="johndoe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter a secure password"
                  />
                </div>
                <p className="text-sm text-muted-foreground">Use at least 8 characters for security.</p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="university">University</Label>
                  <Input
                    id="university"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="e.g., Tokyo University"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Select Interests</Label>
                  <TagPicker
                    value={selectedInterests}
                    onChange={setSelectedInterests}
                  />
                </div>
              </div>
            )}

            {error && <div className="text-sm text-destructive">{error}</div>}

            <div className="flex gap-2">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
              {step < 3 ? (
                <Button type="button" onClick={handleNext} className="flex-1">
                  Next
                </Button>
              ) : (
                <Button type="submit" className="flex-1">
                  Create Account
                </Button>
              )}
            </div>

            <div className="text-center text-sm">
              Already have an account?{' '}
              <button
                type="button"
                className="text-primary underline"
                onClick={() => navigate({ to: '/login' })}
              >
                Log in
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
