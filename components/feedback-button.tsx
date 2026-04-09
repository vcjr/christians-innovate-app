"use client"

import { useState, useEffect, useRef } from 'react'
import { MessageSquareMore, X, Bug, Lightbulb, MessageCircle, Send, CheckCircle2, ImagePlus, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

function isSafeBlobUrl(url: string | null): url is string {
  return typeof url === 'string' && /^blob:/.test(url)
}

const TYPES = [
  { value: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'feature', label: 'Feature Idea', icon: Lightbulb, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { value: 'general', label: 'General', icon: MessageCircle, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
] as const

interface FeedbackButtonProps {
  userId?: string
  appSlug?: string
}

export function FeedbackButton({ userId, appSlug }: FeedbackButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-full shadow-lg shadow-slate-900/20 hover:bg-indigo-600 transition-all active:scale-95 group"
      >
        <MessageSquareMore size={16} className="group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {open && (
        <FeedbackModal
          onClose={() => setOpen(false)}
          userId={userId}
          appSlug={appSlug}
        />
      )}
    </>
  )
}

function FeedbackModal({ onClose, userId, appSlug }: { onClose: () => void; userId?: string; appSlug?: string }) {
  const [type, setType] = useState('bug')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [email, setEmail] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = modalRef.current
    if (!el) return

    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length) focusable[0].focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab' || !focusable.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }

    el.addEventListener('keydown', handleKeyDown)
    return () => el.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handleScreenshot(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview)
    setScreenshot(file)
    setScreenshotPreview(file ? URL.createObjectURL(file) : null)
  }

  function removeScreenshot() {
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview)
    setScreenshot(null)
    setScreenshotPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return

    setSubmitting(true)
    setError('')

    try {
      let screenshotUrl: string | null = null

      if (screenshot && userId) {
        setUploading(true)
        const supabase = createClient()
        const fileExt = screenshot.name.split('.').pop()
        const filePath = `${userId}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('feedback-screenshots')
          .upload(filePath, screenshot)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('feedback-screenshots')
          .getPublicUrl(filePath)

        screenshotUrl = publicUrl
        setUploading(false)
      }

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId ?? null,
          email: email.trim() || null,
          app_slug: appSlug || null,
          type,
          subject: subject.trim() || null,
          body: body.trim(),
          screenshot: screenshotUrl,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          website: honeypot,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Something went wrong.')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setUploading(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div ref={modalRef} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="Send Feedback">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            {submitted ? 'Thank you!' : 'Send Feedback'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>
            <p className="text-lg font-semibold text-slate-800">We got your feedback!</p>
            <p className="text-sm text-slate-500">We read every submission. Thanks for helping us improve.</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 bg-slate-900 text-white font-semibold text-sm rounded-xl hover:bg-indigo-600 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Honeypot */}
            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              autoComplete="off"
              tabIndex={-1}
              aria-hidden="true"
              style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0 }}
            />

            {appSlug && (
              <div className="text-xs text-slate-400 font-medium">
                Reporting for: <span className="text-slate-600 font-semibold">{appSlug}</span>
              </div>
            )}

            {/* Type picker */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">What kind of feedback?</label>
              <div className="flex gap-2">
                {TYPES.map((t) => {
                  const Icon = t.icon
                  const isActive = type === t.value
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        isActive
                          ? t.color + ' ring-2 ring-offset-1 ring-current'
                          : 'text-slate-400 bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Icon size={14} />
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label htmlFor="fb-subject" className="text-sm font-semibold text-slate-700">
                Subject <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="fb-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What happened?"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <label htmlFor="fb-body" className="text-sm font-semibold text-slate-700">
                Details <span className="text-red-400">*</span>
              </label>
              <textarea
                id="fb-body"
                required
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Tell us more..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
              />
            </div>

            {/* Screenshot */}
            {userId && (
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700">
                  Screenshot <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                {isSafeBlobUrl(screenshotPreview) ? (
                  <div className="relative inline-block">
                    <img
                      src={screenshotPreview}
                      alt="Screenshot preview"
                      className="max-h-32 rounded-lg border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={removeScreenshot}
                      className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow border border-slate-200 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="fb-screenshot"
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
                    >
                      <ImagePlus size={14} />
                      Attach screenshot
                    </label>
                    <input
                      id="fb-screenshot"
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshot}
                      className="hidden"
                    />
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-1">JPG, PNG or GIF. Max 5MB.</p>
              </div>
            )}

            {/* Email — only shown when not logged in */}
            {!userId && (
              <div className="space-y-1.5">
                <label htmlFor="fb-email" className="text-sm font-semibold text-slate-700">
                  Email <span className="text-slate-400 font-normal">(optional, for follow-up)</span>
                </label>
                <input
                  id="fb-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || uploading || !body.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting || uploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {uploading ? 'Uploading screenshot...' : 'Sending...'}
                </>
              ) : (
                <>
                  <Send size={14} />
                  Send Feedback
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
