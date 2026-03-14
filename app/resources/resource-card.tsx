'use client'

import { useState } from 'react'
import { deleteResource, toggleResourceActive, adminHideResource, adminDeleteResource } from './actions'
import { FileText, Link as LinkIcon, Download, Trash2, Loader2, Power, Eye, EyeOff, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'

interface Resource {
  id: string
  user_id: string
  title: string
  description: string | null
  file_url: string | null
  external_url: string | null
  category: string
  is_active: boolean
  is_hidden: boolean
  created_at: string
  user_profiles?: {
    full_name: string | null
    avatar_url: string | null
  }
}

interface ResourceCardProps {
  resource: Resource
  currentUserId: string
  isAdmin: boolean
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  'Tools': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'Documents': { bg: 'bg-green-100', text: 'text-green-700' },
  'Templates': { bg: 'bg-purple-100', text: 'text-purple-700' },
  'Guides': { bg: 'bg-orange-100', text: 'text-orange-700' },
  'Books': { bg: 'bg-red-100', text: 'text-red-700' },
  'Videos': { bg: 'bg-pink-100', text: 'text-pink-700' },
  'Podcasts': { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  'Other': { bg: 'bg-gray-100', text: 'text-gray-700' }
}

export function ResourceCard({ resource, currentUserId, isAdmin }: ResourceCardProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [actionType, setActionType] = useState<string | null>(null)

  const isOwner = resource.user_id === currentUserId
  const isLoading = loadingId === resource.id
  const userName = resource.user_profiles?.full_name || 'Anonymous'
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase()

  const categoryStyle = categoryColors[resource.category] || categoryColors['Other']

  const handleToggleActive = async () => {
    setLoadingId(resource.id)
    setActionType('toggle')
    await toggleResourceActive(resource.id, resource.is_active)
    setLoadingId(null)
    setActionType(null)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this resource?')) return

    setLoadingId(resource.id)
    setActionType('delete')
    await deleteResource(resource.id)
    setLoadingId(null)
    setActionType(null)
  }

  const handleAdminHide = async () => {
    setLoadingId(resource.id)
    setActionType('hide')
    await adminHideResource(resource.id, !resource.is_hidden)
    setLoadingId(null)
    setActionType(null)
  }

  const handleAdminDelete = async () => {
    if (!confirm('Are you sure you want to delete this resource as admin?')) return

    setLoadingId(resource.id)
    setActionType('adminDelete')
    await adminDeleteResource(resource.id)
    setLoadingId(null)
    setActionType(null)
  }

  const getResourceUrl = () => {
    return resource.file_url || resource.external_url || '#'
  }

  const isFileResource = !!resource.file_url

  return (
    <div
      className={`bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition ${
        resource.is_hidden ? 'opacity-60 border-orange-300' : 'border-gray-200'
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        {/* Resource Type Icon */}
        <div className={`p-3 rounded-lg ${isFileResource ? 'bg-blue-100' : 'bg-green-100'}`}>
          {isFileResource ? (
            <FileText className="h-6 w-6 text-blue-600" />
          ) : (
            <LinkIcon className="h-6 w-6 text-green-600" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 truncate">{resource.title}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${categoryStyle.bg} ${categoryStyle.text}`}>
                  {resource.category}
                </span>
                {!resource.is_active && (
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                    Inactive
                  </span>
                )}
                {resource.is_hidden && (
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                    Hidden
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {resource.description && (
        <div className="prose prose-sm max-w-none text-gray-600 mb-4 line-clamp-3">
          <ReactMarkdown>{resource.description}</ReactMarkdown>
        </div>
      )}

      {/* Author & Date */}
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
        {resource.user_profiles?.avatar_url ? (
          <Image
            src={resource.user_profiles.avatar_url}
            alt={userName}
            width={24}
            height={24}
            className="rounded-full"
          />
        ) : (
          <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
            {userInitials}
          </div>
        )}
        <span>{userName}</span>
        <span>•</span>
        <span>{new Date(resource.created_at).toLocaleDateString()}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        {/* View/Download Button */}
        <a
          href={getResourceUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition"
        >
          {isFileResource ? (
            <>
              <Download className="h-4 w-4" />
              Download
            </>
          ) : (
            <>
              <ExternalLink className="h-4 w-4" />
              View Link
            </>
          )}
        </a>

        {/* Owner/Admin Actions */}
        {(isOwner || isAdmin) && (
          <div className="flex gap-2">
            {isOwner && (
              <>
                <button
                  onClick={handleToggleActive}
                  disabled={isLoading && actionType === 'toggle'}
                  className={`p-2 rounded-lg text-sm font-medium ${
                    resource.is_active
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  } disabled:opacity-50`}
                  title={resource.is_active ? 'Deactivate' : 'Activate'}
                >
                  {isLoading && actionType === 'toggle' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Power className="h-4 w-4" />
                  )}
                </button>

                <button
                  onClick={handleDelete}
                  disabled={isLoading && actionType === 'delete'}
                  className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
                  title="Delete"
                >
                  {isLoading && actionType === 'delete' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </>
            )}

            {isAdmin && !isOwner && (
              <>
                <button
                  onClick={handleAdminHide}
                  disabled={isLoading && actionType === 'hide'}
                  className="p-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 disabled:opacity-50"
                  title={resource.is_hidden ? 'Unhide' : 'Hide'}
                >
                  {isLoading && actionType === 'hide' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : resource.is_hidden ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>

                <button
                  onClick={handleAdminDelete}
                  disabled={isLoading && actionType === 'adminDelete'}
                  className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
                  title="Delete as Admin"
                >
                  {isLoading && actionType === 'adminDelete' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
