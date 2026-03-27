'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { Camera, Save, Loader2, Eye, EyeOff, Check, X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  ci_updates: boolean
  bible_year: boolean
  skill_share: boolean
  referral: string | null
  skills: string[]
  interests: string[]
  looking_for_business_partner: boolean
  looking_for_accountability_partner: boolean
  bio: string | null
  linkedin_url: string | null
  facebook_url: string | null
  twitter_url: string | null
  website_url: string | null
  email_notifications_enabled: boolean
  daily_reminder_enabled: boolean
  meeting_reminder_enabled: boolean
  weekly_digest_enabled: boolean
  created_at: string
  updated_at: string
}

interface SettingsFormProps {
  user: SupabaseUser
  profile: Profile
}

export function SettingsForm({ user, profile }: SettingsFormProps) {
  const [fullName, setFullName] = useState(profile.full_name || user.user_metadata?.full_name || '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')
  const [ciUpdates, setCiUpdates] = useState(profile.ci_updates)
  const [bibleYear, setBibleYear] = useState(profile.bible_year)
  const [skillShare, setSkillShare] = useState(profile.skill_share)
  const [bio, setBio] = useState(profile.bio || '')
  const [skills, setSkills] = useState<string[]>(profile.skills || [])
  const [interests, setInterests] = useState<string[]>(profile.interests || [])
  const [lookingForBusinessPartner, setLookingForBusinessPartner] = useState(profile.looking_for_business_partner)
  const [lookingForAccountabilityPartner, setLookingForAccountabilityPartner] = useState(profile.looking_for_accountability_partner)
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url || '')
  const [facebookUrl, setFacebookUrl] = useState(profile.facebook_url || '')
  const [twitterUrl, setTwitterUrl] = useState(profile.twitter_url || '')
  const [websiteUrl, setWebsiteUrl] = useState(profile.website_url || '')
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(profile.email_notifications_enabled ?? true)
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(profile.daily_reminder_enabled ?? true)
  const [meetingReminderEnabled, setMeetingReminderEnabled] = useState(profile.meeting_reminder_enabled ?? true)
  const [weeklyDigestEnabled, setWeeklyDigestEnabled] = useState(profile.weekly_digest_enabled ?? true)
  const [skillInput, setSkillInput] = useState('')
  const [interestInput, setInterestInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Email change state
  const [newEmail, setNewEmail] = useState('')
  const [changingEmail, setChangingEmail] = useState(false)
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()
  const router = useRouter()

  const passwordRules = {
    minLength: newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(newPassword),
    hasLowercase: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  }
  const allPasswordRulesMet = Object.values(passwordRules).every(Boolean)
  const passwordsMatch = newPassword === confirmNewPassword && confirmNewPassword.length > 0

  function getInitials(name: string): string {
    if (!name) return user.email?.[0]?.toUpperCase() || 'U'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true)
      setMessage(null)

      if (!event.target.files || event.target.files.length === 0) {
        return
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/avatar.${fileExt}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setAvatarUrl(publicUrl)
      setMessage({ type: 'success', text: 'Avatar uploaded! Remember to save your changes.' })
    } catch (error) {
      console.error('Error uploading avatar:', error)
      setMessage({ type: 'error', text: 'Error uploading avatar. Please try again.' })
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      // Update auth.users metadata (this will trigger sync to user_profiles via database trigger)
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() || null }
      })

      if (authError) {
        console.error('Auth update error:', authError)
        throw authError
      }

      // Update user_profiles (avatar, and full_name for immediate consistency)
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .update({
          full_name: fullName.trim() || null,
          avatar_url: avatarUrl || null,
          ci_updates: ciUpdates,
          bible_year: bibleYear,
          skill_share: skillShare,
          bio: bio.trim() || null,
          skills,
          interests,
          looking_for_business_partner: lookingForBusinessPartner,
          looking_for_accountability_partner: lookingForAccountabilityPartner,
          linkedin_url: linkedinUrl.trim() || null,
          facebook_url: facebookUrl.trim() || null,
          twitter_url: twitterUrl.trim() || null,
          website_url: websiteUrl.trim() || null,
          email_notifications_enabled: emailNotificationsEnabled,
          daily_reminder_enabled: dailyReminderEnabled,
          meeting_reminder_enabled: meetingReminderEnabled,
          weekly_digest_enabled: weeklyDigestEnabled,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()

      if (profileError) {
        console.error('Profile update error:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        })
        throw new Error(profileError.message || 'Failed to update profile')
      }

      console.log('Profile updated successfully:', profileData)

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      router.refresh()
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: 'Error updating profile. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPasswordMessage(null)

    if (!allPasswordRulesMet) {
      setPasswordMessage({ type: 'error', text: 'New password does not meet the requirements.' })
      return
    }
    if (!passwordsMatch) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' })
      return
    }

    setChangingPassword(true)
    try {
      // Verify current password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      })
      if (signInError) {
        setPasswordMessage({ type: 'error', text: 'Current password is incorrect.' })
        return
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setPasswordMessage({ type: 'error', text: error.message })
        return
      }

      setPasswordMessage({ type: 'success', text: 'Password updated successfully.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch {
      setPasswordMessage({ type: 'error', text: 'Something went wrong. Please try again.' })
    } finally {
      setChangingPassword(false)
    }
  }

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault()
    setEmailMessage(null)

    if (!newEmail || newEmail === user.email) {
      setEmailMessage({ type: 'error', text: 'Please enter a different email address.' })
      return
    }

    setChangingEmail(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) {
        setEmailMessage({ type: 'error', text: error.message })
        return
      }
      setEmailMessage({
        type: 'success',
        text: `Confirmation sent to ${newEmail}. Click the link in that email to complete the change.`,
      })
      setNewEmail('')
    } catch {
      setEmailMessage({ type: 'error', text: 'Something went wrong. Please try again.' })
    } finally {
      setChangingEmail(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h2>

        <div className="flex items-center gap-6">
          {/* Avatar Display */}
          <div className="relative">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Avatar"
                width={96}
                height={96}
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-semibold border-4 border-gray-100">
                {getInitials(fullName)}
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div>
            <label
              htmlFor="avatar-upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer font-medium disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  Upload Photo
                </>
              )}
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={uploadAvatar}
              disabled={uploading}
              className="hidden"
            />
            <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max 5MB.</p>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={user.email || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              To change your email address, use the{' '}
              <button
                type="button"
                onClick={() => document.getElementById('change-email-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-blue-600 hover:underline"
              >
                Email Address section
              </button>{' '}
              below.
            </p>
          </div>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Skills & Interests */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills & Interests</h2>

          <div className="space-y-6">
            {/* Skills */}
            <div>
              <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">
                Skills
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  id="skills"
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (skillInput.trim() && !skills.includes(skillInput.trim())) {
                        setSkills([...skills, skillInput.trim()])
                        setSkillInput('')
                      }
                    }
                  }}
                  placeholder="Add a skill and press Enter"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
                      setSkills([...skills, skillInput.trim()])
                      setSkillInput('')
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => setSkills(skills.filter((_, i) => i !== index))}
                      className="hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div>
              <label htmlFor="interests" className="block text-sm font-medium text-gray-700 mb-1">
                Interests
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  id="interests"
                  type="text"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (interestInput.trim() && !interests.includes(interestInput.trim())) {
                        setInterests([...interests, interestInput.trim()])
                        setInterestInput('')
                      }
                    }
                  }}
                  placeholder="Add an interest and press Enter"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (interestInput.trim() && !interests.includes(interestInput.trim())) {
                      setInterests([...interests, interestInput.trim()])
                      setInterestInput('')
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => setInterests(interests.filter((_, i) => i !== index))}
                      className="hover:text-green-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Partnership Preferences */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Looking For</h2>
          <p className="text-sm text-gray-600 mb-4">Let others know what type of partnerships you're interested in</p>

          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={lookingForBusinessPartner}
                onChange={(e) => setLookingForBusinessPartner(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 group-hover:text-blue-600 transition">Business Partners</p>
                <p className="text-sm text-gray-500">I'm open to business collaboration and partnership opportunities</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={lookingForAccountabilityPartner}
                onChange={(e) => setLookingForAccountabilityPartner(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 group-hover:text-blue-600 transition">Accountability Partners</p>
                <p className="text-sm text-gray-500">I'm looking for someone to help keep me accountable in my faith and goals</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Social Media & Website */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Media & Website</h2>
        <p className="text-sm text-gray-600 mb-4">Add your social media profiles and website</p>

        <div className="space-y-4">
          <div>
            <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn URL
            </label>
            <input
              id="linkedinUrl"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/yourprofile"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="facebookUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Facebook URL
            </label>
            <input
              id="facebookUrl"
              type="url"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="https://facebook.com/yourprofile"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="twitterUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Twitter/X URL
            </label>
            <input
              id="twitterUrl"
              type="url"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              placeholder="https://twitter.com/yourhandle"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Website URL
            </label>
            <input
              id="websiteUrl"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourwebsite.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Email Notifications */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h2>
        <p className="text-sm text-gray-600 mb-4">Manage your email notification preferences</p>

        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={emailNotificationsEnabled}
              onChange={(e) => {
                const enabled = e.target.checked
                setEmailNotificationsEnabled(enabled)
                // If turning off master switch, disable all sub-options
                if (!enabled) {
                  setDailyReminderEnabled(false)
                  setMeetingReminderEnabled(false)
                  setWeeklyDigestEnabled(false)
                }
              }}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition">Enable Email Notifications</p>
              <p className="text-sm text-gray-500">Master toggle for all email notifications from Christians Innovate</p>
            </div>
          </label>

          <div className={`ml-7 pl-4 border-l-2 ${emailNotificationsEnabled ? 'border-blue-500' : 'border-gray-300 opacity-50'} space-y-4`}>
            <label className={`flex items-start gap-3 ${emailNotificationsEnabled ? 'cursor-pointer' : 'cursor-not-allowed'} group`}>
              <input
                type="checkbox"
                checked={dailyReminderEnabled && emailNotificationsEnabled}
                onChange={(e) => setDailyReminderEnabled(e.target.checked)}
                disabled={!emailNotificationsEnabled}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 group-hover:text-blue-600 transition">Daily Reading Reminders</p>
                <p className="text-sm text-gray-500">Get daily reminders for your Bible reading plan (sent at 8am UTC)</p>
              </div>
            </label>

            <label className={`flex items-start gap-3 ${emailNotificationsEnabled ? 'cursor-pointer' : 'cursor-not-allowed'} group`}>
              <input
                type="checkbox"
                checked={meetingReminderEnabled && emailNotificationsEnabled}
                onChange={(e) => setMeetingReminderEnabled(e.target.checked)}
                disabled={!emailNotificationsEnabled}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 group-hover:text-blue-600 transition">Meeting Reminders</p>
                <p className="text-sm text-gray-500">Receive reminders about upcoming community meetings (sent day before)</p>
              </div>
            </label>

            <label className={`flex items-start gap-3 ${emailNotificationsEnabled ? 'cursor-pointer' : 'cursor-not-allowed'} group`}>
              <input
                type="checkbox"
                checked={weeklyDigestEnabled && emailNotificationsEnabled}
                onChange={(e) => setWeeklyDigestEnabled(e.target.checked)}
                disabled={!emailNotificationsEnabled}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 group-hover:text-blue-600 transition">Weekly Digest</p>
                <p className="text-sm text-gray-500">Weekly summary of community activity and upcoming events (sent Mondays)</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Newsletter Preferences */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Newsletter Preferences</h2>
        <p className="text-sm text-gray-600 mb-4">Choose which updates you'd like to receive from us</p>

        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={ciUpdates}
              onChange={(e) => setCiUpdates(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900 group-hover:text-blue-600 transition">CI Updates</p>
              <p className="text-sm text-gray-500">Receive updates about Christians Innovate community and events</p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={bibleYear}
              onChange={(e) => setBibleYear(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900 group-hover:text-blue-600 transition">Bible in a Year</p>
              <p className="text-sm text-gray-500">Get reminders and updates for Bible reading plans</p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={skillShare}
              onChange={(e) => setSkillShare(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900 group-hover:text-blue-600 transition">Skill Share</p>
              <p className="text-sm text-gray-500">Receive notifications about skill-sharing opportunities and workshops</p>
            </div>
          </label>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Change Password</h2>
        <p className="text-sm text-gray-600 mb-4">Update the password for your Christians Innovate account.</p>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Create a new password"
                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {newPassword.length > 0 && (
              <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1">
                {([
                  [passwordRules.minLength, 'At least 8 characters'],
                  [passwordRules.hasUppercase, 'One uppercase letter'],
                  [passwordRules.hasLowercase, 'One lowercase letter'],
                  [passwordRules.hasNumber, 'One number'],
                  [passwordRules.hasSpecial, 'One special character'],
                ] as [boolean, string][]).map(([met, label]) => (
                  <div key={label} className={`flex items-center gap-2 text-xs ${met ? 'text-green-600' : 'text-gray-500'}`}>
                    {met ? <Check className="h-3 w-3 shrink-0" /> : <X className="h-3 w-3 shrink-0" />}
                    {label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Re-enter your new password"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                confirmNewPassword.length > 0
                  ? passwordsMatch
                    ? 'border-green-400 focus:ring-green-500'
                    : 'border-red-400 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              required
            />
            {confirmNewPassword.length > 0 && !passwordsMatch && (
              <p className="text-xs text-red-600 mt-1">Passwords do not match.</p>
            )}
          </div>

          {passwordMessage && (
            <div className={`p-3 rounded-lg text-sm ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {passwordMessage.text}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={changingPassword || !currentPassword || !allPasswordRulesMet || !passwordsMatch}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            >
              {changingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Change Email */}
      <div id="change-email-section" className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Email Address</h2>
        <p className="text-sm text-gray-600 mb-4">
          Update the email address associated with your account. We'll send a confirmation link to the new address before making the change.
        </p>

        <form onSubmit={handleEmailChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current email</label>
            <input
              type="email"
              value={user.email || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New email address</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="your-new@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {emailMessage && (
            <div className={`p-3 rounded-lg text-sm ${emailMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {emailMessage.text}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={changingEmail || !newEmail}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            >
              {changingEmail && <Loader2 className="h-4 w-4 animate-spin" />}
              Send Confirmation
            </button>
          </div>
        </form>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
            }`}
        >
          {message.text}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  )
}
