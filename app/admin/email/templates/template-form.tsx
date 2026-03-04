'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useFormStatus } from 'react-dom'
import { EmailEditor } from './email-editor'
import { VariablePicker } from './variable-picker'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { EmailTemplate } from '@/utils/email/types'

interface TemplateFormProps {
  template?: EmailTemplate
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving...
        </>
      ) : (
        'Save Template'
      )}
    </button>
  )
}

export function TemplateForm({ template, action }: TemplateFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [subject, setSubject] = useState(template?.subject || '')
  const [bodyHtml, setBodyHtml] = useState(template?.body_html || '')
  const subjectInputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)

    // Add the HTML content to form data
    formData.set('body_html', bodyHtml)

    const result = await action(formData)

    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      router.push('/admin/email/templates')
    }
  }

  const handleInsertVariable = (variable: string) => {
    // Insert at cursor position in body HTML
    setBodyHtml((prev) => prev + variable)
  }

  const handleInsertVariableInSubject = (variable: string) => {
    const input = subjectInputRef.current
    if (input) {
      const start = input.selectionStart || 0
      const end = input.selectionEnd || 0
      const newSubject =
        subject.substring(0, start) + variable + subject.substring(end)
      setSubject(newSubject)

      // Set cursor position after inserted variable
      setTimeout(() => {
        input.focus()
        input.setSelectionRange(start + variable.length, start + variable.length)
      }, 0)
    } else {
      setSubject((prev) => prev + variable)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {template && <input type="hidden" name="id" value={template.id} />}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Template Key (only for new templates) */}
      {!template && (
        <div>
          <label
            htmlFor="template_key"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Template Key *
          </label>
          <input
            type="text"
            id="template_key"
            name="template_key"
            required
            placeholder="e.g., daily-reminder, welcome, meeting-reminder"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">
            Unique identifier for this template (cannot be changed later)
          </p>
        </div>
      )}

      {/* Template Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Template Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={template?.name}
          placeholder="e.g., Daily Reading Reminder"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={template?.description || ''}
          placeholder="Brief description of when this template is used"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Subject Line */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="subject"
            className="block text-sm font-medium text-gray-700"
          >
            Subject Line *
          </label>
          <VariablePicker onInsert={handleInsertVariableInSubject} />
        </div>
        <input
          ref={subjectInputRef}
          type="text"
          id="subject"
          name="subject"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g., Today's Reading: {{day.scripture}}"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
        />
      </div>

      {/* Email Body */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Email Body *
          </label>
          <VariablePicker onInsert={handleInsertVariable} />
        </div>
        <EmailEditor content={bodyHtml} onChange={setBodyHtml} />
      </div>

      {/* Plain Text Version */}
      <div>
        <label
          htmlFor="body_text"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Plain Text Version (Optional)
        </label>
        <textarea
          id="body_text"
          name="body_text"
          rows={6}
          defaultValue={template?.body_text || ''}
          placeholder="Plain text version for email clients that don't support HTML"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
        />
      </div>

      {/* Active Toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_active"
          name="is_active"
          value="true"
          defaultChecked={template?.is_active !== false}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
          Template is active
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link
          href="/admin/email/templates"
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
        >
          Cancel
        </Link>
        <SubmitButton />
      </div>
    </form>
  )
}
