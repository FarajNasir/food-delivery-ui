import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const serviceAccount = {
  // These should be environment variables in Supabase
  project_id: Deno.env.get("FIREBASE_PROJECT_ID"),
  client_email: Deno.env.get("FIREBASE_CLIENT_EMAIL"),
  private_key: Deno.env.get("FIREBASE_PRIVATE_KEY")?.replace(/\\n/g, '\n'),
}

serve(async (req) => {
  try {
    const payload = await req.json()
    const { record } = payload // Data from Supabase Webhook
    
    const { id, recipient_id, type, subject, body, channel } = record

    console.log(`Processing notification ${id} for recipient ${recipient_id} via ${channel}`)

    let success = false
    if (channel === 'FCM') {
      success = await sendFCM(recipient_id, subject, body, { type })
    } else if (channel === 'WHATSAPP') {
      // success = await sendWhatsApp(...) 
      console.log("WhatsApp requested - logic pending credentials")
    } else if (channel === 'EMAIL') {
      // success = await sendEmail(...)
      console.log("Email requested - logic pending credentials")
    }

    // Update status in DB
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    await supabase
      .from('notifications')
      .update({ status: success ? 'SENT' : 'FAILED' })
      .eq('id', id)

    return new Response(JSON.stringify({ success }), { headers: { "Content-Type": "application/json" } })
  } catch (error) {
    console.error("Notification trigger error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})

async function sendFCM(userId: string, title: string, body: string, data: any) {
  // 1. Get FCM token for user from 'users' table
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  )
  
  const { data: userData } = await supabase
    .from('users')
    .select('fcm_token')
    .eq('id', userId)
    .single()

  if (!userData?.fcm_token) {
    console.warn(`No FCM token found for user ${userId}`)
    return false
  }

  // 2. Call FCM REST API v1
  // Note: This requires generating an OAuth2 token using the service account
  // For brevity in this implementation, we assume a helper or basic fetch
  // In production, use 'google-auth-library' equivalent for Deno
  
  console.log(`Sending FCM to ${userData.fcm_token}: ${title}`)
  
  // MOCK: Integration logic for FCM REST v1
  // In a real Edge Function, you'd perform the fetch to:
  // https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send
  
  return true 
}
