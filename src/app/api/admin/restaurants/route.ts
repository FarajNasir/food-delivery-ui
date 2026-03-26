import { checkAdmin } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'
import { RestaurantLocation } from '@/types/restaurant'

export async function GET() {
  const auth = await checkAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { data: restaurants, error } = await auth.supabase!
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ restaurants })
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "An unexpected error occurred"
    return NextResponse.json({ error }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await checkAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const body = await request.json()
    const { name, location, phone, email, owner_id } = body

    // Validation
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    
    // Location Validation (Newcastle, London, New York)
    const validLocations: RestaurantLocation[] = ["Newcastle", "London", "New York"]
    if (!validLocations.includes(location as RestaurantLocation)) {
      return NextResponse.json({ error: `Invalid location. Must be one of: ${validLocations.join(', ')}` }, { status: 400 })
    }

    const { data: restaurant, error } = await auth.supabase!
      .from('restaurants')
      .insert({
        name,
        location,
        phone,
        email,
        owner_id: owner_id || null
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ restaurant })
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "An unexpected error occurred"
    return NextResponse.json({ error }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const auth = await checkAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const { error } = await auth.supabase!
      .from('restaurants')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ message: 'Restaurant deleted successfully' })
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "An unexpected error occurred"
    return NextResponse.json({ error }, { status: 500 })
  }
}
