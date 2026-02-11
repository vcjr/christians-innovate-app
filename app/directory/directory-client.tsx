'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Users, Briefcase, Heart, User, Linkedin, Facebook, Twitter, Globe } from 'lucide-react'

interface UserProfile {
  id: string
  user_id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  skills: string[]
  interests: string[]
  looking_for_business_partner: boolean
  looking_for_accountability_partner: boolean
  linkedin_url: string | null
  facebook_url: string | null
  twitter_url: string | null
  website_url: string | null
}

interface DirectoryClientProps {
  profiles: UserProfile[]
  currentUserId: string
}

function getInitials(name: string | null): string {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

export function DirectoryClient({ profiles, currentUserId }: DirectoryClientProps) {
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set())
  const [expandedInterests, setExpandedInterests] = useState<Set<string>>(new Set())

  const toggleSkillsExpanded = (profileId: string) => {
    setExpandedSkills(prev => {
      const next = new Set(prev)
      if (next.has(profileId)) {
        next.delete(profileId)
      } else {
        next.add(profileId)
      }
      return next
    })
  }

  const toggleInterestsExpanded = (profileId: string) => {
    setExpandedInterests(prev => {
      const next = new Set(prev)
      if (next.has(profileId)) {
        next.delete(profileId)
      } else {
        next.add(profileId)
      }
      return next
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Member Directory</h1>
          <p className="text-gray-600">
            Connect with fellow Christians Innovate members and discover their skills and interests
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{profiles.length}</p>
                <p className="text-sm text-gray-600">Total Members</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Briefcase className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {profiles.filter(p => p.looking_for_business_partner).length}
                </p>
                <p className="text-sm text-gray-600">Seeking Business Partners</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Heart className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {profiles.filter(p => p.looking_for_accountability_partner).length}
                </p>
                <p className="text-sm text-gray-600">Seeking Accountability Partners</p>
              </div>
            </div>
          </div>
        </div>

        {/* Member Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => {
            const skillsExpanded = expandedSkills.has(profile.id)
            const interestsExpanded = expandedInterests.has(profile.id)

            return (
              <div
                key={profile.id}
                className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition"
              >
                {/* Avatar and Name */}
                <div className="flex items-center gap-4 mb-4">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.full_name || 'User'}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-semibold border-2 border-gray-100">
                      {getInitials(profile.full_name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {profile.full_name || 'Anonymous User'}
                    </h3>
                    {profile.user_id === currentUserId && (
                      <span className="text-xs text-blue-600 font-medium">You</span>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {profile.bio}
                  </p>
                )}

                {/* Skills */}
                {profile.skills && profile.skills.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {(skillsExpanded ? profile.skills : profile.skills.slice(0, 3)).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                      {profile.skills.length > 3 && (
                        <button
                          onClick={() => toggleSkillsExpanded(profile.id)}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200 transition cursor-pointer"
                        >
                          {skillsExpanded ? 'Show less' : `+${profile.skills.length - 3} more`}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Interests */}
                {profile.interests && profile.interests.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Interests</p>
                    <div className="flex flex-wrap gap-1">
                      {(interestsExpanded ? profile.interests : profile.interests.slice(0, 3)).map((interest, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
                        >
                          {interest}
                        </span>
                      ))}
                      {profile.interests.length > 3 && (
                        <button
                          onClick={() => toggleInterestsExpanded(profile.id)}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200 transition cursor-pointer"
                        >
                          {interestsExpanded ? 'Show less' : `+${profile.interests.length - 3} more`}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Looking For */}
                {(profile.looking_for_business_partner || profile.looking_for_accountability_partner) && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Looking For</p>
                    <div className="space-y-1">
                      {profile.looking_for_business_partner && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Briefcase className="h-3 w-3 text-green-600" />
                          <span>Business Partners</span>
                        </div>
                      )}
                      {profile.looking_for_accountability_partner && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Heart className="h-3 w-3 text-purple-600" />
                          <span>Accountability Partners</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Social Links */}
                {(() => {
                  const socialLinks = [
                    { url: profile.linkedin_url, icon: Linkedin, label: 'LinkedIn', color: 'text-blue-600' },
                    { url: profile.facebook_url, icon: Facebook, label: 'Facebook', color: 'text-blue-500' },
                    { url: profile.twitter_url, icon: Twitter, label: 'Twitter', color: 'text-sky-500' },
                    { url: profile.website_url, icon: Globe, label: 'Website', color: 'text-gray-600' }
                  ].filter(link => link.url)

                  return socialLinks.length > 0 && (
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Connect</p>
                      <div className="flex gap-2">
                        {socialLinks.map((link, index) => {
                          const Icon = link.icon
                          return (
                            <a
                              key={index}
                              href={link.url!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`p-2 rounded-lg hover:bg-gray-100 transition ${link.color}`}
                              title={link.label}
                            >
                              <Icon className="h-4 w-4" />
                            </a>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {profiles.length === 0 && (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No members yet</h3>
            <p className="text-gray-600">Be the first to complete your profile!</p>
          </div>
        )}
      </div>
    </div>
  )
}
