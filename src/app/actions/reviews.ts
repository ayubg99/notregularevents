'use server'

import { createClient } from'@/lib/supabase/server'
import type { ReviewTarget } from'@/types/database'

interface Input {
  targetId: string
  targetType: ReviewTarget
  rating: number
  comment: string
}

type Result = { success: true } | { success: false; error: string }

export async function addReview(input: Input): Promise<Result> {
  if (input.rating < 1 || input.rating > 5 || !Number.isInteger(input.rating)) {
    return { success: false, error:'Rating must be a whole number between 1 and 5.' }
  }

  const trimmedComment = input.comment.trim().slice(0, 1000)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error:'Please log in to leave a review.' }
  }

  // Prevent duplicate reviews
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('user_id', user.id)
    .eq('target_type', input.targetType)
    .eq('target_id', input.targetId)
    .maybeSingle()

  if (existing) {
    return { success: false, error:'You have already reviewed this event.' }
  }

  const { error } = await supabase.from('reviews').insert({
    user_id: user.id,
    target_type: input.targetType,
    target_id: input.targetId,
    rating: input.rating,
    comment: trimmedComment || null,
  })

  if (error) {
    console.error('[addReview]', error.message)
    return { success: false, error:'Failed to submit review. Please try again.' }
  }

  return { success: true }
}
