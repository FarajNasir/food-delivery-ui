import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { GoogleAuth } from "npm:google-auth-library@9"

const serviceAccount = {
  project_id: Deno.env.get("FIREBASE_PROJECT_ID"),
  client_email: Deno.env.get("FIREBASE_CLIENT_EMAIL"),
  private_key: Deno.env.get("FIREBASE_PRIVATE_KEY")?.replace(/\\n/g, '\n'),
}

/**
 * Generates an OAuth2 Access Token for FCM v1
 */
async function getAccessToken() {
  const auth = new GoogleAuth({
    credentials: {
      client_email: serviceAccount.client_email,
      private_key: serviceAccount.private_key,
      project_id: serviceAccount.project_id,
    },
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

serve(async (req) => {
  try {
    const payload = await req.json()
    const { record } = payload
    const { id, recipient_id, type, subject, body, channel } = record

    console.log(`Processing notification ${id}: ${channel}`)

    let success = false
    if (channel === 'FCM') {
      success = await sendFCM(recipient_id, subject, body, { type })
    } else if (channel === 'WHATSAPP') {
      // Placeholder for Twilio/Meta integration
      console.log("WhatsApp pending credentials")
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

    return new Response(JSON.stringify({ success }), { 
      headers: { "Content-Type": "application/json" } 
    })
  } catch (error) {
    console.error("Trigger error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})

async function sendFCM(userId: string, title: string, body: string, data: any) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  )
  
  const { data: userData } = await supabase
    .from('users')
    .select('fcm_token')
    .eq('id', userId)
    .single()

  if (!userData?.fcm_token) return false

  try {
    const accessToken = await getAccessToken()
    const url = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token: userData.fcm_token,
          notification: { title, body },
          data: data,
          webpush: {
            fcm_options: {
              link: '/dashboard/owner/orders'
            }
          }
        },
      }),
    })

    return response.ok
  } catch (err) {
    console.error("FCM Send Error:", err)
    return false
  }
}
