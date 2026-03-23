import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Send, Users, AlertCircle, FileText } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';

export default function EmailManagement() {
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);

    const [audience, setAudience] = useState('customers');
    const [recipientCount, setRecipientCount] = useState(0);

    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [customSubject, setCustomSubject] = useState('');
    const [customBody, setCustomBody] = useState('');

    const [sendingStatus, setSendingStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        fetchTemplates();
    }, []);

    useEffect(() => {
        fetchAudienceCount();
    }, [audience]);

    const fetchTemplates = async () => {
        try {
            const { data, error } = await supabase
                .from('email_templates')
                .select('*')
                .eq('is_active', true)
                .order('template_name');

            if (error) throw error;
            setTemplates(data || []);
        } catch (err) {
            console.error('Error fetching templates:', err);
        }
    };

    const fetchAudienceCount = async () => {
        try {
            if (audience === 'customers') {
                const { count, error } = await supabase
                    .from('customer_profiles')
                    .select('*', { count: 'exact', head: true });
                if (error) throw error;
                setRecipientCount(count || 0);
            } else if (audience === 'vendors') {
                const { count, error } = await supabase
                    .from('vendor_profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'approved');
                if (error) throw error;
                setRecipientCount(count || 0);
            } else if (audience === 'pre_customers') {
                const { count, error } = await supabase
                    .from('customer_pre_registrations')
                    .select('*', { count: 'exact', head: true });
                if (error) throw error;
                setRecipientCount(count || 0);
            } else if (audience === 'pre_vendors') {
                const { count, error } = await supabase
                    .from('vendor_pre_registrations')
                    .select('*', { count: 'exact', head: true });
                if (error) throw error;
                setRecipientCount(count || 0);
            }
        } catch (err) {
            console.error('Error fetching audience count:', err);
            setRecipientCount(0);
        }
    };

    const handleSendBroadcast = async () => {
        if (recipientCount === 0) {
            alert('Selected audience has 0 recipients.');
            return;
        }

        if (!selectedTemplate && (!customSubject || !customBody)) {
            alert('Please select a template OR write a custom subject and body.');
            return;
        }

        if (!window.confirm(`Are you sure you want to send this email to ${recipientCount} recipients?`)) return;

        setSendingStatus('sending');
        setProgress(0);

        try {
            // 1. Fetch exact recipients
            let recipients: any[] = [];
            let nameField = 'full_name'; // Fallback

            if (audience === 'customers') {
                const { data } = await supabase.from('customer_profiles').select('email, full_name');
                recipients = data || [];
                nameField = 'full_name';
            } else if (audience === 'vendors') {
                const { data } = await supabase.from('vendor_profiles').select('email, business_name').eq('status', 'approved');
                recipients = data || [];
                nameField = 'business_name';
            } else if (audience === 'pre_customers') {
                const { data } = await supabase.from('customer_pre_registrations').select('email, full_name');
                recipients = data || [];
                nameField = 'full_name';
            } else if (audience === 'pre_vendors') {
                const { data } = await supabase.from('vendor_pre_registrations').select('email, full_name');
                recipients = data || [];
                nameField = 'full_name';
            }

            // 2. Dispatch emails via Edge Function individually
            let sent = 0;
            for (const recipient of recipients) {
                if (!recipient.email) continue;

                const payload: any = {
                    to: recipient.email,
                };

                if (selectedTemplate) {
                    payload.template_name = selectedTemplate;
                    // Dynamically map standard tags based on audience
                    payload.variables = {
                        customer_name: recipient[nameField]?.split(' ')[0] || '',
                        vendor_name: recipient[nameField]?.split(' ')[0] || '',
                        user_name: recipient[nameField]?.split(' ')[0] || ''
                    };
                } else {
                    // Custom inline send
                    payload.subject = customSubject;
                    // naive string replacement for custom body
                    let body = customBody;
                    const firstName = recipient[nameField]?.split(' ')[0] || 'User';
                    body = body.replace(/{{customer_name}}/gi, firstName)
                        .replace(/{{vendor_name}}/gi, firstName)
                        .replace(/{{user_name}}/gi, firstName);
                    payload.htmlBody = body;
                }

                try {
                    await supabase.functions.invoke('send-email', { body: payload });
                } catch (err) {
                    console.error(`Failed to send to ${recipient.email}`, err);
                }

                sent++;
                setProgress(Math.round((sent / recipients.length) * 100));
            }

            setSendingStatus('success');
            setTimeout(() => setSendingStatus('idle'), 5000);

            // Clear custom fields
            setCustomSubject('');
            setCustomBody('');

        } catch (err: any) {
            console.error('Error during broadcast:', err);
            alert(err.message || 'Failed to complete broadcast');
            setSendingStatus('error');
        }
    };

    const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedTemplate(e.target.value);
        if (e.target.value) {
            setCustomSubject('');
            setCustomBody('');
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6 max-w-5xl mx-auto">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Mail className="h-6 w-6 mr-2 text-cyan-600" />
                        Email Outreach
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Send mass broadcast emails to targeted audiences using active database credentials.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Configuration Panel */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                                <Users className="h-5 w-5 mr-2 text-gray-400" />
                                1. Select Audience
                            </h2>
                            <select
                                value={audience}
                                onChange={(e) => setAudience(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 text-gray-900 dark:text-white"
                            >
                                <option value="customers">All Registered Customers</option>
                                <option value="vendors">All Approved Vendors</option>
                                <option value="pre_customers">Customer Pre-Registrations</option>
                                <option value="pre_vendors">Vendor Pre-Registrations</option>
                            </select>

                            <div className="mt-4 p-4 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-800 dark:text-cyan-300 rounded-lg flex items-start">
                                <AlertCircle className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
                                <p className="text-sm">
                                    This broadcast will be sent to exactly <strong>{recipientCount}</strong> valid email addresses from your selected audience.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                                <FileText className="h-5 w-5 mr-2 text-gray-400" />
                                2. Message Content
                            </h2>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Use Database Template
                                </label>
                                <select
                                    value={selectedTemplate}
                                    onChange={handleTemplateChange}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 text-gray-900 dark:text-white"
                                >
                                    <option value="">-- Write Custom Message Below --</option>
                                    {templates.map(tmpl => (
                                        <option key={tmpl.id} value={tmpl.template_name}>
                                            {tmpl.template_name} ({tmpl.template_subject})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="relative flex py-5 items-center">
                                <div className="flex-grow border-t border-gray-200 dark:border-slate-700"></div>
                                <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium uppercase tracking-wider">OR</span>
                                <div className="flex-grow border-t border-gray-200 dark:border-slate-700"></div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Custom Subject
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!!selectedTemplate}
                                        value={customSubject}
                                        onChange={(e) => setCustomSubject(e.target.value)}
                                        placeholder="Special Announcement!"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:ring-cyan-500 text-gray-900 dark:text-white disabled:opacity-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Custom HTML Body
                                    </label>
                                    <textarea
                                        disabled={!!selectedTemplate}
                                        value={customBody}
                                        onChange={(e) => setCustomBody(e.target.value)}
                                        rows={8}
                                        placeholder="<html><body><h1>Hi {{user_name}}!</h1><p>Write your message here...</p></body></html>"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg focus:ring-cyan-500 font-mono text-sm text-gray-900 dark:text-white disabled:opacity-50"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Panel */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 sticky top-24">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                3. Dispatch
                            </h2>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Target Audience:</span>
                                    <span className="font-medium text-gray-900 dark:text-white capitalize">{audience.replace('_', ' ')}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Total Recipients:</span>
                                    <span className="font-bold text-cyan-600 dark:text-cyan-400">{recipientCount}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Content Type:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {selectedTemplate ? 'Database Template' : 'Custom Inline'}
                                    </span>
                                </div>
                            </div>

                            {sendingStatus === 'sending' && (
                                <div className="mb-6 space-y-2 text-center">
                                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
                                        <div className="bg-cyan-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <p className="text-sm font-medium text-cyan-600 dark:text-cyan-400">Sending... {progress}%</p>
                                </div>
                            )}

                            {sendingStatus === 'success' && (
                                <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm text-center font-medium border border-green-200 dark:border-green-800">
                                    Broadcast Sent Successfully!
                                </div>
                            )}

                            <button
                                onClick={handleSendBroadcast}
                                disabled={sendingStatus === 'sending' || recipientCount === 0 || (!selectedTemplate && (!customSubject || !customBody))}
                                className="w-full flex justify-center items-center px-6 py-3 bg-gradient-to-r from-cyan-600 to-green-600 hover:from-cyan-700 hover:to-green-700 focus:ring-4 focus:ring-cyan-500/30 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                {sendingStatus === 'sending' ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-5 w-5 mr-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        Send Broadcast
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
