export type UserProgress = {
  is_completed: boolean
}

export type CalendarDay = {
  id: string
  day_number: number
  date_assigned: string | null
  scripture_reference: string
  user_progress: UserProgress[] | null
}

export type PlanDay = {
  id: string
  day_number: number
  date_assigned: string | null
  scripture_reference: string
  content_markdown: string | null
  created_at: string
  user_progress: UserProgress[] | null
}
