// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { Resend } from 'npm:resend@2.0.0'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const resend = new Resend(RESEND_API_KEY)
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    try {
        const { record } = await req.json()
        // record is the new row from 'request_responses' table

        // Only proceed if status is 'accepted'
        if (record.status !== 'accepted') {
            return new Response(JSON.stringify({ message: 'Not an accepted response' }), { headers: { 'Content-Type': 'application/json' } })
        }

        const { request_id, donor_id } = record

        // 1. Fetch Request Details (to get Requester info)
        const { data: requestData, error: reqError } = await supabase
            .from('blood_requests')
            .select('recipient_name, donor_id') // donor_id here is the Requester's User ID
            .eq('id', request_id)
            .single()

        if (reqError) throw reqError

        // 2. Fetch Requester Profile (to get email)
        const { data: requesterProfile, error: requesterError } = await supabase
            .from('donors')
            .select('name, email, contact_phone')
            .eq('user_id', requestData.donor_id)
            .single()

        // 3. Fetch Donor Profile (Responder)
        const { data: donorProfile, error: donorError } = await supabase
            .from('donors')
            .select('name, email, contact_phone')
            .eq('user_id', donor_id)
            .single()

        if (requesterError || donorError) throw new Error('Could not fetch profiles')

        // 4. Send Email to Requester
        if (requesterProfile.email) {
            await resend.emails.send({
                from: 'HelpConnect Team <onboarding@resend.dev>',
                to: [requesterProfile.email],
                subject: '[HelpConnect] Good News: Donor Match Found!',
                html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #e11d48;">Match Found!</h2>
                <p>Hello ${requesterProfile.name},</p>
                <p>We are pleased to inform you that a donor has accepted your blood request for <strong>${requestData.recipient_name}</strong>.</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #1f2937;">Donor Contact Details</h3>
                  <p style="margin: 5px 0;"><strong>Name:</strong> ${donorProfile.name}</p>
                  <p style="margin: 5px 0;"><strong>Phone:</strong> <a href="tel:${donorProfile.contact_phone}" style="color: #e11d48; text-decoration: none;">${donorProfile.contact_phone}</a></p>
                </div>

                <p>Please contact the donor immediately to coordinate the donation.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
                <p style="color: #6b7280; font-size: 14px;">Best regards,<br>The HelpConnect Team</p>
              </div>
            `,
            })
        }

        // 5. Send Email to Donor
        if (donorProfile.email) {
            await resend.emails.send({
                from: 'HelpConnect Team <onboarding@resend.dev>',
                to: [donorProfile.email],
                subject: '[HelpConnect] Thank You: Donation Match Confirmed',
                html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #e11d48;">Thank You for Helping!</h2>
                <p>Hello ${donorProfile.name},</p>
                <p>You have successfully accepted the blood request for <strong>${requestData.recipient_name}</strong>.</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #1f2937;">Recipient Contact Details</h3>
                  <p style="margin: 5px 0;"><strong>Recipient Name:</strong> ${requestData.recipient_name}</p>
                  <p style="margin: 5px 0;"><strong>Contact Person:</strong> ${requesterProfile.name}</p>
                  <p style="margin: 5px 0;"><strong>Phone:</strong> <a href="tel:${requesterProfile.contact_phone}" style="color: #e11d48; text-decoration: none;">${requesterProfile.contact_phone}</a></p>
                </div>

                <p>The requester has been notified. Please be ready to receive their call.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
                <p style="color: #6b7280; font-size: 14px;">Best regards,<br>The HelpConnect Team</p>
              </div>
            `,
            })
        }

        return new Response(
            JSON.stringify({ message: 'Emails sent successfully' }),
            { headers: { 'Content-Type': 'application/json' } },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
    }
})
