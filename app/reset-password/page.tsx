'use client'

import { useState } from 'react'
import { resetPassword } from './actions'
import Image from 'next/image'
import { Loader2, Eye, EyeOff, Check, X } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rules = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }
  const allRulesMet = Object.values(rules).every(Boolean)
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await resetPassword(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    // On success the server action redirects — loading stays true briefly
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-gray-50">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <Image
            src="/logo.png"
            alt="Christians Innovate"
            width={100}
            height={100}
            className="object-contain sm:w-[120px] sm:h-[120px]"
          />
        </div>

        <div className="bg-white border rounded-xl shadow-lg p-6 sm:p-8">
          <h1 className="text-xl sm:text-2xl font-bold text-center mb-2">
            Set a new password
          </h1>
          <p className="text-gray-600 text-sm text-center mb-6">
            Choose a strong password for your Christians Innovate account.
          </p>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* New password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full p-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Requirements checklist */}
              {password.length > 0 && (
                <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1">
                  {[
                    [rules.minLength, 'At least 8 characters'],
                    [rules.hasUppercase, 'One uppercase letter (A–Z)'],
                    [rules.hasLowercase, 'One lowercase letter (a–z)'],
                    [rules.hasNumber, 'One number (0–9)'],
                    [rules.hasSpecial, 'One special character (!@#$%^&*)'],
                  ].map(([met, label]) => (
                    <div
                      key={label as string}
                      className={`flex items-center gap-2 text-xs ${met ? 'text-green-600' : 'text-gray-500'}`}
                    >
                      {met ? <Check className="h-3 w-3 shrink-0" /> : <X className="h-3 w-3 shrink-0" />}
                      {label as string}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm new password
              </label>
              <div className="relative">
                <input
                  name="confirm_password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className={`w-full p-3 pr-12 border rounded-lg focus:ring-2 focus:border-transparent ${
                    confirmPassword.length > 0
                      ? passwordsMatch
                        ? 'border-green-400 focus:ring-green-500'
                        : 'border-red-400 focus:ring-red-500'
                      : 'focus:ring-blue-500'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-xs text-red-600 mt-1">Passwords do not match.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !allRulesMet || !passwordsMatch}
              className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 font-medium mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
