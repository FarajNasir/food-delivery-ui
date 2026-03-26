import { checkOwner } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { name, restaurant_id } = await request.json()

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    if (!restaurant_id) return NextResponse.json({ error: 'restaurant_id is required' }, { status: 400 })

    // Perform ownership check
    const auth = await checkOwner(restaurant_id)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { data: category, error } = await auth.supabase!
      .from('categories')
      .insert({ name, restaurant_id })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ category })
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "An unexpected error occurred"
    return NextResponse.json({ error }, { status: 500 })
  }
}
