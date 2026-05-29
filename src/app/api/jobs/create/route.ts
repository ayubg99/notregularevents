import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import type { JobType, JobCategory, JobLanguage } from '@/types/database'

interface Body {
  title:             string
  company_name:      string
  company_logo_url?: string
  job_type:          JobType
  category:          JobCategory
  location?:         string
  hours_per_week?:   string
  salary_text?:      string
  language_required: JobLanguage
  description:       string
  requirements?:     string
  contact_name:      string
  apply_email?:      string
  apply_whatsapp?:   string
  apply_url?:        string
  employerId:        string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Body

    if (!body.title?.trim())        return NextResponse.json({ error: 'Job title is required.'    }, { status: 400 })
    if (!body.company_name?.trim()) return NextResponse.json({ error: 'Company name is required.' }, { status: 400 })
    if (!body.description?.trim())  return NextResponse.json({ error: 'Description is required.'  }, { status: 400 })
    if (!body.contact_name?.trim()) return NextResponse.json({ error: 'Contact name is required.' }, { status: 400 })
    if (!body.employerId)           return NextResponse.json({ error: 'Employer account required.'}, { status: 400 })

    const hasApplyMethod = body.apply_email?.trim() || body.apply_whatsapp?.trim() || body.apply_url?.trim()
    if (!hasApplyMethod) {
      return NextResponse.json({ error: 'At least one apply method is required.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.user_metadata?.role !== 'employer') {
      return NextResponse.json({ error: 'Employer account required.' }, { status: 401 })
    }

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const admin = getAdminClient()
    const { data, error } = await admin
      .from('job_listings')
      .insert({
        title:               body.title.trim(),
        company_name:        body.company_name.trim(),
        company_logo_url:    body.company_logo_url?.trim() || null,
        description:         body.description.trim(),
        requirements:        body.requirements?.trim()   || null,
        location:            body.location?.trim()       || 'Valencia, Spain',
        job_type:            body.job_type,
        category:            body.category,
        salary_text:         body.salary_text?.trim()    || null,
        hours_per_week:      body.hours_per_week ? parseInt(body.hours_per_week, 10) : null,
        language_required:   body.language_required,
        apply_email:         body.apply_email?.trim()    || null,
        apply_whatsapp:      body.apply_whatsapp?.trim() || null,
        apply_url:           body.apply_url?.trim()      || null,
        contact_name:        body.contact_name.trim(),
        is_featured:         false,
        is_urgent:           false,
        status:              'active',
        posted_by_user_id:   user.id,
        employer_account_id: body.employerId,
        expires_at:          expiresAt,
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('[api/jobs/create]', error?.message)
      return NextResponse.json({ error: 'Failed to create job listing.' }, { status: 500 })
    }

    console.log('[api/jobs/create] created job', data.id)
    return NextResponse.json({ jobId: data.id })
  } catch (err) {
    console.error('[api/jobs/create] unhandled error:', err)
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}
