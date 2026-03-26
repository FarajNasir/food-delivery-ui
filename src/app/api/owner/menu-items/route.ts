import { checkOwner } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, price, description, image_url, category_id, restaurant_id } = body

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    if (!price) return NextResponse.json({ error: 'Price is required' }, { status: 400 })
    if (!category_id) return NextResponse.json({ error: 'category_id is required' }, { status: 400 })
    if (!restaurant_id) return NextResponse.json({ error: 'restaurant_id is required' }, { status: 400 })

    // Perform ownership check
    const auth = await checkOwner(restaurant_id)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { data: menuItem, error } = await auth.supabase!
      .from('menu_items')
      .insert({
        name,
        price,
        description,
        image_url,
        category_id,
        restaurant_id
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ menuItem })
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "An unexpected error occurred"
    return NextResponse.json({ error }, { status: 500 })
  }
}
