import { createClient } from '@/lib/server'
import { checkOwner } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { price, is_available } = body

    // 1. Get the restaurant_id for this item
    const { data: item, error: fError } = await supabase
      .from('menu_items')
      .select('restaurant_id')
      .eq('id', id)
      .single()

    if (fError) throw fError

    // 2. Perform ownership check with the found restaurant_id
    const auth = await checkOwner(item.restaurant_id)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    // 3. Update the item
    const { data: updatedItem, error } = await auth.supabase!
      .from('menu_items')
      .update({
        price,
        is_available
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ menuItem: updatedItem })
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "An unexpected error occurred"
    return NextResponse.json({ error }, { status: 500 })
  }
}
