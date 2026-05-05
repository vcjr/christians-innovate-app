'use client'

import { useState } from 'react'
import { signup } from './actions'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2, Check, X, Eye, EyeOff } from 'lucide-react'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [showRequirements, setShowRequirements] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Password validation rules
  const passwordRules = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }

  const allRulesMet = Object.values(passwordRules).every(rule => rule)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate password before submission
    if (!allRulesMet) {
      setError('Please ensure your password meets all requirements')
      setLoading(false)
      return
    }

    const formData = new FormData(e.currentTarget)
    const result = await signup(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    // If successful, the server action will redirect
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

        {/* Form Container */}
        <div className="bg-white border rounded-xl shadow-lg p-6 sm:p-8">
          <h1 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">
            Join the Community
          </h1>

          <p className="text-gray-600 text-center mb-4 sm:mb-6 text-sm">
            Sign up to be part of Christians Innovate and receive updates on our programs.
          </p>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                type="text"
                placeholder="Your full name"
                className="w-full p-3 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                type="email"
                placeholder="your@email.com"
                className="w-full p-3 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  className="w-full p-3 pr-12 border rounded"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setShowRequirements(true)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Password Requirements */}
              {showRequirements && (
                <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
                  <p className="text-xs font-medium text-gray-700 mb-2">Password must contain:</p>

                  <div className="space-y-1">
                    <div className={`flex items-center gap-2 text-xs ${passwordRules.minLength ? 'text-green-600' : 'text-gray-600'}`}>
                      {passwordRules.minLength ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      <span>At least 8 characters</span>
                    </div>

                    <div className={`flex items-center gap-2 text-xs ${passwordRules.hasUppercase ? 'text-green-600' : 'text-gray-600'}`}>
                      {passwordRules.hasUppercase ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      <span>One uppercase letter (A-Z)</span>
                    </div>

                    <div className={`flex items-center gap-2 text-xs ${passwordRules.hasLowercase ? 'text-green-600' : 'text-gray-600'}`}>
                      {passwordRules.hasLowercase ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      <span>One lowercase letter (a-z)</span>
                    </div>

                    <div className={`flex items-center gap-2 text-xs ${passwordRules.hasNumber ? 'text-green-600' : 'text-gray-600'}`}>
                      {passwordRules.hasNumber ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      <span>One number (0-9)</span>
                    </div>

                    <div className={`flex items-center gap-2 text-xs ${passwordRules.hasSpecial ? 'text-green-600' : 'text-gray-600'}`}>
                      {passwordRules.hasSpecial ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      <span>One special character (!@#$%^&*)</span>
                    </div>
                  </div>

                  {allRulesMet && (
                    <div className="pt-2 border-t border-gray-200 mt-2">
                      <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Password meets all requirements
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I want to join:
              </label>
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    name="ci_updates"
                    value="true"
                    className="mt-1"
                    defaultChecked
                  />
                  <div>
                    <div className="font-medium">CI Updates</div>
                    <div className="text-sm text-gray-600">News, events, and community updates</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    name="bible_year"
                    value="true"
                    className="mt-1"
                    defaultChecked
                  />
                  <div>
                    <div className="font-medium">Bible Year</div>
                    <div className="text-sm text-gray-600">Systematic Scripture study initiative</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    name="skill_share"
                    value="true"
                    className="mt-1"
                    defaultChecked
                  />
                  <div>
                    <div className="font-medium">Skill Share</div>
                    <div className="text-sm text-gray-600">Iron sharpens iron sessions</div>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Who referred you? (optional)
              </label>
              <input
                name="referral"
                type="text"
                placeholder="Name of person who referred you"
                className="w-full p-3 border rounded"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 font-medium mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign Up
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
