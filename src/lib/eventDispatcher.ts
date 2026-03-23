import { supabase } from './supabase';

/**
 * Dispatches an event to the Trigger System.
 * Queries `event_triggers` for active rules matching the event_type,
 * and executes their configured actions (e.g., send_email).
 */
export async function dispatchTrigger(eventType: string, payload: any) {
    try {
        console.log(`[Event Dispatcher] Received event: ${eventType}`, payload);

        // Fetch active triggers for this event
        const { data: triggers, error } = await supabase
            .from('event_triggers')
            .select('*')
            .eq('event_type', eventType)
            .eq('is_active', true);

        if (error) throw error;
        if (!triggers || triggers.length === 0) {
            console.log(`[Event Dispatcher] No active triggers for ${eventType}.`);
            return;
        }

        // Process each trigger sequentially (could be parallelized)
        for (const trigger of triggers) {
            console.log(`[Event Dispatcher] Executing trigger: ${trigger.name}`);

            if (trigger.action_type === 'send_email') {
                const actions = trigger.actions || {};
                const templateName = actions.template_name;

                if (!payload.email) {
                    console.warn(`[Event Dispatcher] Missing payload.email for send_email trigger on ${eventType}`);
                    continue;
                }

                if (!templateName) {
                    console.warn(`[Event Dispatcher] Trigger ${trigger.name} is missing a template_name in its actions JSON.`);
                    continue;
                }

                try {
                    // We assume payload contains top-level variables needed by the template (like {{customer_name}})
                    const emailPayload = {
                        to: payload.email,
                        template_name: templateName,
                        variables: {
                            ...payload
                        }
                    };

                    console.log(`[Event Dispatcher] Invoking send-email edge function for ${payload.email}...`);
                    await supabase.functions.invoke('send-email', { body: emailPayload });
                } catch (emailErr) {
                    console.error(`[Event Dispatcher] Failed to invoke send-email:`, emailErr);
                }
            }
            else if (trigger.action_type === 'send_notification') {
                // Future: Handle in-app notifications
                console.log(`[Event Dispatcher] (stub) send_notification`, trigger.actions);
            }
        }
    } catch (err) {
        console.error(`[Event Dispatcher] Fatal error dispatching ${eventType}:`, err);
    }
}
