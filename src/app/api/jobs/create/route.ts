import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { sendJobManagementEmail } from '@/lib/email'
import type { JobType, JobCategory, JobLanguage, JobStatus } from '@/types/database'

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
  poster_email:      string
  basePlan:          'standard' | 'featured' | 'employer_plan'
  withUrgent:        boolean
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Body

    // Validate required fields
    if (!body.title?.trim())        return NextResponse.json({ error: 'Job title is required.'    }, { status: 400 })
    if (!body.company_name?.trim()) return NextResponse.json({ error: 'Company name is required.' }, { status: 400 })
    if (!body.description?.trim())  return NextResponse.json({ error: 'Description is required.'  }, { status: 400 })
    if (!body.contact_name?.trim()) return NextResponse.json({ error: 'Contact name is required.' }, { status: 400 })
    if (!body.poster_email?.trim())  return NextResponse.json({ error: 'Your email is required.' }, { status: 400 })

    const hasApplyMethod = body.apply_email?.trim() || body.apply_whatsapp?.trim() || body.apply_url?.trim()
    if (!hasApplyMethod) {
      return NextResponse.json({ error: 'At least one apply method is required.' }, { status: 400 })
    }

    // Get current user (optional — anonymous posting allowed)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const managementToken = nanoid(32)
    const isFree      = body.basePlan === 'standard' && !body.withUrgent
    const isFeatured  = body.basePlan === 'featured' || body.basePlan === 'employer_plan'
    const status: JobStatus = isFree ? 'active' : 'draft'

    // Featured/employer listings get 60 days, others 30
    const daysActive = isFeatured ? 60 : 30
    const expiresAt  = new Date(Date.now() + daysActive * 24 * 60 * 60 * 1000).toISOString()

    const admin = getAdminClient()
    const { data, error } = await admin
      .from('job_listings')
      .insert({
        title:             body.title.trim(),
        company_name:      body.company_name.trim(),
        company_logo_url:  body.company_logo_url?.trim() || null,
        description:       body.description.trim(),
        requirements:      body.requirements?.trim()    || null,
        location:          body.location?.trim()        || 'Valencia, Spain',
        job_type:          body.job_type,
        category:          body.category,
        salary_text:       body.salary_text?.trim()     || null,
        hours_per_week:    body.hours_per_week ? parseInt(body.hours_per_week, 10) : null,
        language_required: body.language_required,
        apply_email:       body.apply_email?.trim()     || null,
        apply_whatsapp:    body.apply_whatsapp?.trim()  || null,
        apply_url:         body.apply_url?.trim()       || null,
        contact_name:      body.contact_name.trim(),
        poster_email:      body.poster_email.trim(),
        management_token:  managementToken,
        is_featured:       false,
        is_urgent:         false,
        status,
        posted_by_user_id: user?.id ?? null,
        expires_at:        expiresAt,
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('[api/jobs/create]', error?.message)
      return NextResponse.json({ error: 'Failed to create job listing.' }, { status: 500 })
    }

    console.log('[api/jobs/create] created job', data.id, 'status:', status)

    // Send management email (always — poster email is required)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    try {
      await sendJobManagementEmail({
        to:        body.poster_email.trim(),
        jobTitle:  body.title.trim(),
        company:   body.company_name.trim(),
        viewUrl:   `${baseUrl}/jobs/${data.id}`,
        manageUrl: `${baseUrl}/jobs/manage?token=${managementToken}`,
        editUrl:   `${baseUrl}/jobs/edit/${data.id}?token=${managementToken}`,
      })
    } catch (emailErr) {
      console.error('[api/jobs/create] management email failed:', emailErr)
      // Non-fatal — job was created successfully
    }

    return NextResponse.json({ jobId: data.id, isFree })
  } catch (err) {
    console.error('[api/jobs/create] unhandled error:', err)
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}
