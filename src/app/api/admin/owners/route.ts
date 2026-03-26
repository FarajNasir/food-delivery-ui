import { checkAdmin } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'

export async function GET() {
  const auth = await checkAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    // 1. Get all user IDs with 'owner' role
    const { data: ownersRoles, error: rError } = await auth.supabase!
      .from('user_roles')
      .select('id')
      .eq('role', 'owner')

    if (rError) throw rError

    if (!ownersRoles || ownersRoles.length === 0) {
      return NextResponse.json({ owners: [] })
    }

    const ownerIds = ownersRoles.map(r => r.id)

    // 2. Get user details from user_details
    const { data: details, error: dError } = await auth.supabase!
      .from('user_details')
      .select('id, first_name, last_name')
      .in('id', ownerIds)

    if (dError) throw dError

    return NextResponse.json({ owners: details })
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "An unexpected error occurred"
    return NextResponse.json({ error }, { status: 500 })
  }
}
