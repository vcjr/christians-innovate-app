'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { Bell, Save, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  user_id: string
  ci_updates: boolean
  bible_year: boolean
  skill_share: boolean
}

interface PreferencesFormProps {
  user: SupabaseUser
  profile: Profile
}

export function PreferencesForm({ user, profile }: PreferencesFormProps) {
  const [ciUpdates, setCiUpdates] = useState(profile.ci_updates)
  const [bibleYear, setBibleYear] = useState(profile.bible_year)
  const [skillShare, setSkillShare] = useState(profile.skill_share)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          ci_updates: ciUpdates,
          bible_year: bibleYear,
          skill_share: skillShare,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) {
        throw error
      }

      setMessage({ type: 'success', text: 'Preferences updated successfully!' })
      router.refresh()
    } catch (error) {
      console.error('Error updating preferences:', error)
      setMessage({ type: 'error', text: 'Error updating preferences. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Newsletter Preferences */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Newsletter Preferences</h2>
        </div>
        <p className="text-sm text-gray-600 mb-6">Choose which updates you&apos;d like to receive from us</p>

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

      {/* Save Button */}
      <button
        type="submit"
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-5 w-5" />
            Save Preferences
          </>
        )}
      </button>
    </form>
  )
}
