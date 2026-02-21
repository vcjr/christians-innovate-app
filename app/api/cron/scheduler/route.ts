import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { sendBatchEmails } from '@/utils/email/sender'

// This endpoint should be called frequently (e.g., every 5 minutes) by Vercel Cron
// It checks the database for scheduled jobs that need to run

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    const now = new Date()

    // Get all active jobs that are due to run
    const { data: jobs, error: fetchError } = await supabase
      .from('scheduled_jobs')
      .select('*')
      .eq('is_active', true)
      .not('next_run_at', 'is', null)
      .lte('next_run_at', now.toISOString())

    if (fetchError) {
      console.error('Error fetching scheduled jobs:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch scheduled jobs' },
        { status: 500 }
      )
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No jobs to run',
        jobs_processed: 0,
      })
    }

    const results = []

    // Process each job
    for (const job of jobs) {
      try {
        console.log(`Processing job: ${job.name} (${job.id})`)

        // Fetch recipients based on filter
        let query = supabase
          .from('user_profiles')
          .select('user_id, email, full_name')

        if (job.recipient_filter === 'email_enabled') {
          query = query.eq('email_notifications_enabled', true)
        } else if (job.recipient_filter === 'ci_updates') {
          query = query.eq('ci_updates', true)
        } else if (job.recipient_filter === 'bible_year') {
          query = query.eq('bible_year', true)
        } else if (job.recipient_filter === 'skill_share') {
          query = query.eq('skill_share', true)
        }

        const { data: recipients, error: recipientsError } = await query

        if (recipientsError || !recipients || recipients.length === 0) {
          console.error(`No recipients found for job ${job.id}:`, recipientsError)
          results.push({
            job_id: job.id,
            job_name: job.name,
            success: false,
            error: 'No recipients found',
          })
          continue
        }

        // Send batch emails using the template
        if (job.template_key) {
          const result = await sendBatchEmails({
            recipients: recipients.map((r) => ({
              email: r.email,
              userId: r.user_id,
              variables: {
                user: {
                  name: r.full_name,
                  email: r.email,
                  id: r.user_id,
                },
                ...(job.custom_variables || {}),
              },
            })),
            templateKey: job.template_key,
            metadata: {
              type: 'scheduled_job',
              job_id: job.id,
              job_name: job.name,
            },
          })

          results.push({
            job_id: job.id,
            job_name: job.name,
            success: true,
            sent: result.sent,
            failed: result.failed,
            total: result.total,
          })

          // Update last_run_at and calculate next_run_at
          const { error: updateError } = await supabase
            .from('scheduled_jobs')
            .update({
              last_run_at: now.toISOString(),
            })
            .eq('id', job.id)

          if (updateError) {
            console.error(`Error updating job ${job.id}:`, updateError)
          }
        } else {
          results.push({
            job_id: job.id,
            job_name: job.name,
            success: false,
            error: 'No template specified',
          })
        }
      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.push({
          job_id: job.id,
          job_name: job.name,
          success: false,
          error: errorMessage,
        })
      }
    }

    return NextResponse.json({
      success: true,
      jobs_processed: jobs.length,
      results,
    })
  } catch (error) {
    console.error('Scheduler error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
