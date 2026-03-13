'use client'

import { useState, useRef } from 'react'
import { createResource, uploadResourceFile } from './actions'
import { FileText, Link as LinkIcon, X, Loader2, Upload, Plus } from 'lucide-react'

const CATEGORIES = [
  'Tools',
  'Documents',
  'Templates',
  'Guides',
  'Books',
  'Videos',
  'Podcasts',
  'Other'
]

export function ResourceUploadForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resourceType, setResourceType] = useState<'file' | 'link'>('file')
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0])
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    const result = await uploadResourceFile(formData)

    if (result.error) {
      setError(result.error)
    } else if (result.fileUrl) {
      setUploadedFileUrl(result.fileUrl)
      setFileName(file.name)
    }

    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set('category', selectedCategory)

    if (resourceType === 'file') {
      if (!uploadedFileUrl) {
        setError('Please upload a file first')
        setLoading(false)
        return
      }
      formData.set('file_url', uploadedFileUrl)
      formData.delete('external_url')
    } else {
      formData.delete('file_url')
    }

    const result = await createResource(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      formRef.current?.reset()
      setUploadedFileUrl(null)
      setFileName(null)
      setSelectedCategory(CATEGORIES[0])
      setResourceType('file')
      setError(null)
      setLoading(false)
      setIsOpen(false)
    }
  }

  const resetForm = () => {
    setIsOpen(false)
    setUploadedFileUrl(null)
    setFileName(null)
    setSelectedCategory(CATEGORIES[0])
    setResourceType('file')
    setError(null)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
      >
        <Plus className="h-5 w-5" />
        Share a Resource
      </button>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Share a Resource</h3>
        <button
          onClick={resetForm}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
        {/* Resource Type Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resource Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setResourceType('file')}
              className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                resourceType === 'file'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FileText className={`h-6 w-6 ${resourceType === 'file' ? 'text-blue-600' : 'text-gray-400'}`} />
              <div className="text-left">
                <p className={`font-medium ${resourceType === 'file' ? 'text-gray-900' : 'text-gray-600'}`}>
                  Upload File
                </p>
                <p className="text-xs text-gray-500">PDF, DOC, images, etc.</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setResourceType('link')}
              className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                resourceType === 'link'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <LinkIcon className={`h-6 w-6 ${resourceType === 'link' ? 'text-green-600' : 'text-gray-400'}`} />
              <div className="text-left">
                <p className={`font-medium ${resourceType === 'link' ? 'text-gray-900' : 'text-gray-600'}`}>
                  External Link
                </p>
                <p className="text-xs text-gray-500">Website, article, video</p>
              </div>
            </button>
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            maxLength={200}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Give your resource a clear title"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* File Upload or URL Input */}
        {resourceType === 'file' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Upload
            </label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.zip"
            />
            
            {uploadedFileUrl ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
                <span className="flex-1 text-sm text-green-800 truncate">{fileName}</span>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedFileUrl(null)
                    setFileName(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors flex flex-col items-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                    <span className="text-sm text-gray-600">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-600">Click to upload or drag and drop</span>
                    <span className="text-xs text-gray-400">PDF, DOC, XLS, PPT, images, ZIP (max 50MB)</span>
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <div>
            <label htmlFor="external_url" className="block text-sm font-medium text-gray-700 mb-2">
              External URL
            </label>
            <input
              type="url"
              id="external_url"
              name="external_url"
              required={resourceType === 'link'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/resource"
            />
          </div>
        )}

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-gray-400">(optional, supports Markdown)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            maxLength={2000}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Describe what this resource is about and how it can help others..."
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={resetForm}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || uploading || (resourceType === 'file' && !uploadedFileUrl)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Share Resource
          </button>
        </div>
      </form>
    </div>
  )
}
