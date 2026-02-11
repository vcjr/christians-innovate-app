'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { Camera, Save, Loader2, Download, Trash2, CheckCircle, HardDrive, RefreshCw, LogOut } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  getCachedTranslations,
  downloadTranslationForOffline,
  removeCachedTranslation,
  getStorageInfo,
} from '@/utils/bible-offline'
import { BIBLE_TRANSLATIONS, type TranslationKey } from '@/utils/bible-constants'
import {
  resetInstallPromptDismissal,
  isInstallPromptDismissed,
  getDaysUntilPromptReappears,
} from '@/utils/install-prompt'

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
  const [skillInput, setSkillInput] = useState('')
  const [interestInput, setInterestInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // PWA offline state
  const [cachedTranslations, setCachedTranslations] = useState<string[]>([])
  const [downloadingTranslation, setDownloadingTranslation] = useState<string | null>(null)
  const [storageInfo, setStorageInfo] = useState<{
    usage: number
    quota: number
    percentUsed: number
  } | null>(null)
  const [installPromptDismissed, setInstallPromptDismissed] = useState(false)
  const [daysUntilPrompt, setDaysUntilPrompt] = useState<number | null>(null)

  const supabase = createClient()
  const router = useRouter()

  // Constants
  const TRANSLATION_FILE_SIZE = '~5-6 MB'

  // Load cached translations on mount
  useEffect(() => {
    async function loadOfflineData() {
      const cached = await getCachedTranslations()
      setCachedTranslations(cached)

      const storage = await getStorageInfo()
      setStorageInfo(storage)

      // Check install prompt state
      setInstallPromptDismissed(isInstallPromptDismissed())
      setDaysUntilPrompt(getDaysUntilPromptReappears())
    }
    loadOfflineData()
  }, [])

  const translationNames: Record<string, string> = {
    KJV: 'King James Version',
    NKJV: 'New King James Version',
    ESV: 'English Standard Version',
    NIV: 'New International Version',
    NLT: 'New Living Translation',
    NASB: 'New American Standard Bible',
    MSG: 'The Message',
  }

  async function handleDownloadTranslation(translation: string) {
    setDownloadingTranslation(translation)
    const result = await downloadTranslationForOffline(translation as TranslationKey)

    if (result.success) {
      const cached = await getCachedTranslations()
      setCachedTranslations(cached)

      const storage = await getStorageInfo()
      setStorageInfo(storage)

      setMessage({ type: 'success', text: `${translation} downloaded for offline use` })
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to download translation' })
    }

    setDownloadingTranslation(null)
  }

  async function handleRemoveTranslation(translation: string) {
    const result = await removeCachedTranslation(translation as TranslationKey)

    if (result.success) {
      const cached = await getCachedTranslations()
      setCachedTranslations(cached)

      const storage = await getStorageInfo()
      setStorageInfo(storage)

      setMessage({ type: 'success', text: `${translation} removed from offline storage` })
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to remove translation' })
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

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

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
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
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
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
            <p className="text-sm text-gray-600 mb-4">Let others know what type of partnerships you&apos;re interested in</p>

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
                  <p className="text-sm text-gray-500">I&apos;m open to business collaboration and partnership opportunities</p>
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
                  <p className="text-sm text-gray-500">I&apos;m looking for someone to help keep me accountable in my faith and goals</p>
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

        {/* Offline Downloads Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Offline Bible Access</h2>
            <p className="text-sm text-gray-600 mb-4">Download Bible translations for offline reading</p>
          </div>

          {/* Storage Info */}
          {storageInfo && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Storage Used</span>
                </div>
                <span className="text-sm text-gray-600">
                  {formatBytes(storageInfo.usage)} of {formatBytes(storageInfo.quota)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${storageInfo.percentUsed > 80 ? 'bg-red-600' : storageInfo.percentUsed > 50 ? 'bg-yellow-600' : 'bg-blue-600'
                    }`}
                  style={{ width: `${Math.min(storageInfo.percentUsed, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {storageInfo.percentUsed.toFixed(1)}% used
              </p>
            </div>
          )}

          {/* Translation Downloads */}
          <div className="space-y-2 mb-4">
            {Object.entries(BIBLE_TRANSLATIONS).map(([key]) => {
              const isCached = cachedTranslations.includes(key)
              const isDownloading = downloadingTranslation === key

              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition"
                >
                  <div className="flex items-center gap-3">
                    {isCached ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{key}</p>
                      <p className="text-sm text-gray-500">{translationNames[key]}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCached ? (
                      <>
                        <span className="text-xs text-green-600 font-medium">Downloaded</span>
                        <button
                          onClick={() => handleRemoveTranslation(key)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Remove from offline storage"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleDownloadTranslation(key)}
                        disabled={isDownloading}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            Download
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Each translation is approximately 5-6 MB. Downloaded translations will be available for reading even when you&apos;re offline.
            </p>
          </div>
        </div>

        {/* App Installation */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">App Installation</h2>
          <p className="text-sm text-gray-600 mb-4">
            Install Christians Innovate on your device for a native app experience
          </p>

          <div className="space-y-4">
            {installPromptDismissed ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-3">
                  You previously dismissed the install prompt.
                  {daysUntilPrompt !== null && daysUntilPrompt > 0 && (
                    <span className="text-gray-500">
                      {' '}It will appear again in {daysUntilPrompt} day{daysUntilPrompt !== 1 ? 's' : ''}.
                    </span>
                  )}
                </p>
                <button
                  onClick={() => {
                    resetInstallPromptDismissal()
                    setInstallPromptDismissed(false)
                    setDaysUntilPrompt(null)
                    setMessage({
                      type: 'success',
                      text: 'Install prompt has been reset. Refresh the page to see it again.',
                    })
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <RefreshCw className="h-4 w-4" />
                  Show Install Prompt Again
                </button>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>Install prompt is enabled.</strong> You&apos;ll see the installation banner when you visit the app.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Newsletter Preferences */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Newsletter Preferences</h2>
          <p className="text-sm text-gray-600 mb-4">Choose which updates you&apos;d like to receive from us</p>

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

        {/* Translation Downloads */}
        <div className="space-y-2 mb-4">
          {Object.entries(BIBLE_TRANSLATIONS).map(([key]) => {
            const isCached = cachedTranslations.includes(key)
            const isDownloading = downloadingTranslation === key

            return (
              <div
                key={key}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition"
              >
                <div className="flex items-center gap-3">
                  {isCached ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{key}</p>
                    <p className="text-sm text-gray-500">{translationNames[key]}</p>
                    {!isCached && (
                      <p className="text-xs text-gray-400">{TRANSLATION_FILE_SIZE}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isCached ? (
                    <>
                      <span className="text-xs text-green-600 font-medium">Downloaded</span>
                      <button
                        onClick={() => handleRemoveTranslation(key)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Remove from offline storage"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleDownloadTranslation(key)}
                      disabled={isDownloading}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="hidden sm:inline">Downloading...</span>
                          <span className="sm:hidden">...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          <span className="hidden sm:inline">Download</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </form>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> Each translation is approximately {TRANSLATION_FILE_SIZE}. Downloads may take 15-60 seconds on slower connections. Downloaded translations will be available for reading even when you&apos;re offline.
          </p>
        </div>
      </div>
    </>
  )
}
