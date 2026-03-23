import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        let { to, config, subject, htmlBody, template_name, variables } = body;

        // If no explicit config provided from UI, seamlessly fetch the live one from the DB
        if (!config) {
            const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
            const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

            // Using Service Role Key securely bypasses RLS so users never see the credentials
            const supabase = createClient(supabaseUrl, supabaseServiceKey);

            const { data: dbConfig, error: configError } = await supabase
                .from('email_configurations')
                .select('*')
                .eq('is_active', true)
                .limit(1)
                .single();

            if (configError || !dbConfig) {
                throw new Error('No active email configuration found in the database. ' + (configError?.message || ''));
            }
            config = dbConfig;
        }

        // If an explicit template tag is requested instead of raw HTML, compile it from the database
        if (template_name) {
            const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
            const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
            const supabase = createClient(supabaseUrl, supabaseServiceKey);

            const { data: template, error: tmplError } = await supabase
                .from('email_templates')
                .select('*')
                .eq('template_name', template_name)
                .eq('is_active', true)
                .single();

            if (tmplError || !template) {
                throw new Error(`Email Template '${template_name}' not found or inactive.`);
            }

            // Compile Interpolations
            let compiledSubject = template.template_subject;
            let compiledBody = template.template_body;

            if (variables) {
                for (const [key, value] of Object.entries(variables)) {
                    // Match any {{key}} syntax globally
                    const regex = new RegExp(`{{${key}}}`, 'g');
                    compiledSubject = compiledSubject.replace(regex, String(value));
                    compiledBody = compiledBody.replace(regex, String(value));
                }
            }

            subject = compiledSubject;
            htmlBody = compiledBody;
        }

        if (!to || !config) {
            throw new Error('Missing "to" address or valid SMTP configuration.');
        }

        if (!subject || !htmlBody) {
            throw new Error('Missing "subject" or "htmlBody" (or valid "template_name").');
        }

        if (config.provider === 'smtp') {
            const transporter = nodemailer.createTransport({
                host: config.smtp_host,
                port: Number(config.smtp_port) || 587,
                secure: Number(config.smtp_port) === 465, // true for 465, false for other ports
                auth: {
                    user: config.username,
                    pass: config.password,
                },
            });

            await transporter.sendMail({
                from: `"${config.from_name || 'ZimAIo'}" <${config.from_email}>`,
                to: to,
                subject: subject,
                html: htmlBody,
            });
        } else {
            // Logic for other providers (SendGrid, Mailgun) can be added here using standard fetch
            throw new Error(`Provider '${config.provider}' is not yet supported in this edge function.`);
        }

        return new Response(JSON.stringify({ success: true, message: 'Email dispatched successfully!' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error: any) {
        console.error('Error sending email:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
