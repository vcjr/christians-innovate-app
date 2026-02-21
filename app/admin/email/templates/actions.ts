'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { extractTemplateVariables } from '@/utils/email/templates'

export async function createTemplate(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if user is admin
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!userRole?.is_admin) {
    return { error: 'Not authorized' }
  }

  const templateKey = formData.get('template_key') as string
  const name = formData.get('name') as string
  const subject = formData.get('subject') as string
  const bodyHtml = formData.get('body_html') as string
  const bodyText = formData.get('body_text') as string
  const description = formData.get('description') as string
  const isActive = formData.get('is_active') === 'true'

  if (!templateKey || !name || !subject || !bodyHtml) {
    return { error: 'Missing required fields' }
  }

  // Extract variables from subject and body
  const subjectVars = extractTemplateVariables(subject)
  const bodyVars = extractTemplateVariables(bodyHtml)
  const allVariables = [...new Set([...subjectVars, ...bodyVars])]

  const { error } = await supabase.from('email_templates').insert({
    template_key: templateKey,
    name,
    subject,
    body_html: bodyHtml,
    body_text: bodyText || null,
    description: description || null,
    variables: allVariables,
    is_active: isActive,
  })

  if (error) {
    console.error('Error creating template:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/email/templates')
  return { success: true }
}

export async function updateTemplate(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if user is admin
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!userRole?.is_admin) {
    return { error: 'Not authorized' }
  }

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const subject = formData.get('subject') as string
  const bodyHtml = formData.get('body_html') as string
  const bodyText = formData.get('body_text') as string
  const description = formData.get('description') as string
  const isActive = formData.get('is_active') === 'true'

  if (!id || !name || !subject || !bodyHtml) {
    return { error: 'Missing required fields' }
  }

  // Extract variables from subject and body
  const subjectVars = extractTemplateVariables(subject)
  const bodyVars = extractTemplateVariables(bodyHtml)
  const allVariables = [...new Set([...subjectVars, ...bodyVars])]

  const { error } = await supabase
    .from('email_templates')
    .update({
      name,
      subject,
      body_html: bodyHtml,
      body_text: bodyText || null,
      description: description || null,
      variables: allVariables,
      is_active: isActive,
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating template:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/email/templates')
  return { success: true }
}

export async function deleteTemplate(templateId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if user is admin
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!userRole?.is_admin) {
    return { error: 'Not authorized' }
  }

  const { error } = await supabase
    .from('email_templates')
    .delete()
    .eq('id', templateId)

  if (error) {
    console.error('Error deleting template:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/email/templates')
  return { success: true }
}

export async function toggleTemplateActive(templateId: string, isActive: boolean) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if user is admin
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!userRole?.is_admin) {
    return { error: 'Not authorized' }
  }

  const { error } = await supabase
    .from('email_templates')
    .update({ is_active: isActive })
    .eq('id', templateId)

  if (error) {
    console.error('Error toggling template:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/email/templates')
  return { success: true }
}

export async function getTemplate(templateKey: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if user is admin
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!userRole?.is_admin) {
    return { error: 'Not authorized' }
  }

  const { data: template, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('template_key', templateKey)
    .single()

  if (error) {
    return { error: error.message }
  }

  return { template }
}

export async function getTemplates() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if user is admin
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!userRole?.is_admin) {
    return { error: 'Not authorized' }
  }

  const { data: templates, error } = await supabase
    .from('email_templates')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { templates }
}
