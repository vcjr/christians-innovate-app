'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { sendEmail } from '@/utils/email/sender'
import { renderEmailTemplate } from '@/utils/email/templates'
import { generateUnsubscribeUrl } from '@/utils/email/tokens'

export async function signup(formData: FormData) {
  console.log('=== SIGNUP PROCESS STARTED ===')

  try {
    const supabase = await createClient()
    console.log('Supabase client created successfully')

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string
    const ciUpdates = formData.get('ci_updates') === 'true'
    const bibleYear = formData.get('bible_year') === 'true'
    const skillShare = formData.get('skill_share') === 'true'
    const referral = formData.get('referral') as string

    console.log('Form data extracted:', { email, name, ciUpdates, bibleYear, skillShare, referral })

    // Server-side password validation
    const passwordRules = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    const allRulesMet = Object.values(passwordRules).every(rule => rule)
    console.log('Password validation rules:', passwordRules, 'All met:', allRulesMet)

    if (!allRulesMet) {
      console.log('Password validation failed')
      return {
        error: 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character'
      }
    }

    // Sign up the user - the handle_new_user trigger will auto-create the profile
    console.log('Attempting to sign up user with email:', email)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.christiansinnovate.com'
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/confirm?type=signup`,
        data: {
          full_name: name,
          ci_updates: ciUpdates,
          bible_year: bibleYear,
          skill_share: skillShare,
          referral: referral || null,
          has_completed_onboarding: false,
        },
      },
    })

    if (authError) {
      console.error('Auth signup error:', authError)
      return { error: authError.message }
    }

    console.log('User signup successful, user ID:', authData.user?.id)
    console.log('Profile auto-created by database trigger')

    // Send welcome email
    if (authData.user) {
      try {
        console.log('Attempting to send welcome email to:', email)

        // Fetch the welcome template
        const { data: template, error: templateError } = await supabase
          .from('email_templates')
          .select('*')
          .eq('template_key', 'welcome')
          .eq('is_active', true)
          .single()

        if (template && !templateError) {
          const unsubscribeLink = generateUnsubscribeUrl(authData.user.id, email)
          const variables = {
            user: {
              name,
              email,
              id: authData.user.id,
            },
            unsubscribe_link: unsubscribeLink,
            site_url: process.env.NEXT_PUBLIC_SITE_URL || 'https://christiansinnovate.com',
          }

          const rendered = renderEmailTemplate(
            template.subject,
            template.body_html,
            template.body_text,
            variables
          )

          await sendEmail({
            to: email,
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text,
            templateKey: 'welcome',
            userId: authData.user.id,
            metadata: {
              type: 'welcome',
            },
          })

          console.log('Welcome email sent successfully')
        } else {
          console.log('Welcome template not found or inactive, skipping email')
        }
      } catch (emailError) {
        // Don't fail signup if email fails
        console.error('Failed to send welcome email:', emailError)
      }
    }

    // Check if email confirmation is required
    if (authData.user && authData.user.confirmed_at) {
      // User is confirmed, redirect to dashboard
      console.log('User confirmed, redirecting to dashboard')
      redirect('/onboarding')
    } else {
      // Email confirmation required
      console.log('Signup complete, redirecting to login')
      redirect('/login?message=' + encodeURIComponent('Check your email to confirm your account before logging in'))
    }
  } catch (error) {
    console.error('=== UNEXPECTED SIGNUP ERROR ===')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Full error object:', JSON.stringify(error, null, 2))

    // If it's a redirect error, let it through (Next.js redirects throw)
    if (error instanceof Error && error.message?.includes('NEXT_REDIRECT')) {
      throw error
    }

    return {
      error: `Signup failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or contact support.`
    }
  }
}
