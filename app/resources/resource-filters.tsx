'use client'

import { useState, useMemo } from 'react'
import { ResourceCard } from './resource-card'
import { Search, Filter, FileText, FolderOpen } from 'lucide-react'

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

interface ResourceFiltersProps {
  resources: Resource[]
  currentUserId: string
  isAdmin: boolean
}

const CATEGORIES = [
  'All',
  'Tools',
  'Documents',
  'Templates',
  'Guides',
  'Books',
  'Videos',
  'Podcasts',
  'Other'
]

export function ResourceFilters({ resources, currentUserId, isAdmin }: ResourceFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest')

  const filteredResources = useMemo(() => {
    let filtered = [...resources]

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.description?.toLowerCase().includes(query) ||
          r.user_profiles?.full_name?.toLowerCase().includes(query)
      )
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((r) => r.category === selectedCategory)
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
    }

    return filtered
  }, [resources, searchQuery, selectedCategory, sortBy])

  // Get category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: resources.length }
    resources.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1
    })
    return counts
  }, [resources])

  return (
    <div className="space-y-6">
      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search resources..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'title')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => {
          const count = categoryCounts[category] || 0
          const isSelected = selectedCategory === category
          
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category}
              {count > 0 && (
                <span className={`text-xs ${isSelected ? 'text-blue-200' : 'text-gray-400'}`}>
                  ({count})
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-500">
        Showing {filteredResources.length} of {resources.length} resources
      </div>

      {/* Resource Grid */}
      {filteredResources.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          {resources.length === 0 ? (
            <>
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No resources yet</h3>
              <p className="text-gray-600 mb-4">Be the first to share a valuable resource with the community!</p>
            </>
          ) : (
            <>
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No matching resources</h3>
              <p className="text-gray-600">Try adjusting your search or filters.</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  )
}
