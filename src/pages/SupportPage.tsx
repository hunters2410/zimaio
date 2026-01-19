import { useState, useEffect } from 'react';
import { Plus, MessageCircle, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function SupportPage() {
  const { user, profile } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    category: 'general',
    message: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (data) setTickets(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const ticketNumber = 'TKT-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    const { error } = await supabase.from('support_tickets').insert({
      user_id: user.id,
      ticket_number: ticketNumber,
      subject: formData.subject,
      category: formData.category,
      status: 'open',
      priority: 'medium'
    });

    if (!error) {
      setFormData({ subject: '', category: 'general', message: '' });
      setShowNewTicket(false);
      fetchTickets();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md text-center">
          <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-6">
            Please sign in to access support tickets and submit requests.
          </p>
          <a
            href="/login"
            className="inline-block px-6 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-cyan-600 to-green-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Support Center</h1>
          <p className="text-cyan-100">We're here to help you</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">My Support Tickets</h2>
          <button
            onClick={() => setShowNewTicket(true)}
            className="flex items-center px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Ticket
          </button>
        </div>

        {showNewTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Create Support Ticket</h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="order">Order Issue</option>
                    <option value="payment">Payment Issue</option>
                    <option value="technical">Technical Support</option>
                    <option value="account">Account Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition"
                  >
                    Submit Ticket
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewTicket(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Support Tickets</h3>
            <p className="text-gray-600 mb-6">You haven't created any support tickets yet.</p>
            <button
              onClick={() => setShowNewTicket(true)}
              className="inline-flex items-center px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Ticket
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {ticket.subject}
                    </h3>
                    <p className="text-sm text-gray-600">Ticket #{ticket.ticket_number}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {ticket.status === 'open' && (
                      <span className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        <Clock className="h-4 w-4 mr-1" />
                        Open
                      </span>
                    )}
                    {ticket.status === 'in_progress' && (
                      <span className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        In Progress
                      </span>
                    )}
                    {ticket.status === 'resolved' && (
                      <span className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolved
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Category: {ticket.category}</span>
                  <span>•</span>
                  <span>Priority: {ticket.priority}</span>
                  <span>•</span>
                  <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
