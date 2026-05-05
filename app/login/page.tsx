import { login } from './actions'
import Image from 'next/image'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const params = await searchParams

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
          <h1 className="text-xl sm:text-2xl font-bold text-center mb-6">
            Welcome Back
          </h1>

          {params?.message && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-sm mb-4">
              {params.message}
            </div>
          )}

          <form className="flex flex-col gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-800">
                  Forgot password?
                </Link>
              </div>
              <input
                name="password"
                type="password"
                placeholder="Your password"
                className="w-full p-3 border rounded"
                required
              />
            </div>

            <button
              formAction={login}
              className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 font-medium mt-2"
            >
              Log In
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}